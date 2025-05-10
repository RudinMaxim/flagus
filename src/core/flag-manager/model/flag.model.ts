import { IMetadata, IEntity } from '../../../shared/kernel';

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

export type TFlagType = (typeof FlagType)[keyof typeof FlagType];
export type TFlagStatus = (typeof FlagStatus)[keyof typeof FlagStatus];

export interface IFlagTTL {
  expiresAt: Date;
  autoDelete: boolean;
}

export interface IFlagEnum {
  selected?: string;
  values: string[];
}

export interface IFeatureFlagProps {
  id: string;
  key: string;
  name: string;
  type: TFlagType;
  description?: string;
  ttl: IFlagTTL;
  status: TFlagStatus;
  enum?: IFlagEnum;
  categoryId?: string;
  environmentId: string;
  clientIds?: string[];
  metadata: IMetadata;
}

export class FeatureFlag implements IEntity<string> {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: TFlagType;
  status: TFlagStatus;
  categoryId?: string;
  environmentId: string;
  enum?: IFlagEnum;
  ttl: IFlagTTL;
  clientIds?: string[];
  metadata: IMetadata;

  constructor(props: IFeatureFlagProps) {
    this.id = props.id;
    this.key = props.key;
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;
    this.status = props.status;
    this.categoryId = props.categoryId;
    this.environmentId = props.environmentId;
    this.enum = props.enum;
    this.ttl = props.ttl;
    this.clientIds = props.clientIds;
    this.metadata = props.metadata;
  }

  isActiveForClient(clientId: string): boolean {
    if (this.status !== FlagStatus.ACTIVE) {
      return false;
    }

    if (this.isExpired()) {
      return false;
    }

    if (this.clientIds && this.clientIds.length > 0) {
      return this.clientIds.includes(clientId);
    }

    return true;
  }

  isExpired(): boolean {
    if (!this.ttl || !this.ttl.expiresAt) {
      return false;
    }

    return new Date() > this.ttl.expiresAt;
  }

  shouldBeDeleted(): boolean {
    return this.isExpired() && this.ttl?.autoDelete === true;
  }

  getEnumValue(clientId: string): string | boolean {
    if (this.type !== FlagType.ENUM || !this.enum || this.enum.values.length === 0) {
      return false;
    }

    if (!this.isActiveForClient(clientId)) {
      return false;
    }

    if (this.enum.selected) {
      return this.enum.selected;
    }

    const hash = this.hashClientId(clientId);
    const index = hash % this.enum.values.length;
    return this.enum.values[index];
  }

  private hashClientId(clientId: string): number {
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
      hash = (hash << 5) - hash + clientId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export interface CreateFlagDTO {
  key: string;
  name: string;
  description?: string;
  type: TFlagType;
  status?: TFlagStatus;
  categoryId?: string;
  environmentId: string;
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
  environmentId?: string;
  enum?: IFlagEnum;
  clientIds?: string[];
  updatedBy: string;
}
