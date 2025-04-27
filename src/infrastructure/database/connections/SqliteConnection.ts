import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { IDatabase } from '../interfaces';

export interface SqliteOptions {
  path: string;
  enableForeignKeys: boolean;
  verbose: boolean;
  timeout: number;
  maxRetries: number;
}

export class SqliteDatabase implements IDatabase {
  private db: sqlite3.Database | null = null;
  private isTransactionActive = false;
  private readonly options: SqliteOptions;

  constructor(options: Partial<SqliteOptions> = {}) {
    this.options = {
      enableForeignKeys: options.enableForeignKeys ?? true,
      verbose: options.verbose ?? false,
      timeout: options.timeout ?? 5000,
      maxRetries: options.maxRetries ?? 3,
      path: options.path ?? 'app.db',
    };

    if (this.options.verbose) {
      sqlite3.verbose();
    }
  }

  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    this.db = new sqlite3.Database(this.options.path, err => {
      if (err) {
        throw new Error(`Failed to open SQLite database: ${err.message}`);
      }
    });

    this.db.configure('busyTimeout', this.options.timeout);

    try {
      if (this.options.enableForeignKeys) {
        await this.exec('PRAGMA foreign_keys = ON');
      }

      await this.exec('PRAGMA journal_mode = WAL'); // Write-Ahead Logging
      await this.exec('PRAGMA synchronous = NORMAL'); // Balance safety and performance

      console.log(`Successfully connected to SQLite database at ${this.options.path}`);
    } catch (error) {
      throw new Error(
        `Failed to initialize SQLite database: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      const close = promisify(this.db.close.bind(this.db));
      try {
        await close();
        this.db = null;
        console.log('SQLite database connection closed');
      } catch (error) {
        throw new Error(
          `Error closing SQLite connection: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  async run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    this.ensureConnection();

    return new Promise((resolve, reject) => {
      this.db!.run(query, params, function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(new Error(`Error executing query: ${err.message}`));
          return;
        }

        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      });
    });
  }

  async get<T = any>(query: string, params: any[] = []): Promise<T | undefined> {
    this.ensureConnection();

    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err: Error | null, row: any) => {
        if (err) {
          reject(new Error(`Error executing query: ${err.message}`));
          return;
        }

        resolve(row as T | undefined);
      });
    });
  }

  async all<T = any>(query: string, params: any[] = []): Promise<T[]> {
    this.ensureConnection();

    return new Promise((resolve, reject) => {
      this.db!.all(query, params, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(new Error(`Error executing query: ${err.message}`));
          return;
        }

        resolve(rows as T[]);
      });
    });
  }

  async exec(sql: string): Promise<void> {
    this.ensureConnection();

    return new Promise((resolve, reject) => {
      this.db!.exec(sql, (err: Error | null) => {
        if (err) {
          reject(new Error(`Error executing query: ${err.message}`));
          return;
        }

        resolve();
      });
    });
  }

  async transaction<T>(callback: () => Promise<T>, retryCount = 0): Promise<T> {
    this.ensureConnection();

    if (this.isTransactionActive) {
      return await callback();
    }

    try {
      this.isTransactionActive = true;
      await this.exec('BEGIN TRANSACTION');

      const result = await callback();

      await this.exec('COMMIT');
      return result;
    } catch (error) {
      await this.exec('ROLLBACK');

      if (
        retryCount < this.options.maxRetries &&
        error instanceof Error &&
        error.message.includes('SQLITE_BUSY')
      ) {
        console.warn(
          `Database busy, retrying transaction (${retryCount + 1}/${this.options.maxRetries})`
        );
        return this.transaction(callback, retryCount + 1);
      }

      throw error;
    } finally {
      this.isTransactionActive = false;
    }
  }

  private ensureConnection(): void {
    if (!this.db) {
      throw new Error('Database connection not initialized. Call initialize() first.');
    }
  }
}
