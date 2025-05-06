import { FastifySchema } from 'fastify';

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

const metadataSchema = {
  type: 'object',
  properties: {
    createdBy: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedBy: { type: ['string', 'null'] },
    updatedAt: { type: ['string', 'null'], format: 'date-time' },
  },
  required: ['createdBy', 'createdAt'],
};

const timeConstraintSchema = {
  type: 'object',
  properties: {
    startDate: { type: ['string', 'null'], format: 'date-time' },
    endDate: { type: ['string', 'null'], format: 'date-time' },
  },
};

const percentageDistributionSchema = {
  type: 'object',
  properties: {
    percentage: { type: 'number', minimum: 0, maximum: 100 },
  },
  required: ['percentage'],
};

const flagSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    type: { type: 'string', enum: ['boolean', 'percentage'] },
    status: { type: 'string', enum: ['active', 'inactive', 'scheduled', 'archived'] },
    categoryId: { type: ['string', 'null'] },
    timeConstraint: timeConstraintSchema,
    percentageDistribution: percentageDistributionSchema,
    clientIds: { type: 'array', items: { type: 'string' } },
    metadata: metadataSchema,
  },
  required: ['id', 'name', 'type', 'status'],
};

// GET /flags
export const getAllFlagsSchema: FastifySchema = {
  description: 'Get all feature flags',
  tags: ['Feature Flags'],
  summary: 'Retrieve all feature flags with their configurations',
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
export const getFlagByIdSchema: FastifySchema = {
  description: 'Get flag by ID',
  tags: ['Feature Flags'],
  summary: 'Retrieve a specific feature flag by its ID',
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
export const createFlagSchema: FastifySchema = {
  description: 'Create new feature flag',
  tags: ['Feature Flags'],
  summary: 'Create a new feature flag with configuration',
  body: {
    type: 'object',
    required: ['name', 'type', 'createdBy'],
    properties: {
      name: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      type: { type: 'string', enum: ['boolean', 'percentage'] },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'scheduled', 'archived'],
        default: 'inactive',
      },
      categoryId: { type: ['string', 'null'], default: null },
      timeConstraint: timeConstraintSchema,
      percentageDistribution: percentageDistributionSchema,
      clientIds: { type: 'array', items: { type: 'string' } },
      createdBy: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: flagSchema,
      },
    },
    400: errorSchema,
    409: errorSchema,
    500: errorSchema,
  },
};

// PUT /flags/:id
export const updateFlagSchema: FastifySchema = {
  description: 'Update feature flag',
  tags: ['Feature Flags'],
  summary: 'Update an existing feature flag configuration',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['updatedBy'],
    properties: {
      name: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      type: { type: 'string', enum: ['boolean', 'percentage'] },
      status: { type: 'string', enum: ['active', 'inactive', 'scheduled', 'archived'] },
      categoryId: { type: ['string', 'null'] },
      timeConstraint: timeConstraintSchema,
      percentageDistribution: percentageDistributionSchema,
      clientIds: { type: 'array', items: { type: 'string' } },
      updatedBy: { type: 'string' },
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
export const deleteFlagSchema: FastifySchema = {
  description: 'Delete feature flag',
  tags: ['Feature Flags'],
  summary: 'Delete a feature flag',
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
export const toggleFlagSchema: FastifySchema = {
  description: 'Toggle flag status',
  tags: ['Feature Flags'],
  summary: 'Change the status of a feature flag',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['status', 'updatedBy'],
    properties: {
      status: { type: 'string', enum: ['active', 'inactive', 'scheduled', 'archived'] },
      updatedBy: { type: 'string' },
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
  description: 'Get client flags',
  tags: ['Client SDK'],
  summary: 'Retrieve all active flags for a specific client',
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
  description: 'Evaluate flag for client',
  tags: ['Client SDK'],
  summary: 'Evaluate a specific flag for a given client',
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
    404: errorSchema,
    500: errorSchema,
  },
};
