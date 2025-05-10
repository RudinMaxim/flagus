import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { IEnvironmentRepository } from '../interfaces';
import { Environment, SDKKeyType } from '../../../core/environment/model';
import { BaseRepository, DataGateway } from '../../../shared/storage';
import { TYPES } from '../../config/types';

interface EnvironmentRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}

interface SDKKeyRow {
  id: string;
  environment_id: string;
  key: string;
  type: string;
  created_at: string;
  created_by: string;
  is_active: number;
}

@injectable()
export class EnvironmentRepository
  extends BaseRepository<Environment, string>
  implements IEnvironmentRepository
{
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'environments', 'id');
  }

  async findAll(): Promise<Environment[]> {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY name ASC`;
    const environmentRows = await this.dataGateway.query<EnvironmentRow>(sql);

    const environments: Environment[] = [];
    for (const row of environmentRows) {
      const sdkKeys = await this.getSDKKeysForEnvironment(row.id);
      environments.push(this.mapToEntity(row, sdkKeys));
    }

    return environments;
  }

  async findById(id: string): Promise<Environment | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.dataGateway.getOne<EnvironmentRow>(sql, [id]);
    if (!row) return null;

    const sdkKeys = await this.getSDKKeysForEnvironment(id);
    return this.mapToEntity(row, sdkKeys);
  }

  private async getSDKKeysForEnvironment(environmentId: string): Promise<SDKKeyRow[]> {
    const sql = `SELECT * FROM sdk_keys WHERE environment_id = ?`;
    return await this.dataGateway.query<SDKKeyRow>(sql, [environmentId]);
  }

  async findByName(name: string): Promise<Environment | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE name = ? LIMIT 1`;
    const row = await this.dataGateway.getOne<EnvironmentRow>(sql, [name]);
    if (!row) return null;

    const sdkKeys = await this.getSDKKeysForEnvironment(row.id);
    return this.mapToEntity(row, sdkKeys);
  }

  async create(entity: Omit<Environment, 'id'>): Promise<Environment> {
    await this.dataGateway.beginTransaction();

    try {
      const id = crypto.randomUUID();
      const sql = `
        INSERT INTO ${this.tableName} (
          id, name, description, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const now = new Date();
      await this.dataGateway.execute(sql, [
        id,
        entity.name,
        entity.description || null,
        now,
        entity.metadata.createdBy,
      ]);

      // Insert SDK keys if provided
      if (entity.sdkKeys && entity.sdkKeys.length > 0) {
        for (const sdkKey of entity.sdkKeys) {
          await this.insertSDKKey(id, sdkKey);
        }
      }

      await this.dataGateway.commit();

      const result = await this.findById(id);
      if (!result) {
        throw new Error(`Failed to retrieve created environment with ID: ${id}`);
      }

      return result;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  private async insertSDKKey(
    environmentId: string,
    sdkKey: import('../../../core/environment/model').ISDKKey
  ): Promise<void> {
    const sql = `
      INSERT INTO sdk_keys (
        id, environment_id, key, type, created_at, created_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.dataGateway.execute(sql, [
      crypto.randomUUID(),
      environmentId,
      sdkKey.key,
      sdkKey.type,
      sdkKey.createdAt,
      sdkKey.createdBy,
      sdkKey.isActive ? 1 : 0,
    ]);
  }

  async update(id: string, data: Partial<Environment>): Promise<Environment | null> {
    await this.dataGateway.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues = [];

      if (data.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(data.name);
      }

      if (data.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(data.description);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());

      if (data.metadata?.updatedBy) {
        updateFields.push('updated_by = ?');
        updateValues.push(data.metadata.updatedBy);
      }

      if (updateFields.length > 0) {
        const sql = `
          UPDATE ${this.tableName} 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.dataGateway.execute(sql, [...updateValues, id]);
      }

      // Update SDK keys if provided
      if (data.sdkKeys !== undefined) {
        // Delete existing SDK keys
        await this.dataGateway.execute('DELETE FROM sdk_keys WHERE environment_id = ?', [id]);

        // Insert new SDK keys
        if (data.sdkKeys.length > 0) {
          for (const sdkKey of data.sdkKeys) {
            await this.insertSDKKey(id, sdkKey);
          }
        }
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
      // Delete SDK keys first (foreign key constraint)
      await this.dataGateway.execute('DELETE FROM sdk_keys WHERE environment_id = ?', [id]);

      // Delete the environment
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

  private mapToEntity(row: EnvironmentRow, sdkKeyRows: SDKKeyRow[] = []): Environment {
    const parseDate = (dateStr: string | null | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        const timestamp = parseFloat(dateStr);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
        return new Date(dateStr);
      } catch (e) {
        return undefined;
      }
    };

    const createdAt = parseDate(row.created_at) || new Date();
    const updatedAt = parseDate(row.updated_at);

    // Map SDK keys
    const sdkKeys = sdkKeyRows.map(keyRow => ({
      key: keyRow.key,
      type: keyRow.type as import('../../../core/environment/model').SDKKeyType,
      createdAt: parseDate(keyRow.created_at) || new Date(),
      createdBy: keyRow.created_by,
      isActive: keyRow.is_active === 1,
    }));

    return new Environment({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      sdkKeys: sdkKeys,
      metadata: {
        createdBy: row.created_by,
        createdAt,
        updatedBy: row.updated_by || undefined,
        updatedAt,
      },
    });
  }

  async addSDKKey(
    environmentId: string,
    key: string,
    type: SDKKeyType,
    createdBy: string
  ): Promise<Environment | null> {
    await this.dataGateway.beginTransaction();

    try {
      const environment = await this.findById(environmentId);
      if (!environment) {
        await this.dataGateway.rollback();
        return null;
      }

      const sdkKey = {
        key,
        type,
        createdAt: new Date(),
        createdBy,
        isActive: true,
      };

      await this.insertSDKKey(environmentId, sdkKey);

      await this.dataGateway.commit();
      return this.findById(environmentId);
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async deactivateSDKKey(environmentId: string, key: string): Promise<Environment | null> {
    await this.dataGateway.beginTransaction();

    try {
      const sql = `
        UPDATE sdk_keys 
        SET is_active = 0 
        WHERE environment_id = ? AND key = ?
      `;

      await this.dataGateway.execute(sql, [environmentId, key]);

      await this.dataGateway.commit();
      return this.findById(environmentId);
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }
}
