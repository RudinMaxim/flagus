import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/x-api-key.middleware';
import healthRoutes from './common/health.route';
import flagRoutes from './v1/flag.route';
import categoryRoutes from './v1/category.route';
import auditRoutes from './v1/audit.route';

export default async function (fastify: FastifyInstance) {
  fastify.register(
    async rootApi => {
      rootApi.register(
        async v1Api => {
          v1Api.register(healthRoutes, { prefix: '/health' });

          v1Api.register(async protectedApi => {
            protectedApi.addHook('onRequest', authenticate);

            protectedApi.register(flagRoutes, { prefix: '/flags' });
            protectedApi.register(categoryRoutes, { prefix: '/categories' });
            protectedApi.register(auditRoutes, { prefix: '/audit' });
          });
        },
        { prefix: '/v1' }
      );

      // e.g., rootApi.register(async (v2Api) => { ... }, { prefix: '/v2' });
    },
    { prefix: '/api' }
  );
}
