import { injectable, inject } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '../../../infrastructure/config/config';
import { TYPES } from '../../../infrastructure/config/types';
import { ILogger } from '../../logger';
import { DataGateway } from '../abstract';
import { DatabaseType } from '../storage.module';

@injectable()
export class MigrationService {
  constructor(
    @inject(TYPES.DataGateway) private readonly dataGateway: DataGateway,
    @inject(TYPES.Config) private readonly config: ConfigService,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  /**
   * Runs all pending migrations
   * @returns {Promise<void>}
   */
  public async runMigrations(): Promise<void> {
    await this.ensureMigrationsTableExists();
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationDir = this.getMigrationDir();
    const availableMigrations = this.getAvailableMigrations(migrationDir);
    const migrationsToRun = availableMigrations.filter(m => !appliedMigrations.includes(m));

    for (const migration of migrationsToRun) {
      await this.runMigration(migration, migrationDir);
    }
  }

  /**
   * Ensures the migrations table exists
   * @returns {Promise<void>}
   */
  private async ensureMigrationsTableExists(): Promise<void> {
    const sql = this.getCreateMigrationsTableSql();
    await this.dataGateway.runScript(sql);
  }

  /**
   * Generates SQL to create the migrations table based on database type
   * @returns {string} SQL statement
   */
  private getCreateMigrationsTableSql(): string {
    switch (this.dataGateway.type) {
      case DatabaseType.POSTGRES:
        return `
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
      case DatabaseType.SQLITE:
        return `
          CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `;
      default:
        throw new Error(`Unsupported database type: ${this.dataGateway.type}`);
    }
  }

  /**
   * Retrieves the list of applied migrations
   * @returns {Promise<string[]>} Array of migration names
   */
  private async getAppliedMigrations(): Promise<string[]> {
    const sql = 'SELECT name FROM migrations ORDER BY id ASC';
    const rows = await this.dataGateway.query<{ name: string }>(sql);
    return rows.map(row => row.name);
  }

  /**
   * Gets the migration directory path from config
   * @returns {string} Directory path
   */
  private getMigrationDir(): string {
    const migrationsConfig = this.config.get('migrations');
    const dir = migrationsConfig[this.dataGateway.type];
    if (!dir) {
      throw new Error(`Migration directory not configured for ${this.dataGateway.type}`);
    }
    return dir;
  }

  /**
   * Retrieves available migration files from the directory
   * @param {string} dir - Migration directory
   * @returns {string[]} Sorted array of migration filenames
   */
  private getAvailableMigrations(dir: string): string[] {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      return [];
    }
    const files = fs.readdirSync(fullPath).filter(file => file.endsWith('.sql'));
    files.sort(); // Ensures migrations run in order
    return files;
  }

  /**
   * Runs a single migration
   * @param {string} migration - Migration filename
   * @param {string} dir - Migration directory
   * @returns {Promise<void>}
   */
  private async runMigration(migration: string, dir: string): Promise<void> {
    try {
      const sql = this.readMigrationScript(dir, migration);
      await this.dataGateway.runScript(sql);
      await this.recordMigration(migration);
      this.logger.info(`Migration ${migration} applied successfully`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error applying migration ${migration}: ${message}`);
      throw error;
    }
  }

  /**
   * Reads the SQL content of a migration file
   * @param {string} dir - Migration directory
   * @param {string} migration - Migration filename
   * @returns {string} SQL content
   */
  private readMigrationScript(dir: string, migration: string): string {
    const filePath = path.join(process.cwd(), dir, migration);
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Records a migration as applied
   * @param {string} migration - Migration filename
   * @returns {Promise<void>}
   */
  private async recordMigration(migration: string): Promise<void> {
    const sql =
      this.dataGateway.type === DatabaseType.POSTGRES
        ? 'INSERT INTO migrations (name) VALUES ($1)'
        : 'INSERT INTO migrations (name) VALUES (?)';
    await this.dataGateway.execute(sql, [migration]);
  }
}
