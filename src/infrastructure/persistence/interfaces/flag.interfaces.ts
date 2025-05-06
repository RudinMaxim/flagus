import { IRepository, TFlagType, TFlagStatus } from '../../../shared/kernel';
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
  expires_at: string;
  enum_values: string;
  selected_enum: string;
  auto_delete: boolean | number;
  client_ids_concat: string | null;
}

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
}
