import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { FeatureFlagService } from '../../../../../core/flag-manager/service';
import { CreateFlagDTO, UpdateFlagDTO, TFlagStatus } from '../../../../../core/flag-manager/model';

@injectable()
export class FlagHttpController {
  constructor(@inject(TYPES.FeatureFlagService) private readonly flagService: FeatureFlagService) {}

  async getAllFlags(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const flags = await this.flagService.getAll();
      return reply.code(200).send({ data: flags });
    } catch (error) {
      _request.log.error(error, 'Error fetching all flags');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch flags',
      });
    }
  }

  async getFlagById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const flag = await this.flagService.getById(request.params.id);
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
  }

  async createFlag(request: FastifyRequest<{ Body: CreateFlagDTO }>, reply: FastifyReply) {
    try {
      const newFlag = await this.flagService.create(request.body);
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
  }

  async updateFlag(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateFlagDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      const updatedFlag = await this.flagService.update(request.params.id, request.body);
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
  }

  async deleteFlag(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.flagService.delete(request.params.id, request.user?.userId ?? 'system');
      return reply.code(204).send();
    } catch (error) {
      request.log.error(error, `Error deleting flag with ID: ${request.params.id}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete flag',
      });
    }
  }

  async toggleFlagStatus(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { status: TFlagStatus; userId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { status, userId } = request.body;
      const updatedFlag = await this.flagService.toggleStatus(request.params.id, status, userId);
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
  }

  async resetFlagTTL(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { userId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.body;
      const updatedFlag = await this.flagService.resetTTL(request.params.id, userId);
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
  }

  async getExpiredFlags(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const expiredFlags = await this.flagService.findExpiredFlags();
      return reply.code(200).send({ data: expiredFlags });
    } catch (error) {
      _request.log.error(error, 'Error fetching expired flags');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch expired flags',
      });
    }
  }

  async cleanupExpiredFlags(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const deletedCount = await this.flagService.cleanupExpiredFlags();
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
  }
}
