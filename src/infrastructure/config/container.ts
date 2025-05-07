import { Container } from 'inversify';
import { ILogger, LoggerService } from '../../shared/logger';
import { persistenceModule } from '../persistence';
import { storageModule, OnInit, OnDestroy } from '../storage';
import { ConfigService } from './config';
import { TYPES } from './types';
import {
  AuditService,
  CategoryService,
  FeatureFlagService,
  FlagEvaluationService,
} from '../../core/service';
import { FlagTTLService } from '../../core/service/flag-ttl.service';
import { FlagHttpController } from '../delivery/api/controllers/v1/flag.http.controller';
import { AuditHttpController } from '../delivery/api/controllers/v1/audit.http.controller';
import { CategoryHttpController } from '../delivery/api/controllers/v1/category.http.controller';

export async function createContainer(): Promise<Container> {
  const container = new Container();

  container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
  container.bind<ConfigService>(TYPES.Config).to(ConfigService).inSingletonScope();

  container.load(storageModule);
  container.load(persistenceModule);

  container.bind<AuditService>(TYPES.AuditService).to(AuditService).inSingletonScope();
  container.bind<CategoryService>(TYPES.CategoryService).to(CategoryService).inSingletonScope();
  container
    .bind<FeatureFlagService>(TYPES.FeatureFlagService)
    .to(FeatureFlagService)
    .inSingletonScope();
  container
    .bind<FlagEvaluationService>(TYPES.FlagEvaluationService)
    .to(FlagEvaluationService)
    .inSingletonScope();

  container.bind<FlagTTLService>(TYPES.FlagTTLService).to(FlagTTLService).inSingletonScope();

  container
    .bind<AuditHttpController>(TYPES.AuditHttpController)
    .to(AuditHttpController)
    .inSingletonScope();
  container
    .bind<CategoryHttpController>(TYPES.CategoryHttpController)
    .to(CategoryHttpController)
    .inSingletonScope();
  container
    .bind<FlagHttpController>(TYPES.FlagHttpController)
    .to(FlagHttpController)
    .inSingletonScope();

  const initializeApp = async () => {
    const initializables = container.getAll<OnInit>(TYPES.OnInit);
    for (const initializable of initializables) {
      await initializable.onInit();
    }
  };

  const cleanupApp = async () => {
    const destroyables = container.getAll<OnDestroy>(TYPES.OnDestroy);
    for (const destroyable of destroyables) {
      await destroyable.onDestroy();
    }
  };

  (container as any).initialize = initializeApp;
  (container as any).cleanup = cleanupApp;

  return container;
}
