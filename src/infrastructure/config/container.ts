import { Container } from 'inversify';
import { LoggerService } from '../../shared/logger';
import { ConfigService, TYPES } from '@infrastructure/config';
import { OnDestroy, OnInit, storageModule } from '@infrastructure/storage';
import { persistenceModule } from '@infrastructure/persistence';

export function createContainer(): Container {
  const container = new Container();

  container.bind<LoggerService>(TYPES.Logger).to(LoggerService).inSingletonScope();
  container.bind<ConfigService>(TYPES.Config).to(ConfigService).inSingletonScope();

  container.load(storageModule);
  container.load(persistenceModule);

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
