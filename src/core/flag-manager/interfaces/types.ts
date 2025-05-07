import { FlagType, FlagStatus, AuditAction } from '../constants';

export type TFlagType = (typeof FlagType)[keyof typeof FlagType];
export type TFlagStatus = (typeof FlagStatus)[keyof typeof FlagStatus];
export type TAuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export interface IFlagTTL {
  expiresAt: Date;
  autoDelete: boolean;
}

export interface IFlagEnum {
  selected?: string;
  values: string[];
}
