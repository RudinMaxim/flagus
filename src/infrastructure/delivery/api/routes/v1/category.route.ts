import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../../../../core/flag-management/model';
import { CategoryService } from '../../../../../core/flag-management/service';
import { TYPES } from '../../../../config/types';
import * as schemas from '../../schemas/category.schema';

export default async function (fastify: FastifyInstance) {
  const categoryService = fastify.container.get<CategoryService>(TYPES.CategoryService);

  // Get all categories
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

  // Get a specific category by ID
  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getCategoriesByIdSchema,
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

  // Get root categories
  fastify.route({
    method: 'GET',
    url: '/roots',
    schema: schemas.getRootsSchema,
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

  // Get subcategories
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

  // Create a new category
  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createSchema,
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

  // Update a category
  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateSchema,
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

  // Delete a category
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteSchema,
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
}
