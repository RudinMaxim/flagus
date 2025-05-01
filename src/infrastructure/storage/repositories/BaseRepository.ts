import { IDatabase, IRepository } from '../interfaces';

/**
 * Базовая реализация репозитория для работы с сущностями
 */
export abstract class BaseRepository<T extends { id?: number }, ID = number>
  implements IRepository<T, ID>
{
  /**
   * Имя таблицы в БД
   */
  protected abstract tableName: string;

  /**
   * Список полей для операций выборки
   */
  protected abstract selectFields: string[];

  /**
   * Список полей для вставки и обновления
   */
  protected abstract insertableFields: string[];

  constructor(protected readonly db: IDatabase) {}

  /**
   * Получение объекта по ID
   */
  async findById(id: ID): Promise<T | undefined> {
    const fields = this.selectFields.join(', ');
    const query = `SELECT ${fields} FROM ${this.tableName} WHERE id = ?`;

    return await this.db.get<T>(query, [id]);
  }

  /**
   * Получение всех объектов
   */
  async findAll(): Promise<T[]> {
    const fields = this.selectFields.join(', ');
    const query = `SELECT ${fields} FROM ${this.tableName}`;

    return await this.db.all<T>(query);
  }

  /**
   * Создание нового объекта
   */
  async create(data: T): Promise<T> {
    // Фильтруем поля, которые можно вставлять
    const fieldsToInsert = this.insertableFields.filter(field => field in data);

    if (fieldsToInsert.length === 0) {
      throw new Error('No valid fields to insert');
    }

    const fields = fieldsToInsert.join(', ');
    const placeholders = fieldsToInsert.map(() => '?').join(', ');
    const values = fieldsToInsert.map(field => (data as any)[field]);

    const query = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;

    const result = await this.db.run(query, values);
    const id = result.lastID;

    if (!id) {
      throw new Error('Failed to create record');
    }

    return { ...data, id } as T;
  }

  /**
   * Обновление существующего объекта
   */
  async update(id: ID, data: Partial<T>): Promise<boolean> {
    // Фильтруем поля, которые можно обновлять
    const fieldsToUpdate = this.insertableFields.filter(field => field in data);

    if (fieldsToUpdate.length === 0) {
      return false;
    }

    const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = [...fieldsToUpdate.map(field => (data as any)[field]), id];

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    const result = await this.db.run(query, values);
    return result.changes ? result.changes > 0 : false;
  }

  /**
   * Удаление объекта по ID
   */
  async delete(id: ID): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;

    const result = await this.db.run(query, [id]);
    return result.changes ? result.changes > 0 : false;
  }
}
