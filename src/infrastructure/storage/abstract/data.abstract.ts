export interface OnInit {
  onInit(): Promise<void>;
}

export interface OnDestroy {
  onDestroy(): Promise<void>;
}

export abstract class DataGateway<T = any> {
  /**
   * Получает клиент базы данных
   * @returns {T} Клиент
   */
  public abstract get client(): T;

  /**
   * Выполняет SQL запрос и возвращает результат
   * @param {string} sql - SQL запрос
   * @param {any[]} params - Параметры запроса
   * @returns {Promise<T, P[]>} Массив результатов запроса
   */
  public abstract query<T, P = any>(sql: string, params?: P[]): Promise<T[]>;

  /**
   * Выполняет SQL запрос без возврата результатов
   * @param {string} sql - SQL запрос
   * @param {any[]} params - Параметры запроса
   * @returns {Promise<T, P>} Результат выполнения запроса
   */
  public abstract execute<T, P = any>(sql: string, params?: P[]): Promise<T>;

  /**
   * Выполняет SQL запрос и возвращает один результат
   * @param {string} sql - SQL запрос
   * @param {any[]} params - Параметры запроса
   * @returns {Promise<T | null>} Результат запроса или null, если ничего не найдено
   */
  public abstract getOne<T, P = any>(sql: string, params?: P[]): Promise<T | null>;

  /**
   * Начинает транзакцию
   * @returns {Promise<void>}
   */
  public abstract beginTransaction(): Promise<void>;

  /**
   * Подтверждает транзакцию
   * @returns {Promise<void>}
   */
  public abstract commit(): Promise<void>;

  /**
   * Откатывает транзакцию
   * @returns {Promise<void>}
   */
  public abstract rollback(): Promise<void>;

  /**
   * Инициализация соединения
   */
  protected abstract connect(): Promise<void>;

  /**
   * Закрытие соединения
   */
  protected abstract disconnect(): Promise<void>;

  /**
   * Инициализация
   */
  protected abstract initialize(): void;
}
