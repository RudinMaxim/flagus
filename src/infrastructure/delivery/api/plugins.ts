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
          title: 'Feature Flag Management API',
          description: 'API for managing feature flags',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
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
    });
  }

  await fastify.register(apiRoutes);
}
