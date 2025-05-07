import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { IAuditRepository, AuditLogRow } from '../interfaces';
import { TAuditAction } from '../../../core/flag-manager/interfaces';
import { AuditLog } from '../../../core/flag-manager/model';
import { BaseRepository, DataGateway } from '../../../shared/storage';
import { TYPES } from '../../config/types';

@injectable()
export class AuditRepository extends BaseRepository<AuditLog, string> implements IAuditRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'audit_logs', 'id');
  }

  async findAll(): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql);
    return rows.map(row => this.mapToEntity(row));
  }

  async findById(id: string): Promise<AuditLog | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE id = ?
    `;
    const row = await this.dataGateway.getOne<AuditLogRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  async create(entity: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    await this.dataGateway.beginTransaction();

    try {
      const auditId = crypto.randomUUID();
      const now = new Date();

      const sql = `
        INSERT INTO ${this.tableName} (
          id, user_id, action, entity_id, entity_type, 
          old_value, new_value, timestamp, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.dataGateway.execute(sql, [
        auditId,
        entity.userId,
        entity.action,
        entity.entityId,
        entity.entityType,
        JSON.stringify(entity.oldValue),
        JSON.stringify(entity.newValue),
        entity.timestamp || now.toISOString(),
        entity.ipAddress || null,
      ]);

      await this.dataGateway.commit();

      const result = await this.findById(auditId);
      if (!result) {
        throw new Error(`Failed to retrieve created audit log with ID: ${auditId}`);
      }
      return result;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async update(id: string, entity: Partial<AuditLog>): Promise<AuditLog | null> {
    await this.dataGateway.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues = [];

      if (entity.userId !== undefined) {
        updateFields.push('user_id = ?');
        updateValues.push(entity.userId);
      }

      if (entity.action !== undefined) {
        updateFields.push('action = ?');
        updateValues.push(entity.action);
      }

      if (entity.entityId !== undefined) {
        updateFields.push('entity_id = ?');
        updateValues.push(entity.entityId);
      }

      if (entity.entityType !== undefined) {
        updateFields.push('entity_type = ?');
        updateValues.push(entity.entityType);
      }

      const stringifyValue = (value: any): string | null => {
        if (value === undefined || value === null) return null;
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      };

      if (entity.oldValue !== undefined) {
        updateFields.push('old_value = ?');
        updateValues.push(stringifyValue(entity.oldValue));
      }

      if (entity.newValue !== undefined) {
        updateFields.push('new_value = ?');
        updateValues.push(stringifyValue(entity.newValue));
      }

      if (entity.timestamp !== undefined) {
        updateFields.push('timestamp = ?');
        updateValues.push(entity.timestamp);
      }

      if (entity.ipAddress !== undefined) {
        updateFields.push('ip_address = ?');
        updateValues.push(entity.ipAddress);
      }

      if (updateFields.length > 0) {
        const sql = `
          UPDATE ${this.tableName} 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.dataGateway.execute(sql, [...updateValues, id]);
      }

      await this.dataGateway.commit();
      return this.findById(id);
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.dataGateway.beginTransaction();

    try {
      const result = await this.dataGateway.execute<{ changes: number }>(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      await this.dataGateway.commit();
      return result.changes > 0;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async findByEntityId(entityId: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE entity_id = ? 
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [entityId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? 
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [userId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE timestamp BETWEEN ? AND ? 
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [
      startDate.toISOString(),
      endDate.toISOString(),
    ]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByAction(action: TAuditAction): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE action = ? 
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [action]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByEntityType(entityType: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE entity_type = ? 
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [entityType]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByActionAndEntityType(action: TAuditAction, entityType: string): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE action = ? AND entity_type = ? 
      ORDER BY timestamp DESC
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [action, entityType]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findLatestActivities(limit: number = 10): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [limit]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findLatestActivitiesByUser(userId: string, limit: number = 10): Promise<AuditLog[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    const rows = await this.dataGateway.query<AuditLogRow>(sql, [userId, limit]);
    return rows.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: AuditLogRow): AuditLog {
    return new AuditLog({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityId: row.entity_id,
      entityType: row.entity_type,
      oldValue: JSON.stringify(row.old_value),
      newValue: JSON.stringify(row.new_value),
      timestamp: row.timestamp,
      ipAddress: row.ip_address || undefined,
    });
  }
}
