import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { TYPES } from '../../../infrastructure/config/types';
import { Group } from '../model/group.model';
import { IGroupRepository } from '../../../infrastructure/persistence';
import { ServiceError } from '../../../shared/kernel';

@injectable()
export class GroupService {
  constructor(@inject(TYPES.GroupRepository) private readonly groupRepository: IGroupRepository) {}

  async createGroup(createdBy: string, name: string, description?: string): Promise<Group> {
    const existing = await this.groupRepository.findByName(name);
    if (existing) throw new ServiceError('Group', 'Группа с таким именем уже существует');

    const group = new Group({
      id: crypto.randomUUID(),
      name,
      description,
      metadata: { createdBy, createdAt: new Date() },
    });

    return this.groupRepository.create(group);
  }

  async getGroupById(id: string): Promise<Group | null> {
    return this.groupRepository.findById(id);
  }

  async getByUserId(id: string): Promise<Group[]> {
    return this.groupRepository.getByUserId(id);
  }

  async listGroups(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<Group>;
  }): Promise<{ groups: Group[]; total: number }> {
    return this.groupRepository.list(options);
  }

  async updateGroup(
    id: string,
    updates: { name?: string; description?: string },
    updatedBy: string
  ): Promise<Group> {
    const group = await this.groupRepository.findById(id);
    if (!group) throw new ServiceError('Group', 'Группа не найдена');

    if (updates.name && updates.name !== group.name) {
      const existing = await this.groupRepository.findByName(updates.name);
      if (existing) throw new ServiceError('Group', 'Группа с таким именем уже существует');
    }

    const updateData: Partial<Group> = {
      ...updates,
      metadata: { ...group.metadata, updatedBy, updatedAt: new Date() },
    };

    const updated = await this.groupRepository.update(id, updateData);
    if (!updated) throw new ServiceError('Group', 'Ошибка обновления');
    return updated;
  }

  async deleteGroup(id: string): Promise<boolean> {
    const group = await this.groupRepository.findById(id);
    if (!group) throw new ServiceError('Group', 'Группа не найдена');
    return this.groupRepository.delete(id);
  }
}
