import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'inversify';
import { GroupService } from '../../../../../core/access/services';
import { TYPES } from '../../../../config/types';
import { Group } from '../../../../../core/access/model/group.model';
import { UserService } from '../../../../../core/access/services';

@injectable()
export class GroupHttpController {
  constructor(
    @inject(TYPES.GroupService) private readonly groupService: GroupService,
    @inject(TYPES.UserService) private readonly userService: UserService
  ) {}

  async getAllGroups(
    request: FastifyRequest<{
      Querystring: {
        skip?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        name?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { skip, limit, sortBy, sortOrder, name } = request.query;

      const filter: Partial<Group> = {};
      if (name) filter.name = name;

      const result = await this.groupService.listGroups({
        skip,
        limit,
        sortBy,
        sortOrder,
        filter,
      });

      return reply.code(200).send({
        data: result.groups,
        meta: {
          total: result.total,
          skip: skip || 0,
          limit: limit || result.total,
        },
      });
    } catch (error) {
      request.log.error(error, 'Error fetching groups');
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch groups',
      });
    }
  }

  async getGroupById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const group = await this.groupService.getGroupById(request.params.id);
      if (!group) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Group not found',
        });
      }
      return reply.code(200).send({ data: group });
    } catch (error) {
      request.log.error(error, `Error fetching group with ID: ${request.params.id}`);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch group',
      });
    }
  }

  async createGroup(
    request: FastifyRequest<{
      Body: { name: string; description?: string; createdBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { name, description, createdBy } = request.body;
      const newGroup = await this.groupService.createGroup(createdBy, name, description);

      return reply.code(201).send({ data: newGroup });
    } catch (error) {
      request.log.error(error, 'Error creating new group');
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
        message: 'Failed to create group',
      });
    }
  }

  async updateGroup(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { name?: string; description?: string; updatedBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { name, description, updatedBy } = request.body;
      const updates = { name, description };

      const updatedGroup = await this.groupService.updateGroup(
        request.params.id,
        updates,
        updatedBy
      );

      return reply.code(200).send({ data: updatedGroup });
    } catch (error) {
      request.log.error(error, `Error updating group with ID: ${request.params.id}`);
      if ((error as Error).message.includes('не найдена')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Group not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to update group',
      });
    }
  }

  async deleteGroup(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await this.groupService.deleteGroup(request.params.id);
      if (!result) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Group not found',
        });
      }
      return reply.code(204).send();
    } catch (error) {
      request.log.error(error, `Error deleting group with ID: ${request.params.id}`);
      if ((error as Error).message.includes('не найдена')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Group not found',
        });
      }
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to delete group',
      });
    }
  }

  async addUserToGroups(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: { groupIds: string[]; updatedBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const { groupIds, updatedBy } = request.body;

      const updatedUser = await this.userService.addUserToGroups(userId, groupIds, updatedBy);

      return reply.code(200).send({
        data: updatedUser,
        message: 'User successfully added to groups',
      });
    } catch (error) {
      request.log.error(error, `Error adding user ${request.params.userId} to groups`);

      if ((error as Error).message.includes('Пользователь не найден')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      if ((error as Error).message.includes('Некоторые группы не найдены')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Some groups not found',
        });
      }

      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to add user to groups',
      });
    }
  }

  async removeUserFromGroups(
    request: FastifyRequest<{
      Params: { userId: string };
      Body: { groupIds: string[]; updatedBy: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const { groupIds, updatedBy } = request.body;

      const updatedUser = await this.userService.removeUserFromGroups(userId, groupIds, updatedBy);

      return reply.code(200).send({
        data: updatedUser,
        message: 'User successfully removed from groups',
      });
    } catch (error) {
      request.log.error(error, `Error removing user ${request.params.userId} from groups`);

      if ((error as Error).message.includes('Пользователь не найден')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to remove user from groups',
      });
    }
  }

  async getUserGroups(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;

      const groups = await this.userService.getUserGroups(userId);

      return reply.code(200).send({
        data: groups,
      });
    } catch (error) {
      request.log.error(error, `Error fetching groups for user ${request.params.userId}`);

      if ((error as Error).message.includes('Пользователь не найден')) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch user groups',
      });
    }
  }
}
