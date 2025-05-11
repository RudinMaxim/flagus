import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { ILogger } from '../../../shared/logger';
import { FeatureFlag, TFlagStatus, TFlagType, FlagStatus } from '../../../core/flag-manager/model';
import { DataGateway } from '../../../shared/storage';
import { IFlagRepository } from '../interfaces';

// Interface for raw database row
interface IFlagRow {
  id: string;
  key: string;
  name: string;
  type: string;
  description?: string;
  expires_at?: string;
  auto_delete?: number;
  status: string;
  enum?: string;
  category_id?: string;
  environment_id?: string;
  client_ids?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
}

@injectable()
export class FlagRepository implements IFlagRepository {
  constructor(
    @inject(TYPES.DataGateway) private readonly dataGateway: DataGateway,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async create(entity: FeatureFlag): Promise<FeatureFlag> {
    const sql = `
      INSERT INTO feature_flags (
        id, key, name, type, description, expires_at, auto_delete, status,
        enum, category_id, environment_id, client_ids, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      entity.id,
      entity.key,
      entity.name,
      entity.type,
      entity.description,
      entity.ttl?.expiresAt.toISOString(),
      entity.ttl?.autoDelete ? 1 : 0,
      entity.status,
      entity.enum ? JSON.stringify(entity.enum) : null,
      entity.categoryId,
      entity.environmentId,
      entity.clientIds ? JSON.stringify(entity.clientIds) : null,
      entity.metadata.createdBy,
      entity.metadata.createdAt.toISOString(),
    ];

    try {
      await this.dataGateway.execute(sql, params);
      return entity;
    } catch (error) {
      this.logger.error('Failed to create feature flag', error as Error, { flagId: entity.id });
      throw new Error('Failed to create feature flag');
    }
  }

  async update(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];
    const updatedAt = new Date().toISOString();

    if (data.name) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.type) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.status) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.enum) {
      updates.push('enum = ?');
      params.push(JSON.stringify(data.enum));
    }
    if (data.categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(data.categoryId);
    }
    if (data.environmentId !== undefined) {
      updates.push('environment_id = ?');
      params.push(data.environmentId);
    }
    if (data.clientIds !== undefined) {
      updates.push('client_ids = ?');
      params.push(data.clientIds ? JSON.stringify(data.clientIds) : null);
    }
    if (data.ttl) {
      updates.push('expires_at = ?, auto_delete = ?');
      params.push(data.ttl.expiresAt.toISOString(), data.ttl.autoDelete ? 1 : 0);
    }
    if (data.metadata?.updatedBy) {
      updates.push('updated_by = ?, updated_at = ?');
      params.push(data.metadata.updatedBy, updatedAt);
    }

    if (updates.length === 0) return existing;

    const sql = `UPDATE feature_flags SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
      await this.dataGateway.execute(sql, params);
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Failed to update feature flag', error as Error, { flagId: id });
      throw new Error('Failed to update feature flag');
    }
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM feature_flags WHERE id = ?';
    try {
      const result = await this.dataGateway.execute(sql, [id]);
      return !!result;
    } catch (error) {
      this.logger.error('Failed to delete feature flag', error as Error, { flagId: id });
      throw new Error('Failed to delete feature flag');
    }
  }

  async findAll(): Promise<FeatureFlag[]> {
    const sql = 'SELECT * FROM feature_flags';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch all feature flags', error as Error);
      throw new Error('Failed to fetch feature flags');
    }
  }

  async findById(id: string): Promise<FeatureFlag | null> {
    const sql = 'SELECT * FROM feature_flags WHERE id = ?';
    try {
      const row = await this.dataGateway.getOne<IFlagRow>(sql, [id]);
      return row ? this.mapToFeatureFlag(row) : null;
    } catch (error) {
      this.logger.error('Failed to fetch feature flag by ID', error as Error, { flagId: id });
      throw new Error('Failed to fetch feature flag');
    }
  }

  async findByName(name: string): Promise<FeatureFlag | null> {
    const sql = 'SELECT * FROM feature_flags WHERE name = ?';
    try {
      const row = await this.dataGateway.getOne<IFlagRow>(sql, [name]);
      return row ? this.mapToFeatureFlag(row) : null;
    } catch (error) {
      this.logger.error('Failed to fetch feature flag by name', error as Error, { name });
      throw new Error('Failed to fetch feature flag');
    }
  }

  async findByStatus(status: TFlagStatus): Promise<FeatureFlag[]> {
    const sql = 'SELECT * FROM feature_flags WHERE status = ?';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [status]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch feature flags by status', error as Error, { status });
      throw new Error('Failed to fetch feature flags');
    }
  }

  async findByCategory(categoryId: string): Promise<FeatureFlag[]> {
    const sql = 'SELECT * FROM feature_flags WHERE category_id = ?';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [categoryId]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch feature flags by category', error as Error, {
        categoryId,
      });
      throw new Error('Failed to fetch feature flags');
    }
  }

  async findByType(type: TFlagType): Promise<FeatureFlag[]> {
    const sql = 'SELECT * FROM feature_flags WHERE type = ?';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [type]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch feature flags by type', error as Error, { type });
      throw new Error('Failed to fetch feature flags');
    }
  }

  async findByKey(key: string, environmentId: string): Promise<FeatureFlag | null> {
    const sql = 'SELECT * FROM feature_flags WHERE key = ? AND environment_id = ?';
    try {
      const row = await this.dataGateway.getOne<IFlagRow>(sql, [key, environmentId]);
      return row ? this.mapToFeatureFlag(row) : null;
    } catch (error) {
      this.logger.error('Failed to fetch feature flag by key and environment', error as Error, {
        key,
        environmentId,
      });
      throw new Error('Failed to fetch feature flag');
    }
  }

  async toggleStatus(id: string, status: TFlagStatus): Promise<FeatureFlag | null> {
    const sql = 'UPDATE feature_flags SET status = ?, updated_at = ? WHERE id = ?';
    const updatedAt = new Date().toISOString();
    try {
      await this.dataGateway.execute(sql, [status, updatedAt, id]);
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Failed to toggle feature flag status', error as Error, {
        flagId: id,
        status,
      });
      throw new Error('Failed to toggle feature flag status');
    }
  }

  async findActiveFlags(): Promise<FeatureFlag[]> {
    const sql =
      'SELECT * FROM feature_flags WHERE status = ? AND (expires_at IS NULL OR expires_at > ?)';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [
        FlagStatus.ACTIVE,
        new Date().toISOString(),
      ]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch active feature flags', error as Error);
      throw new Error('Failed to fetch active feature flags');
    }
  }

  async findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT * FROM feature_flags 
      WHERE status = ? 
      AND (expires_at IS NULL OR expires_at > ?)
      AND (client_ids IS NULL OR client_ids LIKE ?)
    `;
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [
        FlagStatus.ACTIVE,
        new Date().toISOString(),
        `%${clientId}%`,
      ]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch active feature flags for client', error as Error, {
        clientId,
      });
      throw new Error('Failed to fetch active feature flags for client');
    }
  }

  async findExpiredFlags(): Promise<FeatureFlag[]> {
    const sql = 'SELECT * FROM feature_flags WHERE expires_at IS NOT NULL AND expires_at < ?';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [new Date().toISOString()]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch expired feature flags', error as Error);
      throw new Error('Failed to fetch expired feature flags');
    }
  }

  async findByEnvironment(environmentId: string): Promise<FeatureFlag[]> {
    const sql = 'SELECT * FROM feature_flags WHERE environment_id = ?';
    try {
      const rows = await this.dataGateway.query<IFlagRow>(sql, [environmentId]);
      return rows.map(this.mapToFeatureFlag);
    } catch (error) {
      this.logger.error('Failed to fetch feature flags by environment', error as Error, {
        environmentId,
      });
      throw new Error('Failed to fetch feature flags by environment');
    }
  }

  private mapToFeatureFlag(row: IFlagRow): FeatureFlag {
    return new FeatureFlag({
      id: row.id,
      key: row.key,
      name: row.name,
      type: row.type as TFlagType,
      description: row.description,
      ttl: {
        expiresAt: new Date(row.expires_at!),
        autoDelete: !!row.auto_delete,
      },
      status: row.status as TFlagStatus,
      enum: row.enum ? JSON.parse(row.enum) : undefined,
      categoryId: row.category_id,
      environmentId: row.environment_id!,
      clientIds: row.client_ids ? JSON.parse(row.client_ids) : undefined,
      metadata: {
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedBy: row.updated_by,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      },
    });
  }
}
