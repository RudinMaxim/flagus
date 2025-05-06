import { FastifySchema } from 'fastify';

const metadataSchema = {
  type: 'object',
  properties: {
    createdBy: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedBy: { type: ['string', 'null'] },
    updatedAt: { type: ['string', 'null'], format: 'date-time' },
  },
};

const categorySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    parentId: { type: ['string', 'null'] },
    depth: { type: 'integer', minimum: 0, maximum: 3 },
    metadata: metadataSchema,
  },
  required: ['id', 'name', 'depth'],
};

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
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
export const getCategoryByIdSchema: FastifySchema = {
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
export const getRootCategoriesSchema: FastifySchema = {
  description: 'Get root categories',
  tags: ['Categories'],
  summary: 'Retrieve all root categories (depth=0)',
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
export const createCategorySchema: FastifySchema = {
  description: 'Create new category',
  tags: ['Categories'],
  summary: 'Create a new flag category',
  body: {
    type: 'object',
    required: ['name', 'createdBy'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      parentId: { type: ['string', 'null'] },
      createdBy: { type: 'string' },
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
export const updateCategorySchema: FastifySchema = {
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
    required: ['updatedBy'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      parentId: { type: ['string', 'null'] },
      updatedBy: { type: 'string' },
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
export const deleteCategorySchema: FastifySchema = {
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

// GET /categories/stats
export const getCtatsCategorySchema: FastifySchema = {
  description: 'Get category statistics',
  tags: ['Categories'],
  summary: 'Retrieve statistics for all categories',
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
              flagsCount: { type: 'integer' },
            },
          },
        },
      },
    },
    500: errorSchema,
  },
};

// GET /categories/:id/children-tree
export const getChildrenTreeCategorySchema: FastifySchema = {
  description: 'Get children tree of a category',
  tags: ['Categories'],
  summary: 'Retrieve the tree of children categories for a given category',
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
    404: errorSchema,
    500: errorSchema,
  },
};

// PUT /categories/:id/move
export const moveCategorySchema: FastifySchema = {
  description: 'Move a category to a new parent',
  tags: ['Categories'],
  summary: 'Move a category to a new parent category',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['newParentId'],
    properties: {
      newParentId: { type: ['string', 'null'] },
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
    500: errorSchema,
  },
};
