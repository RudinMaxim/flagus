import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { IAuditRepository } from '../../infrastructure/persistence';
import { ILogger } from '../../shared/logger';
import { AuditLog, CreateAuditLogDTO } from '../model';

export class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditError';
  }
}

@injectable()
export class AuditService {
  constructor(
    @inject(TYPES.AuditRepository) private readonly auditRepository: IAuditRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  public async getAll(): Promise<AuditLog[]> {
    return this.auditRepository.findAll();
  }

  public async getById(id: string): Promise<AuditLog | null> {
    return this.auditRepository.findById(id);
  }

  public async getByEntityId(entityId: string): Promise<AuditLog[]> {
    return this.auditRepository.findByEntityId(entityId);
  }

  public async getByUserId(userId: string): Promise<AuditLog[]> {
    return this.auditRepository.findByUserId(userId);
  }

  public async getByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    if (endDate < startDate) {
      throw new AuditError('End date cannot be earlier than start date');
    }
    return this.auditRepository.findByDateRange(startDate, endDate);
  }

  public async logAction(dto: CreateAuditLogDTO): Promise<AuditLog> {
    try {
      const auditLog = new AuditLog({
        id: crypto.randomUUID(),
        userId: dto.userId,
        action: dto.action,
        entityId: dto.entityId,
        entityType: dto.entityType,
        oldValue: dto.oldValue,
        newValue: dto.newValue,
        timestamp: new Date(),
        ipAddress: dto.ipAddress,
      });

      return await this.auditRepository.create(auditLog);
    } catch (error) {
      this.logger.error('Failed to log audit action', error as Error, {
        action: dto.action,
        entityId: dto.entityId,
        entityType: dto.entityType,
        userId: dto.userId,
      });

      return this.createFailureLog(dto);
    }
  }

  public async exportAuditLogs(
    filters: {
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      const logs = await this.fetchLogsByFilters(filters);
      return this.convertLogsToCSV(logs);
    } catch (error) {
      this.logger.error('Failed to export audit logs', error as Error);
      throw new AuditError('Failed to export audit logs: ' + (error as Error).message);
    }
  }

  public getDiff(
    oldValue?: string,
    newValue?: string
  ): Record<string, { old?: any; new?: any; changed: boolean }> {
    if (!oldValue || !newValue) {
      return {};
    }

    try {
      const oldObj = JSON.parse(oldValue);
      const newObj = JSON.parse(newValue);
      return this.generateDiffObject(oldObj, newObj);
    } catch (error) {
      this.logger.error('Failed to generate diff', error as Error);
      return {};
    }
  }

  private createFailureLog(dto: CreateAuditLogDTO): AuditLog {
    return new AuditLog({
      id: 'failed',
      userId: dto.userId,
      action: dto.action,
      entityId: dto.entityId,
      entityType: dto.entityType,
      timestamp: new Date(),
    });
  }

  private async fetchLogsByFilters(filters: {
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<AuditLog[]> {
    const { entityId, startDate, endDate, userId } = filters;

    if (entityId) {
      return this.auditRepository.findByEntityId(entityId);
    }

    if (userId) {
      return this.auditRepository.findByUserId(userId);
    }

    if (startDate && endDate) {
      if (endDate < startDate) {
        throw new AuditError('End date cannot be earlier than start date');
      }
      return this.auditRepository.findByDateRange(startDate, endDate);
    }

    return this.auditRepository.findAll();
  }

  private convertLogsToCSV(logs: AuditLog[]): string {
    const header = 'ID,User ID,Action,Entity ID,Entity Type,Timestamp,IP Address\n';
    const rows = logs
      .map(log => {
        const safeIpAddress = log.ipAddress || 'N/A';
        return `${log.id},${log.userId},${log.action},${log.entityId},${log.entityType},${log.timestamp.toISOString()},${safeIpAddress}`;
      })
      .join('\n');

    return header + rows;
  }

  private generateDiffObject(
    oldObj: Record<string, any>,
    newObj: Record<string, any>
  ): Record<string, { old?: any; new?: any; changed: boolean }> {
    const result: Record<string, { old?: any; new?: any; changed: boolean }> = {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        result[key] = {
          old: oldVal,
          new: newVal,
          changed: true,
        };
      }
    }

    return result;
  }
}
