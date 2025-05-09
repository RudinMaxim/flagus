import { ContainerModule } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import { OnInit, OnDestroy } from './abstract';
import { DataGatewayFactory } from './adapters';

export const storageModule = new ContainerModule(({ bind }) => {
  bind<DataGatewayFactory>(TYPES.DataGatewayFactory).to(DataGatewayFactory);

  bind(TYPES.DataGateway)
    .toDynamicValue(ctx => {
      const factory = ctx.get<DataGatewayFactory>(TYPES.DataGatewayFactory);

      return factory.create();
    })
    .inSingletonScope();

  bind<OnInit>(TYPES.OnInit).toService(TYPES.DataGateway);
  bind<OnDestroy>(TYPES.OnDestroy).toService(TYPES.DataGateway);
});
