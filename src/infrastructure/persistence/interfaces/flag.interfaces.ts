import { IRepository, FlagStatus, FlagType } from '../../../shared/kernel';
import { FeatureFlag } from '../../../core/model';

export interface IFlagRepository extends IRepository<FeatureFlag, string> {
  findByName(name: string): Promise<FeatureFlag | null>;
  findByStatus(status: FlagStatus): Promise<FeatureFlag[]>;
  findByCategory(categoryId: string): Promise<FeatureFlag[]>;
  findByType(type: FlagType): Promise<FeatureFlag[]>;
  toggleStatus(id: string, status: FlagStatus): Promise<FeatureFlag | null>;
  findActiveFlags(): Promise<FeatureFlag[]>;
  findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]>;
}
