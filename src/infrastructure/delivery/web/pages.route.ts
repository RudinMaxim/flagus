import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import { APP_CONSTANTS } from '../../../application';
import { FastifyInstance } from 'fastify';
import handlebars from 'handlebars';
import path from 'path';

export async function pagesRoute(app: FastifyInstance): Promise<void> {
  app.get('/', async (_, reply) => {
    return reply.view('index', {
      title: 'Flagus - Feature Flags Service',
      message: 'Hello from Flagus! Setup completed successfully.',
    });
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, APP_CONSTANTS.STATIC.DIR),
    prefix: APP_CONSTANTS.STATIC.PREFIX,
  });

  await app.register(fastifyView, {
    engine: {
      handlebars: handlebars,
    },
    templates: path.join(__dirname, APP_CONSTANTS.TEMPLATES.DIR),
    layout: APP_CONSTANTS.TEMPLATES.LAYOUT,
  });
}
