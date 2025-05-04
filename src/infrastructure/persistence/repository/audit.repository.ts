import { BaseRepository, DataGateway } from '@infrastructure/storage';
import { AuditLog } from '../../../core/flag-management/model';
import { IAuditRepository } from '../interfaces';
import { TYPES } from '@infrastructure/config';
import { inject, injectable } from 'inversify';

@injectable()
export class AuditRepository extends BaseRepository<AuditLog, string> implements IAuditRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'audit_logs', 'id');
  }

  async findByEntityId(entityId: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE entity_id = $1 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [entityId]);
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [userId]);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE created_at BETWEEN $1 AND $2 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [startDate, endDate]);
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE action = $1 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [action]);
  }
}
