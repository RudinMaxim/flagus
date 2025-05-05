import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { ICategoryRepository } from '../../../infrastructure/persistence';
import { IService, AuditAction } from '../../../shared/kernel';
import { FlagCategory, CreateCategoryDTO, UpdateCategoryDTO } from '../model';
import { AuditService } from './audit.service';

@injectable()
export class CategoryService
  implements IService<FlagCategory, string, CreateCategoryDTO, UpdateCategoryDTO>
{
  private MAX_DEPTH = 3;

  constructor(
    @inject(TYPES.CategoryRepository) private categoryRepository: ICategoryRepository,
    @inject(TYPES.AuditService) private auditService: AuditService
  ) {}

  async getAll(): Promise<FlagCategory[]> {
    return this.categoryRepository.findAll();
  }

  async getById(id: string): Promise<FlagCategory | null> {
    return this.categoryRepository.findById(id);
  }

  async getByName(name: string): Promise<FlagCategory | null> {
    return this.categoryRepository.findByName(name);
  }

  async getRootCategories(): Promise<FlagCategory[]> {
    return this.categoryRepository.findRootCategories();
  }

  async getSubcategories(parentId: string): Promise<FlagCategory[]> {
    return this.categoryRepository.findByParentId(parentId);
  }

  async getCategoryPath(categoryId: string): Promise<FlagCategory[]> {
    return this.categoryRepository.getFullPath(categoryId);
  }

  async create(dto: CreateCategoryDTO): Promise<FlagCategory> {
    const existingCategory = await this.categoryRepository.findByName(dto.name);
    if (existingCategory) {
      throw new Error(`Category with name ${dto.name} already exists`);
    }

    let depth = 0;
    if (dto.parentId) {
      const parentCategory = await this.categoryRepository.findById(dto.parentId);
      if (!parentCategory) {
        throw new Error(`Parent category with id ${dto.parentId} not found`);
      }

      depth = parentCategory.depth + 1;

      if (depth > this.MAX_DEPTH) {
        throw new Error(`Maximum category depth (${this.MAX_DEPTH}) exceeded`);
      }

      const path = await this.categoryRepository.getFullPath(dto.parentId);
      if (path.some(cat => cat.id === dto.parentId)) {
        throw new Error('Cyclic dependency detected in category hierarchy');
      }
    }

    const category = new FlagCategory({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      parentId: dto.parentId,
      depth,
      metadata: {
        createdBy: dto.createdBy,
        createdAt: new Date(),
      },
    });

    const createdCategory = await this.categoryRepository.create(category);

    await this.auditService.logAction({
      userId: dto.createdBy,
      action: AuditAction.CREATE,
      entityId: createdCategory.id,
      entityType: 'flag_category',
      newValue: JSON.stringify(createdCategory),
    });

    return createdCategory;
  }

  async update(id: string, dto: UpdateCategoryDTO): Promise<FlagCategory | null> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      return null;
    }

    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findByName(dto.name);
      if (existingCategory && existingCategory.id !== id) {
        throw new Error(`Category with name ${dto.name} already exists`);
      }
    }

    if (dto.parentId && dto.parentId !== category.parentId) {
      if (dto.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findById(dto.parentId);
      if (!parentCategory) {
        throw new Error(`Parent category with id ${dto.parentId} not found`);
      }

      const newDepth = parentCategory.depth + 1;

      if (newDepth > this.MAX_DEPTH) {
        throw new Error(`Maximum category depth (${this.MAX_DEPTH}) exceeded`);
      }

      const childCategories = await this.categoryRepository.findByParentId(id);
      const isParentAmongChildren = childCategories.some(cat => cat.id === dto.parentId);
      if (isParentAmongChildren) {
        throw new Error('Cyclic dependency detected in category hierarchy');
      }

      dto = { ...dto, depth: newDepth };
    }

    const oldValue = JSON.stringify(category);

    const metadata = { ...category.metadata };
    metadata.updatedBy = dto.updatedBy;
    metadata.updatedAt = new Date();

    const updateData: Partial<FlagCategory> = {
      ...dto,
      metadata,
    };

    const updatedCategory = await this.categoryRepository.update(id, updateData);

    if (updatedCategory) {
      await this.auditService.logAction({
        userId: dto.updatedBy,
        action: AuditAction.UPDATE,
        entityId: id,
        entityType: 'flag_category',
        oldValue,
        newValue: JSON.stringify(updatedCategory),
      });
    }

    return updatedCategory;
  }

  async delete(id: string): Promise<boolean> {
    const subcategories = await this.categoryRepository.findByParentId(id);
    if (subcategories.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      return false;
    }

    const result = await this.categoryRepository.delete(id);

    if (result) {
      await this.auditService.logAction({
        userId: 'system',
        action: AuditAction.DELETE,
        entityId: id,
        entityType: 'flag_category',
        oldValue: JSON.stringify(category),
      });
    }

    return result;
  }
}
