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
    url: '/:id',
    schema: schemas.getAuditLogByIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.getAuditLogById.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/entity/:entityId',
    schema: schemas.getAuditLogsByEntityIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.getAuditLogsByEntityId.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/user/:userId',
    schema: schemas.getAuditLogsByUserIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.getAuditLogsByUserId.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/export',
    schema: schemas.exportAuditLogsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.exportAuditLogs.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/diff',
    schema: schemas.getAuditLogDiffSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: auditController.getAuditLogDiff.bind(auditController),
  });
}
