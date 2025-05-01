/**
 * Базовый интерфейс репозитория для работы с сущностями
 */
export interface IRepository<T, ID = number> {
  /**
   * Получить объект по ID
   */
  findById(id: ID): Promise<T | undefined>;

  /**
   * Получить все объекты
   */
  findAll(): Promise<T[]>;

  /**
   * Создать новый объект
   */
  create(data: Omit<T, 'id'>): Promise<T>;

  /**
   * Обновить существующий объект
   */
  update(id: ID, data: Partial<T>): Promise<boolean>;

  /**
   * Удалить объект по ID
   */
  delete(id: ID): Promise<boolean>;
}
