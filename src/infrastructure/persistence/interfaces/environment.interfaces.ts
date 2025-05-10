import { Environment, SDKKeyType } from '../../../core/environment/model';

export interface IEnvironmentRepository {
  addSDKKey(
    environmentId: string,
    key: string,
    type: SDKKeyType,
    createdBy: string
  ): Promise<Environment | null>;
  deactivateSDKKey(environmentId: string, key: string): Promise<Environment | null>;

  create(environment: Environment): Promise<Environment>;
  findById(id: string): Promise<Environment | null>;
  findByName(name: string): Promise<Environment | null>;
  findAll(): Promise<Environment[]>;
  update(id: string, data: Partial<Environment>): Promise<Environment | null>;
  delete(id: string): Promise<boolean>;
}
