import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { FlagEvaluationService } from '../../../../../core/flag-manager/service';
import { SDKKeyType } from '../../../../../core/environment/model';

@injectable()
export class EvaluateHttpController {
  constructor(
    @inject(TYPES.FlagEvaluationService) private readonly flagService: FlagEvaluationService
  ) {}

  async getClientFlags(
    request: FastifyRequest<{
      Params: { clientId: string; environmentId: string };
      Headers: { 'x-sdk-key': string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { clientId, environmentId } = request.params;
      const sdkKey = request.headers['x-sdk-key'] as string;

      if (!sdkKey) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'SDK key is required',
        });
      }

      const flags = await this.flagService.getAllFlagsForClient(
        environmentId,
        clientId,
        sdkKey,
        SDKKeyType.CLIENT
      );

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
  }

  async evaluateFlag(
    request: FastifyRequest<{
      Params: { flagName: string; clientId: string; environmentId: string };
      Headers: { 'x-sdk-key': string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { flagName, clientId, environmentId } = request.params;
      const sdkKey = request.headers['x-sdk-key'] as string;

      if (!sdkKey) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'SDK key is required',
        });
      }

      const result = await this.flagService.evaluateFlag(
        environmentId,
        flagName,
        clientId,
        sdkKey,
        SDKKeyType.CLIENT
      );

      return reply.code(200).send({
        data: {
          flagName: flagName,
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
  }
}
