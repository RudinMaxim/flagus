import { IRepository } from '../../../shared/kernel';
import { User } from '../../../core/auth/user.model';

export interface IUserRepository extends IRepository<User, string> {
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRole(role: string): Promise<User[]>;
  updateLastLogin(id: string): Promise<User | null>;
}
