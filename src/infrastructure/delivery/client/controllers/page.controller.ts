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
        pageTitle: 'Login',
        layout: 'layouts/auth.hbs',
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
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async notFound(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/404', {
      pageTitle: 'Страница не найдена',
      layout: 'layouts/error',
    });
  }

  async error(
    err: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const errorId = crypto.randomUUID();
    console.error(`Error ID: ${errorId}`, err);

    return this.render(request, reply, 'pages/errors/500', {
      pageTitle: 'Ошибка сервера',
      layout: 'layouts/error',
      errorId: errorId,
    });
  }
}
