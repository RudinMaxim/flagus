// infrastructure/delivery/client/controllers/PageController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from './BaseController';

export class PageController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Login page
   */
  async login(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      // If user is already logged in, redirect to dashboard
      if ((request as any).user) {
        return reply.redirect('/');
      }

      return this.render(request, reply, 'pages/auth/login', {
        title: 'Login',
        layout: 'layouts/auth', // Use auth layout (no sidebar)
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  /**
   * First-time setup page
   */
  async setup(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      return this.render(request, reply, 'pages/auth/setup', {
        title: 'Setup',
        layout: 'layouts/auth', // Use auth layout (no sidebar)
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  /**
   * Not found page
   */
  async notFound(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/404', {
      title: 'Not Found',
      layout: 'layouts/error',
    });
  }

  /**
   * Error page
   */
  async error(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/500', {
      title: 'Error',
      layout: 'layouts/error',
    });
  }
}
