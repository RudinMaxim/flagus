import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/flag.schema';
import { FlagHttpController } from '../controllers/flag.http.controller';
import { TYPES } from '../../../../config/types';

export async function flagRoutes(fastify: FastifyInstance) {
  const flagController = fastify.container.get<FlagHttpController>(TYPES.FlagHttpController);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllFlagsSchema,
    handler: flagController.getAllFlags.bind(flagController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getFlagByIdSchema,
    handler: flagController.getFlagById.bind(flagController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createFlagSchema,
    handler: flagController.createFlag.bind(flagController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateFlagSchema,
    handler: flagController.updateFlag.bind(flagController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteFlagSchema,
    handler: flagController.deleteFlag.bind(flagController),
  });

  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle',
    schema: schemas.toggleFlagSchema,
    handler: flagController.toggleFlagStatus.bind(flagController),
  });

  fastify.route({
    method: 'POST',
    url: '/:id/reset-ttl',
    schema: schemas.resetTTLSchema,
    handler: flagController.resetFlagTTL.bind(flagController),
  });

  fastify.route({
    method: 'GET',
    url: '/expired',
    schema: schemas.getExpiredFlagsSchema,
    handler: flagController.getExpiredFlags.bind(flagController),
  });

  fastify.route({
    method: 'POST',
    url: '/cleanup',
    schema: schemas.cleanupExpiredFlagsSchema,
    handler: flagController.cleanupExpiredFlags.bind(flagController),
  });
}
