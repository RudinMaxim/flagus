import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../../../../core/model';
import { CategoryService } from '../../../../../core/service';
import { TYPES } from '../../../../config/types';
import * as schemas from '../../schemas/category.schema';

export default async function (fastify: FastifyInstance) {
  const categoryService = fastify.container.get<CategoryService>(TYPES.CategoryService);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllCategoriesSchema,
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categories = await categoryService.getAll();
        return reply.code(200).send({ data: categories });
      } catch (error) {
        _request.log.error(error, 'Error fetching all categories');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch categories',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getCategoryByIdSchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const category = await categoryService.getById(request.params.id);
        if (!category) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Category not found',
          });
        }
        return reply.code(200).send({ data: category });
      } catch (error) {
        request.log.error(error, `Error fetching category with ID: ${request.params.id}`);
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch category',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/roots',
    schema: schemas.getRootCategoriesSchema,
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categories = await categoryService.getRootCategories();
        return reply.code(200).send({ data: categories });
      } catch (error) {
        _request.log.error(error, 'Error fetching root categories');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch root categories',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id/subcategories',
    schema: schemas.getSubcategoriesSchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const subcategories = await categoryService.getSubcategories(request.params.id);
        return reply.code(200).send({ data: subcategories });
      } catch (error) {
        request.log.error(
          error,
          `Error fetching subcategories for category ID: ${request.params.id}`
        );
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch subcategories',
        });
      }
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createCategorySchema,
    handler: async (request: FastifyRequest<{ Body: CreateCategoryDTO }>, reply: FastifyReply) => {
      try {
        const newCategory = await categoryService.create(request.body);
        return reply.code(201).send({ data: newCategory });
      } catch (error) {
        request.log.error(error, 'Error creating new category');

        if ((error as Error).message.includes('already exists')) {
          return reply.code(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: (error as Error).message,
          });
        }

        if (
          (error as Error).message.includes('not found') ||
          (error as Error).message.includes('exceeded') ||
          (error as Error).message.includes('Cyclic dependency')
        ) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: (error as Error).message,
          });
        }

        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to create category',
        });
      }
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateCategorySchema,
    handler: async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateCategoryDTO;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const updatedCategory = await categoryService.update(request.params.id, request.body);
        if (!updatedCategory) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Category not found',
          });
        }
        return reply.code(200).send({ data: updatedCategory });
      } catch (error) {
        request.log.error(error, `Error updating category with ID: ${request.params.id}`);

        if ((error as Error).message.includes('already exists')) {
          return reply.code(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: (error as Error).message,
          });
        }

        if (
          (error as Error).message.includes('its own parent') ||
          (error as Error).message.includes('not found') ||
          (error as Error).message.includes('exceeded') ||
          (error as Error).message.includes('Cyclic dependency')
        ) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: (error as Error).message,
          });
        }

        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to update category',
        });
      }
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteCategorySchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const result = await categoryService.delete(request.params.id);
        if (!result) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Category not found',
          });
        }
        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, `Error deleting category with ID: ${request.params.id}`);

        if ((error as Error).message.includes('with subcategories')) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: (error as Error).message,
          });
        }

        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to delete category',
        });
      }
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/:id/move',
    schema: schemas.moveCategorySchema,
    handler: async (
      request: FastifyRequest<{ Params: { id: string }; Body: { newParentId: string | null } }>,
      reply: FastifyReply
    ) => {
      try {
        const movedCategory = await categoryService.moveCategory(
          request.params.id,
          request.body.newParentId
        );
        if (!movedCategory) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Category not found or invalid parent',
          });
        }
        return reply.code(200).send({ data: movedCategory });
      } catch (error) {
        request.log.error(error, `Error moving category with ID: ${request.params.id}`);

        if ((error as Error).message.includes('Cyclic dependency')) {
          return reply.code(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Cyclic dependency detected',
          });
        }

        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to move category',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: schemas.getCtatsCategorySchema,
    handler: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = await categoryService.getCategoryStatistics();
        return reply.code(200).send({ data: stats });
      } catch (error) {
        _request.log.error(error, 'Error fetching category statistics');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch category statistics',
        });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:id/children-tree',
    schema: schemas.getChildrenTreeCategorySchema,
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const childrenTree = await categoryService.getCategoryTree(request.params.id);
        if (!childrenTree) {
          return reply.code(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Category not found or has no children',
          });
        }
        return reply.code(200).send({ data: childrenTree });
      } catch (error) {
        request.log.error(
          error,
          `Error fetching children tree for category ID: ${request.params.id}`
        );
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to fetch children tree',
        });
      }
    },
  });
}
