import Fastify, { FastifyInstance } from 'fastify';
import { LoggerService } from '@shared/logger';
import { OnDestroy, OnInit } from '@shared/config';
import { createContainer, TYPES } from '@infrastructure/di';
import { DataGateway } from '@infrastructure/storage';
import { registerRoutes } from '../routes/register.routes';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const container = createContainer();

  const dataService = container.get<DataGateway & OnInit>(TYPES.DataGateway);

  await dataService.onInit();

  app.decorate('container', container);
  app.decorate('db', dataService);

  app.addHook('onClose', async () => {
    const logger = container.get<LoggerService>(TYPES.LoggerService);
    logger.info('Shutting down app...');

    await (dataService as unknown as OnDestroy).onDestroy();
  });

  await registerRoutes(app);

  return app;
}
