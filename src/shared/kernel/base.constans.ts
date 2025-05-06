export const FlagType = {
  BOOLEAN: 'boolean',
  ENUM: 'enum',
} as const;

export const FlagStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived',
} as const;

export const UserRole = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  TOGGLE: 'toggle',
  EXTEND_TTL: 'extend_ttl',
} as const;
