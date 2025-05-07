import { IMetadata, IEntity } from '../../../shared/kernel';
import { TUserRole } from '../interfaces';

export interface IUserProps {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  role: TUserRole;
  isActive: boolean;
  metadata: IMetadata;
}

export class User implements IEntity<string> {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  role: TUserRole;
  isActive: boolean;
  metadata: IMetadata;

  constructor(props: IUserProps) {
    this.id = props.id;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.email = props.email;
    this.role = props.role;
    this.isActive = props.isActive;
    this.metadata = props.metadata;
  }
}
