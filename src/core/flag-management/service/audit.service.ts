import { injectable, inject } from 'inversify';
import { AuditLog, CreateAuditLogDTO } from '../model/audit.model';
import { IAuditRepository } from '@infrastructure/persistence/interfaces/repositories';
import { TYPES } from '@infrastructure/config';
import { ILogger } from '@shared/logger';

@injectable()
export class AuditService {
  constructor(
    @inject(TYPES.AuditRepository) private auditRepository: IAuditRepository,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async getAll(): Promise<AuditLog[]> {
    return this.auditRepository.findAll();
  }

  async getById(id: string): Promise<AuditLog | null> {
    return this.auditRepository.findById(id);
  }

  async getByEntityId(entityId: string): Promise<AuditLog[]> {
    return this.auditRepository.findByEntityId(entityId);
  }

  async getByUserId(userId: string): Promise<AuditLog[]> {
    return this.auditRepository.findByUserId(userId);
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return this.auditRepository.findByDateRange(startDate, endDate);
  }

  async logAction(dto: CreateAuditLogDTO): Promise<AuditLog> {
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

      // В случае ошибки при логировании аудита, мы не хотим блокировать основную операцию,
      // поэтому возвращаем "пустой" объект аудита
      return new AuditLog({
        id: 'failed',
        userId: dto.userId,
        action: dto.action,
        entityId: dto.entityId,
        entityType: dto.entityType,
        timestamp: new Date(),
      });
    }
  }

  async exportAuditLogs(
    entityId?: string,
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<string> {
    try {
      let logs: AuditLog[] = [];

      if (entityId) {
        logs = await this.auditRepository.findByEntityId(entityId);
      } else if (userId) {
        logs = await this.auditRepository.findByUserId(userId);
      } else if (startDate && endDate) {
        logs = await this.auditRepository.findByDateRange(startDate, endDate);
      } else {
        logs = await this.auditRepository.findAll();
      }

      // Формируем CSV
      const header = 'ID,User ID,Action,Entity ID,Entity Type,Timestamp,IP Address\n';
      const rows = logs
        .map(log => {
          return `${log.id},${log.userId},${log.action},${log.entityId},${log.entityType},${log.timestamp.toISOString()},${log.ipAddress || 'N/A'}`;
        })
        .join('\n');

      return header + rows;
    } catch (error) {
      this.logger.error('Failed to export audit logs', error as Error);
      throw error;
    }
  }

  // Получение разницы между двумя состояниями объекта для визуализации
  getDiff(
    oldValue?: string,
    newValue?: string
  ): Record<string, { old?: any; new?: any; changed: boolean }> {
    if (!oldValue || !newValue) {
      return {};
    }

    try {
      const oldObj = JSON.parse(oldValue);
      const newObj = JSON.parse(newValue);

      const result: Record<string, { old?: any; new?: any; changed: boolean }> = {};

      // Объединяем все ключи из обоих объектов
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

      for (const key of allKeys) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];

        // Сравниваем значения
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          result[key] = {
            old: oldVal,
            new: newVal,
            changed: true,
          };
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to generate diff', error as Error);
      return {};
    }
  }
}
