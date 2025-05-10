import { injectable, inject } from 'inversify';
import { ICategoryRepository } from '../../../infrastructure/persistence';
import { CreateCategoryDTO, FlagCategory, UpdateCategoryDTO } from '../model';
import { ServiceError } from '../../../shared/kernel';
import { ILogger } from '../../../shared/logger';
import { TYPES } from '../../../infrastructure/config/types';
import { AuditService } from '../../observability/services/audit.service';
import { AuditAction, TAuditAction } from '../../observability/model';

@injectable()
export class CategoryService {
  private readonly MAX_DEPTH = 3;

  constructor(
    @inject(TYPES.CategoryRepository) private readonly categoryRepository: ICategoryRepository,
    @inject(TYPES.AuditService) private readonly auditService: AuditService,
    @inject(TYPES.Logger) private readonly logger: ILogger
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

  public async getCategoryTree(rootId: string | null = null): Promise<FlagCategory[]> {
    return this.categoryRepository.getChildrenTree(rootId);
  }

  async create(dto: CreateCategoryDTO): Promise<FlagCategory> {
    if (!dto.name || !dto.createdBy) throw new ServiceError('Category', 'Required fields missing');
    await this.validateCategoryName(dto.name);

    const depth = await this.calculateDepth(dto.parentId);
    const category = new FlagCategory({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      parentId: dto.parentId,
      depth,
      metadata: { createdBy: dto.createdBy, createdAt: new Date() },
    });

    try {
      const created = await this.categoryRepository.create(category);
      await this.logAudit(AuditAction.CREATE, dto.createdBy, created.id, null, created);
      return created;
    } catch (error) {
      this.logger.error('Category creation failed', error as Error, { dto });
      throw new ServiceError('Category', `Creation failed: ${(error as Error).message}`);
    }
  }

  async update(id: string, dto: UpdateCategoryDTO): Promise<FlagCategory> {
    const category = await this.validateCategoryExists(id);
    if (dto.name && dto.name !== category.name) await this.validateCategoryName(dto.name, id);
    if (dto.parentId && dto.parentId !== category.parentId)
      await this.validateParentCategory(id, dto.parentId);

    const updateData: Partial<FlagCategory> = {
      ...dto,
      depth: dto.parentId ? await this.calculateDepth(dto.parentId) : category.depth,
      metadata: { ...category.metadata, updatedBy: dto.updatedBy, updatedAt: new Date() },
    };

    try {
      const updated = await this.categoryRepository.update(id, updateData);
      if (!updated) throw new ServiceError('Category', 'Update failed');
      await this.logAudit(AuditAction.UPDATE, dto.updatedBy, id, category, updated);
      return updated;
    } catch (error) {
      this.logger.error('Category update failed', error as Error, { id, dto });
      throw new ServiceError('Category', `Update failed: ${(error as Error).message}`);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const category = await this.validateCategoryExists(id);
    if ((await this.categoryRepository.findByParentId(id)).length > 0) {
      throw new ServiceError('Category', 'Cannot delete category with subcategories');
    }

    try {
      if (!(await this.categoryRepository.delete(id)))
        throw new ServiceError('Category', 'Deletion failed');
      await this.logAudit(AuditAction.DELETE, userId, id, category, null);
    } catch (error) {
      this.logger.error('Category deletion failed', error as Error, { id });
      throw new ServiceError('Category', `Deletion failed: ${(error as Error).message}`);
    }
  }

  public async moveCategory(
    categoryId: string,
    newParentId: string | null,
    userId: string = 'system'
  ): Promise<FlagCategory | null> {
    const current = await this.categoryRepository.findById(categoryId);
    if (!current) {
      throw new Error(`Category with ID "${categoryId}" not found`);
    }

    if (current.parentId === newParentId) {
      return current;
    }

    const updated = await this.categoryRepository.moveNode(categoryId, newParentId);

    if (updated) {
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        entityId: categoryId,
        entityType: 'flag_categories',
        oldValue: JSON.stringify(current),
        newValue: JSON.stringify(updated),
      });
    }

    return updated;
  }

  private async validateCategoryName(name: string, excludeId?: string): Promise<void> {
    const existing = await this.categoryRepository.findByName(name);
    if (existing && (!excludeId || existing.id !== excludeId)) {
      throw new ServiceError('Category', `Category '${name}' already exists`);
    }
  }

  private async validateCategoryExists(id: string): Promise<FlagCategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new ServiceError('Category', `Category '${id}' not found`);
    return category;
  }

  private async validateParentCategory(categoryId: string, parentId: string): Promise<void> {
    if (categoryId === parentId)
      throw new ServiceError('Category', 'Category cannot be its own parent');
    const parent = await this.validateCategoryExists(parentId);
    if (parent.depth + 1 > this.MAX_DEPTH) {
      throw new ServiceError('Category', `Maximum depth (${this.MAX_DEPTH}) exceeded`);
    }
    const path = await this.categoryRepository.getFullPath(parentId);
    if (path.some(cat => cat.id === categoryId)) {
      throw new ServiceError('Category', 'Cyclic dependency detected');
    }
  }

  private async calculateDepth(parentId?: string): Promise<number> {
    if (!parentId) return 0;
    const parent = await this.validateCategoryExists(parentId);
    const depth = parent.depth + 1;
    if (depth > this.MAX_DEPTH)
      throw new ServiceError('Category', `Maximum depth (${this.MAX_DEPTH}) exceeded`);
    return depth;
  }

  private async logAudit(
    action: TAuditAction,
    userId: string,
    entityId: string,
    oldValue: any,
    newValue: any
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
