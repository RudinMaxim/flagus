import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schemas from '../../schemas/flag.schema';
import { CreateFlagDTO, UpdateFlagDTO } from '../../../../../core/model';
import { FeatureFlagService } from '../../../../../core/service';
import { TFlagStatus } from '../../../../../shared/kernel';
import { TYPES } from '../../../../config/types';

export default async function (fastify: FastifyInstance) {
  const flagService = fastify.container.get<FeatureFlagService>(TYPES.FeatureFlagService);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllFlagsSchema,
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const flags = await flagService.getAll();
        return reply.code(200).send({ data: flags });
      } catch (error) {
        _request.log.error(error, 'Error fetching all flags');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch flags',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getFlagByIdSchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const flag = await flagService.getById(request.params.id);
        if (!flag) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Flag not found',
          });
        }
        return reply.code(200).send({ data: flag });
      } catch (error) {
        request.log.error(error, `Error fetching flag with ID: ${request.params.id}`);
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch flag',
        });
      }
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createFlagSchema,
    handler: async (request: FastifyRequest<{ Body: CreateFlagDTO }>, reply: FastifyReply) => {
      try {
        const newFlag = await flagService.create(request.body);
        return reply.code(201).send({ data: newFlag });
      } catch (error) {
        request.log.error(error, 'Error creating new flag');
        if ((error as Error).message.includes('already exists')) {
          return reply.code(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: (error as Error).message,
          });
        }
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to create flag',
        });
      }
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateFlagSchema,
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateFlagDTO;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const updatedFlag = await flagService.update(request.params.id, request.body);
        if (!updatedFlag) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Flag not found',
          });
        }
        return reply.code(200).send({ data: updatedFlag });
      } catch (error) {
        request.log.error(error, `Error updating flag with ID: ${request.params.id}`);
        if ((error as Error).message.includes('already exists')) {
          return reply.code(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: (error as Error).message,
          });
        }
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to update flag',
        });
      }
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteFlagSchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const result = await flagService.delete(request.params.id);
        if (!result) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Flag not found',
          });
        }
        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, `Error deleting flag with ID: ${request.params.id}`);
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to delete flag',
        });
      }
    },
  });

  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle',
    schema: schemas.toggleFlagSchema,
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { status: TFlagStatus; userId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { status, userId } = request.body;
        const updatedFlag = await flagService.toggleStatus(request.params.id, status, userId);
        if (!updatedFlag) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Flag not found',
          });
        }
        return reply.code(200).send({ data: updatedFlag });
      } catch (error) {
        request.log.error(error, `Error toggling flag status for ID: ${request.params.id}`);
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to toggle flag status',
        });
      }
    },
  });

  fastify.route({
    method: 'POST',
    url: '/:id/reset-ttl',
    schema: schemas.resetTTLSchema,
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { userId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.body;
        const updatedFlag = await flagService.resetTTL(request.params.id, userId);
        if (!updatedFlag) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Flag not found',
          });
        }
        return reply.code(200).send({ data: updatedFlag });
      } catch (error) {
        request.log.error(error, `Error resetting TTL for flag ID: ${request.params.id}`);
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to reset flag TTL',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/expired',
    schema: {
      tags: ['Feature Flags'],
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const expiredFlags = await flagService.findExpiredFlags();
        return reply.code(200).send({ data: expiredFlags });
      } catch (error) {
        _request.log.error(error, 'Error fetching expired flags');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch expired flags',
        });
      }
    },
  });

  fastify.route({
    method: 'POST',
    url: '/cleanup',
    schema: {
      tags: ['Feature Flags'],
    },
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const deletedCount = await flagService.cleanupExpiredFlags();
        return reply.code(200).send({
          data: {
            deletedCount,
            message: `Cleaned up ${deletedCount} expired flags`,
          },
        });
      } catch (error) {
        _request.log.error(error, 'Error cleaning up expired flags');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to clean up expired flags',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/client/:clientId',
    schema: schemas.getClientFlagsSchema,
    handler: async (
      request: FastifyRequest<{ Params: { clientId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const flags = await flagService.getClientFlags(request.params.clientId);
        return reply.code(200).send({ data: flags });
      } catch (error) {
        request.log.error(
          error,
          `Error fetching client flags for client ID: ${request.params.clientId}`
        );
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch client flags',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/evaluate/:flagName/:clientId',
    schema: schemas.evaluateFlagSchema,
    handler: async (
      request: FastifyRequest<{
        Params: { flagName: string; clientId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const result = await flagService.evaluateFlag(
          request.params.flagName,
          request.params.clientId
        );
        return reply.code(200).send({
          data: {
            flagName: request.params.flagName,
            isActive: result,
          },
        });
      } catch (error) {
        request.log.error(
          error,
          `Error evaluating flag '${request.params.flagName}' for client: ${request.params.clientId}`
        );
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to evaluate flag',
        });
      }
    },
  });
}
