import { IMetadata, IEntity } from '../../../shared/kernel';

export const UserRole = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type TJwtPayload = {
  userId: string;
  email?: string;
  role?: TUserRole;
  groups?: string[];
  exp: number;
};

export type TUserRole = (typeof UserRole)[keyof typeof UserRole];

export interface IUserProps {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  role: TUserRole;
  isActive: boolean;
  groupIds: string[];
  metadata: IMetadata;
}

export class User implements IEntity<string> {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  role: TUserRole;
  isActive: boolean;
  groupIds: string[];
  metadata: IMetadata;

  constructor(props: IUserProps) {
    this.id = props.id;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.email = props.email;
    this.role = props.role;
    this.isActive = props.isActive;
    this.groupIds = props.groupIds;
    this.metadata = props.metadata;
  }
}

export interface AuthDTO {
  email: string;
  password: string;
}

export interface TokenDTO extends RefreshTokenDTO {
  accessToken: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  email: string;
  role: TUserRole;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  email?: string;
  role?: TUserRole;
  isActive?: boolean;
  groupIds?: string[];
}

export interface LoginResponseDTO extends TokenDTO {
  id: string;
  role: string;
}
