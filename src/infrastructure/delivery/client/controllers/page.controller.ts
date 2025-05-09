import { FastifyRequest, FastifyReply } from 'fastify';
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
        appVersion: '0.1.1',
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
        appVersion: '0.1.1',
        layout: 'layouts/auth.hbs',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async notFound(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/404', {
      title: 'Not Found',
      layout: 'layouts/error',
    });
  }

  async error(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/500', {
      title: 'Error',
      layout: 'layouts/error',
    });
  }
}
