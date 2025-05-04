import { Container } from 'inversify';
import { LoggerService } from '@shared/logger';
import { ConfigService, TYPES } from '@infrastructure/config';
import { storageModule } from '@infrastructure/storage';

export function createContainer(): Container {
  const container = new Container();

  container.bind<LoggerService>(TYPES.Logger).to(LoggerService).inSingletonScope();
  container.bind<ConfigService>(TYPES.Config).to(ConfigService).inSingletonScope();

  container.load(storageModule);

  return container;
}
