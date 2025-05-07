import { FastifyInstance } from 'fastify';
import * as schemas from '../schemas/auth.schema';
import { AuthHttpController } from '../controllers/auth.http.controller';
import { TYPES } from '../../../../config/types';

export default async function (fastify: FastifyInstance) {
  const authController = fastify.container.get<AuthHttpController>(TYPES.AuthHttpController);

  fastify.route({
    method: 'POST',
    url: '/login',
    schema: schemas.loginSchema,
    handler: authController.login.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/refresh',
    schema: schemas.refreshTokenSchema,
    handler: authController.refreshToken.bind(authController),
  });

  fastify.route({
    method: 'GET',
    url: '/check-first-user',
    schema: schemas.checkFirstUserSchema,
    handler: authController.checkFirstUser.bind(authController),
  });

  fastify.route({
    method: 'POST',
    url: '/create-first-admin',
    schema: schemas.createFirstAdminSchema,
    handler: authController.createFirstAdmin.bind(authController),
  });
}
