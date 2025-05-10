import path from 'path';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import { PageController } from './controllers';
import { CategoryService, FeatureFlagService } from '../../../core/flag-manager/service';
import { AuthMiddleware } from '../middlewares';
import { registerHandlebarsHelpers } from '../../../shared/utils';
import { TYPES } from '../../config/types';
import { FlagController } from './controllers/flag.controller';

export async function registerClient(app: FastifyInstance): Promise<void> {
  await app.register(fastifyView, {
    engine: {
      handlebars,
    },
    root: path.join(__dirname, 'templates'),
    viewExt: 'hbs',
    options: {
      partials: {
        header: 'components/header.hbs',
        sidebar: 'components/sidebar.hbs',
        footer: 'components/footer.hbs',
        notifications: 'components/notifications.hbs',
        head: 'partials/head.hbs',
        scripts: 'partials/scripts.hbs',
      },
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
    decorateReply: false,
  });

  app.get('/robots.txt', (request, reply) => {
    reply.sendFile('robots.txt', path.join(__dirname, 'assets'));
  });

  registerHandlebarsHelpers(handlebars);

  const pageController = app.container.get<PageController>(TYPES.PageController);
  const flagController = app.container.get<FlagController>(TYPES.FlagController);
  const authMiddleware = app.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  app.get('/login', pageController.login.bind(pageController));
  app.get('/setup', pageController.setup.bind(pageController));

  app.register(async instance => {
    instance.addHook('preHandler', authMiddleware.authenticateUI);

    instance.get('/', flagController.index.bind(flagController));
    instance.get('/flags', flagController.index.bind(flagController));
    instance.get('/flags/create', flagController.create.bind(flagController));
    instance.get('/flags/:id', flagController.show.bind(flagController));
    instance.get('/flags/:id/edit', flagController.edit.bind(flagController));
    instance.post('/flags/:id/toggle', flagController.toggleStatus.bind(flagController));
  });

  app.setErrorHandler(pageController.error.bind(pageController));
  app.setNotFoundHandler(pageController.notFound.bind(pageController));
}
