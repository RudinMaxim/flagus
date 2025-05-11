import { ContainerModule } from 'inversify';
import { DataGatewayFactory } from './adapters';
import { TYPES } from '../../infrastructure/config/types';
import { OnInit, OnDestroy } from '../../infrastructure/config/container';
import { MigrationService } from './service/migration.service';

export enum DatabaseType {
  POSTGRES = 'postgres',
  SQLITE = 'sqlite',
}

export const storageModule = new ContainerModule(({ bind }) => {
  bind<DataGatewayFactory>(TYPES.DataGatewayFactory).to(DataGatewayFactory);
  bind<MigrationService>(TYPES.MigrationService).to(MigrationService);

  bind(TYPES.DataGateway)
    .toDynamicValue(ctx => {
      const factory = ctx.get<DataGatewayFactory>(TYPES.DataGatewayFactory);

      return factory.create();
    })
    .inSingletonScope();

  bind<OnInit>(TYPES.OnInit).toService(TYPES.DataGateway);
  bind<OnDestroy>(TYPES.OnDestroy).toService(TYPES.DataGateway);
});
