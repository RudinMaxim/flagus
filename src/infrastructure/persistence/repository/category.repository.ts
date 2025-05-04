import { BaseRepository, DataGateway } from '@infrastructure/storage';
import { FlagCategory } from '../../../core/flag-management/model';
import { ICategoryRepository } from '../interfaces';
import { TYPES } from '@infrastructure/config';
import { inject, injectable } from 'inversify';

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
      WHERE name = $1 
      LIMIT 1
    `;
    return this.dataGateway.getOne<FlagCategory>(sql, [name]);
  }

  async findByParentId(parentId: string): Promise<FlagCategory[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = $1 
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
        SELECT * FROM ${this.tableName} WHERE id = $1
        
        UNION ALL
        
        SELECT c.* 
        FROM ${this.tableName} c
        JOIN category_path cp ON c.id = cp.parent_id
      )
      SELECT * FROM category_path
      ORDER BY level ASC
    `;
    return this.dataGateway.query<FlagCategory>(sql, [categoryId]);
  }
}
