// Flag типы
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

// Роли пользователей
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// Типы для аудита
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  TOGGLE = 'toggle',
}

// Настройки временных ограничений
export interface TimeConstraint {
  startDate?: Date;
  endDate?: Date;
}

// Настройки процентного распределения
export interface PercentageDistribution {
  percentage: number; // 0-100
}

// Метаданные
export interface Metadata {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}
