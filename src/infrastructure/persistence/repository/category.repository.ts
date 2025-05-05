import { injectable, inject } from 'inversify';
import { FlagCategory } from '../../../core/flag-management/model';
import { BaseRepository, DataGateway } from '../../storage';
import { ICategoryRepository } from '../interfaces';
import { TYPES } from '../../config/types';

@injectable()
export class CategoryRepository
  extends BaseRepository<FlagCategory, string>
  implements ICategoryRepository
{
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'flag_categories', 'id');
  }

  async findByName(name: string): Promise<FlagCategory | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE name = ? 
      LIMIT 1
    `;
    return this.dataGateway.getOne<FlagCategory>(sql, [name]);
  }

  async findByParentId(parentId: string): Promise<FlagCategory[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ? 
      ORDER BY name ASC
    `;
    return this.dataGateway.query<FlagCategory>(sql, [parentId]);
  }

  async findRootCategories(): Promise<FlagCategory[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id IS NULL 
      ORDER BY name ASC
    `;
    return this.dataGateway.query<FlagCategory>(sql);
  }

  async getFullPath(categoryId: string): Promise<FlagCategory[]> {
    const sql = `
      WITH RECURSIVE category_path AS (
        SELECT *, 0 AS level FROM ${this.tableName} WHERE id = ?
        
        UNION ALL
        
        SELECT c.*, cp.level + 1 AS level
        FROM ${this.tableName} c
        JOIN category_path cp ON c.id = cp.parent_id
      )
      SELECT * FROM category_path
      ORDER BY level ASC
    `;
    return this.dataGateway.query<FlagCategory>(sql, [categoryId]);
  }
}
