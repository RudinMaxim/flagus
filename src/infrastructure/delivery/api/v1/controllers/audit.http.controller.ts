import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { AuditService } from '../../../../../core/observability/services';

@injectable()
export class AuditHttpController {
  constructor(@inject(TYPES.AuditService) private readonly auditService: AuditService) {}

  async getAllAuditLogs(
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

      const filters = {
        entityId,
        userId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      };

      const logs = await this.auditService.getLogs(filters);
      return reply.code(200).send({ data: logs });
    } catch (error) {
      request.log.error(error, 'Error fetching all audit logs');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch audit logs',
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
}
