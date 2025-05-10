import { IEntity, IMetadata } from '../../../shared/kernel';

export enum SDKKeyType {
  CLIENT = 'client',
  SERVER = 'server',
}

export interface ISDKKey {
  key: string;
  type: SDKKeyType;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface IEnvironmentProps {
  id: string;
  name: string;
  description?: string;
  sdkKeys: ISDKKey[];
  metadata: IMetadata;
}

export class Environment implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  sdkKeys: ISDKKey[];
  metadata: IMetadata;

  constructor(props: IEnvironmentProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.sdkKeys = props.sdkKeys;
    this.metadata = props.metadata;
  }

  addSDKKey(key: string, type: SDKKeyType, createdBy: string): void {
    this.sdkKeys.push({
      key,
      type,
      createdAt: new Date(),
      createdBy,
      isActive: true,
    });
  }

  deactivateSDKKey(key: string): void {
    const sdkKey = this.sdkKeys.find(k => k.key === key);
    if (sdkKey) {
      sdkKey.isActive = false;
    }
  }

  isValidSDKKey(key: string, type: SDKKeyType): boolean {
    const sdkKey = this.sdkKeys.find(k => k.key === key);
    return !!sdkKey && sdkKey.isActive && sdkKey.type === type;
  }
}
