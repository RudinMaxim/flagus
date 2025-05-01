import { ContainerModule } from 'inversify';
import { SQLiteServiceImpl } from './impl';
import { TYPES } from '@infrastructure/di';

export const storageModule = new ContainerModule(({ bind }) => {
  bind(TYPES.DataGateway).to(SQLiteServiceImpl).inSingletonScope();
});
