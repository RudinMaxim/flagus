import { FlagCategory } from '../../../core/flag-manager/model';
import { IRepository } from '../../../shared/kernel';

export interface ICategoryRepository extends IRepository<FlagCategory, string> {
  findByName(name: string): Promise<FlagCategory | null>;
  findByParentId(parentId: string): Promise<FlagCategory[]>;
  findRootCategories(): Promise<FlagCategory[]>;
  getFullPath(categoryId: string): Promise<FlagCategory[]>;
  getChildrenTree(categoryId: string | null): Promise<FlagCategory[]>;
  moveNode(categoryId: string, newParentId: string | null): Promise<FlagCategory | null>;
  getCategoryStats(): Promise<{ id: string; name: string; flagsCount: number }[]>;
}
