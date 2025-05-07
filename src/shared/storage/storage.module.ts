import { ContainerModule } from 'inversify';
import { SQLiteServiceImpl } from './impl';
import { OnDestroy, OnInit } from './abstract';
import { TYPES } from '../../infrastructure/config/types';

export const storageModule = new ContainerModule(({ bind }) => {
  bind(TYPES.DataGateway).to(SQLiteServiceImpl).inSingletonScope();
  bind<OnInit>(TYPES.OnInit).toService(TYPES.DataGateway);
  bind<OnDestroy>(TYPES.OnDestroy).toService(TYPES.DataGateway);
});
