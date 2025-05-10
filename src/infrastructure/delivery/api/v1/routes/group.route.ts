import { FastifyInstance } from 'fastify';
import * as groupSchemas from '../schemas/group.schema';
import * as userSchemas from '../schemas/user.schema';
import { GroupHttpController } from '../controllers/group.http.controller';
import { TYPES } from '../../../../config/types';
import { AuthMiddleware } from '../../../middlewares';

export async function groupRoutes(fastify: FastifyInstance) {
  const groupController = fastify.container.get<GroupHttpController>(TYPES.GroupHttpController);
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  fastify.route({
    method: 'GET',
    url: '/',
    schema: groupSchemas.getAllGroupsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.getAllGroups.bind(groupController),
  });

  fastify.route({
    method: 'GET',
    url: '/:id',
    schema: groupSchemas.getGroupByIdSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.getGroupById.bind(groupController),
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: groupSchemas.createGroupSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.createGroup.bind(groupController),
  });

  fastify.route({
    method: 'PUT',
    url: '/:id',
    schema: groupSchemas.updateGroupSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.updateGroup.bind(groupController),
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: groupSchemas.deleteGroupSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.deleteGroup.bind(groupController),
  });

  fastify.route({
    method: 'POST',
    url: '/users/:userId/add',
    schema: userSchemas.addUserToGroupsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.addUserToGroups.bind(groupController),
  });

  fastify.route({
    method: 'POST',
    url: '/users/:userId/remove',
    schema: userSchemas.removeUserFromGroupsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.removeUserFromGroups.bind(groupController),
  });

  fastify.route({
    method: 'GET',
    url: '/users/:userId',
    schema: userSchemas.getUserGroupsSchema,
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    handler: groupController.getUserGroups.bind(groupController),
  });
}
