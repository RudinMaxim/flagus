import { User } from '@infrastructure/auth/user.model';
import { BaseRepository, DataGateway } from '@infrastructure/storage';
import { IUserRepository } from '../interfaces';
import { inject, injectable } from 'inversify';
import { TYPES } from '@infrastructure/config';

@injectable()
export class UserRepository extends BaseRepository<User, string> implements IUserRepository {
  constructor(@inject(TYPES.DataGateway) dataGateway: DataGateway) {
    super(dataGateway, 'users', 'id');
  }

  async findByUsername(username: string): Promise<User | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE username = $1 
      LIMIT 1
    `;
    return this.dataGateway.getOne<User>(sql, [username]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE email = $1 
      LIMIT 1
    `;
    return this.dataGateway.getOne<User>(sql, [email]);
  }

  async findByRole(role: string): Promise<User[]> {
    const sql = `
      SELECT u.* FROM ${this.tableName} u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1
      ORDER BY u.username ASC
    `;
    return this.dataGateway.query<User>(sql, [role]);
  }

  async updateLastLogin(id: string): Promise<User | null> {
    const sql = `
      UPDATE ${this.tableName} 
      SET last_login_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    return this.dataGateway.getOne<User>(sql, [id]);
  }
}
