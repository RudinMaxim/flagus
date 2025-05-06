import { AuditAction, FlagStatus, FlagType, UserRole } from './base.constans';

export interface IMetadata {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface IFlagTTL {
  expiresAt: Date;
  autoDelete: boolean;
}

export type TFlagType = (typeof FlagType)[keyof typeof FlagType];
export type TFlagStatus = (typeof FlagStatus)[keyof typeof FlagStatus];
export type TUserRole = (typeof UserRole)[keyof typeof UserRole];
export type TAuditAction = (typeof AuditAction)[keyof typeof AuditAction];
