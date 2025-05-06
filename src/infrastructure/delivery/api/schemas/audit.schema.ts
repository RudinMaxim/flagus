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
    oldValue: { type: ['object', 'null'], additionalProperties: true },
    newValue: { type: ['object', 'null'], additionalProperties: true },
    timestamp: { type: 'string', format: 'date-time' },
    ipAddress: { type: ['string', 'null'] },
  },
};

// GET /audit
export const getAllAuditLogsSchema: FastifySchema = {
  description: 'Get all audit logs',
  tags: ['Audit Logs'],
  summary: 'Retrieve all audit logs',
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

// GET /audit/:id
export const getAuditLogByIdSchema: FastifySchema = {
  description: 'Get audit log by ID',
  tags: ['Audit Logs'],
  summary: 'Retrieve a specific audit log by its ID',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: auditLogSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// GET /audit/entity/:entityId
export const getAuditLogsByEntityIdSchema: FastifySchema = {
  description: 'Get audit logs by entity ID',
  tags: ['Audit Logs'],
  summary: 'Retrieve audit logs for a specific entity',
  params: {
    type: 'object',
    required: ['entityId'],
    properties: {
      entityId: { type: 'string' },
    },
  },
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

// GET /audit/user/:userId
export const getAuditLogsByUserIdSchema: FastifySchema = {
  description: 'Get audit logs by user ID',
  tags: ['Audit Logs'],
  summary: 'Retrieve audit logs created by a specific user',
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  },
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

// POST /audit
export const createAuditLogSchema: FastifySchema = {
  description: 'Create audit log',
  tags: ['Audit Logs'],
  summary: 'Create a new audit log entry',
  body: {
    type: 'object',
    required: ['userId', 'action', 'entityId', 'entityType'],
    properties: {
      userId: { type: 'string' },
      action: { type: 'string', enum: ['create', 'update', 'delete', 'toggle'] },
      entityId: { type: 'string' },
      entityType: { type: 'string' },
      oldValue: { type: ['object', 'null'], additionalProperties: true },
      newValue: { type: ['object', 'null'], additionalProperties: true },
      ipAddress: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: auditLogSchema,
      },
    },
    400: errorSchema,
    500: errorSchema,
  },
};

// GET /audit/export
export const exportAuditLogsSchema: FastifySchema = {
  description: 'Export audit logs to CSV',
  tags: ['Audit Logs'],
  summary: 'Export audit logs with optional filtering',
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

// GET /audit/:id/diff
export const getAuditLogDiffSchema: FastifySchema = {
  description: 'Get diff between old and new values',
  tags: ['Audit Logs'],
  summary: 'Show differences between old and new values in an audit log',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};
