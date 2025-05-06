export enum FlagType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
}

export enum FlagStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  TOGGLE = 'toggle',
}

export interface TimeConstraint {
  startDate?: Date;
  endDate?: Date;
}

export interface PercentageDistribution {
  percentage: number; // 0-100
}

export interface Metadata {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}
