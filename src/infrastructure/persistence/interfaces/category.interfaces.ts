import { IRepository } from '../../../shared/kernel';
import { FlagCategory } from '../../../core/model';

export interface ICategoryRepository extends IRepository<FlagCategory, string> {
  findByName(name: string): Promise<FlagCategory | null>;
  findByParentId(parentId: string): Promise<FlagCategory[]>;
  findRootCategories(): Promise<FlagCategory[]>;
  getFullPath(categoryId: string): Promise<FlagCategory[]>;
}
