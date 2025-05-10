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
};

const groupSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    metadata: metadataSchema,
  },
};

// GET /groups
export const getAllGroupsSchema: FastifySchema = {
  description: 'Get all groups',
  tags: ['Groups'],
  summary: 'Retrieve all groups with pagination and filtering',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      skip: { type: 'integer', minimum: 0 },
      limit: { type: 'integer', minimum: 1 },
      sortBy: { type: 'string', enum: ['name', 'createdAt'] },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] },
      name: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: groupSchema,
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            skip: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
    500: errorSchema,
  },
};

// GET /groups/:id
export const getGroupByIdSchema: FastifySchema = {
  description: 'Get group by ID',
  tags: ['Groups'],
  summary: 'Retrieve a specific group by ID',
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
        data: groupSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// POST /groups
export const createGroupSchema: FastifySchema = {
  description: 'Create new group',
  tags: ['Groups'],
  summary: 'Create a new group',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'createdBy'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      description: { type: 'string', maxLength: 255 },
      createdBy: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: groupSchema,
      },
    },
    409: errorSchema,
    500: errorSchema,
  },
};

// PUT /groups/:id
export const updateGroupSchema: FastifySchema = {
  description: 'Update group',
  tags: ['Groups'],
  summary: 'Update an existing group',
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
      name: { type: 'string', minLength: 2, maxLength: 50 },
      description: { type: 'string', maxLength: 255 },
      updatedBy: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: groupSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// DELETE /groups/:id
export const deleteGroupSchema: FastifySchema = {
  description: 'Delete group',
  tags: ['Groups'],
  summary: 'Delete a group',
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
