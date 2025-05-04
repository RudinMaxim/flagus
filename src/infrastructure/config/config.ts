import { injectable } from 'inversify';

export interface SQLiteConfig {
  database: string;
  options?: {
    memory?: boolean;
    readonly?: boolean;
    fileMustExist?: boolean;
  };
}
@injectable()
export class ConfigService {
  public readonly sqlite: SQLiteConfig = {
    database: process.env.SQLITE_DATABASE || ':memory:',
    options: {
      memory: process.env.SQLITE_MEMORY === 'true',
      readonly: process.env.SQLITE_READONLY === 'true',
      fileMustExist: process.env.SQLITE_FILE_MUST_EXIST === 'true',
    },
  };
}
