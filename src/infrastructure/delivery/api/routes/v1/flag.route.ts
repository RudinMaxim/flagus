import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schemas from '../../schemas/flag.schema';
import { CreateFlagDTO, UpdateFlagDTO } from '../../../../../core/flag-management/model';
import { FeatureFlagService } from '../../../../../core/flag-management/service';
import { FlagStatus } from '../../../../../shared/kernel';
import { TYPES } from '../../../../config/types';

export default async function (fastify: FastifyInstance) {
  const flagService = fastify.container.get<FeatureFlagService>(TYPES.FeatureFlagService);

  // Get all flags
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

  // Get a specific flag by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getFlagsByIdSchema,
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

  // Create a new flag
  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createSchema,
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

  // Update a flag
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateSchema,
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

  // Delete a flag
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteSchema,
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

  // Toggle flag status
  fastify.route({
    method: 'PATCH',
    url: '/:id/toggle',
    schema: schemas.toggleSchema,
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { status: FlagStatus; userId: string };
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

  // Get client flags - main endpoint for client SDKs
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

  // Evaluate a specific flag for a client
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
        const isActive = await flagService.evaluateFlag(
          request.params.flagName,
          request.params.clientId
        );
        return reply.code(200).send({
          data: {
            flagName: request.params.flagName,
            isActive,
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
