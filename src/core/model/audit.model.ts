import { TAuditAction, IEntity } from '../../shared/kernel';

export interface CreateAuditLogDTO {
  userId: string;
  action: TAuditAction;
  entityId: string;
  entityType: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

interface IAuditLogProps {
  id: string;
  userId: string;
  action: TAuditAction;
  entityId: string;
  entityType: string;
  oldValue: string | undefined;
  newValue: string | undefined;
  timestamp: Date;
  ipAddress?: string;
}

export class AuditLog implements IEntity<string> {
  id: string;
  userId: string;
  action: TAuditAction;
  entityId: string;
  entityType: string;
  oldValue: string | undefined;
  newValue: string | undefined;
  timestamp: Date;
  ipAddress?: string;

  constructor(props: IAuditLogProps) {
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
