import { FeatureFlag, TFlagStatus, TFlagType } from '../../../core/flag-manager/model';
import { IRepository } from '../../../shared/kernel';

export interface IFlagRepository extends IRepository<FeatureFlag, string> {
  findByName(name: string): Promise<FeatureFlag | null>;
  findByStatus(status: TFlagStatus): Promise<FeatureFlag[]>;
  findByCategory(categoryId: string): Promise<FeatureFlag[]>;
  findByType(type: TFlagType): Promise<FeatureFlag[]>;
  findByKey(key: string): Promise<FeatureFlag | null>;
  toggleStatus(id: string, status: TFlagStatus): Promise<FeatureFlag | null>;
  findActiveFlags(): Promise<FeatureFlag[]>;
  findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]>;
  findExpiredFlags(): Promise<FeatureFlag[]>;
  findByEnvironment(environmentId: string): Promise<FeatureFlag[]>;
}
