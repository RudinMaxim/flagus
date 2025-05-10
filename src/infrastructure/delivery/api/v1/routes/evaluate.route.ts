import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/flag.schema';
import { TYPES } from '../../../../config/types';
import { EvaluateHttpController } from '../controllers/evaluate.http.controller';

export async function evaluateRoutes(fastify: FastifyInstance) {
  const evaluateController = fastify.container.get<EvaluateHttpController>(
    TYPES.EvaluateHttpController
  );

  fastify.route({
    method: 'GET',
    url: '/client/:environmentId/:clientId',
    schema: schemas.getClientFlagsSchema,
    handler: evaluateController.getClientFlags.bind(evaluateController),
  });

  fastify.route({
    method: 'GET',
    url: '/evaluate/:environmentId/:flagName/:clientId',
    schema: schemas.evaluateFlagSchema,
    handler: evaluateController.evaluateFlag.bind(evaluateController),
  });
}
