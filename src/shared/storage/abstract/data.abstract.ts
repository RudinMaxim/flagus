import { DatabaseType } from '../storage.module';

export abstract class DataGateway<T = any> {
  /**
   * Gets the database type
   * @returns {DatabaseType} The type of database
   */
  public abstract get type(): DatabaseType;

  /**
   * Gets the database client
   * @returns {T} Client
   */
  public abstract get client(): T;

  /**
   * Executes a SQL query and returns results
   * @param {string} sql - SQL query
   * @param {any[]} params - Query parameters
   * @returns {Promise<T[]>} Array of query results
   */
  public abstract query<T, P = any>(sql: string, params?: P[]): Promise<T[]>;

  /**
   * Executes a SQL query without returning results
   * @param {string} sql - SQL query
   * @param {any[]} params - Query parameters
   * @returns {Promise<T>} Execution result
   */
  public abstract execute<T, P = any>(sql: string, params?: P[]): Promise<T>;

  /**
   * Executes a SQL query and returns a single result
   * @param {string} sql - SQL query
   * @param {any[]} params - Query parameters
   * @returns {Promise<T | null>} Single result or null if not found
   */
  public abstract getOne<T, P = any>(sql: string, params?: P[]): Promise<T | null>;

  /**
   * Executes a multi-statement SQL script
   * @param {string} sql - SQL script
   * @returns {Promise<void>}
   */
  public abstract runScript(sql: string): Promise<void>;

  /**
   * Begins a transaction
   * @returns {Promise<void>}
   */
  public abstract beginTransaction(): Promise<void>;

  /**
   * Commits a transaction
   * @returns {Promise<void>}
   */
  public abstract commit(): Promise<void>;

  /**
   * Rolls back a transaction
   * @returns {Promise<void>}
   */
  public abstract rollback(): Promise<void>;

  /**
   * Establishes database connection
   */
  protected abstract connect(): Promise<void>;

  /**
   * Closes database connection
   */
  protected abstract disconnect(): Promise<void>;

  /**
   * Initializes the gateway
   */
  protected abstract initialize(): void;
}
