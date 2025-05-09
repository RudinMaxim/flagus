import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { BaseController } from './base.controller';

export class PageController extends BaseController {
  constructor() {
    super();
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      if ((request as any).user) {
        return reply.redirect('/');
      }

      return this.render(request, reply, 'pages/auth/login', {
        layout: 'layouts/auth.hbs',
        pageTitle: 'Вход в систему',
        pageDescription:
          'Вход в систему управления feature flags Flagus. Авторизуйтесь для доступа к панели управления.',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async setup(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      return this.render(request, reply, 'pages/auth/setup', {
        pageTitle: 'Setup',
        layout: 'layouts/auth.hbs',
        pageDescription:
          'Первоначальная настройка системы управления feature flags Flagus. Создайте администратора и начните работу.',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async notFound(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/404', {
      layout: 'layouts/error',
      pageTitle: 'Страница не найдена',
      pageDescription:
        'Запрашиваемая страница не найдена в системе Flagus. Проверьте URL или вернитесь на главную.',
    });
  }

  async error(
    err: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const errorId = crypto.randomUUID();
    return this.render(request, reply, 'pages/errors/500', {
      layout: 'layouts/error',
      errorId: errorId,
      pageTitle: 'Ошибка',
      pageDescription: 'Произошла ошибка при обработке вашего запроса в системе Flagus.',
      error: {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
  }
}
