import { injectable, inject } from 'inversify';
import { User } from '../../auth/user.model';
import { TYPES } from '../../config/types';
import { BaseRepository, DataGateway } from '../../storage';
import { IUserRepository } from '../interfaces';

@injectable()
export class UserRepository extends BaseRepository<User, string> implements IUserRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'users', 'id');
  }

  async findByUsername(username: string): Promise<User | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE username = ? 
      LIMIT 1
    `;
    return this.dataGateway.getOne<User>(sql, [username]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE email = ? 
      LIMIT 1
    `;
    return this.dataGateway.getOne<User>(sql, [email]);
  }

  async findByRole(role: string): Promise<User[]> {
    const sql = `
      SELECT u.* FROM ${this.tableName} u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = ? 
      ORDER BY u.username ASC
    `;
    return this.dataGateway.query<User>(sql, [role]);
  }

  async updateLastLogin(id: string): Promise<User | null> {
    const updateSql = `
      UPDATE ${this.tableName} 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await this.dataGateway.execute(updateSql, [id]);

    const selectSql = `
      SELECT * FROM ${this.tableName} 
      WHERE id = ?
    `;
    return this.dataGateway.getOne<User>(selectSql, [id]);
  }
}
