import { FastifyInstance } from 'fastify';
import { pagesRoute } from './web/pages.route';
import { registerApiRoutes } from './api/plugins';
import { ConfigService } from '../config/config';
import { TYPES } from '../config/types';

export async function registerRoutes(app: FastifyInstance) {
  await registerApiRoutes(app, app.container.get<ConfigService>(TYPES.Config));
  await pagesRoute(app);
}
