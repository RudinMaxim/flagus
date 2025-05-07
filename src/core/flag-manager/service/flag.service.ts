import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { IFlagRepository } from '../../infrastructure/persistence';
import { IService, FlagStatus, AuditAction, FlagType, TFlagStatus } from '../../shared/kernel';
import { FlagEvaluationService } from './flag-evaluation.service';
import { FeatureFlag, CreateFlagDTO, UpdateFlagDTO } from '../model';
import { AuditService } from './audit.service';
import { ILogger } from '../../shared/logger';
import { FlagTTLService } from './flag-ttl.service';

export class FeatureFlagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureFlagError';
  }
}

@injectable()
export class FeatureFlagService
  implements IService<FeatureFlag, string, CreateFlagDTO, UpdateFlagDTO>
{
  constructor(
    @inject(TYPES.FlagRepository) private readonly flagRepository: IFlagRepository,
    @inject(TYPES.AuditService) private readonly auditService: AuditService,
    @inject(TYPES.FlagEvaluationService) private readonly evaluationService: FlagEvaluationService,
    @inject(TYPES.FlagTTLService) private readonly flagTTLService: FlagTTLService,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async evaluateFlag(flagNameOrKey: string, clientId: string): Promise<boolean | string> {
    if (!flagNameOrKey) throw new Error('Flag name or key is required');
    if (!clientId) throw new Error('Client ID is required');

    return this.evaluationService.evaluateFlag(flagNameOrKey, clientId);
  }

  async getClientFlags(clientId: string): Promise<Record<string, boolean | string>> {
    if (!clientId) throw new Error('Client ID is required');

    return this.evaluationService.getAllFlagsForClient(clientId);
  }

  async getAll(): Promise<FeatureFlag[]> {
    return this.flagRepository.findAll();
  }

  async getById(id: string): Promise<FeatureFlag | null> {
    if (!id) throw new Error('Flag ID is required');
    return this.flagRepository.findById(id);
  }

  async getByName(name: string): Promise<FeatureFlag | null> {
    if (!name) throw new Error('Flag name is required');
    return this.flagRepository.findByName(name);
  }

  async getByKey(key: string): Promise<FeatureFlag | null> {
    if (!key) throw new Error('Flag key is required');
    return this.flagRepository.findByKey(key);
  }

  async getByCategory(categoryId: string): Promise<FeatureFlag[]> {
    if (!categoryId) throw new Error('Category ID is required');
    return this.flagRepository.findByCategory(categoryId);
  }

  async getActiveFlags(): Promise<FeatureFlag[]> {
    return this.flagRepository.findActiveFlags();
  }

  async findExpiredFlags(): Promise<FeatureFlag[]> {
    return this.flagRepository.findExpiredFlags();
  }

  async create(dto: CreateFlagDTO): Promise<FeatureFlag> {
    this.validateCreateDto(dto);

    const existingFlag = await this.flagRepository.findByName(dto.name);
    if (existingFlag) {
      throw new Error(`Flag with name ${dto.name} already exists`);
    }

    const existingKey = await this.flagRepository.findByKey(dto.key);
    if (existingKey) {
      throw new Error(`Flag with key ${dto.key} already exists`);
    }

    const flag = new FeatureFlag({
      id: crypto.randomUUID(),
      key: dto.key,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      status: dto.status || FlagStatus.INACTIVE,
      categoryId: dto.categoryId,
      enum: dto.enum,
      ttl: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoDelete: true,
      },
      clientIds: dto.clientIds,
      metadata: {
        createdBy: dto.createdBy,
        createdAt: new Date(),
      },
    });

    const createdFlag = await this.flagRepository.create(flag);

    try {
      await this.auditService.logAction({
        userId: dto.createdBy,
        action: AuditAction.CREATE,
        entityId: createdFlag.id,
        entityType: 'feature_flag',
        newValue: JSON.stringify(createdFlag),
      });
    } catch (error) {
      this.logger.error('Failed to log audit action', error as Error, {
        action: AuditAction.CREATE,
        entityId: createdFlag.id,
        entityType: 'feature_flag',
        newValue: JSON.stringify(createdFlag),
      });
      throw new FeatureFlagError(`Flag created but failed to log audit: ${error}`);
    }

    if (createdFlag.ttl) {
      this.flagTTLService.registerFlag(createdFlag);
    }

    return createdFlag;
  }

  async update(id: string, dto: UpdateFlagDTO): Promise<FeatureFlag | null> {
    if (!id) throw new Error('Flag ID is required');
    this.validateUpdateDto(dto);

    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return null;
    }

    if (dto.name && dto.name !== flag.name) {
      const existingFlag = await this.flagRepository.findByName(dto.name);
      if (existingFlag && existingFlag.id !== id) {
        throw new Error(`Flag with name ${dto.name} already exists`);
      }
    }

    const oldValue = JSON.stringify(flag);

    const metadata = { ...flag.metadata };
    metadata.updatedBy = dto.updatedBy;
    metadata.updatedAt = new Date();

    const updateData: Partial<FeatureFlag> = {
      ...dto,
      metadata,
    };

    if ('key' in updateData) {
      delete (updateData as any).key;
    }

    const updatedFlag = await this.flagRepository.update(id, updateData);

    if (updatedFlag) {
      try {
        await this.auditService.logAction({
          userId: dto.updatedBy,
          action: AuditAction.UPDATE,
          entityId: id,
          entityType: 'feature_flag',
          oldValue,
          newValue: JSON.stringify(updatedFlag),
        });
      } catch (error) {
        this.logger.error('Failed to log audit action', error as Error, {
          action: AuditAction.UPDATE,
          entityId: id,
          entityType: 'feature_flag',
          oldValue,
          newValue: JSON.stringify(updatedFlag),
        });
        throw new FeatureFlagError(`Flag updated but failed to log audit: ${error}`);
      }
    }

    return updatedFlag;
  }

  async delete(id: string, userId: string = 'system'): Promise<boolean> {
    if (!id) throw new Error('Flag ID is required');

    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return false;
    }

    const result = await this.flagRepository.delete(id);

    if (result) {
      try {
        await this.auditService.logAction({
          userId,
          action: AuditAction.DELETE,
          entityId: id,
          entityType: 'feature_flag',
          oldValue: JSON.stringify(flag),
        });
      } catch (error) {
        this.logger.error('Failed to log audit action', error as Error, {
          action: AuditAction.DELETE,
          entityId: id,
          entityType: 'feature_flag',
          oldValue: JSON.stringify(flag),
        });
        throw new FeatureFlagError(`Flag deleted but failed to log audit: ${error}`);
      }

      this.flagTTLService.unregisterFlag(id);
    }

    return result;
  }

  async toggleStatus(id: string, status: TFlagStatus, userId: string): Promise<FeatureFlag | null> {
    if (!id) throw new Error('Flag ID is required');
    if (!userId) throw new Error('User ID is required');
    if (!Object.values(FlagStatus).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return null;
    }

    if (flag.status === status) {
      return flag;
    }

    const oldValue = JSON.stringify(flag);

    const updatedFlag = await this.flagRepository.toggleStatus(id, status);

    if (updatedFlag) {
      try {
        await this.auditService.logAction({
          userId,
          action: AuditAction.TOGGLE,
          entityId: id,
          entityType: 'feature_flag',
          oldValue,
          newValue: JSON.stringify(updatedFlag),
        });
      } catch (error) {
        this.logger.error('Failed to log audit action', error as Error, {
          action: AuditAction.TOGGLE,
          entityId: id,
          entityType: 'feature_flag',
          oldValue,
          newValue: JSON.stringify(updatedFlag),
        });
        throw new FeatureFlagError(`Flag status toggled but failed to log audit: ${error}`);
      }
    }

    return updatedFlag;
  }

  async resetTTL(id: string, userId: string): Promise<FeatureFlag | null> {
    if (!id) throw new Error('Flag ID is required');
    if (!userId) throw new Error('User ID is required');

    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      return null;
    }

    if (!flag.ttl) {
      throw new Error('Flag does not have TTL configured');
    }

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    const oldValue = JSON.stringify(flag);

    const updatedFlag = await this.flagRepository.update(id, {
      ttl: {
        ...flag.ttl,
        expiresAt: newExpiresAt,
      },
      metadata: {
        ...flag.metadata,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    if (updatedFlag) {
      try {
        await this.auditService.logAction({
          userId,
          action: AuditAction.EXTEND_TTL,
          entityId: id,
          entityType: 'feature_flag',
          oldValue,
          newValue: JSON.stringify(updatedFlag),
        });
      } catch (error) {
        this.logger.error('Failed to log audit action', error as Error, {
          action: AuditAction.EXTEND_TTL,
          entityId: id,
          entityType: 'feature_flag',
          oldValue,
          newValue: JSON.stringify(updatedFlag),
        });
        throw new FeatureFlagError(`Flag TTL reset but failed to log audit: ${error}`);
      }
    }

    return updatedFlag;
  }

  async cleanupExpiredFlags(): Promise<number> {
    const expiredFlags = await this.flagRepository.findExpiredFlags();
    let deletedCount = 0;

    for (const flag of expiredFlags) {
      if (flag.shouldBeDeleted()) {
        await this.delete(flag.id, 'system');
        deletedCount++;
      } else {
        await this.toggleStatus(flag.id, FlagStatus.ARCHIVED, 'system');
      }
    }

    return deletedCount;
  }

  private validateCreateDto(dto: CreateFlagDTO): void {
    if (!dto.key) throw new Error('Flag key is required');
    if (!dto.name) throw new Error('Flag name is required');
    if (!dto.type) throw new Error('Flag type is required');
    if (!dto.createdBy) throw new Error('Creator ID is required');

    if (dto.type === FlagType.ENUM) {
      if (!dto.enum) {
        throw new Error('Enum type flags must have at least one enum value');
      }
    }
  }

  private validateUpdateDto(dto: UpdateFlagDTO): void {
    if (!dto.updatedBy) throw new Error('Updater ID is required');

    if (dto.type === FlagType.ENUM) {
      if (!dto.enum?.values || dto.enum?.values.length < 1) {
        throw new Error('Enum type flags must have at least one enum value');
      }
    }
  }
}
