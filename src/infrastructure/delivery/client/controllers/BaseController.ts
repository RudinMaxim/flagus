import { FastifyReply, FastifyRequest } from 'fastify';

export abstract class BaseController {
  protected viewData: Record<string, any> = {};

  constructor(protected services?: Record<string, any>) {
    this.services = services || {};
  }

  /**
   * Prepare common view data for all templates
   */
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

  /**
   * Render a full page template
   */
  protected async render(
    request: FastifyRequest,
    reply: FastifyReply,
    template: string,
    data: Record<string, any> = {}
  ): Promise<FastifyReply> {
    const viewData = this.prepareViewData(request);

    return reply.view(template, {
      ...viewData,
      ...data,
    });
  }

  /**
   * Render a partial template (for HTMX responses)
   */
  protected async renderPartial(
    reply: FastifyReply,
    template: string,
    data: Record<string, any> = {}
  ): Promise<FastifyReply> {
    // For partials, we don't apply the layout
    return reply.view(template, data, { layout: false });
  }

  /**
   * Set flash message to be displayed on the next request
   */
  protected setFlashMessage(
    request: FastifyRequest,
    type: 'success' | 'danger' | 'warning' | 'info',
    message: string
  ): void {
    if ((request as any).session) {
      (request as any).session.flashMessage = { type, message };
    }
  }

  /**
   * Handle API errors consistently
   */
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
