import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../../config/types';
import { CategoryService } from '../../../../../core/flag-manager/service';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../../../../core/flag-manager/model';

@injectable()
export class CategoryHttpController {
  constructor(@inject(TYPES.CategoryService) private readonly categoryService: CategoryService) {}

  async getAllCategories(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await this.categoryService.getAll();
      return reply.code(200).send({ data: categories });
    } catch (error) {
      _request.log.error(error, 'Error fetching all categories');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch categories',
      });
    }
  }

  async getCategoryById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const category = await this.categoryService.getById(request.params.id);
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
  }

  async getRootCategories(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await this.categoryService.getRootCategories();
      return reply.code(200).send({ data: categories });
    } catch (error) {
      _request.log.error(error, 'Error fetching root categories');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch root categories',
      });
    }
  }

  async getSubcategories(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const subcategories = await this.categoryService.getSubcategories(request.params.id);
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
  }

  async createCategory(request: FastifyRequest<{ Body: CreateCategoryDTO }>, reply: FastifyReply) {
    try {
      const newCategory = await this.categoryService.create(request.body);
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
  }

  async updateCategory(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateCategoryDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      const updatedCategory = await this.categoryService.update(request.params.id, request.body);
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
  }

  async deleteCategory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.categoryService.delete(request.params.id, request.user?.userId ?? 'system');
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
  }

  async moveCategory(
    request: FastifyRequest<{ Params: { id: string }; Body: { newParentId: string | null } }>,
    reply: FastifyReply
  ) {
    try {
      const movedCategory = await this.categoryService.moveCategory(
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
  }

  async getCategoryChildrenTree(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const childrenTree = await this.categoryService.getCategoryTree(request.params.id);
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
  }
}
