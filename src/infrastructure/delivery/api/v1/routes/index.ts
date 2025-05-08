import { FastifyInstance } from 'fastify';
import healthRoutes from '../../common/health.route';
import { TYPES } from '../../../../config/types';
import flagRoutes from './flag.route';
import categoryRoutes from './category.route';
import auditRoutes from './audit.route';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import evaluateRoutes from './evaluate.route';
import { AuthMiddleware } from '../../../middlewares';

export default async function (fastify: FastifyInstance) {
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  fastify.register(
    async rootApi => {
      rootApi.register(
        async v1Api => {
          v1Api.register(healthRoutes, { prefix: '/health' });

          v1Api.register(async protectedApi => {
            protectedApi.addHook('onRequest', authMiddleware.XApiKey);

            protectedApi.register(authRoutes, { prefix: '/auth' });
            protectedApi.register(evaluateRoutes, { prefix: '/evaluate' });

            protectedApi.register(async adminApi => {
              adminApi.addHook('onRequest', authMiddleware.authenticate);

              adminApi.register(flagRoutes, { prefix: '/flags' });
              adminApi.register(categoryRoutes, { prefix: '/categories' });
              adminApi.register(auditRoutes, { prefix: '/audit' });
              adminApi.register(userRoutes, { prefix: '/users' });
            });
          });
        },
        { prefix: '/v1' }
      );

      // e.g., rootApi.register(async (v2Api) => { ... }, { prefix: '/v2' });
    },
    { prefix: '/api' }
  );
}
