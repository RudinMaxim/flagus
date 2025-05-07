import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/flag.schema';
import { FlagHttpController } from '../controllers/flag.http.controller';
import { TYPES } from '../../../../config/types';
import { EvaluateHttpController } from '../controllers/evaluate.http.controller';

export default async function (fastify: FastifyInstance) {
  const flagController = fastify.container.get<FlagHttpController>(TYPES.FlagHttpController);
  const evaluateController = fastify.container.get<EvaluateHttpController>(
    TYPES.EvaluateHttpController
  );

  fastify.route({
    method: 'GET',
    url: '/:clientId',
    schema: schemas.getClientFlagsSchema,
    handler: evaluateController.getClientFlags.bind(flagController),
  });

  fastify.route({
    method: 'GET',
    url: '/:flagName/:clientId',
    schema: schemas.evaluateFlagSchema,
    handler: evaluateController.evaluateFlag.bind(flagController),
  });
}
