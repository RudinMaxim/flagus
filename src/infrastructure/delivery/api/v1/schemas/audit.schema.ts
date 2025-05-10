import { FastifySchema } from 'fastify';

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

const auditLogSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    action: { type: 'string', enum: ['create', 'update', 'delete', 'toggle'] },
    entityId: { type: 'string' },
    entityType: { type: 'string' },
    oldValue: {
      type: ['string', 'null'],
      additionalProperties: true,
    },
    newValue: {
      type: ['string', 'null'],
      additionalProperties: true,
    },
    timestamp: { type: 'string', format: 'date-time' },
    ipAddress: { type: ['string', 'null'] },
  },
};

// GET /audit
export const getAllAuditLogsSchema: FastifySchema = {
  description: 'Get all audit logs',
  tags: ['Audit Logs'],
  summary: 'Retrieve all audit logs',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: auditLogSchema,
        },
      },
    },
    500: errorSchema,
  },
};

// GET /audit/export
export const exportAuditLogsSchema: FastifySchema = {
  description: 'Export audit logs to CSV',
  tags: ['Audit Logs'],
  summary: 'Export audit logs with optional filtering',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      entityId: { type: 'string' },
      userId: { type: 'string' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'string',
      format: 'binary',
    },
    500: errorSchema,
  },
};
