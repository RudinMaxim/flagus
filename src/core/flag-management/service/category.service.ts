import { injectable, inject } from 'inversify';
import { FlagCategory, CreateCategoryDTO, UpdateCategoryDTO } from '../model/category.model';
import { ICategoryRepository } from '@infrastructure/persistence/interfaces/repositories';
import { IService } from '@shared/kernel/base.interfaces';
import { AuditAction } from '@shared/kernel/base.types';
import { AuditService } from './audit.service';
import { TYPES } from '@infrastructure/config';

@injectable()
export class CategoryService
  implements IService<FlagCategory, string, CreateCategoryDTO, UpdateCategoryDTO>
{
  private MAX_DEPTH = 3; // Максимальная глубина вложенности категорий

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
    // Проверка на уникальность имени
    const existingCategory = await this.categoryRepository.findByName(dto.name);
    if (existingCategory) {
      throw new Error(`Category with name ${dto.name} already exists`);
    }

    // Определение глубины категории
    let depth = 0;
    if (dto.parentId) {
      const parentCategory = await this.categoryRepository.findById(dto.parentId);
      if (!parentCategory) {
        throw new Error(`Parent category with id ${dto.parentId} not found`);
      }

      depth = parentCategory.depth + 1;

      // Проверка на максимальную глубину
      if (depth > this.MAX_DEPTH) {
        throw new Error(`Maximum category depth (${this.MAX_DEPTH}) exceeded`);
      }

      // Проверка на циклические зависимости
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

    // Регистрация в аудите
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

    // Проверка на уникальность имени если имя меняется
    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findByName(dto.name);
      if (existingCategory && existingCategory.id !== id) {
        throw new Error(`Category with name ${dto.name} already exists`);
      }
    }

    // Проверка новой глубины категории при изменении родителя
    if (dto.parentId && dto.parentId !== category.parentId) {
      // Нельзя сделать категорию родителем самой себя
      if (dto.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findById(dto.parentId);
      if (!parentCategory) {
        throw new Error(`Parent category with id ${dto.parentId} not found`);
      }

      const newDepth = parentCategory.depth + 1;

      // Проверка на максимальную глубину
      if (newDepth > this.MAX_DEPTH) {
        throw new Error(`Maximum category depth (${this.MAX_DEPTH}) exceeded`);
      }

      // Проверка на циклические зависимости
      const childCategories = await this.categoryRepository.findByParentId(id);
      const isParentAmongChildren = childCategories.some(cat => cat.id === dto.parentId);
      if (isParentAmongChildren) {
        throw new Error('Cyclic dependency detected in category hierarchy');
      }

      // Обновление глубины
      dto = { ...dto, depth: newDepth };
    }

    // Сохраняем старое значение для аудита
    const oldValue = JSON.stringify(category);

    // Обновляем метаданные
    const metadata = { ...category.metadata };
    metadata.updatedBy = dto.updatedBy;
    metadata.updatedAt = new Date();

    const updateData: Partial<FlagCategory> = {
      ...dto,
      metadata,
    };

    const updatedCategory = await this.categoryRepository.update(id, updateData);

    if (updatedCategory) {
      // Регистрация в аудите
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
    // Проверка наличия подкатегорий
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
      // Регистрация в аудите
      await this.auditService.logAction({
        userId: 'system', // Можно передавать userId при вызове метода
        action: AuditAction.DELETE,
        entityId: id,
        entityType: 'flag_category',
        oldValue: JSON.stringify(category),
      });
    }

    return result;
  }
}
