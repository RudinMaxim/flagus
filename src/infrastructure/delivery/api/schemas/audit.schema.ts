import { FastifySchema } from 'fastify';

// Common response schemas
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
    entityId: { type: 'string' },
    entityType: { type: 'string' },
    userId: { type: 'string' },
    action: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    oldValue: {
      type: ['object', 'null'],
      additionalProperties: true,
    },
    newValue: {
      type: ['object', 'null'],
      additionalProperties: true,
    },
  },
};

// GET /audit
export const getAllAuditSchema: FastifySchema = {
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
export const getAuditByIdSchema: FastifySchema = {
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
export const getByEntityIdSchema: FastifySchema = {
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
export const getByUserIdSchema: FastifySchema = {
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

// GET /audit/export
export const exportLogsSchema: FastifySchema = {
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
    500: errorSchema,
  },
};

// GET /audit/:id/diff
export const getDiffSchema: FastifySchema = {
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
