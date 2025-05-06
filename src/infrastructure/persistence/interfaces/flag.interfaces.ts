import { IRepository, FlagStatus, FlagType } from '../../../shared/kernel';
import { FeatureFlag } from '../../../core/model';

export interface FlagRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  category_id: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  start_date: string | null;
  end_date: string | null;
  percentage: number | null;
  client_ids_concat: string | null;
}

export interface IFlagRepository extends IRepository<FeatureFlag, string> {
  findByName(name: string): Promise<FeatureFlag | null>;
  findByStatus(status: FlagStatus): Promise<FeatureFlag[]>;
  findByCategory(categoryId: string): Promise<FeatureFlag[]>;
  findByType(type: FlagType): Promise<FeatureFlag[]>;
  findByKey(key: string): Promise<FeatureFlag | null>;
  toggleStatus(id: string, status: FlagStatus): Promise<FeatureFlag | null>;
  findActiveFlags(): Promise<FeatureFlag[]>;
  findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]>;
}
