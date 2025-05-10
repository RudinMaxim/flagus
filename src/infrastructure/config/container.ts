import { Container } from 'inversify';
import { ILogger, LoggerService } from '../../shared/logger';
import { persistenceModule } from '../persistence';
import { ConfigService } from './config';
import { TYPES } from './types';
import { flagManagerContainer } from '../../core/flag-manager';
import { storageModule, OnInit, OnDestroy } from '../../shared/storage';
import { httpControllerModule } from '../delivery/api/v1/controllers';
import { accessContainer } from '../../core/access';
import { AuthMiddleware } from '../delivery/middlewares';
import { observabilityContainer } from '../../core/observability';
import { clientControllerModule } from '../delivery/client/controllers/client.controller.module';

export async function createContainer(): Promise<Container> {
  const container = new Container();

  container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
  container.bind<ConfigService>(TYPES.Config).to(ConfigService).inSingletonScope();

  container.load(storageModule);
  container.load(persistenceModule);
  container.load(flagManagerContainer);
  container.load(accessContainer);
  container.load(observabilityContainer);
  container.load(httpControllerModule);
  container.load(clientControllerModule);

  container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();

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
