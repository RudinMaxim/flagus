import { TAuditAction } from '../../../core/flag-manager/interfaces';
import { AuditLog } from '../../../core/flag-manager/model';
import { IRepository } from '../../../shared/kernel';

export interface AuditLogRow {
  id: string;
  user_id: string;
  action: TAuditAction;
  entity_id: string;
  entity_type: string;
  old_value: string | null;
  new_value: string | null;
  timestamp: Date;
  ip_address: string | null;
}

export interface IAuditRepository extends IRepository<AuditLog, string> {
  findByEntityId(entityId: string): Promise<AuditLog[]>;
  findByUserId(userId: string): Promise<AuditLog[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
  findByAction(action: string): Promise<AuditLog[]>;
}
