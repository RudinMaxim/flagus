import { inject, injectable } from 'inversify';
import jwa from 'jwa';
import { TYPES } from '../../../infrastructure/config/types';
import { ConfigService } from '../../../infrastructure/config/config';
import { TJwtPayload, TokenDTO } from '../interfaces';
import { User } from '../model';

@injectable()
export class TokenService {
  private readonly signer;

  constructor(@inject(TYPES.Config) private readonly config: ConfigService) {
    this.signer = jwa('HS256');
  }

  public generateTokens(user: User): TokenDTO {
    const header = this.encode({ alg: 'HS256', typ: 'JWT' });

    const accessPayload: TJwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: this.expiryTimestamp(Number(this.config.JWT_ACCESS_EXPIRES)),
    };

    const refreshPayload: TJwtPayload = {
      userId: user.id,
      exp: this.expiryTimestamp(Number(this.config.JWT_REFRESH_EXPIRES)),
    };

    const accessToken = this.buildToken(header, accessPayload, this.config.JWT_ACCESS_SECRET);
    const refreshToken = this.buildToken(header, refreshPayload, this.config.JWT_REFRESH_SECRET);

    return { accessToken, refreshToken };
  }

  public verifyAccessToken(token: string) {
    return this.verifyToken<TJwtPayload>(token, this.config.JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
  }

  public verifyRefreshToken(token: string) {
    return this.verifyToken<TJwtPayload>(token, this.config.JWT_REFRESH_SECRET) as {
      userId: string;
    };
  }

  private verifyToken<T extends TJwtPayload>(token: string, secret: string): Omit<T, 'exp'> {
    const [headerB64, payloadB64, sig] = token.split('.');
    const signed = [headerB64, payloadB64].join('.');

    if (!this.signer.verify(signed, sig, secret)) {
      throw new Error('Недействительный токен');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as T;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Истекший токен');
    }

    const { exp, ...rest } = payload;
    return rest;
  }

  private buildToken(headerB64: string, payload: TJwtPayload, secret: string) {
    const payloadB64 = this.encode(payload);
    const sig = this.signer.sign([headerB64, payloadB64].join('.'), secret);
    return [headerB64, payloadB64, sig].join('.');
  }

  private encode(obj: object): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }

  private expiryTimestamp(seconds: number): number {
    return Math.floor(Date.now() / 1000) + seconds;
  }
}
