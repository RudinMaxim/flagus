import { TUserRole } from './types';

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
}
