import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { IFlagRepository } from '../../infrastructure/persistence';
import { ILogger } from '../../shared/logger';
import { FeatureFlag } from '../model';

export class FlagEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlagEvaluationError';
  }
}

@injectable()
export class FlagEvaluationService {
  private flagCache: Map<string, FeatureFlag> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly cacheTTL: number = 5 * 60 * 1000; // 5 минут

  constructor(
    @inject(TYPES.FlagRepository) private readonly flagRepository: IFlagRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async evaluateFlag(flagName: string, clientId: string): Promise<boolean> {
    try {
      if (!flagName) {
        throw new FlagEvaluationError('Flag name is required');
      }
      if (!clientId) {
        throw new FlagEvaluationError('Client ID is required');
      }

      await this.refreshCacheIfNeeded();
      const flag = await this.getFlagFromCache(flagName);

      if (!flag) {
        return false;
      }

      return flag.isActiveForClient(clientId);
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagName} for client ${clientId}`, error as Error);
      return false;
    }
  }

  async getAllFlagsForClient(clientId: string): Promise<Record<string, boolean>> {
    try {
      if (!clientId) {
        throw new FlagEvaluationError('Client ID is required');
      }

      await this.refreshCacheIfNeeded();
      return this.evaluateAllCachedFlags(clientId);
    } catch (error) {
      this.logger.error(`Error getting all flags for client ${clientId}`, error as Error);
      return {};
    }
  }

  async refreshCache(): Promise<void> {
    try {
      const activeFlags = await this.flagRepository.findActiveFlags();

      this.flagCache.clear();

      for (const flag of activeFlags) {
        this.flagCache.set(flag.name, flag);
      }

      this.lastCacheUpdate = new Date();
      this.logger.info(`Flag cache refreshed with ${activeFlags.length} active flags`);
    } catch (error) {
      this.logger.error('Error refreshing flag cache', error as Error);
      throw new FlagEvaluationError(`Failed to refresh flag cache: ${(error as Error).message}`);
    }
  }

  invalidateFlagInCache(flagName: string): void {
    if (!flagName) {
      this.logger.warn('Attempted to invalidate flag with empty name');
      return;
    }

    this.flagCache.delete(flagName);
    this.logger.debug(`Flag ${flagName} invalidated in cache`);
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastCacheUpdate.getTime() > this.cacheTTL) {
      await this.refreshCache();
    }
  }

  private async getFlagFromCache(flagName: string): Promise<FeatureFlag | undefined> {
    const flag = this.flagCache.get(flagName);

    if (!flag) {
      const foundFlag = await this.flagRepository.findByName(flagName);

      if (foundFlag) {
        this.flagCache.set(flagName, foundFlag);
        return foundFlag;
      }

      return undefined;
    }

    return flag;
  }

  private evaluateAllCachedFlags(clientId: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    for (const [flagName, flag] of this.flagCache.entries()) {
      result[flagName] = flag.isActiveForClient(clientId);
    }

    return result;
  }
}
