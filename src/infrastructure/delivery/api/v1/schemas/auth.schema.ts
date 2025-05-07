import { FastifySchema } from 'fastify';

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

const tokenSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    expiresIn: { type: 'integer' },
  },
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['ADMIN', 'USER', 'MANAGER'] },
    isActive: { type: 'boolean' },
    metadata: {
      type: 'object',
      properties: {
        createdBy: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedBy: { type: ['string', 'null'] },
        updatedAt: { type: ['string', 'null'], format: 'date-time' },
      },
    },
  },
};

// POST /auth/login
export const loginSchema: FastifySchema = {
  description: 'User login',
  tags: ['Authentication'],
  summary: 'Authenticate user and receive access tokens',
  security: [{ apiKey: [] }],
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: tokenSchema,
      },
    },
    401: errorSchema,
    500: errorSchema,
  },
};

// POST /auth/refresh
export const refreshTokenSchema: FastifySchema = {
  description: 'Refresh token',
  tags: ['Authentication'],
  summary: 'Get new access token using refresh token',
  security: [{ apiKey: [] }],
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: tokenSchema,
      },
    },
    401: errorSchema,
    500: errorSchema,
  },
};

// GET /auth/check-first-user
export const checkFirstUserSchema: FastifySchema = {
  description: 'Check first user',
  tags: ['Authentication'],
  summary: 'Check if first admin user needs to be created',
  security: [{ apiKey: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            isFirstUser: { type: 'boolean' },
          },
        },
      },
    },
    500: errorSchema,
  },
};

// POST /auth/create-first-admin
export const createFirstAdminSchema: FastifySchema = {
  description: 'Create first admin',
  tags: ['Authentication'],
  summary: 'Create the first administrator account',
  security: [{ apiKey: [] }],
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
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
