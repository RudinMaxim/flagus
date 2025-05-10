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

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
    isActive: { type: 'boolean' },
    groupIds: { type: 'array', items: { type: 'string' } },
    metadata: metadataSchema,
  },
};

// GET /users
export const getAllUsersSchema: FastifySchema = {
  description: 'Get all users',
  tags: ['Users'],
  summary: 'Retrieve all users with pagination and filtering',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      skip: { type: 'integer', minimum: 0 },
      limit: { type: 'integer', minimum: 1 },
      sortBy: { type: 'string', enum: ['username', 'email', 'role', 'isActive', 'createdAt'] },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] },
      role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
      isActive: { type: 'boolean' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: userSchema,
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

// GET /users/:id
export const getUserByIdSchema: FastifySchema = {
  description: 'Get user by ID',
  tags: ['Users'],
  summary: 'Retrieve a specific user by ID',
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
        data: userSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// GET /users/email/:email
export const getUserByEmailSchema: FastifySchema = {
  description: 'Get user by email',
  tags: ['Users'],
  summary: 'Retrieve a specific user by email',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: userSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// POST /users
export const createUserSchema: FastifySchema = {
  description: 'Create new user',
  tags: ['Users'],
  summary: 'Create a new user',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['username', 'email', 'password', 'role', 'createdBy'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['ADMIN', 'USER', 'MANAGER'] },
      createdBy: { type: 'string' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: userSchema,
      },
    },
    409: errorSchema,
    500: errorSchema,
  },
};

// PUT /users/:id
export const updateUserSchema: FastifySchema = {
  description: 'Update user',
  tags: ['Users'],
  summary: 'Update an existing user',
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
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
      isActive: { type: 'boolean' },
      groupIds: { type: 'array', items: { type: 'string' } },
      updatedBy: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: userSchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// DELETE /users/:id
export const deleteUserSchema: FastifySchema = {
  description: 'Delete user',
  tags: ['Users'],
  summary: 'Delete a user',
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

// POST /groups/users/:userId/add
export const addUserToGroupsSchema: FastifySchema = {
  description: 'Add user to groups',
  tags: ['Groups'],
  summary: 'Add a user to multiple groups',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['groupIds', 'updatedBy'],
    properties: {
      groupIds: { type: 'array', items: { type: 'string' } },
      updatedBy: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: userSchema,
        message: { type: 'string' },
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// POST /groups/users/:userId/remove
export const removeUserFromGroupsSchema: FastifySchema = {
  description: 'Remove user from groups',
  tags: ['Groups'],
  summary: 'Remove a user from multiple groups',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['groupIds', 'updatedBy'],
    properties: {
      groupIds: { type: 'array', items: { type: 'string' } },
      updatedBy: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: userSchema,
        message: { type: 'string' },
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// GET /groups/users/:userId
export const getUserGroupsSchema: FastifySchema = {
  description: 'Get user groups',
  tags: ['Groups'],
  summary: 'Retrieve all groups a user belongs to',
  security: [{ bearerAuth: [] }],
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
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              metadata: metadataSchema,
            },
          },
        },
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};
