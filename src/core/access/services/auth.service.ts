import { injectable, inject } from 'inversify';
import { IUserRepository } from '../../../infrastructure/persistence';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { TYPES } from '../../../infrastructure/config/types';
import { UserRole } from '../constants';
import { AuthDTO, TokenDTO, CreateUserDTO, RefreshTokenDTO, LoginResponseDTO } from '../interfaces';
import { User } from '../model';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.TokenService) private readonly tokenService: TokenService
  ) {}

  public async login(credentials: AuthDTO): Promise<LoginResponseDTO> {
    const user = await this.userRepository.findByEmail(credentials.email);

    if (!user) {
      throw new Error('Пользователь с таким email не найден');
    }

    if (!user.isActive) {
      throw new Error('Пользователь деактивирован');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Неверный пароль');
    }

    return {
      id: user.id,
      role: user.role,
      ...this.tokenService.generateTokens(user),
    };
  }

  public async refreshToken(request: RefreshTokenDTO): Promise<TokenDTO> {
    const decoded = this.tokenService.verifyRefreshToken(request.refreshToken);
    const user = await this.userRepository.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error('Недействительный токен');
    }

    return this.tokenService.generateTokens(user);
  }

  public async isFirstUser(): Promise<boolean> {
    return this.userRepository.checkIsFirstUser();
  }

  public async createFirstAdmin(userData: CreateUserDTO): Promise<User> {
    const isFirstUser = await this.isFirstUser();

    if (!isFirstUser) {
      throw new Error('Администратор уже создан');
    }

    return await this.userRepository.create({
      username: userData.username,
      email: userData.email,
      passwordHash: await bcrypt.hash(userData.password, 10),
      role: UserRole.ADMIN,
      isActive: true,
      metadata: {
        createdAt: new Date(),
        createdBy: 'SYSTEM',
      },
    });
  }
}
