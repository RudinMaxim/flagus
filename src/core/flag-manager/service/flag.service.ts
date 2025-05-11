import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { IFlagRepository } from '../../../infrastructure/persistence';
import { ServiceError } from '../../../shared/kernel';
import { ILogger } from '../../../shared/logger';
import { EnvironmentService } from './environment.service';
import {
  CreateFlagDTO,
  FeatureFlag,
  FlagStatus,
  FlagType,
  TFlagStatus,
  UpdateFlagDTO,
} from '../model';
import { AuditService } from '../../observability/services';
import { AuditAction, TAuditAction } from '../../observability/model';

@injectable()
export class FeatureFlagService {
  private ttlJobs: Map<string, { expiresAt: Date; notified: boolean }> = new Map();
  private readonly TTL_INTERVAL_MS = 60 * 60 * 1000; // 1 час
  private readonly TTL_NOTIFY_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 дней
  private ttlInterval?: NodeJS.Timeout;

  constructor(
    @inject(TYPES.FlagRepository) private readonly flagRepository: IFlagRepository,
    @inject(TYPES.AuditService) private readonly auditService: AuditService,
    @inject(TYPES.EnvironmentService) private readonly environmentService: EnvironmentService,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {
    this.startTTLMonitor();
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

  async getByKey(key: string, environmentId: string): Promise<FeatureFlag | null> {
    if (!key) throw new Error('Flag key is required');
    if (!environmentId) throw new Error('Flag environmentId is required');
    return this.flagRepository.findByKey(key, environmentId);
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
    if (!dto.environmentId || !dto.name || !dto.key || !dto.createdBy || !dto.type) {
      throw new ServiceError('FeatureFlag', 'Required fields missing');
    }

    await this.environmentService.validateEnvironmentExists(dto.environmentId);
    const [existingName, existingKey] = await Promise.all([
      this.flagRepository.findByName(dto.name),
      this.flagRepository.findByKey(dto.key, dto.environmentId),
    ]);

    if (existingName?.environmentId === dto.environmentId) {
      throw new ServiceError('FeatureFlag', `Flag '${dto.name}' already exists in environment`);
    }
    if (existingKey?.environmentId === dto.environmentId) {
      throw new ServiceError('FeatureFlag', `Key '${dto.key}' already exists in environment`);
    }
    if (dto.type === FlagType.ENUM && (!dto.enum || !dto.enum.values.length)) {
      throw new ServiceError('FeatureFlag', 'Enum flags require values');
    }

    const flag = new FeatureFlag({
      id: crypto.randomUUID(),
      key: dto.key,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      status: dto.status || FlagStatus.INACTIVE,
      categoryId: dto.categoryId,
      environmentId: dto.environmentId,
      enum: dto.enum,
      ttl: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), autoDelete: true },
      clientIds: dto.clientIds,
      metadata: { createdBy: dto.createdBy, createdAt: new Date() },
    });

    try {
      const created = await this.flagRepository.create(flag);
      await this.logAudit(AuditAction.CREATE, dto.createdBy, created.id, null, created);
      this.registerFlagTTL(created);
      return created;
    } catch (error) {
      this.logger.error('Flag creation failed', error as Error, { dto });
      throw new ServiceError('FeatureFlag', `Creation failed: ${(error as Error).message}`);
    }
  }

  async update(id: string, dto: UpdateFlagDTO): Promise<FeatureFlag> {
    if (!id || !dto.updatedBy) throw new ServiceError('FeatureFlag', 'Required fields missing');
    const flag = await this.validateFlagExists(id);

    if (dto.name && dto.name !== flag.name) {
      const existing = await this.flagRepository.findByName(dto.name);
      if (existing && existing.id !== id && existing.environmentId === flag.environmentId) {
        throw new ServiceError('FeatureFlag', `Flag '${dto.name}' already exists in environment`);
      }
    }
    if (dto.type === FlagType.ENUM && (!dto.enum || !dto.enum.values.length)) {
      throw new ServiceError('FeatureFlag', 'Enum flags require values');
    }

    const updateData: Partial<FeatureFlag> = {
      ...dto,
      metadata: { ...flag.metadata, updatedBy: dto.updatedBy, updatedAt: new Date() },
    };
    delete (updateData as any).key;

    try {
      const updated = await this.flagRepository.update(id, updateData);
      if (!updated) throw new ServiceError('FeatureFlag', 'Update failed');
      await this.logAudit(AuditAction.UPDATE, dto.updatedBy, id, flag, updated);
      this.unregisterFlagTTL(id);
      this.registerFlagTTL(updated);
      return updated;
    } catch (error) {
      this.logger.error('Flag update failed', error as Error, { id, dto });
      throw new ServiceError('FeatureFlag', `Update failed: ${(error as Error).message}`);
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const flag = await this.validateFlagExists(id);
    try {
      if (!(await this.flagRepository.delete(id)))
        throw new ServiceError('FeatureFlag', 'Deletion failed');
      await this.logAudit(AuditAction.DELETE, userId, id, flag, null);
      this.unregisterFlagTTL(id);
    } catch (error) {
      this.logger.error('Flag deletion failed', error as Error, { id });
      throw new ServiceError('FeatureFlag', `Deletion failed: ${(error as Error).message}`);
    }
  }

  async toggleStatus(id: string, status: TFlagStatus, userId: string): Promise<FeatureFlag> {
    if (!Object.values(FlagStatus).includes(status as any)) {
      throw new ServiceError('FeatureFlag', `Invalid status: ${status}`);
    }
    const flag = await this.validateFlagExists(id);
    if (flag.status === status) return flag;

    try {
      const updated = await this.flagRepository.toggleStatus(id, status);
      if (!updated) throw new ServiceError('FeatureFlag', 'Status toggle failed');
      await this.logAudit(AuditAction.TOGGLE, userId, id, flag, updated);
      return updated;
    } catch (error) {
      this.logger.error('Flag status toggle failed', error as Error, { id, status });
      throw new ServiceError('FeatureFlag', `Status toggle failed: ${(error as Error).message}`);
    }
  }

  async cleanupExpiredFlags(environmentId?: string): Promise<number> {
    try {
      const expiredFlags = await this.flagRepository.findExpiredFlags();
      const filteredFlags = environmentId
        ? expiredFlags.filter(
            flag => flag.environmentId === environmentId && flag.shouldBeDeleted()
          )
        : expiredFlags.filter(flag => flag.shouldBeDeleted());

      let deletedCount = 0;
      for (const flag of filteredFlags) {
        if (await this.flagRepository.delete(flag.id)) {
          await this.logAudit(AuditAction.DELETE, 'system', flag.id, flag, null);
          this.unregisterFlagTTL(flag.id);
          deletedCount++;
        }
      }
      this.logger.info(`Cleaned up ${deletedCount} expired flags`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to clean up expired flags', error as Error, { environmentId });
      return 0;
    }
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
        throw new ServiceError('FeatureFlag', `Flag TTL reset but failed to log audit: ${error}`);
      }
    }

    return updatedFlag;
  }

  private startTTLMonitor(): void {
    if (this.ttlInterval) return;
    this.ttlInterval = setInterval(() => this.processTTLJobs(), this.TTL_INTERVAL_MS);
    this.logger.info('TTL monitor started');
  }

  private stopTTLMonitor(): void {
    if (this.ttlInterval) {
      clearInterval(this.ttlInterval);
      this.ttlInterval = undefined;
      this.logger.info('TTL monitor stopped');
    }
  }

  private registerFlagTTL(flag: FeatureFlag): void {
    if (!flag.ttl?.expiresAt) return;
    this.ttlJobs.set(flag.id, { expiresAt: flag.ttl.expiresAt, notified: false });
    this.logger.debug(`Registered flag ${flag.id} for TTL`, { expiresAt: flag.ttl.expiresAt });
  }

  private unregisterFlagTTL(flagId: string): void {
    if (this.ttlJobs.delete(flagId)) {
      this.logger.debug(`Unregistered flag ${flagId} from TTL`);
    }
  }

  private async processTTLJobs(): Promise<void> {
    try {
      const now = Date.now();
      const toDelete: string[] = [];
      const toNotify: string[] = [];

      for (const [flagId, job] of this.ttlJobs) {
        const timeLeft = job.expiresAt.getTime() - now;
        if (timeLeft <= 0) toDelete.push(flagId);
        else if (!job.notified && timeLeft <= this.TTL_NOTIFY_DAYS) {
          toNotify.push(flagId);
          job.notified = true;
        }
      }

      if (toDelete.length) {
        const deleted = await this.cleanupExpiredFlags();
        this.logger.info(`Processed ${deleted} expired flags via TTL`);
      }

      if (toNotify.length) {
        this.logger.info(`Notified for ${toNotify.length} flags nearing expiration`);
        // Здесь можно добавить отправку уведомлений (email, webhook)
      }
    } catch (error) {
      this.logger.error('Failed to process TTL jobs', error as Error);
    }
  }

  private async validateFlagExists(id: string): Promise<FeatureFlag> {
    const flag = await this.flagRepository.findById(id);
    if (!flag) throw new ServiceError('FeatureFlag', `Flag '${id}' not found`);
    return flag;
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
      entityType: 'feature_flag',
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
    });
  }
}
