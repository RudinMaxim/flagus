import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { AuditService } from '../../../../../core/flag-manager/service';

@injectable()
export class AuditHttpController {
  constructor(@inject(TYPES.AuditService) private readonly auditService: AuditService) {}

  async getAllAuditLogs(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const logs = await this.auditService.getAll();
      return reply.code(200).send({ data: logs });
    } catch (error) {
      _request.log.error(error, 'Error fetching all audit logs');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch audit logs',
      });
    }
  }

  async getAuditLogById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const log = await this.auditService.getById(request.params.id);
      if (!log) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Audit log not found',
        });
      }
      return reply.code(200).send({ data: log });
    } catch (error) {
      request.log.error(error, `Error fetching audit log with ID: ${request.params.id}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch audit log',
      });
    }
  }

  async getAuditLogsByEntityId(
    request: FastifyRequest<{ Params: { entityId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const logs = await this.auditService.getByEntityId(request.params.entityId);
      return reply.code(200).send({ data: logs });
    } catch (error) {
      request.log.error(
        error,
        `Error fetching audit logs for entity ID: ${request.params.entityId}`
      );
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch audit logs by entity ID',
      });
    }
  }

  async getAuditLogsByUserId(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const logs = await this.auditService.getByUserId(request.params.userId);
      return reply.code(200).send({ data: logs });
    } catch (error) {
      request.log.error(error, `Error fetching audit logs for user ID: ${request.params.userId}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch audit logs by user ID',
      });
    }
  }

  async exportAuditLogs(
    request: FastifyRequest<{
      Querystring: {
        entityId?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { entityId, userId, startDate, endDate } = request.query;

      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (startDate) {
        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid startDate format',
          });
        }
      }

      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid endDate format',
          });
        }
      }

      const csv = await this.auditService.exportAuditLogs({
        entityId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        userId,
      });

      const filename = `audit_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

      return reply
        .code(200)
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    } catch (error) {
      request.log.error(error, 'Error exporting audit logs');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to export audit logs',
      });
    }
  }

  async getAuditLogDiff(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const log = await this.auditService.getById(request.params.id);
      if (!log) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Audit log not found',
        });
      }

      const diff = this.auditService.getDiff(log.oldValue ?? undefined, log.newValue ?? undefined);
      return reply.code(200).send({ data: diff });
    } catch (error) {
      request.log.error(error, `Error generating diff for audit log ID: ${request.params.id}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to generate diff',
      });
    }
  }
}
