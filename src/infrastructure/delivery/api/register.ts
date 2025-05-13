import { FastifyInstance } from 'fastify';
import { ConfigService } from '../../config/config';
import { TYPES } from '../../config/types';
import {
  auditRoutes,
  authRoutes,
  categoryRoutes,
  evaluateRoutes,
  flagRoutes,
  groupRoutes,
  userRoutes,
} from './v1/routes';
import { healthRoutes } from './common/health.route';

export async function registerApi(fastify: FastifyInstance) {
  const config = fastify.container.get<ConfigService>(TYPES.Config);

  if (config.get('cors').enabled) {
    const fastifyCors = import('@fastify/cors');
    await fastify.register(fastifyCors, {
      origin: config.get('cors').origins || true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    });
  }

  if (config.get('server').swagger.enabled) {
    await fastify.register(import('@fastify/swagger'), {
      openapi: {
        info: {
          title: 'Flagus - Feature Flags Management API',
          description:
            'Flagus is a lightweight, open-source feature flag management service designed for simplicity and speed.',
          version: '1.0.0',
          contact: {
            name: 'API Support',
            url: 'https://t.me/RudinMaxim',
          },
          license: {
            name: 'MIT',
            url: 'https://github.com/RudinMaxim/flagus/blob/main/LICENSE',
          },
        },
        tags: [
          {
            name: 'Client SDK',
            description: 'Endpoints for client SDK integration',
          },
          {
            name: 'Feature Flags',
            description: 'Endpoints for managing feature flags',
          },
          {
            name: 'Environments',
            description: 'Endpoints for managing environments',
          },
          {
            name: 'Categories',
            description: 'Endpoints for managing flag categories',
          },
          {
            name: 'Audit Logs',
            description: 'Endpoints for accessing audit logs',
          },
          {
            name: 'Authentication',
            description: 'Endpoints for authentication',
          },
          {
            name: 'Users',
            description: 'Endpoints for managing users',
          },
          {
            name: 'Groups',
            description: 'Endpoints for managing groups',
          },
          {
            name: 'System',
            description: 'Endpoints for system',
          },
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
              description: 'API key for authentication',
            },
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT Bearer token for user authentication',
            },
          },
        },
      },
    });

    await fastify.register(import('@fastify/swagger-ui'), {
      routePrefix: config.get('server').swagger.path,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      uiHooks: {
        onRequest: function (_request, _reply, next) {
          next();
        },
        preHandler: function (_request, _reply, next) {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: header => header,
      transformSpecification: swaggerObject => swaggerObject,
      transformSpecificationClone: true,
    });
  }

  await fastify.register(
    async rootApi => {
      rootApi.register(
        async v1Api => {
          v1Api.register(healthRoutes, { prefix: '/health' });

          v1Api.register(async protectedApi => {
            protectedApi.register(authRoutes, { prefix: '/auth' });
            protectedApi.register(evaluateRoutes, { prefix: '/evaluate' });

            protectedApi.register(flagRoutes, { prefix: '/flags' });
            protectedApi.register(categoryRoutes, { prefix: '/categories' });
            protectedApi.register(auditRoutes, { prefix: '/audit' });
            protectedApi.register(userRoutes, { prefix: '/users' });
            protectedApi.register(groupRoutes, { prefix: '/group' });
          });
        },
        { prefix: '/v1' }
      );

      // e.g., rootApi.register(async (v2Api) => { ... }, { prefix: '/v2' });
    },
    { prefix: '/api' }
  );
}
