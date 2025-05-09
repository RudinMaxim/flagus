import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TokenService } from '../../../core/access/services';
import { TYPES } from '../../config/types';

@injectable()
export class AuthMiddleware {
  constructor(@inject(TYPES.TokenService) private readonly tokenService: TokenService) {}

  public authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Отсутствует токен авторизации',
        });
      }

      const token = authHeader.split(' ')[1];

      try {
        const payload = this.tokenService.verifyAccessToken(token);
        request.user = payload;
      } catch (error) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Недействительный токен',
        });
      }
    } catch (error) {
      request.log.error(error, 'Ошибка аутентификации');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Ошибка в процессе аутентификации',
      });
    }
  };

  public authorizeRole = (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Пользователь не аутентифицирован',
          });
        }

        if (!roles.includes(request.user.role)) {
          return reply.code(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Недостаточно прав доступа',
          });
        }
      } catch (error) {
        request.log.error(error, 'Ошибка авторизации');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Ошибка в процессе авторизации',
        });
      }
    };
  };

  public XApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const apiKey = request.headers['x-api-key'];

      if (!apiKey || apiKey !== process.env.API_KEY) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or missing API key',
        });
      }
    } catch (error) {
      request.log.error(error, 'Authentication error');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Authentication process failed',
      });
    }
  };

  public authenticateUI = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accessToken = request.cookies.accessToken;
      const refreshToken = request.cookies.refreshToken;

      if (!accessToken && !refreshToken) {
        return reply.redirect('/login');
      }

      if (accessToken) {
        try {
          const payload = this.tokenService.verifyAccessToken(accessToken);
          request.user = payload;
          return;
        } catch (accessError) {
          request.log.warn(accessError, 'Access token expired or invalid');
        }
      }

      if (!refreshToken) {
        return reply.redirect('/login');
      }

      try {
        const newTokens = await this.tokenService.refreshToken({ refreshToken });

        reply.setCookie('accessToken', newTokens.accessToken, {
          path: '/',
          secure: true,
          sameSite: 'lax',
          httpOnly: true,
        });
        reply.setCookie('refreshToken', newTokens.refreshToken, {
          path: '/',
          secure: true,
          sameSite: 'lax',
          httpOnly: true,
        });

        const newPayload = this.tokenService.verifyAccessToken(newTokens.accessToken);
        request.user = newPayload;

        return;
      } catch (refreshError) {
        request.log.error(refreshError, 'Ошибка обновления токена по refreshToken');
        return reply.redirect('/login');
      }
    } catch (error) {
      request.log.error(error, 'Unexpected error in authenticateUI');
      return reply.redirect('/login');
    }
  };
}
