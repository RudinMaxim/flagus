import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { IEnvironmentRepository } from '../../../infrastructure/persistence/interfaces';
import { ILogger } from '../../../shared/logger';
import { Environment, ISDKKey, SDKKeyType } from '../model';
import { ServiceError } from '../../../shared/kernel';
import { AuditService } from '../../observability/services/audit.service';
import { AuditAction } from '../../observability/model';

@injectable()
export class EnvironmentService {
  private envCache: Map<string, { data: Environment; lastUpdated: Date }> = new Map();
  private readonly ENV_CACHE_TTL = 5 * 60 * 1000; // 5 минут

  constructor(
    @inject(TYPES.EnvironmentRepository) private readonly envRepository: IEnvironmentRepository,
    @inject(TYPES.AuditService) private readonly auditService: AuditService,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async create(dto: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<Environment> {
    if (!dto.name || !dto.createdBy)
      throw new ServiceError('Environment', 'Required fields missing');
    const existing = await this.envRepository.findByName(dto.name);
    if (existing) throw new ServiceError('Environment', `Environment '${dto.name}' already exists`);

    const env = new Environment({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      sdkKeys: [],
      metadata: { createdBy: dto.createdBy, createdAt: new Date() },
    });

    try {
      const created = await this.envRepository.create(env);
      await this.auditService.logAction({
        userId: dto.createdBy,
        action: AuditAction.CREATE,
        entityId: created.id,
        entityType: 'environment',
        newValue: JSON.stringify(created),
      });
      return created;
    } catch (error) {
      this.logger.error('Environment creation failed', error as Error, { dto });
      throw new ServiceError('Environment', `Creation failed: ${(error as Error).message}`);
    }
  }

  async generateSDKKey(environmentId: string, type: SDKKeyType, userId: string): Promise<string> {
    await this.validateEnvironmentExists(environmentId);
    const key = `xai_${type}_${crypto.randomUUID().replace(/-/g, '')}`;

    try {
      const updatedEnv = await this.envRepository.addSDKKey(environmentId, key, type, userId);
      if (!updatedEnv) {
        throw new Error('Failed to add SDK key to environment');
      }

      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        entityId: environmentId,
        entityType: 'sdk_key',
        newValue: JSON.stringify({ key, type }),
      });

      this.envCache.set(environmentId, { data: updatedEnv, lastUpdated: new Date() });
      return key;
    } catch (error) {
      this.logger.error('SDK key generation failed', error as Error, { environmentId, type });
      throw new ServiceError(
        'Environment',
        `SDK key generation failed: ${(error as Error).message}`
      );
    }
  }

  async deactivateSDKKey(environmentId: string, key: string, userId: string): Promise<void> {
    await this.validateEnvironmentExists(environmentId);

    try {
      const updatedEnv = await this.envRepository.deactivateSDKKey(environmentId, key);
      if (!updatedEnv) {
        throw new Error('Failed to deactivate SDK key');
      }

      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        entityId: environmentId,
        entityType: 'sdk_key',
        newValue: JSON.stringify({ key, active: false }),
      });

      this.envCache.set(environmentId, { data: updatedEnv, lastUpdated: new Date() });
    } catch (error) {
      this.logger.error('SDK key deactivation failed', error as Error, { environmentId, key });
      throw new ServiceError(
        'Environment',
        `SDK key deactivation failed: ${(error as Error).message}`
      );
    }
  }

  async getSDKKeys(environmentId: string): Promise<ISDKKey[]> {
    const env = await this.validateEnvironmentExists(environmentId);
    return env.sdkKeys || [];
  }

  async validateSDKKey(environmentId: string, key: string, type: SDKKeyType): Promise<boolean> {
    const env = await this.getEnvironment(environmentId);
    return env?.isValidSDKKey(key, type) || false;
  }

  async validateEnvironmentExists(id: string): Promise<Environment> {
    const env = await this.getEnvironment(id);
    if (!env) throw new ServiceError('Environment', `Environment '${id}' not found`);
    return env;
  }

  private async getEnvironment(id: string): Promise<Environment | null> {
    const cached = this.envCache.get(id);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.ENV_CACHE_TTL) {
      return cached.data;
    }

    try {
      const env = await this.envRepository.findById(id);
      if (env) this.envCache.set(id, { data: env, lastUpdated: new Date() });
      else this.envCache.delete(id);
      return env;
    } catch (error) {
      this.logger.error('Environment fetch failed', error as Error, { id });
      return null;
    }
  }
}
