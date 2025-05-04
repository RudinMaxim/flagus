import { FastifyInstance } from 'fastify';
import { apiRoute } from './api';
import { pagesRoute } from './web/pages.route';

export async function registerRoutes(app: FastifyInstance) {
  await apiRoute(app);
  await pagesRoute(app);
}
