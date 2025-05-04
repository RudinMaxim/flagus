import { IEntity } from '@shared/kernel/base.interfaces';
import { AuditAction } from '@shared/kernel/base.types';

export class AuditLog implements IEntity<string> {
  id: string;
  userId: string;
  action: AuditAction;
  entityId: string;
  entityType: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
  ipAddress?: string;

  constructor(data: {
    id: string;
    userId: string;
    action: AuditAction;
    entityId: string;
    entityType: string;
    oldValue?: string;
    newValue?: string;
    timestamp: Date;
    ipAddress?: string;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.action = data.action;
    this.entityId = data.entityId;
    this.entityType = data.entityType;
    this.oldValue = data.oldValue;
    this.newValue = data.newValue;
    this.timestamp = data.timestamp;
    this.ipAddress = data.ipAddress;
  }
}

// DTO для создания записи аудита
export interface CreateAuditLogDTO {
  userId: string;
  action: AuditAction;
  entityId: string;
  entityType: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}
