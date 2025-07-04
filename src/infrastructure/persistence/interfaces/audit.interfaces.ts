import { AuditLog } from '../../../core/observability/model';
import { IRepository } from '../../../shared/kernel';

export interface IAuditRepository extends IRepository<AuditLog, string> {
  findByEntityId(entityId: string): Promise<AuditLog[]>;
  findByUserId(userId: string): Promise<AuditLog[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
  findByAction(action: string): Promise<AuditLog[]>;
}
