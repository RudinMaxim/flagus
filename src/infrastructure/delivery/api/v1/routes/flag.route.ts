import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/flag.schema';
import { FlagHttpController, EnvironmentHttpController } from '../controllers';
import { TYPES } from '../../../../config/types';
import { AuthMiddleware } from '../../../middlewares';

export async function flagRoutes(fastify: FastifyInstance) {
  const flagController = fastify.container.get<FlagHttpController>(TYPES.FlagHttpController);
  const environmentController = fastify.container.get<EnvironmentHttpController>(
    TYPES.EnvironmentHttpController
  );
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

  fastify.route({
    method: 'GET',
    url: '/environments/:id',
    schema: schemas.getEnvironmentByIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: environmentController.getEnvironmentById.bind(environmentController),
  });

  // TODO: Уязвисость, связано с setup.js
  fastify.route({
    method: 'POST',
    url: '/environments',
    schema: schemas.createEnvironmentSchema,
    handler: environmentController.createEnvironment.bind(environmentController),
  });

  fastify.route({
    method: 'POST',
    url: '/environments/:id/sdk-keys',
    schema: schemas.generateSDKKeySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: environmentController.generateSDKKey.bind(environmentController),
  });

  fastify.route({
    method: 'GET',
    url: '/environments/:id/sdk-keys',
    schema: schemas.getSDKKeysSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: environmentController.getSDKKeys.bind(environmentController),
  });

  fastify.route({
    method: 'POST',
    url: '/environments/:id/sdk-keys/:key/deactivate',
    schema: schemas.deactivateSDKKeySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: environmentController.deactivateSDKKey.bind(environmentController),
  });
}
