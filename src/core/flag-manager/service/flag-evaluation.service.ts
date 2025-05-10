import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { IFlagRepository } from '../../../infrastructure/persistence';
import { ILogger } from '../../../shared/logger';
import { EnvironmentService } from '../../environment/service/environment.service';
import { FeatureFlag, FlagStatus, FlagType } from '../model';
import { SDKKeyType } from '../../environment/model';
import { ServiceError } from '../../../shared/kernel';

@injectable()
export class FlagEvaluationService {
  private flagCache: Map<string, FeatureFlag> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 минут

  constructor(
    @inject(TYPES.FlagRepository) private readonly flagRepository: IFlagRepository,
    @inject(TYPES.EnvironmentService) private readonly environmentService: EnvironmentService,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {
    this.refreshCachePeriodically();
  }

  async evaluateFlag(
    environmentId: string,
    key: string,
    clientId: string,
    sdkKey: string,
    sdkKeyType: SDKKeyType
  ): Promise<boolean | string> {
    if (!environmentId || !key || !clientId || !sdkKey) {
      throw new ServiceError('FlagEvaluation', 'Required fields missing');
    }
    if (!(await this.environmentService.validateSDKKey(environmentId, sdkKey, sdkKeyType))) {
      throw new ServiceError('FlagEvaluation', 'Invalid SDK key');
    }

    const flag = this.flagCache.get(`${environmentId}_${key}`);
    if (!flag || flag.status !== FlagStatus.ACTIVE || flag.isExpired()) return false;

    if (flag.type === FlagType.ENUM) return flag.getEnumValue(clientId);
    return flag.isActiveForClient(clientId);
  }

  async getAllFlagsForClient(
    environmentId: string,
    clientId: string,
    sdkKey: string,
    sdkKeyType: SDKKeyType
  ): Promise<Record<string, boolean | string>> {
    if (!environmentId || !clientId || !sdkKey) {
      throw new ServiceError('FlagEvaluation', 'Required fields missing');
    }
    if (!(await this.environmentService.validateSDKKey(environmentId, sdkKey, sdkKeyType))) {
      throw new ServiceError('FlagEvaluation', 'Invalid SDK key');
    }

    const result: Record<string, boolean | string> = {};
    for (const [cacheKey, flag] of this.flagCache.entries()) {
      if (
        !cacheKey.startsWith(`${environmentId}_`) ||
        flag.status !== FlagStatus.ACTIVE ||
        flag.isExpired()
      )
        continue;
      result[flag.key] =
        flag.type === FlagType.ENUM
          ? flag.getEnumValue(clientId)
          : flag.isActiveForClient(clientId);
    }
    return result;
  }

  private async refreshCachePeriodically(): Promise<void> {
    setInterval(async () => {
      try {
        const flags = await this.flagRepository.findActiveFlags();
        this.flagCache.clear();
        flags.forEach(flag => this.flagCache.set(`${flag.environmentId}_${flag.key}`, flag));
        this.logger.info(`Flag cache refreshed with ${flags.length} active flags`);
      } catch (error) {
        this.logger.error('Flag cache refresh failed', error as Error);
      }
    }, this.CACHE_TTL);
  }
}
