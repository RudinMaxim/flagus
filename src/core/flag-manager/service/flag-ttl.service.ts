import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { ILogger } from '../../shared/logger';
import { FeatureFlag } from '../model';
import { FeatureFlagService } from './flag.service';

interface TTLJob {
  flagId: string;
  expiresAt: Date;
  notificationSent: boolean;
}

@injectable()
export class FlagTTLService {
  private jobs: Map<string, TTLJob> = new Map();
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly NOTIFICATION_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.FlagEvaluationService) private readonly cleanupService: FeatureFlagService
  ) {}

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.interval = setInterval(() => this.processJobs(), this.CLEANUP_INTERVAL_MS);
    this.logger.info('TTL Monitor service started');
  }

  public stop(): void {
    if (!this.isRunning || !this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.isRunning = false;
    this.interval = null;
    this.logger.info('TTL Monitor service stopped');
  }

  public registerFlag(flag: FeatureFlag): void {
    if (!flag.ttl || !flag.ttl.expiresAt) {
      return;
    }

    this.jobs.set(flag.id, {
      flagId: flag.id,
      expiresAt: flag.ttl.expiresAt,
      notificationSent: false,
    });

    this.logger.debug(`Registered flag ${flag.id} (${flag.name}) for TTL monitoring`, {
      flagId: flag.id,
      expiresAt: flag.ttl.expiresAt,
    });
  }

  public updateFlag(flag: FeatureFlag): void {
    this.unregisterFlag(flag.id);
    this.registerFlag(flag);
  }

  public unregisterFlag(flagId: string): void {
    if (this.jobs.has(flagId)) {
      this.jobs.delete(flagId);
      this.logger.debug(`Unregistered flag ${flagId} from TTL monitoring`, { flagId });
    }
  }

  private async processJobs(): Promise<void> {
    try {
      const now = new Date();
      const jobsToRemove: string[] = [];
      const notificationsToSend: TTLJob[] = [];

      for (const [flagId, job] of this.jobs.entries()) {
        if (now >= job.expiresAt) {
          jobsToRemove.push(flagId);
        } else if (
          !job.notificationSent &&
          job.expiresAt.getTime() - now.getTime() <= this.NOTIFICATION_THRESHOLD_MS
        ) {
          notificationsToSend.push(job);
          job.notificationSent = true;
        }
      }

      if (jobsToRemove.length > 0) {
        try {
          const deletedCount = await this.cleanupService.cleanupExpiredFlags();
          this.logger.info(`Cleaned up ${deletedCount} expired flags`);
        } catch (error) {
          this.logger.error('Failed to clean up expired flags', error as Error);
        }
      }

      for (const flagId of jobsToRemove) {
        this.jobs.delete(flagId);
      }
    } catch (error) {
      this.logger.error('Error processing TTL jobs', error as Error);
    }
  }
}
