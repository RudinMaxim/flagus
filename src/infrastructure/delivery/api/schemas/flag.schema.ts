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

const flagSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    categoryId: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SCHEDULED'] },
    rolloutPercentage: { type: 'integer', minimum: 0, maximum: 100 },
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          attribute: { type: 'string' },
          operator: { type: 'string' },
          value: { type: ['string', 'number', 'boolean', 'array'] },
        },
      },
    },
    scheduleStart: { type: ['string', 'null'], format: 'date-time' },
    scheduleEnd: { type: ['string', 'null'], format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

// GET /flags
export const getAllFlagsSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: flagSchema,
        },
      },
    },
    500: errorSchema,
  },
};

// GET /flags/:id
export const getFlagsByIdSchema: FastifySchema = {
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
        data: flagSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// POST /flags
export const createSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      categoryId: { type: ['string', 'null'] },
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SCHEDULED'] },
      rolloutPercentage: { type: 'integer', minimum: 0, maximum: 100 },
      rules: {
        type: 'array',
        items: {
          type: 'object',
          required: ['attribute', 'operator', 'value'],
          properties: {
            attribute: { type: 'string' },
            operator: {
              type: 'string',
              enum: [
                'EQUALS',
                'NOT_EQUALS',
                'CONTAINS',
                'NOT_CONTAINS',
                'GREATER_THAN',
                'LESS_THAN',
              ],
            },
            value: { type: ['string', 'number', 'boolean', 'array'] },
          },
        },
      },
      scheduleStart: { type: ['string', 'null'], format: 'date-time' },
      scheduleEnd: { type: ['string', 'null'], format: 'date-time' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: flagSchema,
      },
    },
    409: errorSchema,
    500: errorSchema,
  },
};

// PUT /flags/:id
export const updateSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      categoryId: { type: ['string', 'null'] },
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SCHEDULED'] },
      rolloutPercentage: { type: 'integer', minimum: 0, maximum: 100 },
      rules: {
        type: 'array',
        items: {
          type: 'object',
          required: ['attribute', 'operator', 'value'],
          properties: {
            attribute: { type: 'string' },
            operator: {
              type: 'string',
              enum: [
                'EQUALS',
                'NOT_EQUALS',
                'CONTAINS',
                'NOT_CONTAINS',
                'GREATER_THAN',
                'LESS_THAN',
              ],
            },
            value: { type: ['string', 'number', 'boolean', 'array'] },
          },
        },
      },
      scheduleStart: { type: ['string', 'null'], format: 'date-time' },
      scheduleEnd: { type: ['string', 'null'], format: 'date-time' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: flagSchema,
      },
    },
    404: errorSchema,
    409: errorSchema,
    500: errorSchema,
  },
};

// DELETE /flags/:id
export const deleteSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    204: {
      type: 'null',
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// PATCH /flags/:id/toggle
export const toggleSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['status', 'userId'],
    properties: {
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SCHEDULED'] },
      userId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: flagSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// GET /flags/client/:clientId
export const getClientFlagsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['clientId'],
    properties: {
      clientId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
      },
    },
    500: errorSchema,
  },
};

// GET /flags/evaluate/:flagName/:clientId
export const evaluateFlagSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['flagName', 'clientId'],
    properties: {
      flagName: { type: 'string' },
      clientId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            flagName: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
    500: errorSchema,
  },
};
