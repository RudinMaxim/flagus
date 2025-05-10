import { IRepository } from '../../../shared/kernel';
import { User } from '../../../core/access/model/user.model';

export interface IUserRepository extends IRepository<User, string> {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
  list(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<User>;
  }): Promise<{ users: User[]; total: number }>;
  checkIsFirstUser(): Promise<boolean>;
}
