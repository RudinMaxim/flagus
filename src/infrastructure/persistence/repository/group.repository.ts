import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { IGroupRepository } from '../interfaces';
import { Group } from '../../../core/access/model/group.model';
import { IMetadata } from '../../../shared/kernel';
import { BaseRepository, DataGateway } from '../../../shared/storage';
import { TYPES } from '../../config/types';

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  users_concat: string | null;
}

@injectable()
export class GroupRepository extends BaseRepository<Group, string> implements IGroupRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'groups', 'id');
  }

  /**
   * Возвращает все группы с их разрешениями и пользователями
   */
  async findAll(): Promise<Group[]> {
    const sql = this.buildBaseSelectQuery();
    const rows = await this.dataGateway.query<GroupRow>(sql);
    return rows.map(row => this.mapToEntity(row));
  }

  /**
   * Находит группу по идентификатору
   * @param id Идентификатор группы
   */
  async findById(id: string): Promise<Group | null> {
    if (!id) {
      throw new Error('Group ID is required');
    }

    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.id = ?
      GROUP BY g.id
    `;

    const row = await this.dataGateway.getOne<GroupRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * Возвращает группы пользователя
   * @param userId Идентификатор пользователя
   */
  async getByUserId(userId: string): Promise<Group[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      INNER JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = ?
      GROUP BY g.id
      ORDER BY g.name ASC
    `;

    const rows = await this.dataGateway.query<GroupRow>(sql, [userId]);
    return rows.map(row => this.mapToEntity(row));
  }

  /**
   * Создает новую группу
   * @param entity Данные новой группы
   */
  async create(entity: Omit<Group, 'id'>): Promise<Group> {
    if (!entity.name) {
      throw new Error('Group name is required');
    }

    if (!entity.metadata?.createdBy) {
      throw new Error('Created by is required');
    }

    await this.dataGateway.beginTransaction();

    try {
      const groupId = crypto.randomUUID();
      const now = new Date();

      const groupSql = `
        INSERT INTO groups (
          id, name, description, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?)
      `;

      await this.dataGateway.execute(groupSql, [
        groupId,
        entity.name,
        entity.description || null,
        now,
        entity.metadata.createdBy,
      ]);

      await this.dataGateway.commit();

      const result = await this.findById(groupId);
      if (!result) {
        throw new Error(`Failed to retrieve created group with ID: ${groupId}`);
      }
      return result;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  /**
   * Обновляет существующую группу
   * @param id Идентификатор группы
   * @param entity Обновляемые данные группы
   */
  async update(id: string, entity: Partial<Group>): Promise<Group | null> {
    if (!id) {
      throw new Error('Group ID is required');
    }

    // Проверяем существование группы перед обновлением
    const existingGroup = await this.findById(id);
    if (!existingGroup) {
      return null;
    }

    await this.dataGateway.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (entity.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(entity.name);
      }

      if (entity.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(entity.description);
      }

      if (updateFields.length === 0 && !entity.metadata?.updatedBy) {
        // Нет полей для обновления
        await this.dataGateway.rollback();
        return existingGroup;
      }

      updateFields.push('updated_at = ?');
      const now = new Date();
      updateValues.push(now);

      if (entity.metadata?.updatedBy) {
        updateFields.push('updated_by = ?');
        updateValues.push(entity.metadata.updatedBy);
      }

      const groupSql = `
        UPDATE groups 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;

      await this.dataGateway.execute(groupSql, [...updateValues, id]);
      await this.dataGateway.commit();

      return await this.findById(id);
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  /**
   * Удаляет группу и все связанные записи
   * @param id Идентификатор группы
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Group ID is required');
    }

    await this.dataGateway.beginTransaction();

    try {
      // Удаляем связи пользователей с группой
      await this.dataGateway.execute('DELETE FROM user_groups WHERE group_id = ?', [id]);

      // Проверим, связана ли группа с какой-либо записью в audit_logs
      const auditLogs = await this.dataGateway.getOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM audit_logs WHERE entity_id = ? AND entity_type = "group"',
        [id]
      );

      if (auditLogs && auditLogs.count > 0) {
        // Обновляем audit_logs, помечая записи как устаревшие или удаленные
        // Здесь можно добавить логику обработки аудита, если это требуется
      }

      // Удаляем саму группу
      const result = await this.dataGateway.execute<{ changes: number }>(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      await this.dataGateway.commit();
      return result.changes > 0;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  /**
   * Находит группу по имени
   * @param name Имя группы
   */
  async findByName(name: string): Promise<Group | null> {
    if (!name) {
      throw new Error('Group name is required');
    }

    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.name = ? 
      GROUP BY g.id
      LIMIT 1
    `;

    const row = await this.dataGateway.getOne<GroupRow>(sql, [name]);
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * Находит группы по массиву идентификаторов
   * @param ids Массив идентификаторов групп
   */
  async findByIds(ids: string[]): Promise<Group[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.id IN (${placeholders})
      GROUP BY g.id
    `;

    const rows = await this.dataGateway.query<GroupRow>(sql, ids);
    return rows.map(row => this.mapToEntity(row));
  }

  /**
   * Получает список групп с пагинацией, сортировкой и фильтрацией
   */
  async list(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<Group>;
  }): Promise<{ groups: Group[]; total: number }> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 100;
    const sortBy = this.validateSortField(options?.sortBy);
    const sortOrder = options?.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (options?.filter) {
      if (options.filter.name) {
        whereConditions.push('g.name LIKE ?');
        whereParams.push(`%${options.filter.name}%`);
      }

      if (options.filter.description) {
        whereConditions.push('g.description LIKE ?');
        whereParams.push(`%${options.filter.description}%`);
      }

      if (options.filter.metadata?.createdBy) {
        whereConditions.push('g.created_by = ?');
        whereParams.push(options.filter.metadata.createdBy);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Получаем общее количество записей
    const countSql = `
      SELECT COUNT(DISTINCT g.id) as total
      FROM groups g
      ${whereClause}
    `;

    const countResult = await this.dataGateway.getOne<{ total: number }>(countSql, whereParams);
    const total = countResult?.total || 0;

    // Получаем постранично отфильтрованные записи с сортировкой
    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      ${whereClause}
      GROUP BY g.id
      ORDER BY g.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const rows = await this.dataGateway.query<GroupRow>(sql, [...whereParams, limit, skip]);
    const groups = rows.map(row => this.mapToEntity(row));

    return { groups, total };
  }

  /**
   * Добавляет пользователя в группу
   * @param groupId Идентификатор группы
   * @param userId Идентификатор пользователя
   */
  async addUserToGroup(groupId: string, userId: string): Promise<boolean> {
    if (!groupId || !userId) {
      throw new Error('Group ID and User ID are required');
    }

    await this.dataGateway.beginTransaction();

    try {
      // Проверяем существование группы и пользователя перед добавлением
      const groupExists = await this.dataGateway.getOne<{ id: string }>(
        'SELECT id FROM groups WHERE id = ?',
        [groupId]
      );

      if (!groupExists) {
        throw new Error(`Group with ID ${groupId} does not exist`);
      }

      const userExists = await this.dataGateway.getOne<{ id: string }>(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );

      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist`);
      }

      // Проверяем, существует ли уже связь
      const existingLink = await this.dataGateway.getOne<{ user_id: string; group_id: string }>(
        'SELECT user_id, group_id FROM user_groups WHERE user_id = ? AND group_id = ?',
        [userId, groupId]
      );

      if (!existingLink) {
        // Добавляем связь, только если её ещё нет
        await this.dataGateway.execute(
          'INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)',
          [userId, groupId]
        );
      }

      await this.dataGateway.commit();
      return true;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  /**
   * Удаляет пользователя из группы
   * @param groupId Идентификатор группы
   * @param userId Идентификатор пользователя
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<boolean> {
    if (!groupId || !userId) {
      throw new Error('Group ID and User ID are required');
    }

    await this.dataGateway.beginTransaction();

    try {
      const result = await this.dataGateway.execute<{ changes: number }>(
        'DELETE FROM user_groups WHERE user_id = ? AND group_id = ?',
        [userId, groupId]
      );

      await this.dataGateway.commit();
      return result.changes > 0;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  /**
   * Получает пользователей группы
   * @param groupId Идентификатор группы
   */
  async getGroupUsers(groupId: string): Promise<string[]> {
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    const sql = `
      SELECT user_id
      FROM user_groups
      WHERE group_id = ?
    `;

    const rows = await this.dataGateway.query<{ user_id: string }>(sql, [groupId]);
    return rows.map(row => row.user_id);
  }

  /**
   * Преобразует строку из БД в модель Group
   * @param row Строка данных из БД
   */
  private mapToEntity(row: GroupRow): Group {
    const parseDate = (dateStr: string | null | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        const timestamp = parseFloat(dateStr);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
        return new Date(dateStr);
      } catch (e) {
        return undefined;
      }
    };

    const createdAt = parseDate(row.created_at) || new Date();
    const updatedAt = parseDate(row.updated_at);

    const metadata: IMetadata = {
      createdBy: row.created_by,
      createdAt,
      updatedBy: row.updated_by || undefined,
      updatedAt,
    };

    return new Group({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      metadata,
    });
  }

  /**
   * Строит базовый SQL-запрос для выборки групп
   * @param whereClause Условие WHERE без ключевого слова WHERE
   */
  private buildBaseSelectQuery(whereClause?: string): string {
    return `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT gp.permission_id) AS permissions_concat,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN group_permissions gp ON g.id = gp.group_id
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      ${whereClause ? `WHERE ${whereClause}` : ''}
      GROUP BY g.id
      ORDER BY g.name ASC
    `;
  }

  /**
   * Проверяет и возвращает корректное поле для сортировки
   * @param field Поле для сортировки
   */
  private validateSortField(field?: string): string {
    const allowedFields = ['name', 'created_at', 'updated_at'];

    if (!field || !allowedFields.includes(field)) {
      return 'name';
    }

    return field;
  }
}
