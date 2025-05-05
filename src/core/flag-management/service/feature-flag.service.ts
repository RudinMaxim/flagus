import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { IFlagRepository } from '../../../infrastructure/persistence';
import { IService, FlagStatus, AuditAction } from '../../../shared/kernel';
import { FlagEvaluationService } from '../../evaluation/service/flag-evaluation.service';
import { FeatureFlag, CreateFlagDTO, UpdateFlagDTO } from '../model';
import { AuditService } from './audit.service';

@injectable()
export class FeatureFlagService
  implements IService<FeatureFlag, string, CreateFlagDTO, UpdateFlagDTO>
{
  constructor(
    @inject(TYPES.FlagRepository) private flagRepository: IFlagRepository,
    @inject(TYPES.AuditService) private auditService: AuditService,
    @inject(TYPES.FlagEvaluationService) private evaluationService: FlagEvaluationService
  ) {}

  async getAll(): Promise<FeatureFlag[]> {
    return this.flagRepository.findAll();
  }

  async getById(id: string): Promise<FeatureFlag | null> {
    return this.flagRepository.findById(id);
  }

  async getByName(name: string): Promise<FeatureFlag | null> {
    return this.flagRepository.findByName(name);
  }

  async getByCategory(categoryId: string): Promise<FeatureFlag[]> {
    return this.flagRepository.findByCategory(categoryId);
  }

  async getActiveFlags(): Promise<FeatureFlag[]> {
    return this.flagRepository.findActiveFlags();
  }

  async create(dto: CreateFlagDTO): Promise<FeatureFlag> {
    const existingFlag = await this.flagRepository.findByName(dto.name);
    if (existingFlag) {
      throw new Error(`Flag with name ${dto.name} already exists`);
    }

    const flag = new FeatureFlag({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      type: dto.type,
      status: dto.status || FlagStatus.INACTIVE,
      categoryId: dto.categoryId,
      timeConstraint: dto.timeConstraint,
      percentageDistribution: dto.percentageDistribution,
      clientIds: dto.clientIds,
      metadata: {
        createdBy: dto.createdBy,
        createdAt: new Date(),
      },
    });

    const createdFlag = await this.flagRepository.create(flag);

    // Регистрация в аудите
    await this.auditService.logAction({
      userId: dto.createdBy,
      action: AuditAction.CREATE,
      entityId: createdFlag.id,
      entityType: 'feature_flag',
      newValue: JSON.stringify(createdFlag),
    });

    return createdFlag;
  }

  async update(id: string, dto: UpdateFlagDTO): Promise<FeatureFlag | null> {
    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return null;
    }

    // Проверка на уникальность имени если имя меняется
    if (dto.name && dto.name !== flag.name) {
      const existingFlag = await this.flagRepository.findByName(dto.name);
      if (existingFlag && existingFlag.id !== id) {
        throw new Error(`Flag with name ${dto.name} already exists`);
      }
    }

    // Сохраняем старое значение для аудита
    const oldValue = JSON.stringify(flag);

    // Обновляем метаданные
    const metadata = { ...flag.metadata };
    metadata.updatedBy = dto.updatedBy;
    metadata.updatedAt = new Date();

    const updateData: Partial<FeatureFlag> = {
      ...dto,
      metadata,
    };

    const updatedFlag = await this.flagRepository.update(id, updateData);

    if (updatedFlag) {
      // Регистрация в аудите
      await this.auditService.logAction({
        userId: dto.updatedBy,
        action: AuditAction.UPDATE,
        entityId: id,
        entityType: 'feature_flag',
        oldValue,
        newValue: JSON.stringify(updatedFlag),
      });
    }

    return updatedFlag;
  }

  async delete(id: string): Promise<boolean> {
    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return false;
    }

    const result = await this.flagRepository.delete(id);

    if (result) {
      // Регистрация в аудите
      await this.auditService.logAction({
        userId: 'system', // Можно передавать userId при вызове метода
        action: AuditAction.DELETE,
        entityId: id,
        entityType: 'feature_flag',
        oldValue: JSON.stringify(flag),
      });
    }

    return result;
  }

  async toggleStatus(id: string, status: FlagStatus, userId: string): Promise<FeatureFlag | null> {
    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return null;
    }

    const oldValue = JSON.stringify(flag);

    const updatedFlag = await this.flagRepository.toggleStatus(id, status);

    if (updatedFlag) {
      // Регистрация в аудите
      await this.auditService.logAction({
        userId,
        action: AuditAction.TOGGLE,
        entityId: id,
        entityType: 'feature_flag',
        oldValue,
        newValue: JSON.stringify(updatedFlag),
      });
    }

    return updatedFlag;
  }

  async evaluateFlag(flagName: string, clientId: string): Promise<boolean> {
    return this.evaluationService.evaluateFlag(flagName, clientId);
  }

  async getClientFlags(clientId: string): Promise<Record<string, boolean>> {
    return this.evaluationService.getAllFlagsForClient(clientId);
  }
}
