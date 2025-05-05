import { injectable, inject } from 'inversify';
import { AuditLog } from '../../../core/flag-management/model';
import { TYPES } from '../../config/types';
import { BaseRepository, DataGateway } from '../../storage';
import { IAuditRepository } from '../interfaces';

@injectable()
export class AuditRepository extends BaseRepository<AuditLog, string> implements IAuditRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'audit_logs', 'id');
  }

  async findByEntityId(entityId: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE entity_id = ? 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [entityId]);
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [userId]);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE created_at BETWEEN ? AND ? 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [startDate.toISOString(), endDate.toISOString()]);
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE action = ? 
      ORDER BY created_at DESC
    `;
    return this.dataGateway.query<AuditLog>(sql, [action]);
  }
}
