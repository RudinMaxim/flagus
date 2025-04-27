// IDatabase.ts
export interface IDatabase {
  /**
   * Инициализирует соединение с базой данных
   */
  initialize(): Promise<void>;

  /**
   * Закрывает соединение с базой данных
   */
  close(): Promise<void>;

  /**
   * Выполняет SQL-запрос, который не возвращает данные (INSERT, UPDATE, DELETE, CREATE и т.д.)
   * @param query SQL-запрос
   * @param params Параметры запроса
   * @returns Объект с результатами операции (lastID, changes)
   */
  run(query: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;

  /**
   * Выполняет SQL-запрос и возвращает первую строку результата
   * @param query SQL-запрос
   * @param params Параметры запроса
   * @returns Первая строка результата или undefined, если результат пуст
   */
  get<T = any>(query: string, params?: any[]): Promise<T | undefined>;

  /**
   * Выполняет SQL-запрос и возвращает все строки результата
   * @param query SQL-запрос
   * @param params Параметры запроса
   * @returns Массив строк результата
   */
  all<T = any>(query: string, params?: any[]): Promise<T[]>;

  /**
   * Выполняет SQL-запрос напрямую (без параметров)
   * @param sql SQL-запрос
   */
  exec(sql: string): Promise<void>;

  /**
   * Выполняет SQL-запрос в транзакции
   * @param callback Функция, выполняемая в транзакции
   * @returns Результат выполнения callback-функции
   */
  transaction<T>(callback: () => Promise<T>, retryCount?: number): Promise<T>;
}
