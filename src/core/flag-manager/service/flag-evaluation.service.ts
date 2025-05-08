import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { IFlagRepository } from '../../../infrastructure/persistence';
import { ILogger } from '../../../shared/logger';
import { FlagType } from '../constants';
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
  private keyToNameMap: Map<string, string> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly cacheTTL: number = 5 * 60 * 1000; // 5 минут

  constructor(
    @inject(TYPES.FlagRepository) private readonly flagRepository: IFlagRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  public async evaluateFlag(flagNameOrKey: string, clientId: string): Promise<boolean | string> {
    try {
      if (!flagNameOrKey) {
        throw new FlagEvaluationError('Flag name or key is required');
      }
      if (!clientId) {
        throw new FlagEvaluationError('Client ID is required');
      }

      await this.refreshCacheIfNeeded();
      const flag = await this.getFlagFromCache(flagNameOrKey);

      if (!flag) {
        return false;
      }

      if (flag.isExpired()) {
        this.logger.debug(`Flag '${flagNameOrKey}' is expired`);
        return false;
      }

      if (flag.type === FlagType.ENUM) {
        return flag.getEnumValue(clientId);
      }

      return flag.isActiveForClient(clientId);
    } catch (error) {
      this.logger.error(
        `Error evaluating flag ${flagNameOrKey} for client ${clientId}`,
        error as Error
      );
      return false;
    }
  }

  public async getAllFlagsForClient(clientId: string): Promise<Record<string, boolean | string>> {
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

  private async refreshCache(): Promise<void> {
    try {
      const activeFlags = await this.flagRepository.findActiveFlags();

      this.flagCache.clear();
      this.keyToNameMap.clear();

      for (const flag of activeFlags) {
        this.flagCache.set(flag.name, flag);
        this.keyToNameMap.set(flag.key, flag.name);
      }

      this.lastCacheUpdate = new Date();
      this.logger.info(`Flag cache refreshed with ${activeFlags.length} active flags`);
    } catch (error) {
      this.logger.error('Error refreshing flag cache', error as Error);
      throw new FlagEvaluationError(`Failed to refresh flag cache: ${(error as Error).message}`);
    }
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastCacheUpdate.getTime() > this.cacheTTL) {
      await this.refreshCache();
    }
  }

  private async getFlagFromCache(flagNameOrKey: string): Promise<FeatureFlag | null> {
    let flag = this.flagCache.get(flagNameOrKey);

    if (!flag) {
      const flagName = this.keyToNameMap.get(flagNameOrKey);
      if (flagName) {
        flag = this.flagCache.get(flagName);
      }
    }

    if (!flag) {
      const foundFlagByName = await this.flagRepository.findByName(flagNameOrKey);
      if (foundFlagByName) {
        this.flagCache.set(foundFlagByName.name, foundFlagByName);
        this.keyToNameMap.set(foundFlagByName.key, foundFlagByName.name);
        return foundFlagByName;
      }

      const foundFlagByKey = await this.flagRepository.findByKey(flagNameOrKey);
      if (foundFlagByKey) {
        this.flagCache.set(foundFlagByKey.name, foundFlagByKey);
        this.keyToNameMap.set(foundFlagByKey.key, foundFlagByKey.name);
        return foundFlagByKey;
      }

      return null;
    }

    return flag;
  }

  private evaluateAllCachedFlags(clientId: string): Record<string, boolean | string> {
    const result: Record<string, boolean | string> = {};

    for (const [_, flag] of this.flagCache.entries()) {
      if (flag.type === FlagType.ENUM) {
        result[flag.key] = flag.getEnumValue(clientId);
      } else {
        result[flag.key] = flag.isActiveForClient(clientId);
      }
    }

    return result;
  }
}
