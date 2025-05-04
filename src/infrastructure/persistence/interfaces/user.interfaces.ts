import { User } from '@infrastructure/auth/user.model';
import { IRepository } from '../../../shared/kernel';

export interface IUserRepository extends IRepository<User, string> {
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRole(role: string): Promise<User[]>;
  updateLastLogin(id: string): Promise<User | null>;
}
