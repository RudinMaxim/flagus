import { AuditAction, IEntity } from '../../shared/kernel';

export interface AuditLogProps {
  id: string;
  userId: string;
  action: AuditAction;
  entityId: string;
  entityType: string;
  oldValue: string | undefined;
  newValue: string | undefined;
  timestamp: Date;
  ipAddress?: string;
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

export class AuditLog implements IEntity<string> {
  id: string;
  userId: string;
  action: AuditAction;
  entityId: string;
  entityType: string;
  oldValue: string | undefined;
  newValue: string | undefined;
  timestamp: Date;
  ipAddress?: string;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.action = props.action;
    this.entityId = props.entityId;
    this.entityType = props.entityType;
    this.oldValue = props.oldValue;
    this.newValue = props.newValue;
    this.timestamp = props.timestamp;
    this.ipAddress = props.ipAddress;
  }
}
