export interface IRepository<T, ID> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(entity: T): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export interface IEntity<ID = string> {
  id: ID;
}

export interface IService<T, ID, CreateDTO, UpdateDTO> {
  getAll(): Promise<T[]>;
  getById(id: ID): Promise<T | null>;
  create(dto: CreateDTO): Promise<T>;
  update(id: ID, dto: UpdateDTO): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}
