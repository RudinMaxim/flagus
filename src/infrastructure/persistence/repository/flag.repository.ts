import { BaseRepository, DataGateway } from '@infrastructure/storage';
import { FeatureFlag } from '../../../core/flag-management/model';
import { FlagStatus, FlagType } from '../../../shared/kernel';
import { IFlagRepository } from '../interfaces';
import { inject, injectable } from 'inversify';
import { TYPES } from '@infrastructure/config';

@injectable()
export class FlagRepository extends BaseRepository<FeatureFlag, string> implements IFlagRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'feature_flags', 'id');
  }

  async findByName(name: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE name = ? 
      LIMIT 1
    `;
    return this.dataGateway.getOne<FeatureFlag>(sql, [name]);
  }

  async findByStatus(status: FlagStatus): Promise<FeatureFlag[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE status = ? 
      ORDER BY name ASC
    `;
    return this.dataGateway.query<FeatureFlag>(sql, [status]);
  }

  async findByCategory(categoryId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT f.* FROM ${this.tableName} f
      JOIN flag_categories_map fcm ON f.id = fcm.flag_id
      WHERE fcm.category_id = ? 
      ORDER BY f.name ASC
    `;
    return this.dataGateway.query<FeatureFlag>(sql, [categoryId]);
  }

  async findByType(type: FlagType): Promise<FeatureFlag[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE type = ? 
      ORDER BY name ASC
    `;
    return this.dataGateway.query<FeatureFlag>(sql, [type]);
  }

  async toggleStatus(id: string, status: FlagStatus): Promise<FeatureFlag | null> {
    const updateSql = `
      UPDATE ${this.tableName} 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await this.dataGateway.execute(updateSql, [status, id]);

    const selectSql = `
      SELECT * FROM ${this.tableName} 
      WHERE id = ?
    `;
    return this.dataGateway.getOne<FeatureFlag>(selectSql, [id]);
  }

  async findActiveFlags(): Promise<FeatureFlag[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE status = ? 
      ORDER BY name ASC
    `;
    return this.dataGateway.query<FeatureFlag>(sql, [FlagStatus.ACTIVE]);
  }

  async findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT f.* FROM ${this.tableName} f
      JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE fc.client_id = ? AND f.status = ? 
      ORDER BY f.name ASC
    `;
    return this.dataGateway.query<FeatureFlag>(sql, [clientId, FlagStatus.ACTIVE]);
  }
}
