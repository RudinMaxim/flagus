import { ContainerModule } from 'inversify';
import { TYPES } from '@infrastructure/config';
import {
  IAuditRepository,
  ICategoryRepository,
  IFlagRepository,
  IUserRepository,
} from './interfaces';
import { AuditRepository, CategoryRepository, FlagRepository, UserRepository } from './repository';

export const persistenceModule = new ContainerModule(({ bind }) => {
  bind<IAuditRepository>(TYPES.AuditRepository).to(AuditRepository).inSingletonScope();
  bind<ICategoryRepository>(TYPES.CategoryRepository).to(CategoryRepository).inSingletonScope();
  bind<IFlagRepository>(TYPES.FlagRepository).to(FlagRepository).inSingletonScope();
  bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
});
