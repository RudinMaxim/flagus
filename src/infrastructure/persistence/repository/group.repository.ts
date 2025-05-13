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
  permissions_concat: string | null;
  users_concat: string | null;
}

@injectable()
export class GroupRepository extends BaseRepository<Group, string> implements IGroupRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'groups', 'id');
  }

  async findAll(): Promise<Group[]> {
    const sql = this.buildBaseSelectQuery();
    const rows = await this.dataGateway.query<GroupRow>(sql);
    return rows.map(row => this.mapToEntity(row));
  }

  async findById(id: string): Promise<Group | null> {
    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT gp.permission_id) AS permissions_concat,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN group_permissions gp ON g.id = gp.group_id
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.id = ?
      GROUP BY g.id
    `;

    const row = await this.dataGateway.getOne<GroupRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  async getByUserId(userId: string): Promise<Group[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const sql = `
    SELECT 
      g.*,
      GROUP_CONCAT(DISTINCT gp.permission_id) AS permissions_concat,
      GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
    FROM groups g
    INNER JOIN user_groups ug ON g.id = ug.group_id
    LEFT JOIN group_permissions gp ON g.id = gp.group_id
    WHERE ug.user_id = ?
    GROUP BY g.id
    ORDER BY g.name ASC
  `;

    const rows = await this.dataGateway.query<GroupRow>(sql, [userId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async create(entity: Omit<Group, 'id'>): Promise<Group> {
    await this.dataGateway.beginTransaction();

    try {
      const groupId = crypto.randomUUID();
      const groupSql = `
        INSERT INTO groups (
          id, name, description, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const now = new Date();
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

  async update(id: string, entity: Partial<Group>): Promise<Group | null> {
    await this.dataGateway.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues = [];

      if (entity.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(entity.name);
      }

      if (entity.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(entity.description);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());

      if (entity.metadata?.updatedBy) {
        updateFields.push('updated_by = ?');
        updateValues.push(entity.metadata.updatedBy);
      }

      if (updateFields.length > 0) {
        const groupSql = `
          UPDATE groups 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.dataGateway.execute(groupSql, [...updateValues, id]);
      }

      await this.dataGateway.commit();
      return this.findById(id);
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.dataGateway.beginTransaction();

    try {
      await this.dataGateway.execute('DELETE FROM user_groups WHERE group_id = ?', [id]);
      await this.dataGateway.execute('DELETE FROM group_permissions WHERE group_id = ?', [id]);

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

  async findByName(name: string): Promise<Group | null> {
    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT gp.permission_id) AS permissions_concat,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN group_permissions gp ON g.id = gp.group_id
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.name = ? 
      GROUP BY g.id
      LIMIT 1
    `;

    const row = await this.dataGateway.getOne<GroupRow>(sql, [name]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByIds(ids: Array<string>): Promise<Group[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT gp.permission_id) AS permissions_concat,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN group_permissions gp ON g.id = gp.group_id
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      WHERE g.id IN (${placeholders})
      GROUP BY g.id
    `;

    const rows = await this.dataGateway.query<GroupRow>(sql, ids);
    return rows.map(row => this.mapToEntity(row));
  }

  async list(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<Group>;
  }): Promise<{ groups: Group[]; total: number }> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 100;
    const sortBy = options?.sortBy || 'name';
    const sortOrder = options?.sortOrder || 'asc';

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
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT g.id) as total
      FROM groups g
      ${whereClause}
    `;

    const countResult = await this.dataGateway.getOne<{ total: number }>(countSql, whereParams);
    const total = countResult?.total || 0;

    // Get paginated results
    const sql = `
      SELECT 
        g.*,
        GROUP_CONCAT(DISTINCT gp.permission_id) AS permissions_concat,
        GROUP_CONCAT(DISTINCT ug.user_id) AS users_concat
      FROM groups g
      LEFT JOIN group_permissions gp ON g.id = gp.group_id
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
}
