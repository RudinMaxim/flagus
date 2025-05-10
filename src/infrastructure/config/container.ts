import { Container } from 'inversify';
import { ILogger, LoggerService } from '../../shared/logger';
import { persistenceModule } from '../persistence';
import { ConfigService } from './config';
import { TYPES } from './types';
import { flagManagerContainer } from '../../core/flag-manager';
import { storageModule, OnInit, OnDestroy } from '../../shared/storage';
import {
  AuditHttpController,
  AuthHttpController,
  CategoryHttpController,
  FlagHttpController,
  UserHttpController,
} from '../delivery/api/v1/controllers';
import { accessContainer } from '../../core/access';
import { EvaluateHttpController } from '../delivery/api/v1/controllers/evaluate.http.controller';
import { AuthMiddleware } from '../delivery/middlewares';
import { PageController } from '../delivery/client/controllers';
import { FlagController } from '../delivery/client/controllers/flag.controller';
import { observabilityContainer } from '../../core/observability';
import { environmentContainer } from '../../core/environment';

export async function createContainer(): Promise<Container> {
  const container = new Container();

  container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
  container.bind<ConfigService>(TYPES.Config).to(ConfigService).inSingletonScope();

  container.load(storageModule);
  container.load(persistenceModule);
  container.load(flagManagerContainer);
  container.load(accessContainer);
  container.load(observabilityContainer);
  container.load(environmentContainer);

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
  container
    .bind<EvaluateHttpController>(TYPES.EvaluateHttpController)
    .to(EvaluateHttpController)
    .inSingletonScope();

  container
    .bind<AuthHttpController>(TYPES.AuthHttpController)
    .to(AuthHttpController)
    .inSingletonScope();
  container
    .bind<UserHttpController>(TYPES.UserHttpController)
    .to(UserHttpController)
    .inSingletonScope();

  container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();

  container.bind<PageController>(TYPES.PageController).to(PageController).inSingletonScope();
  container.bind<FlagController>(TYPES.FlagController).to(FlagController).inSingletonScope();

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
