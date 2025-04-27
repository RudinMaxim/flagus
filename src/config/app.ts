import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import path from 'path';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

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
