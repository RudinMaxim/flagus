import {
  IEntity,
  FlagType,
  FlagStatus,
  TimeConstraint,
  PercentageDistribution,
  Metadata,
} from '@shared/kernel';

export class FeatureFlag implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  type: FlagType;
  status: FlagStatus;
  categoryId?: string;
  timeConstraint?: TimeConstraint;
  percentageDistribution?: PercentageDistribution;
  clientIds?: string[]; // Список клиентов, для которых действует флаг
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

  // Активен ли флаг по временным ограничениям
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

  // Проверка активности флага для конкретного клиента
  isActiveForClient(clientId: string): boolean {
    // Если флаг неактивен, то никому не доступен
    if (this.status !== FlagStatus.ACTIVE) {
      return false;
    }

    // Проверка времени
    if (!this.isActiveByTime()) {
      return false;
    }

    // Проверка списка клиентов
    if (this.clientIds && this.clientIds.length > 0) {
      return this.clientIds.includes(clientId);
    }

    // Для процентного распределения
    if (this.type === FlagType.PERCENTAGE && this.percentageDistribution) {
      // Хэшируем clientId для консистентного распределения
      const hash = this.hashClientId(clientId);
      return hash <= this.percentageDistribution.percentage;
    }

    // Для булевого флага
    return this.status === FlagStatus.ACTIVE;
  }

  // Простая хэш-функция для распределения клиентов (0-100)
  private hashClientId(clientId: string): number {
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
      hash = (hash << 5) - hash + clientId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 100);
  }
}

// DTO для создания флага
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

// DTO для обновления флага
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
