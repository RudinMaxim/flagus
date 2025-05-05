import { FastifySchema } from 'fastify';

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

const categorySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    parentId: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

// GET /categories
export const getAllCategoriesSchema: FastifySchema = {
  description: 'Get all categories',
  tags: ['Categories'],
  summary: 'Retrieve all flag categories',
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: categorySchema,
        },
      },
    },
    500: errorSchema,
  },
};

// GET /categories/:id
export const getCategoriesByIdSchema: FastifySchema = {
  description: 'Get category by ID',
  tags: ['Categories'],
  summary: 'Retrieve a specific category by its ID',
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
        data: categorySchema,
      },
    },
    404: errorSchema,
    500: errorSchema,
  },
};

// GET /categories/roots
export const getRootsSchema: FastifySchema = {
  description: 'Get root categories',
  tags: ['Categories'],
  summary: 'Retrieve all root categories (categories without parent)',
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: categorySchema,
        },
      },
    },
    500: errorSchema,
  },
};

// GET /categories/:id/subcategories
export const getSubcategoriesSchema: FastifySchema = {
  description: 'Get subcategories',
  tags: ['Categories'],
  summary: 'Retrieve all subcategories for a given category',
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
          items: categorySchema,
        },
      },
    },
    500: errorSchema,
  },
};

// POST /categories
export const createSchema: FastifySchema = {
  description: 'Create new category',
  tags: ['Categories'],
  summary: 'Create a new flag category',
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      parentId: { type: ['string', 'null'] },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        data: categorySchema,
      },
    },
    400: errorSchema,
    409: errorSchema,
    500: errorSchema,
  },
};

// PUT /categories/:id
export const updateSchema: FastifySchema = {
  description: 'Update category',
  tags: ['Categories'],
  summary: 'Update an existing category',
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
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      parentId: { type: ['string', 'null'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: categorySchema,
      },
    },
    400: errorSchema,
    404: errorSchema,
    409: errorSchema,
    500: errorSchema,
  },
};

// DELETE /categories/:id
export const deleteSchema: FastifySchema = {
  description: 'Delete category',
  tags: ['Categories'],
  summary: 'Delete a category (only if it has no subcategories)',
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
    400: errorSchema,
    404: errorSchema,
    500: errorSchema,
  },
};
