import path from 'path';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import { PageController, DashboardController } from './controllers';
import {
  AuditService,
  CategoryService,
  FeatureFlagService,
} from '../../../core/flag-manager/service';
import { AuthMiddleware } from '../middlewares';
import { registerHandlebarsHelpers } from '../../../shared/utils';
import { TYPES } from '../../config/types';

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

  const flagService = app.container.get<FeatureFlagService>(TYPES.FeatureFlagService);
  const auditService = app.container.get<AuditService>(TYPES.AuditService);
  const categoryService = app.container.get<CategoryService>(TYPES.CategoryService);

  const authMiddleware = app.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  const controllers = {
    page: new PageController(),
    dashboard: new DashboardController({
      flagService,
      categoryService,
      auditService,
    }),
  };

  // app.addHook('onSend', (request, reply, payload, done) => {
  //   reply.header('X-Content-Type-Options', 'nosniff');
  //   reply.header('X-Frame-Options', 'DENY');
  //   reply.header('X-XSS-Protection', '1; mode=block');
  //   reply.header('Referrer-Policy', 'same-origin');
  //   done(null, payload);
  // });

  app.get('/login', controllers.page.login.bind(controllers.page));
  app.get('/setup', controllers.page.setup.bind(controllers.page));

  app.register(async instance => {
    instance.addHook('preHandler', authMiddleware.authenticateUI);
    instance.get('/', controllers.dashboard.index.bind(controllers.dashboard));
  });

  app.setErrorHandler(controllers.page.error.bind(controllers.page));
  app.setNotFoundHandler(controllers.page.notFound.bind(controllers.page));
}
