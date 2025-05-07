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
