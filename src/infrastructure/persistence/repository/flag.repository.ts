import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { FeatureFlag } from '../../../core/model';
import {
  FlagStatus,
  FlagType,
  TimeConstraint,
  PercentageDistribution,
  Metadata,
} from '../../../shared/kernel';
import { TYPES } from '../../config/types';
import { BaseRepository, DataGateway } from '../../storage';
import { FlagRow, IFlagRepository } from '../interfaces';

@injectable()
export class FlagRepository extends BaseRepository<FeatureFlag, string> implements IFlagRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'feature_flags', 'id');
  }

  async findAll(): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql);

    return rows.map(row => this.mapToEntity(row));
  }

  async findById(id: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.id = ?
      GROUP BY f.id
    `;

    const row = await this.dataGateway.getOne<FlagRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  async create(entity: Omit<FeatureFlag, 'id'>): Promise<FeatureFlag> {
    await this.dataGateway.beginTransaction();

    try {
      const flagId = crypto.randomUUID();
      const flagSql = `
        INSERT INTO feature_flags (
          id, key, name, description, type, status, category_id, 
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date();
      await this.dataGateway.execute(flagSql, [
        flagId,
        entity.key,
        entity.name,
        entity.description || null,
        entity.type,
        entity.status,
        entity.categoryId || null,
        now,
        entity.metadata.createdBy,
      ]);

      if (entity.timeConstraint) {
        const tcSql = `
          INSERT INTO flag_time_constraints (flag_id, start_date, end_date)
          VALUES (?, ?, ?)
        `;
        await this.dataGateway.execute(tcSql, [
          flagId,
          entity.timeConstraint.startDate ? entity.timeConstraint.startDate : null,
          entity.timeConstraint.endDate ? entity.timeConstraint.endDate : null,
        ]);
      }

      if (entity.percentageDistribution) {
        const pdSql = `
          INSERT INTO flag_percentage_distributions (flag_id, percentage)
          VALUES (?, ?)
        `;
        await this.dataGateway.execute(pdSql, [flagId, entity.percentageDistribution.percentage]);
      }

      if (entity.clientIds && entity.clientIds.length > 0) {
        for (const clientId of entity.clientIds) {
          const clientSql = `
            INSERT INTO flag_clients (flag_id, client_id)
            VALUES (?, ?)
          `;
          await this.dataGateway.execute(clientSql, [flagId, clientId]);
        }
      }

      await this.dataGateway.commit();

      const result = await this.findById(flagId);
      if (!result) {
        throw new Error(`Failed to retrieve created feature flag with ID: ${flagId}`);
      }
      return result;
    } catch (error) {
      await this.dataGateway.rollback();
      throw error;
    }
  }

  async update(id: string, entity: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    await this.dataGateway.beginTransaction();

    try {
      const updateFields: string[] = [];
      const updateValues = [];

      if (entity.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(entity.name);
      }

      if (entity.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(entity.description);
      }

      if (entity.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(entity.type);
      }

      if (entity.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(entity.status);
      }

      if (entity.categoryId !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(entity.categoryId);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date());

      if (entity.metadata?.updatedBy) {
        updateFields.push('updated_by = ?');
        updateValues.push(entity.metadata.updatedBy);
      }

      if (updateFields.length > 0) {
        const flagSql = `
          UPDATE feature_flags 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;
        await this.dataGateway.execute(flagSql, [...updateValues, id]);
      }

      if (entity.timeConstraint) {
        const tcExists = await this.dataGateway.getOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM flag_time_constraints WHERE flag_id = ?',
          [id]
        );

        if (tcExists && tcExists.count > 0) {
          await this.dataGateway.execute(
            'UPDATE flag_time_constraints SET start_date = ?, end_date = ? WHERE flag_id = ?',
            [
              entity.timeConstraint.startDate ? entity.timeConstraint.startDate : null,
              entity.timeConstraint.endDate ? entity.timeConstraint.endDate : null,
              id,
            ]
          );
        } else {
          await this.dataGateway.execute(
            'INSERT INTO flag_time_constraints (flag_id, start_date, end_date) VALUES (?, ?, ?)',
            [
              id,
              entity.timeConstraint.startDate ? entity.timeConstraint.startDate : null,
              entity.timeConstraint.endDate ? entity.timeConstraint.endDate : null,
            ]
          );
        }
      }

      if (entity.percentageDistribution) {
        const pdExists = await this.dataGateway.getOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM flag_percentage_distributions WHERE flag_id = ?',
          [id]
        );

        if (pdExists && pdExists.count > 0) {
          await this.dataGateway.execute(
            'UPDATE flag_percentage_distributions SET percentage = ? WHERE flag_id = ?',
            [entity.percentageDistribution.percentage, id]
          );
        } else {
          await this.dataGateway.execute(
            'INSERT INTO flag_percentage_distributions (flag_id, percentage) VALUES (?, ?)',
            [id, entity.percentageDistribution.percentage]
          );
        }
      }

      if (entity.clientIds !== undefined) {
        await this.dataGateway.execute('DELETE FROM flag_clients WHERE flag_id = ?', [id]);

        if (entity.clientIds.length > 0) {
          for (const clientId of entity.clientIds) {
            await this.dataGateway.execute(
              'INSERT INTO flag_clients (flag_id, client_id) VALUES (?, ?)',
              [id, clientId]
            );
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

  async findByName(name: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.name = ? 
      GROUP BY f.id
      LIMIT 1
    `;

    const row = await this.dataGateway.getOne<FlagRow>(sql, [name]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.key = ? 
      GROUP BY f.id
      LIMIT 1
    `;

    const row = await this.dataGateway.getOne<FlagRow>(sql, [key]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByStatus(status: FlagStatus): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.status = ? 
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [status]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByCategory(categoryId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.category_id = ? 
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [categoryId]);
    return rows.map(row => this.mapToEntity(row));
  }

  async findByType(type: FlagType): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      LEFT JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.type = ? 
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [type]);
    return rows.map(row => this.mapToEntity(row));
  }

  async toggleStatus(id: string, status: FlagStatus): Promise<FeatureFlag | null> {
    const updateSql = `
      UPDATE ${this.tableName} 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `;
    await this.dataGateway.execute(updateSql, [status, new Date(), id]);
    return this.findById(id);
  }

  async findActiveFlags(): Promise<FeatureFlag[]> {
    return this.findByStatus(FlagStatus.ACTIVE);
  }

  async findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]> {
    const sql = `
      SELECT 
        f.*,
        tc.start_date, tc.end_date,
        pd.percentage,
        GROUP_CONCAT(fc.client_id) AS client_ids_concat
      FROM feature_flags f
      LEFT JOIN flag_time_constraints tc ON f.id = tc.flag_id
      LEFT JOIN flag_percentage_distributions pd ON f.id = pd.flag_id
      JOIN flag_clients fc ON f.id = fc.flag_id
      WHERE f.status = ? AND fc.client_id = ?
      GROUP BY f.id
      ORDER BY f.name ASC
    `;

    const rows = await this.dataGateway.query<FlagRow>(sql, [FlagStatus.ACTIVE, clientId]);
    return rows.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: FlagRow): FeatureFlag {
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

    const startDate = parseDate(row.start_date);
    const endDate = parseDate(row.end_date);
    const createdAt = parseDate(row.created_at) || new Date();
    const updatedAt = parseDate(row.updated_at);

    const clientIds: string[] =
      row.client_ids_concat && typeof row.client_ids_concat === 'string'
        ? row.client_ids_concat.split(',')
        : [];

    const timeConstraint: TimeConstraint | undefined =
      startDate || endDate ? { startDate, endDate } : undefined;

    const percentageDistribution: PercentageDistribution | undefined =
      row.percentage !== null && row.percentage !== undefined
        ? { percentage: row.percentage }
        : undefined;

    const metadata: Metadata = {
      createdBy: row.created_by,
      createdAt,
      updatedBy: row.updated_by || undefined,
      updatedAt,
    };

    return new FeatureFlag({
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description || undefined,
      type: row.type as FlagType,
      status: row.status as FlagStatus,
      categoryId: row.category_id || undefined,
      timeConstraint,
      percentageDistribution,
      clientIds: clientIds.length > 0 ? clientIds : undefined,
      metadata,
    });
  }
}
