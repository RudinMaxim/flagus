import { IFlagEnum, TAuditAction, TFlagStatus, TFlagType } from './types';

export interface CreateAuditLogDTO {
  userId: string;
  action: TAuditAction;
  entityId: string;
  entityType: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  parentId?: string;
  createdBy: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  parentId?: string;
  updatedBy: string;
  depth?: number;
}

export interface CreateFlagDTO {
  key: string;
  name: string;
  description?: string;
  type: TFlagType;
  status?: TFlagStatus;
  categoryId?: string;
  enum?: IFlagEnum;
  clientIds?: string[];
  createdBy: string;
}

export interface UpdateFlagDTO {
  name?: string;
  description?: string;
  type?: TFlagType;
  status?: TFlagStatus;
  categoryId?: string;
  enum?: IFlagEnum;
  clientIds?: string[];
  updatedBy: string;
}
