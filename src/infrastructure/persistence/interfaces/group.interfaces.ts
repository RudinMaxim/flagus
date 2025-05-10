import { Group } from '../../../core/access/model/group.model';
import { IRepository } from '../../../shared/kernel';

export interface IGroupRepository extends IRepository<Group, string> {
  findByName(name: string): Promise<Group | null>;
  findByIds(ids: Array<string>): Promise<Group[]>;
  list(options?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Partial<Group>;
  }): Promise<{ groups: Group[]; total: number }>;
}
