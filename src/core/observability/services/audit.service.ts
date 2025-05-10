import { injectable, inject } from 'inversify';
import { IAuditRepository } from '../../../infrastructure/persistence';
import { ILogger } from '../../../shared/logger';
import { AuditLog, CreateAuditLogDTO } from '../model';
import { TYPES } from '../../../infrastructure/config/types';
import { ServiceError } from '../../../shared/kernel';

@injectable()
export class AuditService {
  constructor(
    @inject(TYPES.AuditRepository) private readonly auditRepository: IAuditRepository,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async logAction(dto: CreateAuditLogDTO): Promise<AuditLog> {
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

    try {
      return await this.auditRepository.create(auditLog);
    } catch (error) {
      this.logger.error('Audit log failed', error as Error, { dto });
      return auditLog;
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
      throw new ServiceError('Audit', 'Failed to export audit logs: ' + (error as Error).message);
    }
  }

  async getLogs(filters: {
    entityId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    const { entityId, userId, startDate, endDate } = filters;
    if (entityId) return this.auditRepository.findByEntityId(entityId);
    if (userId) return this.auditRepository.findByUserId(userId);
    if (startDate && endDate) {
      if (endDate < startDate) throw new ServiceError('Audit', 'Invalid date range');
      return this.auditRepository.findByDateRange(startDate, endDate);
    }
    return this.auditRepository.findAll();
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
        throw new ServiceError('Audit', 'End date cannot be earlier than start date');
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
        return `${log.id},${log.userId},${log.action},${log.entityId},${log.entityType},${log.timestamp},${safeIpAddress}`;
      })
      .join('\n');

    return header + rows;
  }
}
