import { injectable, inject } from 'inversify';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { ConfigService } from '../../../infrastructure/config/config';
import { TYPES } from '../../../infrastructure/config/types';
import { ILogger } from '../../logger';
import { DataGateway, OnInit, OnDestroy } from '../abstract';

export interface IPostgres {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

@injectable()
export class PostgresServiceImpl extends DataGateway<PoolClient> implements OnInit, OnDestroy {
  private pool: Pool;
  private db!: PoolClient;

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.Config) private readonly config: ConfigService
  ) {
    super();
    const { postgres } = this.config.get('database');

    const pgConfig: PoolConfig = {
      host: postgres.host,
      port: postgres.port,
      user: postgres.user,
      password: postgres.password,
      database: postgres.database,
    };
    this.pool = new Pool(pgConfig);
  }

  get client() {
    return this.db;
  }

  public async onInit(): Promise<void> {
    await this.connect();
  }

  public async onDestroy(): Promise<void> {
    await this.disconnect();
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }

  public async execute<T, P = any>(sql: string, params: P[] = []): Promise<T> {
    const result = await this.client.query(sql, params);
    return {
      rowCount: result.rowCount,
      rows: result.rows,
    } as unknown as T;
  }

  public async getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const result = await this.client.query(sql, params);
    return (result.rows[0] as T) || null;
  }

  public async beginTransaction(): Promise<void> {
    await this.client.query('BEGIN');
  }

  public async commit(): Promise<void> {
    await this.client.query('COMMIT');
  }

  public async rollback(): Promise<void> {
    await this.client.query('ROLLBACK');
  }

  protected async connect(): Promise<void> {
    try {
      this.db = await this.pool.connect();
      this.logger.info('PostgreSQL connection established');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(`Error during PostgreSQL connection: ${errorMessage}`);
      throw error;
    }
  }

  protected async disconnect(): Promise<void> {
    try {
      await this.client.release();
      await this.pool.end();
      this.logger.info('PostgreSQL connection closed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(`Error during PostgreSQL shutdown: ${errorMessage}`);
      throw error;
    }
  }

  protected async initialize(): Promise<void> {
    // Инициализация схемы или миграции могут быть добавлены здесь
  }
}
