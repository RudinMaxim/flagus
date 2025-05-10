import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/user.schema';
import { UserHttpController } from '../controllers/user.http.controller';
import { TYPES } from '../../../../config/types';
import { AuthMiddleware } from '../../../middlewares';

export async function userRoutes(fastify: FastifyInstance) {
  const userController = fastify.container.get<UserHttpController>(TYPES.UserHttpController);
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllUsersSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: userController.getAllUsers.bind(userController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getUserByIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: userController.getUserById.bind(userController),
  });

  fastify.route({
    method: 'GET',
    url: '/email/:email',
    schema: schemas.getUserByEmailSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: userController.getUserByEmail.bind(userController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createUserSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: userController.createUser.bind(userController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateUserSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: userController.updateUser.bind(userController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteUserSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: userController.deleteUser.bind(userController),
  });
}
