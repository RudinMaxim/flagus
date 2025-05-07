import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { FeatureFlagService } from '../../../../../core/flag-manager/service';

@injectable()
export class EvaluateHttpController {
  constructor(@inject(TYPES.FeatureFlagService) private readonly flagService: FeatureFlagService) {}

  async getClientFlags(
    request: FastifyRequest<{ Params: { clientId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const flags = await this.flagService.getClientFlags(request.params.clientId);
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
      Params: { flagName: string; clientId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.flagService.evaluateFlag(
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
  }
}
