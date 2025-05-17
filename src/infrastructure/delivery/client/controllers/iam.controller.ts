import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from './base.controller';
import { inject, injectable } from 'inversify';
import { GroupService, UserService } from '../../../../core/access/services';
import { TYPES } from '../../../config/types';

@injectable()
export class IAMController extends BaseController {
  constructor(
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.GroupService) private groupService: GroupService
  ) {
    super();
  }

  async usersList(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const query = request.query as any;
      const { users, total } = await this.userService.listUsers();

      for (const user of users) {
        const userGroups = await this.groupService.getByUserId(user.id);
        user.groupIds = userGroups ? userGroups.map(group => group.id) : [];
      }

      return this.render(request, reply, 'pages/users/list', {
        pageTitle: 'User Management',
        pageSubtitle: 'Manage users and their access',
        users: users,
        pagination: {
          total: total,
          page: query.page,
          pages: Math.ceil(total / (query.limit || 10)),
        },
        actionButtons: [
          {
            text: 'Create Group',
            icon: 'people',
            type: 'outline-primary',
            url: '#',
            htmxAttr: `data-bs-toggle="modal" data-bs-target="#createGroupModal"`,
          },
          {
            text: 'Create User',
            icon: 'person-plus',
            type: 'primary',
            url: '#',
            htmxAttr: 'data-bs-toggle="modal" data-bs-target="#createUserModal"',
          },
        ],
        showEnvironmentSelector: true,
        currentEnvironment: 'development',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async rolesIndex(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      return this.render(request, reply, 'pages/users/roles', {
        pageTitle: 'Role Management',
        pageSubtitle: 'System roles and permissions',
        showEnvironmentSelector: true,
        currentEnvironment: 'development',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async groupsList(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const query = request.query as any;
      const { groups, total } = await this.groupService.listGroups();

      return this.render(request, reply, 'pages/users/groups', {
        pageTitle: 'Group Management',
        pageSubtitle: 'Manage user groups and permissions',
        groups,
        pagination: {
          total: total,
          page: query.page,
          pages: Math.ceil(total / (query.limit || 10)),
        },
        actionButtons: [
          {
            text: 'Create Group',
            icon: 'people',
            type: 'primary',
            url: '#',
            htmxAttr: 'data-bs-toggle="modal" data-bs-target="#createGroupModal"',
          },
        ],
        showEnvironmentSelector: true,
        currentEnvironment: 'development',
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }
}
