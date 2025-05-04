import { injectable, inject } from 'inversify';
import { IFlagRepository } from '@infrastructure/persistence/interfaces/repositories';
import { ILogger } from '@shared/kernel/base.interfaces';
import { FeatureFlag } from '../../flag-management/model/flag.model';
import { TYPES } from '@infrastructure/config';

@injectable()
export class FlagEvaluationService {
  private flagCache: Map<string, FeatureFlag> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly cacheTTL: number = 5 * 60 * 1000;

  constructor(
    @inject(TYPES.FlagRepository) private flagRepository: IFlagRepository,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  /**
   * Оценивает, активен ли флаг для указанного клиента
   */
  async evaluateFlag(flagName: string, clientId: string): Promise<boolean> {
    try {
      // Проверка и обновление кэша при необходимости
      await this.refreshCacheIfNeeded();

      // Поиск флага в кэше
      let flag = this.flagCache.get(flagName);

      // Если флага нет в кэше, пробуем получить его из репозитория
      if (!flag) {
        const foundFlag = await this.flagRepository.findByName(flagName);
        flag = foundFlag !== null ? foundFlag : undefined;

        if (flag) {
          this.flagCache.set(flagName, flag);
        } else {
          // Если флаг не найден, считаем его выключенным
          return false;
        }
      }

      // Проверка активности флага для клиента
      return flag.isActiveForClient(clientId);
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagName} for client ${clientId}`, error as Error);
      return false; // По умолчанию считаем флаг выключенным при ошибках
    }
  }

  /**
   * Возвращает все активные флаги для клиента в виде { [flagName]: boolean }
   */
  async getAllFlagsForClient(clientId: string): Promise<Record<string, boolean>> {
    try {
      // Проверка и обновление кэша при необходимости
      await this.refreshCacheIfNeeded();

      const result: Record<string, boolean> = {};

      // Оцениваем каждый флаг в кэше для клиента
      for (const [flagName, flag] of this.flagCache.entries()) {
        result[flagName] = flag.isActiveForClient(clientId);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting all flags for client ${clientId}`, error as Error);
      return {}; // Возвращаем пустой объект при ошибках
    }
  }

  /**
   * Обновляет кэш флагов из репозитория, если истек TTL
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastCacheUpdate.getTime() > this.cacheTTL) {
      await this.refreshCache();
    }
  }

  /**
   * Принудительно обновляет кэш флагов
   */
  public async refreshCache(): Promise<void> {
    try {
      const activeFlags = await this.flagRepository.findActiveFlags();

      // Очищаем текущий кэш
      this.flagCache.clear();

      // Заполняем кэш активными флагами
      for (const flag of activeFlags) {
        this.flagCache.set(flag.name, flag);
      }

      this.lastCacheUpdate = new Date();
      this.logger.info(`Flag cache refreshed with ${activeFlags.length} active flags`);
    } catch (error) {
      this.logger.error('Error refreshing flag cache', error as Error);
      // Если не удалось обновить кэш, оставляем старые данные
    }
  }

  /**
   * Инвалидирует флаг в кэше при его изменении
   */
  public invalidateFlagInCache(flagName: string): void {
    this.flagCache.delete(flagName);
    this.logger.debug(`Flag ${flagName} invalidated in cache`);
  }
}
