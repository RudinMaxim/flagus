import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'inversify';
import { TUserRole, CreateUserDTO, UpdateUserDTO } from '../../../../../core/access/interfaces';
import { UserService } from '../../../../../core/access/services';
import { TYPES } from '../../../../config/types';

@injectable()
export class UserHttpController {
  constructor(@inject(TYPES.UserService) private readonly userService: UserService) {}

  async getAllUsers(
    request: FastifyRequest<{
      Querystring: {
        skip?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        role?: TUserRole;
        isActive?: boolean;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { skip, limit, sortBy, sortOrder, role, isActive } = request.query;

      const filter: { role?: TUserRole; isActive?: boolean } = {};
      if (role !== undefined) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive;

      const result = await this.userService.listUsers({
        skip,
        limit,
        sortBy,
        sortOrder,
        filter,
      });

      return reply.code(200).send({
        data: result.users,
        meta: {
          total: result.total,
          skip: skip || 0,
          limit: limit || result.total,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error fetching users');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch users',
      });
    }
  }

  async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const user = await this.userService.getUserById(request.params.id);
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }
      return reply.code(200).send({ data: user });
    } catch (error) {
      request.log.error(error, `Error fetching user with ID: ${request.params.id}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch user',
      });
    }
  }

  async createUser(
    request: FastifyRequest<{
      Body: CreateUserDTO & { createdBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { createdBy, ...userData } = request.body;
      const newUser = await this.userService.createUser(userData, createdBy);

      return reply.code(201).send({ data: newUser });
    } catch (error) {
      request.log.error(error, 'Error creating new user');
      if ((error as Error).message.includes('уже существует')) {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: (error as Error).message,
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to create user',
      });
    }
  }

  async updateUser(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateUserDTO & { updatedBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { updatedBy, ...userData } = request.body;
      const updatedUser = await this.userService.updateUser(request.params.id, userData, updatedBy);

      return reply.code(200).send({ data: updatedUser });
    } catch (error) {
      request.log.error(error, `Error updating user with ID: ${request.params.id}`);
      if ((error as Error).message.includes('не найден')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update user',
      });
    }
  }

  async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await this.userService.deleteUser(request.params.id);
      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }
      return reply.code(204).send();
    } catch (error) {
      request.log.error(error, `Error deleting user with ID: ${request.params.id}`);
      if ((error as Error).message.includes('не найден')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete user',
      });
    }
  }

  async getUserByEmail(
    request: FastifyRequest<{ Params: { email: string } }>,
    reply: FastifyReply
  ) {
    try {
      const user = await this.userService.getUserByEmail(request.params.email);
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }
      return reply.code(200).send({ data: user });
    } catch (error) {
      request.log.error(error, `Error fetching user with email: ${request.params.email}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch user by email',
      });
    }
  }
}
