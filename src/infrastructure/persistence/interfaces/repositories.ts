import { User } from '@infrastructure/auth/user.model';
import { IRepository } from '@shared/kernel/base.interfaces';
import { FlagStatus, FlagType } from '@shared/kernel/base.types';
import { AuditLog } from '../../../core/flag-management/model/audit.model';
import { FlagCategory } from '../../../core/flag-management/model/category.model';
import { FeatureFlag } from '../../../core/flag-management/model/flag.model';

// Расширенный интерфейс для репозитория флагов
export interface IFlagRepository extends IRepository<FeatureFlag, string> {
  findByName(name: string): Promise<FeatureFlag | null>;
  findByStatus(status: FlagStatus): Promise<FeatureFlag[]>;
  findByCategory(categoryId: string): Promise<FeatureFlag[]>;
  findByType(type: FlagType): Promise<FeatureFlag[]>;
  toggleStatus(id: string, status: FlagStatus): Promise<FeatureFlag | null>;
  findActiveFlags(): Promise<FeatureFlag[]>;
  findActiveFlagsForClient(clientId: string): Promise<FeatureFlag[]>;
}

// Расширенный интерфейс для репозитория категорий
export interface ICategoryRepository extends IRepository<FlagCategory, string> {
  findByName(name: string): Promise<FlagCategory | null>;
  findByParentId(parentId: string): Promise<FlagCategory[]>;
  findRootCategories(): Promise<FlagCategory[]>;
  getFullPath(categoryId: string): Promise<FlagCategory[]>;
}

// Расширенный интерфейс для репозитория аудита
export interface IAuditRepository extends IRepository<AuditLog, string> {
  findByEntityId(entityId: string): Promise<AuditLog[]>;
  findByUserId(userId: string): Promise<AuditLog[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
  findByAction(action: string): Promise<AuditLog[]>;
}

// Расширенный интерфейс для репозитория пользователей
export interface IUserRepository extends IRepository<User, string> {
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRole(role: string): Promise<User[]>;
  updateLastLogin(id: string): Promise<User | null>;
}
