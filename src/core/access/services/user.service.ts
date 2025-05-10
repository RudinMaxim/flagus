import { injectable, inject } from 'inversify';
import { IGroupRepository, IUserRepository } from '../../../infrastructure/persistence';
import * as bcrypt from 'bcrypt';
import { TYPES } from '../../../infrastructure/config/types';
import { CreateUserDTO, UpdateUserDTO, User } from '../model';
import { Group } from '../model/group.model';
import { ServiceError } from '../../../shared/kernel';

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.GroupRepository) private readonly groupRepository: IGroupRepository
  ) {}

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createUser(userData: CreateUserDTO, createdBy: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) throw new ServiceError('User', 'Пользователь с таким email уже существует');

    return this.userRepository.create({
      username: userData.username,
      email: userData.email,
      passwordHash: await bcrypt.hash(userData.password, 10),
      role: userData.role,
      isActive: true,
      groupIds: [],
      metadata: { createdBy, createdAt: new Date() },
    });
  }

  async updateUser(id: string, userData: UpdateUserDTO, updatedBy: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ServiceError('User', 'Пользователь не найден');

    const updates: Partial<User> = { ...userData };
    if (userData.password) updates.passwordHash = await bcrypt.hash(userData.password, 10);
    updates.metadata = { ...user.metadata, updatedBy, updatedAt: new Date() };

    return this.userRepository.update(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new ServiceError('User', 'Пользователь не найден');
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

  async addUserToGroups(userId: string, groupIds: string[], updatedBy: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new ServiceError('User', 'Пользователь не найден');

    const groups = await this.groupRepository.findByIds(groupIds);
    if (groups.length !== groupIds.length)
      throw new ServiceError('User', 'Некоторые группы не найдены');

    const newGroupIds = [...new Set([...user.groupIds, ...groupIds])];
    return this.userRepository.update(userId, {
      groupIds: newGroupIds,
      metadata: { ...user.metadata, updatedBy, updatedAt: new Date() },
    });
  }

  async removeUserFromGroups(userId: string, groupIds: string[], updatedBy: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new ServiceError('User', 'Пользователь не найден');

    const newGroupIds = user.groupIds.filter(id => !groupIds.includes(id));
    return this.userRepository.update(userId, {
      groupIds: newGroupIds,
      metadata: { ...user.metadata, updatedBy, updatedAt: new Date() },
    });
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new ServiceError('User', 'Пользователь не найден');
    return this.groupRepository.findByIds(user.groupIds);
  }
}
