import { ContainerModule, injectable } from 'inversify';
import { TYPES } from '../../infrastructure/config/types';
import {
  CategoryService,
  EnvironmentService,
  FeatureFlagService,
  FlagEvaluationService,
  FlagTTLService,
} from './service';
import { randomBytes } from 'crypto';
import { SDKKeyType } from './model';

interface ISDKKeyStrategy {
  generate(): string;
}

@injectable()
class ClientSDKKeyStrategy implements ISDKKeyStrategy {
  generate(): string {
    return `client_${randomBytes(16).toString('hex')}`;
  }
}

@injectable()
class ServerSDKKeyStrategy implements ISDKKeyStrategy {
  generate(): string {
    return `server_${randomBytes(16).toString('hex')}`;
  }
}

@injectable()
export class SDKKeyFactory {
  private strategies: Map<SDKKeyType, ISDKKeyStrategy>;

  constructor(
    private clientStrategy: ClientSDKKeyStrategy,
    private serverStrategy: ServerSDKKeyStrategy
  ) {
    this.strategies = new Map([
      [SDKKeyType.CLIENT, clientStrategy],
      [SDKKeyType.SERVER, serverStrategy],
    ]);
  }

  generateKey(type: SDKKeyType): string {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unsupported SDK key type: ${type}`);
    }
    return strategy.generate();
  }
}

export const flagManagerContainer = new ContainerModule(({ bind }) => {
  bind<CategoryService>(TYPES.CategoryService).to(CategoryService).inSingletonScope();
  bind<FeatureFlagService>(TYPES.FeatureFlagService).to(FeatureFlagService).inSingletonScope();
  bind<FlagEvaluationService>(TYPES.FlagEvaluationService)
    .to(FlagEvaluationService)
    .inSingletonScope();
  bind<FlagTTLService>(TYPES.FlagTTLService).to(FlagTTLService).inSingletonScope();
  bind<EnvironmentService>(TYPES.EnvironmentService).to(EnvironmentService).inSingletonScope();
});
