import { IRepository } from '../../../shared/kernel';
import { DataGateway } from '../abstract';

export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  protected dataGateway: DataGateway;
  protected tableName: string;
  protected idField: string = 'id';

  constructor(dataGateway: DataGateway, tableName: string, idField: string = 'id') {
    this.dataGateway = dataGateway;
    this.tableName = tableName;
    this.idField = idField;
  }

  async findAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName}`;
    return this.dataGateway.query<T>(sql);
  }

  async findById(id: ID): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.idField} = ?`;
    return this.dataGateway.getOne<T>(sql, [id]);
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    const keys = Object.keys(entity as any);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(entity as any);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.dataGateway.getOne<T>(sql, values);
    if (!result) {
      throw new Error('Failed to create entity: no result returned.');
    }
    return result;
  }

  async update(id: ID, entity: Partial<T>): Promise<T | null> {
    const keys = Object.keys(entity as any);
    const setClauses = keys.map(key => `${key} = ?`).join(', ');
    const values = Object.values(entity as any);

    const sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE ${this.idField} = ?`;
    const result = await this.dataGateway.getOne<T>(`${sql} RETURNING *`, [...values, id]);
    return result;
  }

  async delete(id: ID): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idField} = ?`;
    const result = await this.dataGateway.execute(sql, [id]);
    return (result as any).changes > 0;
  }
}
