import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { EnvironmentService } from '../../../../../core/flag-manager/service';
import { SDKKeyType } from '../../../../../core/flag-manager/model';

@injectable()
export class EnvironmentHttpController {
  constructor(
    @inject(TYPES.EnvironmentService) private readonly environmentService: EnvironmentService
  ) {}

  async getEnvironmentById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const environment = await this.environmentService.validateEnvironmentExists(
        request.params.id
      );
      return reply.code(200).send({ data: environment });
    } catch (error) {
      request.log.error(error, `Error fetching environment with ID: ${request.params.id}`);
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Environment not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch environment',
      });
    }
  }

  async createEnvironment(
    request: FastifyRequest<{
      Body: { name: string; description?: string; createdBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const newEnvironment = await this.environmentService.create(request.body);
      return reply.code(201).send({ data: newEnvironment });
    } catch (error) {
      request.log.error(error, 'Error creating new environment');
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
        message: 'Failed to create environment',
      });
    }
  }

  async generateSDKKey(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { type: SDKKeyType; userId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { type, userId } = request.body;

      const key = await this.environmentService.generateSDKKey(id, type, userId);
      return reply.code(200).send({ data: { key } });
    } catch (error) {
      request.log.error(error, `Error generating SDK key for environment: ${request.params.id}`);
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Environment not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to generate SDK key',
      });
    }
  }

  async deactivateSDKKey(
    request: FastifyRequest<{
      Params: { id: string; key: string };
      Body: { userId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id, key } = request.params;
      const { userId } = request.body;

      await this.environmentService.deactivateSDKKey(id, key, userId);
      return reply.code(200).send({ success: true });
    } catch (error) {
      request.log.error(
        error,
        `Error deactivating SDK key ${request.params.key} for environment: ${request.params.id}`
      );
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Environment not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to deactivate SDK key',
      });
    }
  }

  async getSDKKeys(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const keys = await this.environmentService.getSDKKeys(request.params.id);
      return reply.code(200).send({ data: keys });
    } catch (error) {
      request.log.error(error, `Error fetching SDK keys for environment: ${request.params.id}`);
      if ((error as Error).message.includes('not found')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Environment not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch SDK keys',
      });
    }
  }
}
