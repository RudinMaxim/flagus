import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { ICategoryRepository } from '../../infrastructure/persistence';
import { IService, AuditAction } from '../../shared/kernel';
import { FlagCategory, CreateCategoryDTO, UpdateCategoryDTO } from '../model';
import { AuditService } from './audit.service';

export class CategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryError';
  }
}

@injectable()
export class CategoryService
  implements IService<FlagCategory, string, CreateCategoryDTO, UpdateCategoryDTO>
{
  private readonly MAX_DEPTH = 3;

  constructor(
    @inject(TYPES.CategoryRepository) private readonly categoryRepository: ICategoryRepository,
    @inject(TYPES.AuditService) private readonly auditService: AuditService
  ) {}

  public async getAll(): Promise<FlagCategory[]> {
    return this.categoryRepository.findAll();
  }

  public async getById(id: string): Promise<FlagCategory | null> {
    return this.categoryRepository.findById(id);
  }

  public async getByName(name: string): Promise<FlagCategory | null> {
    return this.categoryRepository.findByName(name);
  }

  public async getRootCategories(): Promise<FlagCategory[]> {
    return this.categoryRepository.findRootCategories();
  }

  public async getSubcategories(parentId: string): Promise<FlagCategory[]> {
    return this.categoryRepository.findByParentId(parentId);
  }

  public async getCategoryPath(categoryId: string): Promise<FlagCategory[]> {
    return this.categoryRepository.getFullPath(categoryId);
  }

  public async create(dto: CreateCategoryDTO): Promise<FlagCategory> {
    await this.validateCategoryName(dto.name);
    const depth = await this.calculateDepth(dto.parentId);

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
    await this.logAudit(
      AuditAction.CREATE,
      dto.createdBy,
      createdCategory.id,
      null,
      createdCategory
    );

    return createdCategory;
  }

  public async update(id: string, dto: UpdateCategoryDTO): Promise<FlagCategory | null> {
    const category = await this.validateCategoryExists(id);

    if (dto.name && dto.name !== category.name) {
      await this.validateCategoryName(dto.name, id);
    }

    const updateData: Partial<FlagCategory> = { ...dto };

    if (dto.parentId && dto.parentId !== category.parentId) {
      await this.validateParentCategory(id, dto.parentId);
      const newDepth = await this.calculateDepth(dto.parentId);
      updateData.depth = newDepth;
    }

    const oldValue = { ...category };
    updateData.metadata = {
      ...category.metadata,
      updatedBy: dto.updatedBy,
      updatedAt: new Date(),
    };

    const updatedCategory = await this.categoryRepository.update(id, updateData);

    if (updatedCategory) {
      await this.logAudit(AuditAction.UPDATE, dto.updatedBy, id, oldValue, updatedCategory);
    }

    return updatedCategory;
  }

  public async delete(id: string, userId: string = 'system'): Promise<boolean> {
    const category = await this.validateCategoryExists(id);
    await this.validateNoSubcategories(id);

    const result = await this.categoryRepository.delete(id);

    if (result) {
      await this.logAudit(AuditAction.DELETE, userId, id, category, null);
    }

    return result;
  }

  private async validateCategoryName(name: string, excludeId?: string): Promise<void> {
    const existingCategory = await this.categoryRepository.findByName(name);

    if (existingCategory && (!excludeId || existingCategory.id !== excludeId)) {
      throw new CategoryError(`Category with name ${name} already exists`);
    }
  }

  private async validateCategoryExists(id: string): Promise<FlagCategory> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new CategoryError(`Category with id ${id} not found`);
    }

    return category;
  }

  private async validateParentCategory(categoryId: string, parentId: string): Promise<void> {
    if (categoryId === parentId) {
      throw new CategoryError('Category cannot be its own parent');
    }

    const parentCategory = await this.validateCategoryExists(parentId);

    if (parentCategory.depth + 1 > this.MAX_DEPTH) {
      throw new CategoryError(`Maximum category depth (${this.MAX_DEPTH}) exceeded`);
    }

    const childCategories = await this.categoryRepository.findByParentId(categoryId);
    if (childCategories.some(cat => cat.id === parentId)) {
      throw new CategoryError('Cyclic dependency detected in category hierarchy');
    }

    const path = await this.categoryRepository.getFullPath(parentId);
    if (path.some(cat => cat.id === categoryId)) {
      throw new CategoryError('Cyclic dependency detected in category hierarchy');
    }
  }

  private async validateNoSubcategories(id: string): Promise<void> {
    const subcategories = await this.categoryRepository.findByParentId(id);

    if (subcategories.length > 0) {
      throw new CategoryError('Cannot delete category with subcategories');
    }
  }

  private async calculateDepth(parentId?: string): Promise<number> {
    if (!parentId) return 0;

    const parentCategory = await this.validateCategoryExists(parentId);
    const newDepth = parentCategory.depth + 1;

    if (newDepth > this.MAX_DEPTH) {
      throw new CategoryError(`Maximum category depth (${this.MAX_DEPTH}) exceeded`);
    }

    return newDepth;
  }

  private async logAudit(
    action: AuditAction,
    userId: string,
    entityId: string,
    oldValue: FlagCategory | null,
    newValue: FlagCategory | null
  ): Promise<void> {
    await this.auditService.logAction({
      userId,
      action,
      entityId,
      entityType: 'flag_category',
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }
}
