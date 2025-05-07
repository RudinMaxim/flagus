import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/user.schema';
import { UserHttpController } from '../controllers/user.http.controller';
import { TYPES } from '../../../../config/types';

export default async function (fastify: FastifyInstance) {
  const userController = fastify.container.get<UserHttpController>(TYPES.UserHttpController);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: schemas.getAllUsersSchema,
    handler: userController.getAllUsers.bind(userController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: schemas.getUserByIdSchema,
    handler: userController.getUserById.bind(userController),
  });

  fastify.route({
    method: 'GET',
    url: '/email/:email',
    schema: schemas.getUserByEmailSchema,
    handler: userController.getUserByEmail.bind(userController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: schemas.createUserSchema,
    handler: userController.createUser.bind(userController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: schemas.updateUserSchema,
    handler: userController.updateUser.bind(userController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: schemas.deleteUserSchema,
    handler: userController.deleteUser.bind(userController),
  });
}
