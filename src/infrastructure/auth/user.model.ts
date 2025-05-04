import { IEntity } from '../../shared/kernel/base.interfaces';
import { UserRole } from '../../shared/kernel/base.types';

export class User implements IEntity<string> {
  id: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt?: Date;

  constructor(data: {
    id: string;
    username: string;
    password: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.email = data.email;
    this.role = data.role;
    this.isActive = data.isActive;
    this.lastLogin = data.lastLogin;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  protected toJSON(): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

export interface CreateUserDTO {
  username: string;
  password: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserDTO {
  username?: string;
  password?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AuthDTO {
  username: string;
  password: string;
}

export interface TokenDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}
