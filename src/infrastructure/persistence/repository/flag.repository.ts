import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { FeatureFlag } from '../../../core/model';
import {
  FlagStatus,
  IFlagTTL,
  IMetadata,
  TFlagStatus,
  TFlagType,
  IFlagEnum,
} from '../../../shared/kernel';
import { TYPES } from '../../config/types';
import { BaseRepository, DataGateway } from '../../storage';
import { FlagRow, IFlagRepository } from '../interfaces';

@injectable()
export class FlagRepository extends BaseRepository<FeatureFlag, string> implements IFlagRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'feature_flags', 'id');
  }

  async findAll(): Promise<FeatureFlag[]> {
    const sql = this.buildBaseSelectQuery();
    const rows = await this.dataGateway.query<FlagRow>(sql);
    return rows.map(row => this.mapToEntity(row));
  }

  async findById(id: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.id = ?
      GROUP BY f.id
    `;

    const row = await this.dataGateway.getOne<FlagRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  async create(entity: Omit<FeatureFlag, 'id'>): Promise<FeatureFlag> {
    await this.dataGateway.beginTransaction();

    try {
      const flagId = crypto.randomUUID();
      const flagSql = `
        INSERT INTO feature_flags (
          id, key, name, description, type, status, category_id, 
          enum_values, selected_enum, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date();
      await this.dataGateway.execute(flagSql, [
        flagId,
        entity.key,
        entity.name,
        entity.description || null,
        entity.type,
        entity.status,
        entity.categoryId || null,
        entity.enum ? JSON.stringify(entity.enum.values) : null,
        entity.enum?.selected || null,
        now,
        entity.metadata.createdBy,
      ]);

      if (entity.ttl) {
        const ttlSql = `
          INSERT INTO flag_ttl (flag_id, expires_at, auto_delete)
          VALUES (?, ?, ?)
        `;
        await this.dataGateway.execute(ttlSql, [
          flagId,
          entity.ttl.expiresAt,
          entity.ttl.autoDelete ? 1 : 0,
        ]);
      }

      if (entity.clientIds && entity.clientIds.length > 0) {
        for (const clientId of entity.clientIds) {
          const clientSql = `
            INSERT INTO flag_clients (flag_id, client_id)
            VALUES (?, ?)
          `;
          await this.dataGateway.execute(clientSql, [flagId, clientId]);
        }
      }

      await this.dataGateway.commit();

      const result = await this.findById(flagId);
      if (!result) {
        throw new Error(`Failed to retrieve created feature flag with ID: ${flagId}`);
      }
      return result;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async update(id: string, entity: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
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

      if (entity.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(entity.type);
      }

      if (entity.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(entity.status);
      }

      if (entity.categoryId !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(entity.categoryId);
      }

      if (entity.enum !== undefined) {
        updateFields.push('enum_values = ?');
        updateValues.push(entity.enum.values ? JSON.stringify(entity.enum.values) : null);

        updateFields.push('selected_enum = ?');
        updateValues.push(entity.enum.selected || null);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());

      if (entity.metadata?.updatedBy) {
        updateFields.push('updated_by = ?');
        updateValues.push(entity.metadata.updatedBy);
      }

      if (updateFields.length > 0) {
        const flagSql = `
          UPDATE feature_flags 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.dataGateway.execute(flagSql, [...updateValues, id]);
      }

      if (entity.ttl) {
        const ttlExists = await this.dataGateway.getOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM flag_ttl WHERE flag_id = ?',
          [id]
        );

        if (ttlExists && ttlExists.count > 0) {
          await this.dataGateway.execute(
            'UPDATE flag_ttl SET expires_at = ?, auto_delete = ? WHERE flag_id = ?',
            [entity.ttl.expiresAt, entity.ttl.autoDelete ? 1 : 0, id]
          );
        } else {
          await this.dataGateway.execute(
            'INSERT INTO flag_ttl (flag_id, expires_at, auto_delete) VALUES (?, ?, ?)',
            [id, entity.ttl.expiresAt, entity.ttl.autoDelete ? 1 : 0]
          );
        }
      }

      if (entity.clientIds !== undefined) {
        await this.dataGateway.execute('DELETE FROM flag_clients WHERE flag_id = ?', [id]);

        if (entity.clientIds.length > 0) {
          for (const clientId of entity.clientIds) {
            await this.dataGateway.execute(
              'INSERT INTO flag_clients (flag_id, client_id) VALUES (?, ?)',
              [id, clientId]
            );
          }
        }
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
      await this.dataGateway.execute('DELETE FROM flag_clients WHERE flag_id = ?', [id]);
      await this.dataGateway.execute('DELETE FROM flag_ttl WHERE flag_id = ?', [id]);

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

  async findByName(name: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.name = ? 
      GROUP BY f.id
      LIMIT 1
    `;

    const row = await this.dataGateway.getOne<FlagRow>(sql, [name]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.key = ? 
      GROUP BY f.id
      LIMIT 1
    `;

    const row = await this.dataGateway.getOne<FlagRow>(sql, [key]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByStatus(status: TFlagStatus): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.status = ? 
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [status]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByCategory(categoryId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.category_id = ? 
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [categoryId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByType(type: TFlagType): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.type = ? 
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [type]);
    return rows.map(row => this.mapToEntity(row));
  }

  async toggleStatus(id: string, status: TFlagStatus): Promise<FeatureFlag | null> {
    const updateSql = `
      UPDATE ${this.tableName} 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `;
    await this.dataGateway.execute(updateSql, [status, new Date(), id]);
    return this.findById(id);
  }

  async findActiveFlags(): Promise<FeatureFlag[]> {
    return this.findByStatus(FlagStatus.ACTIVE);
  }

  async findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.status = ? AND fc.client_id = ?
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [FlagStatus.ACTIVE, clientId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findExpiredFlags(): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE ttl.expires_at < ?
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [new Date()]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findAutoDeleteFlags(): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        ttl.expires_at, ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE ttl.expires_at < ? AND ttl.auto_delete = 1
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [new Date()]);
    return rows.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: FlagRow): FeatureFlag {
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

    const expiresAt = parseDate(row.expires_at)!;
    const createdAt = parseDate(row.created_at) || new Date();
    const updatedAt = parseDate(row.updated_at);

    const clientIds: string[] =
      row.client_ids_concat && typeof row.client_ids_concat === 'string'
        ? row.client_ids_concat.split(',')
        : [];

    let enumData: IFlagEnum | undefined = undefined;

    if (row.enum_values && typeof row.enum_values === 'string') {
      try {
        const values = JSON.parse(row.enum_values);
        enumData = {
          values: values,
          selected: row.selected_enum || undefined,
        };
      } catch (e) {
        // If parsing fails, leave enumData as undefined
      }
    }

    const ttl: IFlagTTL = {
      expiresAt,
      autoDelete: row.auto_delete === 1 || row.auto_delete === true,
    };

    const metadata: IMetadata = {
      createdBy: row.created_by,
      createdAt,
      updatedBy: row.updated_by || undefined,
      updatedAt,
    };

    return new FeatureFlag({
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description || undefined,
      type: row.type as TFlagType,
      status: row.status as TFlagStatus,
      categoryId: row.category_id || undefined,
      enum: enumData,
      ttl,
      clientIds: clientIds.length > 0 ? clientIds : undefined,
      metadata,
    });
  }

  private buildBaseSelectQuery(whereClause?: string): string {
    return `
      SELECT 
        f.*,
        ttl.expires_at, 
        ttl.auto_delete,
        GROUP_CONCAT(DISTINCT fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_ttl ttl ON f.id = ttl.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      ${whereClause ? `WHERE ${whereClause}` : ''}
      GROUP BY f.id
      ORDER BY f.name ASC
    `;
  }
}
