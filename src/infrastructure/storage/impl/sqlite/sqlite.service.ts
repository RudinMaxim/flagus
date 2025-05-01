import { injectable, inject } from 'inversify';
import sqlite3 from 'sqlite3';
import { Database, RunResult } from 'sqlite3';
import { DataGateway, OnDestroy, OnInit } from '../../abstract';
import { ConfigService } from '@shared/config';
import { TYPES } from '@infrastructure/di';
import { LoggerService } from '@shared/logger';

@injectable()
export class SQLiteServiceImpl extends DataGateway<Database> implements OnInit, OnDestroy {
  private db: Database;

  constructor(
    @inject(TYPES.LoggerService) private readonly logger: LoggerService,
    @inject(TYPES.ConfigService) private readonly config: ConfigService
  ) {
    super();
  }

  get client() {
    return this.db;
  }

  public async onInit(): Promise<void> {
    await this.connect();
    this.initialize();
  }

  public async onDestroy(): Promise<void> {
    await this.disconnect();
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  public async execute(sql: string, params: any[] = []): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  public async getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          this.logger.error(`Error executing getOne: ${err.message}`);
          reject(err);
        } else {
          resolve((row as T) || null);
        }
      });
    });
  }

  public async beginTransaction(): Promise<void> {
    return this.execute('BEGIN TRANSACTION;').then(() => {});
  }

  public async commit(): Promise<void> {
    return this.execute('COMMIT;').then(() => {});
  }

  public async rollback(): Promise<void> {
    return this.execute('ROLLBACK;').then(() => {});
  }

  protected initialize(): void {
    const { database } = this.config.sqlite;
    this.db = new sqlite3.Database(database);
  }

  protected async connect(): Promise<void> {
    try {
      // Проверка подключения
      await this.query('SELECT 1');
      this.logger.info('SQLite connection established');

      // Настройки для БД
      await this.execute('PRAGMA foreign_keys = ON;');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(`Error during SQLite connection: ${errorMessage}`);
      throw error;
    }
  }

  protected async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          const errorMessage = err instanceof Error ? err.stack : 'Unknown error';
          this.logger.error(`Error during SQLite shutdown: ${errorMessage}`);
          reject(err);
        } else {
          this.logger.info('SQLite connection closed');
          resolve();
        }
      });
    });
  }
}
