import { FastifyInstance } from 'fastify';
import { ConfigService } from '../../config/config';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyCors from '@fastify/cors';
import apiRoutes from './routes';

export async function registerApiRoutes(fastify: FastifyInstance, config: ConfigService) {
  await fastify.register(fastifyCors, {
    origin: config.corsOrigins || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  if (config.nodeEnv === 'development') {
    await fastify.register(fastifySwagger, {
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
            name: 'Client SDK',
            description: 'Endpoints for client SDK integration',
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
          },
        },
        security: [{ apiKey: [] }],
      },
    });

    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
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
