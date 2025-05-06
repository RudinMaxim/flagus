import { injectable } from 'inversify';

export interface SQLiteConfig {
  database: string;
  options?: {
    memory?: boolean;
    readonly?: boolean;
    fileMustExist?: boolean;
  };
}
@injectable()
export class ConfigService {
  public readonly nodeEnv = process.env.NODE_ENV || 'development';
  public readonly port = parseInt(process.env.PORT || '3000', 10);
  public readonly host = process.env.HOST || '0.0.0.0';
  public readonly apiKey = process.env.API_KEY || 'change-me-in-production';
  public readonly logLevel = process.env.LOG_LEVEL || 'info';
  public readonly corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : '*';
  public readonly apiVersion = process.env.API_VERSION || '1.0.0';
  public readonly maxNestingLevel = parseInt(process.env.MAX_NESTING_LEVEL || '5', 10);

  public readonly server = {
    port: parseInt(process.env.PORT as string, 10),
    host: process.env.HOST || '0.0.0.0',
    hostname: process.env.HOSTNAME || 'localhost',
    swagger: {
      enabled: true,
      path: process.env.SWAGGER_PATH || '/documentation',
    },
  };

  public readonly cors = {
    enabled: true,
    origins: (process.env.CORS_ORIGINS || '*').split(','),
  };

  public readonly sqlite: SQLiteConfig = {
    database: process.env.SQLITE_DATABASE || ':memory:',
    options: {
      memory: process.env.SQLITE_MEMORY === 'true',
      readonly: process.env.SQLITE_READONLY === 'true',
      fileMustExist: process.env.SQLITE_FILE_MUST_EXIST === 'true',
    },
  };
}
