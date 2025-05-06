import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { FlagCategory } from '../../../core/model';
import { BaseRepository, DataGateway } from '../../storage';
import { CategoryRow, ICategoryRepository } from '../interfaces';
import { TYPES } from '../../config/types';
import { Metadata } from '../../../shared/kernel';

@injectable()
export class CategoryRepository
  extends BaseRepository<FlagCategory, string>
  implements ICategoryRepository
{
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'flag_categories', 'id');
  }

  async findAll(): Promise<FlagCategory[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      ORDER BY depth ASC, name ASC
    `;
    const rows = await this.dataGateway.query<CategoryRow>(sql);
    return rows.map(row => this.mapToEntity(row));
  }

  async findById(id: string): Promise<FlagCategory | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE id = ?
      LIMIT 1
    `;
    const row = await this.dataGateway.getOne<CategoryRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByName(name: string): Promise<FlagCategory | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE name = ? 
      LIMIT 1
    `;
    const row = await this.dataGateway.getOne<CategoryRow>(sql, [name]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByParentId(parentId: string): Promise<FlagCategory[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id = ? 
      ORDER BY name ASC
    `;
    const rows = await this.dataGateway.query<CategoryRow>(sql, [parentId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findRootCategories(): Promise<FlagCategory[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE parent_id IS NULL 
      ORDER BY name ASC
    `;
    const rows = await this.dataGateway.query<CategoryRow>(sql);
    return rows.map(row => this.mapToEntity(row));
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
      ORDER BY level DESC
    `;
    const rows = await this.dataGateway.query<CategoryRow>(sql, [categoryId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async getChildrenTree(categoryId: string | null = null): Promise<FlagCategory[]> {
    const sql = `
      WITH RECURSIVE category_tree AS (
        SELECT *, 0 AS tree_level 
        FROM ${this.tableName} 
        WHERE ${categoryId ? 'id = ?' : 'parent_id IS NULL'}
        
        UNION ALL
        
        SELECT c.*, ct.tree_level + 1
        FROM ${this.tableName} c
        JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree
      ORDER BY tree_level ASC, name ASC
    `;

    const params = categoryId ? [categoryId] : [];
    const rows = await this.dataGateway.query<CategoryRow>(sql, params);
    return rows.map(row => this.mapToEntity(row));
  }

  async create(entity: Omit<FlagCategory, 'id'>): Promise<FlagCategory> {
    await this.dataGateway.beginTransaction();

    try {
      let depth = 0;
      if (entity.parentId) {
        const parent = await this.findById(entity.parentId);
        if (!parent) {
          throw new Error(`Parent category with ID ${entity.parentId} not found`);
        }
        depth = parent.depth + 1;
      }

      const categoryId = crypto.randomUUID();
      const now = new Date();

      const sql = `
        INSERT INTO ${this.tableName} (
          id, name, description, parent_id, depth,
          created_at, created_by, updated_at, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.dataGateway.execute(sql, [
        categoryId,
        entity.name,
        entity.description || null,
        entity.parentId || null,
        depth,
        now,
        entity.metadata.createdBy,
        null,
        null,
      ]);

      await this.dataGateway.commit();

      const result = await this.findById(categoryId);
      if (!result) {
        throw new Error(`Failed to retrieve created category with ID: ${categoryId}`);
      }
      return result;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async update(id: string, entity: Partial<FlagCategory>): Promise<FlagCategory | null> {
    await this.dataGateway.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues = [];

      if (entity.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(entity.name);
      }

      if (entity.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(entity.description);
      }

      if (entity.parentId !== undefined) {
        updateFields.push('parent_id = ?');
        updateValues.push(entity.parentId);

        let depth = 0;
        if (entity.parentId) {
          const parent = await this.findById(entity.parentId);
          if (!parent) {
            throw new Error(`Parent category with ID ${entity.parentId} not found`);
          }
          depth = parent.depth + 1;
        }

        updateFields.push('depth = ?');
        updateValues.push(depth);

        if (entity.parentId) {
          const path = await this.getFullPath(entity.parentId);
          if (path.some(cat => cat.id === id)) {
            throw new Error('Circular dependency detected in category hierarchy');
          }
        }
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());

      if (entity.metadata?.updatedBy) {
        updateFields.push('updated_by = ?');
        updateValues.push(entity.metadata.updatedBy);
      }

      if (updateFields.length > 0) {
        const sql = `
          UPDATE ${this.tableName} 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.dataGateway.execute(sql, [...updateValues, id]);
      }

      if (entity.parentId !== undefined) {
        await this.updateChildrenDepth(id);
      }

      await this.dataGateway.commit();
      return this.findById(id);
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async moveNode(categoryId: string, newParentId: string | null): Promise<FlagCategory | null> {
    return this.update(categoryId, {
      parentId: newParentId ?? undefined,
      metadata: {
        updatedBy: 'system',
        createdBy: 'system',
        createdAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.dataGateway.beginTransaction();

    try {
      const children = await this.findByParentId(id);
      if (children.length > 0) {
        throw new Error(
          'Cannot delete category with children. Delete children first or move them to a different parent.'
        );
      }

      const flagsCount = await this.dataGateway.getOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM feature_flags WHERE category_id = ?',
        [id]
      );

      if (flagsCount && flagsCount.count > 0) {
        throw new Error(
          `Cannot delete category with associated flags. There are ${flagsCount.count} flags in this category.`
        );
      }

      const result = await this.dataGateway.execute<{ changes: number }>(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      await this.dataGateway.commit();
      return result.changes > 0;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async getCategoryStats(): Promise<{ id: string; name: string; flagsCount: number }[]> {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        COUNT(f.id) as flagsCount 
      FROM ${this.tableName} c
      LEFT JOIN feature_flags f ON c.id = f.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    return this.dataGateway.query<{ id: string; name: string; flagsCount: number }>(sql);
  }

  private async updateChildrenDepth(parentId: string): Promise<void> {
    const parent = await this.findById(parentId);
    if (!parent) return;

    const children = await this.findByParentId(parentId);
    for (const child of children) {
      const newDepth = parent.depth + 1;
      if (child.depth !== newDepth) {
        await this.dataGateway.execute(`UPDATE ${this.tableName} SET depth = ? WHERE id = ?`, [
          newDepth,
          child.id,
        ]);
        await this.updateChildrenDepth(child.id);
      }
    }
  }

  private mapToEntity(row: CategoryRow): FlagCategory {
    const parseDate = (dateStr: string | null | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        const timestamp = parseFloat(dateStr);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
        return new Date(dateStr);
      } catch (e) {
        return undefined;
      }
    };

    const metadata: Metadata = {
      createdBy: row.created_by,
      createdAt: parseDate(row.created_at) || new Date(),
      updatedBy: row.updated_by || undefined,
      updatedAt: parseDate(row.updated_at),
    };

    return new FlagCategory({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      parentId: row.parent_id || undefined,
      depth: row.depth,
      metadata,
    });
  }
}
