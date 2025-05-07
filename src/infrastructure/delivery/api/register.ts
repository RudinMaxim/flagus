import { FastifyInstance } from 'fastify';
import { ConfigService } from '../../config/config';
import apiRoutes from './v1/routes';

export async function registerApiRoutes(fastify: FastifyInstance, config: ConfigService) {
  if (config.cors.enabled) {
    const fastifyCors = import('@fastify/cors');
    await fastify.register(fastifyCors, {
      origin: config.cors.origins || true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    });
  }

  if (config.server.swagger.enabled) {
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
      routePrefix: config.server.swagger.path,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      uiHooks: {
        onRequest: function (request, reply, next) {
          next();
        },
        preHandler: function (request, reply, next) {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: header => header,
      transformSpecification: swaggerObject => swaggerObject,
      transformSpecificationClone: true,
    });
  }

  await fastify.register(apiRoutes);
}
