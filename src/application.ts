import 'reflect-metadata';
import 'tsconfig-paths/register';
import Fastify, { FastifyInstance } from 'fastify';
import { ILogger } from './shared/logger';
import { registerRoutes } from '@infrastructure/delivery';
import { createContainer, TYPES } from './infrastructure/config';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const container = createContainer();
  const logger = container.get<ILogger>(TYPES.Logger);

  app.addHook('onClose', async () => {
    logger.info('Shutting down app...');
  });

  registerRoutes(app);

  return app;
}
