import Fastify, { FastifyInstance } from 'fastify';
import { ILogger } from './shared/logger';
import { registerRoutes } from './infrastructure/delivery';
import { createContainer } from './infrastructure/config/container';
import { TYPES } from './infrastructure/config/types';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const container = await createContainer();
  const logger = container.get<ILogger>(TYPES.Logger);

  app.decorate('container', container);

  if (typeof (container as any).initialize === 'function') {
    await (container as any).initialize();
  }

  app.addHook('onClose', async () => {
    logger.info('Shutting down app...');
    if (typeof (container as any).cleanup === 'function') {
      await (container as any).cleanup();
    }
  });

  registerRoutes(app);

  return app;
}
