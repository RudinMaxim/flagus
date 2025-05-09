import { FastifyInstance } from 'fastify';
import { CategoryHttpController } from '../controllers/category.http.controller';
import { TYPES } from '../../../../config/types';
import * as schemas from '../schemas/category.schema';
import { AuthMiddleware } from '../../../middlewares';

export async function categoryRoutes(fastify: FastifyInstance) {
  const categoryController = fastify.container.get<CategoryHttpController>(
    TYPES.CategoryHttpController
  );
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllCategoriesSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.getAllCategories.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getCategoryByIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.getCategoryById.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/roots',
    schema: schemas.getRootCategoriesSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.getRootCategories.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/subcategories',
    schema: schemas.getSubcategoriesSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.getSubcategories.bind(categoryController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createCategorySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.createCategory.bind(categoryController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateCategorySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.updateCategory.bind(categoryController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteCategorySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.deleteCategory.bind(categoryController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id/move',
    schema: schemas.moveCategorySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.moveCategory.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: schemas.getCtatsCategorySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.getCategoryStatistics.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/children-tree',
    schema: schemas.getChildrenTreeCategorySchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: categoryController.getCategoryChildrenTree.bind(categoryController),
  });
}
