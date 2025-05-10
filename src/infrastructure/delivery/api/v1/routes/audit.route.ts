import { FastifyInstance } from 'fastify';
import { AuditHttpController } from '../controllers/audit.http.controller';
import { TYPES } from '../../../../config/types';
import * as schemas from '../schemas/audit.schema';
import { AuthMiddleware } from '../../../middlewares';

export async function auditRoutes(fastify: FastifyInstance) {
  const auditController = fastify.container.get<AuditHttpController>(TYPES.AuditHttpController);
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllAuditLogsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.getAllAuditLogs.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/export',
    schema: schemas.exportAuditLogsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.exportAuditLogs.bind(auditController),
  });
}
