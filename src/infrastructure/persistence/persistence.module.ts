import { ContainerModule } from 'inversify';
import {
  IAuditRepository,
  ICategoryRepository,
  IEnvironmentRepository,
  IFlagRepository,
  IUserRepository,
} from './interfaces';
import {
  AuditRepository,
  CategoryRepository,
  EnvironmentRepository,
  FlagRepository,
  UserRepository,
} from './repository';
import { TYPES } from '../config/types';

export const persistenceModule = new ContainerModule(({ bind }) => {
  bind<IAuditRepository>(TYPES.AuditRepository).to(AuditRepository).inSingletonScope();
  bind<ICategoryRepository>(TYPES.CategoryRepository).to(CategoryRepository).inSingletonScope();
  bind<IFlagRepository>(TYPES.FlagRepository).to(FlagRepository).inSingletonScope();
  bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
  bind<IEnvironmentRepository>(TYPES.EnvironmentRepository)
    .to(EnvironmentRepository)
    .inSingletonScope();
});
