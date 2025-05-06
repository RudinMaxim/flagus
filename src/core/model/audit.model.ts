import { AuditAction, IEntity } from '../../shared/kernel';

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

export interface CreateAuditLogDTO {
  userId: string;
  action: AuditAction;
  entityId: string;
  entityType: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}
