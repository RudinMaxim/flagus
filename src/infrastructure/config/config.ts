import { ContainerModule, injectable } from 'inversify';
import { TYPES } from './types';

export interface ServerConfig {
  port: number;
  host: string;
  hostname: string;
  swagger: {
    enabled: boolean;
    path: string;
  };
}

export interface CorsConfig {
  enabled: boolean;
  origins: string[] | '*';
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpires: number; // in seconds
  refreshExpires: number; // in seconds
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  sqlite: {
    database: string;
  };
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

export interface AppConfig {
  nodeEnv: string;
  apiKey: string;
  logLevel: string;
  apiVersion: string;
  maxNestingLevel: number;
  server: ServerConfig;
  cors: CorsConfig;
  jwt: JwtConfig;
  database: DatabaseConfig;
}

@injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      apiKey: process.env.API_KEY || 'change-me-in-production',
      logLevel: process.env.LOG_LEVEL || 'info',
      apiVersion: process.env.API_VERSION || '1.0.0',
      maxNestingLevel: parseInt(process.env.MAX_NESTING_LEVEL || '5', 10),
      server: this.getServerConfig(),
      cors: this.getCorsConfig(),
      jwt: this.getJwtConfig(),
      database: this.getDatabaseConfig(),
    };
  }

  private getServerConfig(): ServerConfig {
    return {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      hostname: process.env.HOSTNAME || 'localhost',
      swagger: {
        enabled: process.env.SWAGGER_ENABLED !== 'false',
        path: process.env.SWAGGER_PATH || '/api/documentation',
      },
    };
  }

  private getCorsConfig(): CorsConfig {
    return {
      enabled: process.env.CORS_ENABLED !== 'false',
      origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    };
  }

  private getJwtConfig(): JwtConfig {
    return {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'JWT_ACCESS_SECRET',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'JWT_REFRESH_SECRET',
      accessExpires: parseInt(process.env.JWT_ACCESS_EXPIRES || '900', 10), // 15 minutes
      refreshExpires: parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10), // 7 days
    };
  }

  private getDatabaseConfig(): DatabaseConfig {
    return {
      type: process.env.SQLITE_DATABASE ? 'sqlite' : 'postgres',
      sqlite: {
        database: process.env.SQLITE_DATABASE!,
      },
      postgres: {
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: (process.env.POSTGRES_PORT as unknown as number) ?? 5432,
        user: process.env.POSTGRES_USER ?? 'postgress',
        password: process.env.POSTGRES_PASSWORD!,
        database: process.env.POSTGRES_DATABASE!,
      },
    };
  }

  public get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this.config[key];
  }

  public getAll(): AppConfig {
    return this.config;
  }
}
