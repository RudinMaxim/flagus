import { IRepository } from '../../../shared/kernel';
import { FlagCategory } from '../../../core/model';

export interface CategoryRow {
  id: string;
  name: string;
  description: string | undefined;
  parent_id: string | undefined;
  depth: number;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

export interface ICategoryRepository extends IRepository<FlagCategory, string> {
  findByName(name: string): Promise<FlagCategory | null>;
  findByParentId(parentId: string): Promise<FlagCategory[]>;
  findRootCategories(): Promise<FlagCategory[]>;
  getFullPath(categoryId: string): Promise<FlagCategory[]>;
  getChildrenTree(categoryId: string | null): Promise<FlagCategory[]>;
  moveNode(categoryId: string, newParentId: string | null): Promise<FlagCategory | null>;
  getCategoryStats(): Promise<{ id: string; name: string; flagsCount: number }[]>;
}
