import { injectable, inject } from 'inversify';
import { IUserRepository } from '../../../infrastructure/persistence';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { TYPES } from '../../../infrastructure/config/types';
import { AuthDTO, CreateUserDTO, LoginResponseDTO, User, UserRole } from '../model';
import { ServiceError } from '../../../shared/kernel';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.TokenService) private readonly tokenService: TokenService
  ) {}

  public async login(credentials: AuthDTO): Promise<LoginResponseDTO> {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) throw new ServiceError('Auth', 'Пользователь с таким email не найден');
    if (!user.isActive) throw new ServiceError('Auth', 'Пользователь деактивирован');

    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValid) throw new ServiceError('Auth', 'Неверный пароль');

    return {
      id: user.id,
      role: user.role,
      ...this.tokenService.generateTokens(user),
    };
  }

  public async isFirstUser(): Promise<boolean> {
    return this.userRepository.checkIsFirstUser();
  }

  public async createFirstAdmin(userData: CreateUserDTO): Promise<User> {
    if (!(await this.isFirstUser())) throw new ServiceError('Auth', 'Администратор уже создан');

    return this.userRepository.create({
      username: userData.username,
      email: userData.email,
      passwordHash: await bcrypt.hash(userData.password, 10),
      role: UserRole.ADMIN,
      isActive: true,
      groupIds: [],
      metadata: { createdAt: new Date(), createdBy: 'SYSTEM' },
    });
  }
}
