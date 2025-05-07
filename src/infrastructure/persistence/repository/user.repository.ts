import { injectable, inject } from 'inversify';
import { User } from '../../../core/access/model/user.model';
import { TYPES } from '../../config/types';
import { IUserRepository, UserRow } from '../interfaces';
import { BaseRepository } from '../../../shared/storage';
import { DataGateway } from '../../../shared/storage/abstract';
import { IMetadata } from '../../../shared/kernel';
import crypto from 'crypto';
import { TUserRole } from '../../../core/access/interfaces';

@injectable()
export class UserRepository extends BaseRepository<User, string> implements IUserRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'users', 'id');
  }

  async findById(id: string): Promise<User | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.idField} = ?`;
    const row = await this.dataGateway.getOne<UserRow>(sql, [id]);
    return row ? this.mapToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
    const row = await this.dataGateway.getOne<UserRow>(sql, [email]);
    return row ? this.mapToEntity(row) : null;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const userId = crypto.randomUUID();
    const now = new Date();

    const sql = `
      INSERT INTO ${this.tableName} (
        id, username, password_hash, email, role, is_active,
        created_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.dataGateway.execute(sql, [
      userId,
      user.username,
      user.passwordHash,
      user.email,
      user.role,
      user.isActive ? 1 : 0,
      now,
      user.metadata.createdBy,
    ]);

    const result = await this.findById(userId);
    if (!result) {
      throw new Error('Failed to create user');
    }
    return result;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (userData.username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(userData.username);
    }

    if (userData.passwordHash !== undefined) {
      updateFields.push('password_hash = ?');
      updateValues.push(userData.passwordHash);
    }

    if (userData.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(userData.email);
    }

    if (userData.role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(userData.role);
    }

    if (userData.isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(userData.isActive ? 1 : 0);
    }

    if (userData.metadata?.updatedBy) {
      updateFields.push('updated_at = ?');
      updateValues.push(new Date());

      updateFields.push('updated_by = ?');
      updateValues.push(userData.metadata.updatedBy);
    }

    if (updateFields.length === 0) {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new Error(`User with id ${id} not found`);
      }
      return existingUser;
    }

    const sql = `
      UPDATE ${this.tableName}
      SET ${updateFields.join(', ')}
      WHERE ${this.idField} = ?
    `;

    await this.dataGateway.execute(sql, [...updateValues, id]);

    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found after update`);
    }

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idField} = ?`;
    await this.dataGateway.execute(sql, [id]);
    return true;
  }

  async list(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<User>;
  }): Promise<{ users: User[]; total: number }> {
    const {
      skip = 0,
      limit = 50,
      sortBy = this.idField,
      sortOrder = 'asc',
      filter = {},
    } = options || {};

    const columnMap: Record<string, string> = {
      id: 'id',
      username: 'username',
      passwordHash: 'password_hash',
      email: 'email',
      role: 'role',
      isActive: 'is_active',
    };

    const filterEntries = Object.entries(filter)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        const columnName = columnMap[key] || key;
        return { columnName, value };
      });

    let whereClause = '';
    const params: any[] = [];

    if (filterEntries.length > 0) {
      whereClause =
        'WHERE ' +
        filterEntries
          .map(({ columnName }, index) => {
            if (columnName === 'is_active' && typeof filterEntries[index].value === 'boolean') {
              return `${columnName} = ?`;
            }
            return `${columnName} = ?`;
          })
          .join(' AND ');

      filterEntries.forEach(({ value }) => {
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else {
          params.push(value);
        }
      });
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM ${this.tableName}
      ${whereClause}
    `;

    const dbSortBy = columnMap[sortBy] || sortBy;

    const dataSql = `
      SELECT *
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${dbSortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [countResult] = await this.dataGateway.query<{ total: string }>(countSql, params);
    const rows = await this.dataGateway.query<UserRow>(dataSql, [...params, limit, skip]);
    const users = rows.map(row => this.mapToEntity(row));

    return {
      users,
      total: parseInt(countResult.total, 10),
    };
  }

  async checkIsFirstUser(): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const [result] = await this.dataGateway.query<{ count: string }>(sql);
    return parseInt(result.count, 10) === 0;
  }

  private mapToEntity(row: UserRow): User {
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

    const metadata: IMetadata = {
      createdBy: row.created_by,
      createdAt,
      updatedBy: row.updated_by || undefined,
      updatedAt,
    };

    return new User({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      email: row.email,
      role: row.role as TUserRole,
      isActive: row.is_active == 1,
      metadata,
    });
  }
}
