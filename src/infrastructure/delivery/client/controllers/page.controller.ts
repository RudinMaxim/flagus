import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { injectable } from 'inversify';
import { BaseController } from './base.controller';

@injectable()
export class PageController extends BaseController {
  async login(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      if ((request as any).user) {
        return reply.redirect('/');
      }

      return this.render(request, reply, 'pages/auth/login', {
        layout: 'layouts/auth.hbs',
        pageTitle: 'Login',
        pageDescription:
          'Login to the feature flags Flagus control panel. Log in to access the control panel.',
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
          'Initial setup of the feature flags Flagus management system. Create an administrator and get started.',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async notFound(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return this.render(request, reply, 'pages/errors/404', {
      layout: 'layouts/error',
      pageTitle: 'Page not found',
      pageDescription:
        'The requested page was not found in the Flagus system. Check the URL or return to the home page.',
    });
  }

  async error(
    err: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    console.error(err);
    const errorId = crypto.randomUUID();
    return this.render(request, reply, 'pages/errors/500', {
      layout: 'layouts/error',
      errorId: errorId,
      pageTitle: 'Error',
      pageDescription: 'There was an error processing your request in the Flagus system.',
      error: {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
  }
}
