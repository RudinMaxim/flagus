import { FastifyRequest, FastifyReply } from 'fastify';
import { inject, injectable } from 'inversify';
import { BaseController } from './base.controller';
import { CategoryService, FeatureFlagService } from '../../../../core/flag-manager/service';
import { TYPES } from '../../../config/types';

@injectable()
export class FlagController extends BaseController {
  constructor(
    @inject(TYPES.FeatureFlagService) private readonly flagService: FeatureFlagService,
    @inject(TYPES.CategoryService) private readonly categoryService: CategoryService
  ) {
    super();
  }

  async index(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const categories = await this.categoryService.getAll();

      const flagsResult = await this.flagService.getAll();

      const isHtmx = request.headers['hx-request'] === 'true';

      if (isHtmx && request.headers['hx-target'] === 'flags-table') {
        return this.renderPartial(reply, 'components/flagList', {
          flags: flagsResult,
        });
      }

      return this.render(request, reply, 'pages/flags/index', {
        pageTitle: 'Фича-флаги',
        pageDescription: 'Управление фича-флагами в системе Flagus',
        flags: flagsResult,
        layout: 'layouts/main.hbs',
        categories,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async show(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> {
    try {
      const { id } = request.params as { id: string };
      const flag = await this.flagService.getById(id);

      if (!flag) {
        return reply.callNotFound();
      }

      const history = await this.flagService.getById(id);

      return this.render(request, reply, 'pages/flags/detail', {
        pageTitle: `Флаг: ${flag.name}`,
        pageDescription: `Подробная информация о флаге ${flag.name}`,
        flag,
        layout: 'layouts/main.hbs',
        history,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const categories = await this.categoryService.getAll();

      return this.render(request, reply, 'pages/flags/form', {
        pageTitle: 'Создание флага',
        pageDescription: 'Создание нового фича-флага в системе Flagus',
        categories,
        layout: 'layouts/main.hbs',
        flag: {
          status: true,
          ttl: null,
        },
        isNew: true,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async edit(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> {
    try {
      const { id } = request.params as { id: string };
      const flag = await this.flagService.getById(id);

      if (!flag) {
        return reply.callNotFound();
      }

      const categories = await this.categoryService.getAll();

      return this.render(request, reply, 'pages/flags/form', {
        pageTitle: `Редактирование флага: ${flag.name}`,
        pageDescription: `Редактирование фича-флага ${flag.name}`,
        categories,
        layout: 'layouts/main.hbs',
        flag,
        isNew: false,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }

  async toggleStatus(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.userId;
      const flag = await this.flagService.getById(id);

      if (!flag) {
        return reply.status(404).send({ error: 'Flag not found' });
      }

      const updatedFlag = await this.flagService.update(id, {
        ...flag,
        status: flag.status === 'active' ? 'inactive' : 'active',
        updatedBy: userId ?? 'system',
      });

      return this.renderPartial(reply, 'components/flagToggle', {
        flag: updatedFlag,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  }
}
