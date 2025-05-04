import Fastify, { FastifyInstance } from 'fastify';
import { LoggerService } from './shared/logger';
import { createContainer, OnDestroy, OnInit, TYPES } from '@infrastructure/config';
import { DataGateway } from '@infrastructure/storage';
import { registerRoutes } from '@infrastructure/delivery';

export const APP_CONSTANTS = {
  ROUTES: {
    API_PREFIX: '/api',
    HEALTH: '/health',
    FLAGS: '/flags',
  },
  TEMPLATES: {
    DIR: '../../../../interfaces/ui/templates',
    LAYOUT: 'layout',
  },
  STATIC: {
    DIR: '../../../../interfaces/ui/public',
    PREFIX: '/public/',
  },
};

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const container = createContainer();

  const dataService = container.get<DataGateway & OnInit>(TYPES.DataGateway);

  await dataService.onInit();

  app.decorate('container', container);
  app.decorate('db', dataService);

  app.addHook('onClose', async () => {
    const logger = container.get<LoggerService>(TYPES.Logger);
    logger.info('Shutting down app...');

    await (dataService as unknown as OnDestroy).onDestroy();
  });

  await registerRoutes(app);

  return app;
}
