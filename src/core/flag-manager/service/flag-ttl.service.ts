import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/config/types';
import { ILogger } from '../../../shared/logger';
import { FeatureFlagService } from './flag.service';
import { FeatureFlag } from '../model';

interface TTLJob {
  expiresAt: Date;
  notified: boolean;
}

@injectable()
export class FlagTTLService {
  private jobs: Map<string, TTLJob> = new Map();
  private readonly INTERVAL_MS = 60 * 60 * 1000; // 1 час
  private readonly NOTIFY_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 дней
  private interval?: NodeJS.Timeout;

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.FeatureFlagService) private readonly flagService: FeatureFlagService
  ) {}

  start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => this.processJobs(), this.INTERVAL_MS);
    this.logger.info('FlagTTLService started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
      this.logger.info('FlagTTLService stopped');
    }
  }

  register(flag: FeatureFlag): void {
    if (!flag.ttl?.expiresAt) return;
    this.jobs.set(flag.id, { expiresAt: flag.ttl.expiresAt, notified: false });
    this.logger.debug(`Registered flag ${flag.id} for TTL`, { expiresAt: flag.ttl.expiresAt });
  }

  unregister(flagId: string): void {
    if (this.jobs.delete(flagId)) {
      this.logger.debug(`Unregistered flag ${flagId} from TTL`);
    }
  }

  private async processJobs(): Promise<void> {
    try {
      const now = Date.now();
      const toDelete: string[] = [];
      const toNotify: string[] = [];

      for (const [flagId, job] of this.jobs) {
        const timeLeft = job.expiresAt.getTime() - now;
        if (timeLeft <= 0) toDelete.push(flagId);
        else if (!job.notified && timeLeft <= this.NOTIFY_DAYS) {
          toNotify.push(flagId);
          job.notified = true;
        }
      }

      if (toDelete.length) {
        const deleted = await this.flagService.cleanupExpiredFlags();
        toDelete.forEach(id => this.jobs.delete(id));
        this.logger.info(`Deleted ${deleted} expired flags`);
      }

      if (toNotify.length) {
        this.logger.info(`Notified for ${toNotify.length} flags nearing expiration`);
        // TODO: webhook
      }
    } catch (error) {
      this.logger.error('Failed to process TTL jobs', error as Error);
    }
  }
}
