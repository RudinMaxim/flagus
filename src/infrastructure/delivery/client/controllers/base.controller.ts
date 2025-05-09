import { FastifyReply, FastifyRequest } from 'fastify';

export abstract class BaseController {
  protected viewData: Record<string, any> = {};

  protected prepareViewData(request: FastifyRequest): Record<string, any> {
    const user = (request as any).user;
    const isAdmin = user?.role === 'ADMIN';
    const currentPath = request.url;

    return {
      user,
      isAdmin,
      currentYear: new Date().getFullYear(),
      isActive: {
        dashboard: currentPath === '/',
        flags: currentPath.startsWith('/flags'),
        categories: currentPath.startsWith('/categories'),
        audit: currentPath.startsWith('/audit'),
        users: currentPath.startsWith('/users'),
        settings: currentPath.startsWith('/settings'),
      },
      flashMessage: (request as any).session?.flashMessage || null,
    };
  }

  protected async render(
    request: FastifyRequest,
    reply: FastifyReply,
    template: string,
    data: Record<string, any> = {}
  ): Promise<FastifyReply> {
    const viewData = this.prepareViewData(request);

    const layout = data.layout ?? 'layouts/main';

    return reply.view(template, { ...viewData, appVersion: '0.1.1', ...data }, { layout });
  }

  protected async renderPartial(
    reply: FastifyReply,
    template: string,
    data: Record<string, any> = {}
  ): Promise<FastifyReply> {
    return reply.view(template, data, { layout: false } as Record<string, any>);
  }

  protected setFlashMessage(
    request: FastifyRequest,
    type: 'success' | 'danger' | 'warning' | 'info',
    message: string
  ): void {
    if ((request as any).session) {
      (request as any).session.flashMessage = { type, message };
    }
  }

  protected handleError(reply: FastifyReply, error: any): FastifyReply {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    if (statusCode === 500) {
      console.error('Controller error:', error);
    }

    return reply.status(statusCode).send({
      statusCode,
      error: message,
    });
  }
}
