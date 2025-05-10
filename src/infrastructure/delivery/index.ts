import { FastifyInstance } from 'fastify';
import { registerClient } from './client/register';
import { registerApi } from './api/register';

export async function registerRoutes(app: FastifyInstance) {
  await registerClient(app);
  await registerApi(app);
}
