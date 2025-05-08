import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../../../../core/access/constants';
import { AuthDTO, CreateUserDTO, RefreshTokenDTO } from '../../../../core/access/interfaces';
import { AuthService } from '../../../../core/access/services';
import { BaseController } from './base.controller';

export class AuthController extends BaseController {
  private authService: AuthService;

  constructor(services: { authService: AuthService }) {
    super(services);
    this.authService = services.authService;
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { email, password } = request.body as AuthDTO;

      const tokens = await this.authService.login({ email, password });

      (request as any).session.user = {
        id: tokens.id,
        email,
        role: tokens.role,
      };
      (request as any).session.accessToken = tokens.accessToken;
      (request as any).session.refreshToken = tokens.refreshToken;

      return reply.redirect('/');
    } catch (error) {
      this.setFlashMessage(request, 'danger', (error as Error).message || 'Authentication failed');
      return reply.redirect('/login');
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      (request as any).session.destroy();
      return reply.redirect('/login');
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async checkFirstUser(_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const isFirstUser = await this.authService.isFirstUser();
      return reply.send({ needsSetup: isFirstUser });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async createFirstAdmin(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { username, email, password, confirmPassword } = request.body as CreateUserDTO & {
        confirmPassword: string;
      };

      if (password !== confirmPassword) {
        this.setFlashMessage(request, 'danger', 'Passwords do not match');
        return reply.redirect('/setup');
      }

      const isFirstUser = await this.authService.isFirstUser();
      if (!isFirstUser) {
        this.setFlashMessage(request, 'danger', 'Администратор уже создан');
        return reply.redirect('/login');
      }

      try {
        await this.authService.createFirstAdmin({
          username,
          email,
          password,
          role: UserRole.ADMIN,
        });

        this.setFlashMessage(
          request,
          'success',
          'Admin account created successfully. Please login.'
        );
        return reply.redirect('/login');
      } catch (err) {
        this.setFlashMessage(
          request,
          'danger',
          (err as Error).message || 'Failed to create admin account'
        );
        return reply.redirect('/setup');
      }
    } catch (error) {
      this.setFlashMessage(request, 'danger', 'Failed to create admin account');
      return reply.redirect('/setup');
    }
  }

  async apiLogin(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { email, password } = request.body as AuthDTO;

      const tokens = await this.authService.login({ email, password });

      return reply.send({
        success: true,
        ...tokens,
      });
    } catch (error) {
      return reply.status(401).send({
        success: false,
        message: (error as Error).message || 'Invalid credentials',
      });
    }
  }

  async apiRefreshToken(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { refreshToken } = request.body as RefreshTokenDTO;

      const tokens = await this.authService.refreshToken({ refreshToken });

      return reply.send({
        success: true,
        ...tokens,
      });
    } catch (error) {
      return reply.status(401).send({
        success: false,
        message: (error as Error).message || 'Invalid refresh token',
      });
    }
  }

  async apiCheckFirstUser(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const isFirstUser = await this.authService.isFirstUser();
      return reply.send({ needsSetup: isFirstUser });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async apiCreateFirstAdmin(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { username, email, password, confirmPassword } = request.body as CreateUserDTO & {
        confirmPassword: string;
      };

      // Check if passwords match
      if (password !== confirmPassword) {
        return reply.status(400).send({
          success: false,
          message: 'Passwords do not match',
        });
      }

      // Check if setup is needed
      const isFirstUser = await this.authService.isFirstUser();
      if (!isFirstUser) {
        return reply.status(400).send({
          success: false,
          message: 'Администратор уже создан',
        });
      }

      try {
        // Create admin user
        const user = await this.authService.createFirstAdmin({
          username,
          email,
          password,
          role: UserRole.ADMIN,
        });

        return reply.status(201).send({
          success: true,
          message: 'Admin account created successfully',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      } catch (err) {
        return reply.status(400).send({
          success: false,
          message: (err as Error).message || 'Failed to create admin account',
        });
      }
    } catch (error) {
      return this.handleError(reply, error);
    }
  }
}
