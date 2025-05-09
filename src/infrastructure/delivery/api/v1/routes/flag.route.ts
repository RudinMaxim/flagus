import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/flag.schema';
import { FlagHttpController } from '../controllers/flag.http.controller';
import { TYPES } from '../../../../config/types';
import { AuthMiddleware } from '../../../middlewares';

export async function flagRoutes(fastify: FastifyInstance) {
  const flagController = fastify.container.get<FlagHttpController>(TYPES.FlagHttpController);
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllFlagsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.getAllFlags.bind(flagController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getFlagByIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.getFlagById.bind(flagController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createFlagSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.createFlag.bind(flagController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateFlagSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.updateFlag.bind(flagController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteFlagSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.deleteFlag.bind(flagController),
  });

  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle',
    schema: schemas.toggleFlagSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.toggleFlagStatus.bind(flagController),
  });

  fastify.route({
    method: 'POST',
    url: '/:id/reset-ttl',
    schema: schemas.resetTTLSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.resetFlagTTL.bind(flagController),
  });

  fastify.route({
    method: 'GET',
    url: '/expired',
    schema: schemas.getExpiredFlagsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.getExpiredFlags.bind(flagController),
  });

  fastify.route({
    method: 'POST',
    url: '/cleanup',
    schema: schemas.cleanupExpiredFlagsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: flagController.cleanupExpiredFlags.bind(flagController),
  });
}
