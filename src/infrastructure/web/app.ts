import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import path from 'path';
import { LoggerService } from '@shared/logger';
import { OnDestroy, OnInit } from '@shared/config';
import { createContainer, TYPES } from '@infrastructure/di';
import { DataGateway } from '@infrastructure/storage/abstract';

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

  // TODO: Удалить после тестов
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../ui/public'),
    prefix: '/public/',
  });

  await app.register(fastifyView, {
    engine: {
      handlebars: handlebars,
    },
    templates: path.join(__dirname, '../ui/templates'),
    layout: 'layout',
  });

  app.get('/', async (_, reply) => {
    return reply.view('index', {
      title: 'Flagus - Feature Flags Service',
      message: 'Hello from Flagus! Setup completed successfully.',
    });
  });

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}
