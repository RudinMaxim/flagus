import { UserRole } from '../constants';

export type TJwtPayload = {
  userId: string;
  email?: string;
  role?: TUserRole;
  exp: number;
};

export type TUserRole = (typeof UserRole)[keyof typeof UserRole];
