import { injectable, inject } from 'inversify';
import { IUserRepository } from '../../../infrastructure/persistence';
import * as bcrypt from 'bcrypt';
import { TYPES } from '../../../infrastructure/config/types';
import { CreateUserDTO, UpdateUserDTO, TUserRole } from '../interfaces';
import { User } from '../model';

@injectable()
export class UserService {
  constructor(@inject(TYPES.UserRepository) private readonly userRepository: IUserRepository) {}

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createUser(userData: CreateUserDTO, createdBy: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    return await this.userRepository.create({
      username: userData.username,
      email: userData.email,
      passwordHash: await bcrypt.hash(userData.password, 10),
      role: userData.role,
      isActive: true,
      metadata: {
        createdBy,
        createdAt: new Date(),
      },
    });
  }

  async updateUser(id: string, userData: UpdateUserDTO, updatedBy: string): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Пользователь не найден');
    }

    const updates: Partial<User> = { ...userData };

    if (userData.password) {
      updates.passwordHash = await bcrypt.hash(userData.password, 10);
      delete updates.passwordHash;
    }

    updates.metadata = {
      ...existingUser.metadata,
      updatedBy,
      updatedAt: new Date(),
    };

    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Пользователь не найден');
    }

    return this.userRepository.delete(id);
  }

  async listUsers(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<User>;
  }): Promise<{ users: User[]; total: number }> {
    return this.userRepository.list(options);
  }
}
