import {
  IEntity,
  FlagType,
  FlagStatus,
  TimeConstraint,
  PercentageDistribution,
  Metadata,
} from '../../shared/kernel';

export interface CreateFlagDTO {
  name: string;
  description?: string;
  type: FlagType;
  status?: FlagStatus;
  categoryId?: string;
  timeConstraint?: TimeConstraint;
  percentageDistribution?: PercentageDistribution;
  clientIds?: string[];
  createdBy: string;
}

export interface UpdateFlagDTO {
  name?: string;
  description?: string;
  type?: FlagType;
  status?: FlagStatus;
  categoryId?: string;
  timeConstraint?: TimeConstraint;
  percentageDistribution?: PercentageDistribution;
  clientIds?: string[];
  updatedBy: string;
}

export class FeatureFlag implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  type: FlagType;
  status: FlagStatus;
  categoryId?: string;
  timeConstraint?: TimeConstraint;
  percentageDistribution?: PercentageDistribution;
  clientIds?: string[];
  metadata: Metadata;

  constructor(data: {
    id: string;
    name: string;
    description?: string;
    type: FlagType;
    status: FlagStatus;
    categoryId?: string;
    timeConstraint?: TimeConstraint;
    percentageDistribution?: PercentageDistribution;
    clientIds?: string[];
    metadata: Metadata;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.status = data.status;
    this.categoryId = data.categoryId;
    this.timeConstraint = data.timeConstraint;
    this.percentageDistribution = data.percentageDistribution;
    this.clientIds = data.clientIds;
    this.metadata = data.metadata;
  }

  isActiveByTime(): boolean {
    if (!this.timeConstraint) {
      return true;
    }

    const now = new Date();
    const { startDate, endDate } = this.timeConstraint;

    if (startDate && now < startDate) {
      return false;
    }

    if (endDate && now > endDate) {
      return false;
    }

    return true;
  }

  isActiveForClient(clientId: string): boolean {
    if (this.status !== FlagStatus.ACTIVE) {
      return false;
    }

    if (!this.isActiveByTime()) {
      return false;
    }

    if (this.clientIds && this.clientIds.length > 0) {
      return this.clientIds.includes(clientId);
    }

    if (this.type === FlagType.PERCENTAGE && this.percentageDistribution) {
      const hash = this.hashClientId(clientId);
      return hash <= this.percentageDistribution.percentage;
    }

    return this.status === FlagStatus.ACTIVE;
  }

  private hashClientId(clientId: string): number {
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
      hash = (hash << 5) - hash + clientId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}
