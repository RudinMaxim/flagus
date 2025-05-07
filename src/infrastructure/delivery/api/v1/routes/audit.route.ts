import { FastifyInstance } from 'fastify';
import { AuditHttpController } from '../controllers/audit.http.controller';
import { TYPES } from '../../../../config/types';
import * as schemas from '../schemas/audit.schema';

export default async function (fastify: FastifyInstance) {
  const auditController = fastify.container.get<AuditHttpController>(TYPES.AuditHttpController);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllAuditLogsSchema,
    handler: auditController.getAllAuditLogs.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getAuditLogByIdSchema,
    handler: auditController.getAuditLogById.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/entity/:entityId',
    schema: schemas.getAuditLogsByEntityIdSchema,
    handler: auditController.getAuditLogsByEntityId.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/user/:userId',
    schema: schemas.getAuditLogsByUserIdSchema,
    handler: auditController.getAuditLogsByUserId.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/export',
    schema: schemas.exportAuditLogsSchema,
    handler: auditController.exportAuditLogs.bind(auditController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/diff',
    schema: schemas.getAuditLogDiffSchema,
    handler: auditController.getAuditLogDiff.bind(auditController),
  });
}
