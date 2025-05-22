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
    createdAt: { type: 'number' },
    updatedBy: { type: ['string', 'null'] },
    updatedAt: { type: ['number', 'null'] },
  },
};

const ttlSchema = {
  type: 'object',
  properties: {
    expiresAt: { type: 'number' },
    autoDelete: { type: 'boolean', default: true },
  },
};

const flagSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    key: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    type: { type: 'string', enum: ['boolean', 'enum'] },
    status: { type: 'string', enum: ['active', 'inactive', 'scheduled', 'archived'] },
    categoryId: { type: ['string', 'null'] },
    environmentId: { type: 'string' },
    enum: {
      type: 'object',
      properties: {
        selected: { type: ['string', 'null'] },
        values: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    ttl: ttlSchema,
    clientIds: {
      type: ['array', 'null'],
      items: { type: 'string' },
    },
    metadata: metadataSchema,
  },
};

const sdkKeySchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    type: { type: 'string', enum: ['client', 'server'] },
    createdAt: { type: 'string', format: 'date-time' },
    createdBy: { type: 'string' },
    isActive: { type: 'boolean' },
  },
};

const environmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    sdkKeys: {
      type: 'array',
      items: sdkKeySchema,
    },
    metadata: metadataSchema,
  },
};

// GET /flags
export const getAllFlagsSchema: FastifySchema = {
  description: 'Get all feature flags',
  tags: ['Feature Flags'],
  summary: 'Retrieve all feature flags with their configurations',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      environmentId: { type: 'string' },
    },
  },
  response: {
    // 200: {
    //   type: 'object',
    //   properties: {
    //     data: {
    //       type: 'array',
    //       items: flagSchema,
    //     },
    //   },
    // },
    500: errorSchema,
  },
};

// GET /flags/:id
export const getFlagByIdSchema: FastifySchema = {
  description: 'Get flag by ID',
  tags: ['Feature Flags'],
  summary: 'Retrieve a specific feature flag by its ID',
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['key', 'name', 'type', 'createdBy', 'environmentId'],
    properties: {
      key: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$', minLength: 1, maxLength: 100 },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      type: { type: 'string', enum: ['boolean', 'enum'] },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'scheduled', 'archived'],
        default: 'inactive',
      },
      categoryId: { type: ['string', 'null'], default: null },
      environmentId: { type: 'string' },
      enumValues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Required when type is "enum"',
      },
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
  security: [{ bearerAuth: [] }],
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
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      type: { type: 'string', enum: ['boolean', 'enum'] },
      status: { type: 'string', enum: ['active', 'inactive', 'scheduled', 'archived'] },
      categoryId: { type: ['string', 'null'] },
      environmentId: { type: 'string' },
      enumValues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Required when type is "enum"',
      },
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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
      status: { type: 'string', enum: ['active', 'inactive', 'scheduled', 'archived'] },
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

// GET /flags/expired
export const getExpiredFlagsSchema: FastifySchema = {
  description: 'Get expired flags',
  tags: ['Feature Flags'],
  summary: 'Get all expired flags',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      environmentId: { type: 'string' },
    },
  },
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

// POST /flags/cleanup
export const cleanupExpiredFlagsSchema = {
  tags: ['Feature Flags'],
  summary: 'Clean up expired feature flags',
  description: 'Removes all expired feature flags that have autoDelete set to true',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      environmentId: { type: 'string' },
    },
  },
  response: {
    200: {
      description: 'Successful response',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            deletedCount: { type: 'number' },
            deletedFlags: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string' },
      },
    },
  },
};

// POST /flags/:id/reset-ttl
export const resetTTLSchema: FastifySchema = {
  description: 'Reset flag TTL',
  tags: ['Feature Flags'],
  summary: 'Reset the TTL for a feature flag',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
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
        data: flagSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// Environment schemas
export const getAllEnvironmentsSchema: FastifySchema = {
  description: 'Get all environments',
  tags: ['Environments'],
  summary: 'Retrieve all environments',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: environmentSchema,
        },
      },
    },
    500: errorSchema,
  },
};

export const getEnvironmentByIdSchema: FastifySchema = {
  description: 'Get environment by ID',
  tags: ['Environments'],
  summary: 'Retrieve a specific environment by its ID',
  security: [{ bearerAuth: [] }],
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
        data: environmentSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

export const createEnvironmentSchema: FastifySchema = {
  description: 'Create new environment',
  tags: ['Environments'],
  summary: 'Create a new environment',
  // security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'createdBy'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      createdBy: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: environmentSchema,
      },
    },
    400: errorSchema,
    409: errorSchema,
    500: errorSchema,
  },
};

export const generateSDKKeySchema: FastifySchema = {
  description: 'Generate SDK key',
  tags: ['Environments'],
  summary: 'Generate a new SDK key for an environment',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['type', 'userId'],
    properties: {
      type: { type: 'string', enum: ['client', 'server'] },
      userId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
        },
      },
    },
    400: errorSchema,
    404: errorSchema,
    500: errorSchema,
  },
};

export const deactivateSDKKeySchema: FastifySchema = {
  description: 'Deactivate SDK key',
  tags: ['Environments'],
  summary: 'Deactivate an SDK key for an environment',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id', 'key'],
    properties: {
      id: { type: 'string' },
      key: { type: 'string' },
    },
  },
  body: {
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
        success: { type: 'boolean' },
      },
    },
    400: errorSchema,
    404: errorSchema,
    500: errorSchema,
  },
};

export const getSDKKeysSchema: FastifySchema = {
  description: 'Get SDK keys',
  tags: ['Environments'],
  summary: 'Get all SDK keys for an environment',
  security: [{ bearerAuth: [] }],
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
          type: 'array',
          items: sdkKeySchema,
        },
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// Modify client evaluation schemas to include environment ID
export const getClientFlagsSchema: FastifySchema = {
  description: 'Get client flags',
  tags: ['Client SDK'],
  summary: 'Retrieve all active flags for a specific client',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['clientId', 'environmentId'],
    properties: {
      clientId: { type: 'string' },
      environmentId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          additionalProperties: {
            oneOf: [{ type: 'boolean' }, { type: 'string' }],
          },
        },
      },
    },
    500: errorSchema,
  },
};

export const evaluateFlagSchema: FastifySchema = {
  description: 'Evaluate flag for client',
  tags: ['Client SDK'],
  summary: 'Evaluate a specific flag for a given client',
  security: [{ apiKey: [] }],
  params: {
    type: 'object',
    required: ['flagName', 'clientId', 'environmentId'],
    properties: {
      flagName: { type: 'string' },
      clientId: { type: 'string' },
      environmentId: { type: 'string' },
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
            isActive: {
              oneOf: [{ type: 'boolean' }, { type: 'string' }],
            },
          },
        },
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};
