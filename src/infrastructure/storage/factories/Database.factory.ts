import { IDatabase } from '../interfaces';
import { SqliteDatabase, SqliteOptions } from '../connections';

/**
 * Поддерживаемые типы баз данных
 */
export enum DatabaseType {
  SQLITE = 'sqlite',
}

/**
 * Общая конфигурация для соединения с базой данных
 */
export interface DatabaseConfig {
  type: DatabaseType;
  sqlite?: Partial<SqliteOptions>;
}

/**
 * Фабрика для создания соединений с базой данных
 */
export class DatabaseFactory {
  /**
   * Создает соединение с базой данных в соответствии с указанной конфигурацией
   * @param config Конфигурация соединения с БД
   * @returns Соединение с базой данных
   */
  public static createConnection(config: DatabaseConfig): IDatabase {
    switch (config.type) {
      case DatabaseType.SQLITE:
        if (!config.sqlite?.path) {
          throw new Error('SQLite database path is required');
        }
        return new SqliteDatabase(config.sqlite);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
}
