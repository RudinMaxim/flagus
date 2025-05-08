import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'inversify';
import { AuthDTO, RefreshTokenDTO, CreateUserDTO } from '../../../../../core/access/interfaces';
import { AuthService, TokenService } from '../../../../../core/access/services';
import { TYPES } from '../../../../config/types';

@injectable()
export class AuthHttpController {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: AuthService,
    @inject(TYPES.TokenService) private readonly tokenService: TokenService
  ) {}

  async login(request: FastifyRequest<{ Body: AuthDTO }>, reply: FastifyReply) {
    try {
      const tokens = await this.authService.login(request.body);
      return reply.code(200).send({ data: tokens });
    } catch (error) {
      request.log.error(error, 'Login error');
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: (error as Error).message,
      });
    }
  }

  async refreshToken(request: FastifyRequest<{ Body: RefreshTokenDTO }>, reply: FastifyReply) {
    try {
      const tokens = await this.tokenService.refreshToken(request.body);
      return reply.code(200).send({ data: tokens });
    } catch (error) {
      request.log.error(error, 'Token refresh error');
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid refresh token',
      });
    }
  }

  async checkFirstUser(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const isFirstUser = await this.authService.isFirstUser();
      return reply.code(200).send({
        data: {
          isFirstUser,
        },
      });
    } catch (error) {
      _request.log.error(error, 'Error checking for first user');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to check first user status',
      });
    }
  }

  async createFirstAdmin(request: FastifyRequest<{ Body: CreateUserDTO }>, reply: FastifyReply) {
    try {
      const admin = await this.authService.createFirstAdmin(request.body);
      return reply.code(201).send({ data: admin });
    } catch (error) {
      request.log.error(error, 'Error creating first admin');
      if ((error as Error).message.includes('уже создан')) {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: (error as Error).message,
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create admin',
      });
    }
  }
}
