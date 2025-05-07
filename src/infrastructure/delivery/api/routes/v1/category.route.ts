import { FastifyInstance } from 'fastify';
import { CategoryHttpController } from '../../controllers/v1/category.http.controller';
import { TYPES } from '../../../../config/types';
import * as schemas from '../../schemas/category.schema';

export default async function (fastify: FastifyInstance) {
  const categoryController = fastify.container.get<CategoryHttpController>(
    TYPES.CategoryHttpController
  );

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllCategoriesSchema,
    handler: categoryController.getAllCategories.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getCategoryByIdSchema,
    handler: categoryController.getCategoryById.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/roots',
    schema: schemas.getRootCategoriesSchema,
    handler: categoryController.getRootCategories.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/subcategories',
    schema: schemas.getSubcategoriesSchema,
    handler: categoryController.getSubcategories.bind(categoryController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createCategorySchema,
    handler: categoryController.createCategory.bind(categoryController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateCategorySchema,
    handler: categoryController.updateCategory.bind(categoryController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteCategorySchema,
    handler: categoryController.deleteCategory.bind(categoryController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id/move',
    schema: schemas.moveCategorySchema,
    handler: categoryController.moveCategory.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/stats',
    schema: schemas.getCtatsCategorySchema,
    handler: categoryController.getCategoryStatistics.bind(categoryController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id/children-tree',
    schema: schemas.getChildrenTreeCategorySchema,
    handler: categoryController.getCategoryChildrenTree.bind(categoryController),
  });
}
