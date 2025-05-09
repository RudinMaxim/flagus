import { injectable, inject } from 'inversify';
import { ConfigService } from '../../../infrastructure/config/config';
import { TYPES } from '../../../infrastructure/config/types';
import { DataGateway } from '../abstract';
import { PostgresServiceImpl } from './postgres.service';
import { SQLiteServiceImpl } from './sqlite.service';
import { ILogger } from '../../logger';

@injectable()
export class DataGatewayFactory {
  constructor(
    @inject(TYPES.Config) private readonly config: ConfigService,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  create(): DataGateway {
    const dbType = this.config.get('database').type;

    switch (dbType) {
      case 'postgres':
        return new PostgresServiceImpl(this.logger, this.config);
      case 'sqlite':
        return new SQLiteServiceImpl(this.logger, this.config);
      default:
        throw new Error('Unsupported database type');
    }
  }
}
