import { Container } from 'inversify';
import { LoggerService } from '@shared/logger';
import { ConfigService } from '@shared/config';
import { TYPES } from '@infrastructure/di';
import { storageModule } from '@infrastructure/storage';

export function createContainer(): Container {
  const container = new Container();

  container.bind<LoggerService>(TYPES.LoggerService).to(LoggerService).inSingletonScope();
  container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();

  container.load(storageModule);

  return container;
}
