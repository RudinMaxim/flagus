import { randomBytes } from 'crypto';
import { ContainerModule, injectable } from 'inversify';
import { SDKKeyType } from './model';
import { EnvironmentService } from './service/environment.service';
import { TYPES } from '../../infrastructure/config/types';

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

export const environmentContainer = new ContainerModule(({ bind }) => {
  bind<EnvironmentService>(TYPES.EnvironmentService).to(EnvironmentService).inSingletonScope();
});
