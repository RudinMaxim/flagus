import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from './base.controller';

interface DashboardServices {
  flagService: any;
  categoryService: any;
  auditService: any;
}

export class DashboardController extends BaseController {
  constructor(services: DashboardServices) {
    super(services);
  }

  /**
   * Dashboard home page
   */
  async index(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      // Get recent flags (last 10)
      const recentFlags = await this.services?.flagService.getAll({
        limit: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      // Get flag statistics
      const flagStats = await this.services?.flagService.getStats();

      // Get recent audit logs (last 5)
      const recentAudit = await this.services?.auditService.getAll({
        limit: 5,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        populate: ['user'],
      });

      // Get category statistics
      const categoryStats = await this.services?.categoryService.getStats();

      return this.render(request, reply, 'pages/dashboard/index', {
        title: 'Dashboard',
        recentFlags,
        flagStats,
        recentAudit,
        categoryStats,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  /**
   * Search for flags (HTMX endpoint)
   */
  async searchFlags(
    request: FastifyRequest<{
      Querystring: { query: string };
    }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { query } = request.query;

      if (!query || query.length < 2) {
        return reply.send('');
      }

      const flags = await this.services?.flagService.search(query, { limit: 10 });

      if (flags.length === 0) {
        return this.renderPartial(reply, 'components/searchResults', {
          query,
          noResults: true,
        });
      }

      return this.renderPartial(reply, 'components/searchResults', {
        query,
        flags,
      });
    } catch (error) {
      return reply.send('<div class="p-3">Error searching flags</div>');
    }
  }

  /**
   * Validate flag name (HTMX endpoint)
   */
  async validateFlagName(
    request: FastifyRequest<{
      Querystring: { name: string; id?: string };
    }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    try {
      const { name, id } = request.query;

      if (!name) {
        return reply.send('Flag name is required');
      }

      // Check pattern (alphanumeric, underscore, dot, dash)
      if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
        return reply.send(
          'Flag name can only contain letters, numbers, underscores, dots, and hyphens'
        );
      }

      // Check if name already exists (excluding current flag if editing)
      const existingFlag = await this.services?.flagService.getByName(name);

      if (existingFlag && existingFlag.id !== id) {
        return reply.send('Flag name already exists');
      }

      return reply.send('');
    } catch (error) {
      return reply.send('Error validating flag name');
    }
  }
}
