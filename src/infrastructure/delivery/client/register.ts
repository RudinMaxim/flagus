import path from 'path';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import { PageController, DashboardController } from './controllers';
import { TYPES } from '../../config/types';
import {
  AuditService,
  CategoryService,
  FeatureFlagService,
} from '../../../core/flag-manager/service';
import { AuthMiddleware } from '../middlewares';
import { registerHandlebarsHelpers } from '../../../shared/utils';
import { AuthController } from './controllers/auth.controller';
import { AuthService, UserService } from '../../../core/access/services';

export async function registerClient(app: FastifyInstance): Promise<void> {
  await app.register(fastifyView, {
    engine: {
      handlebars,
    },
    root: path.join(__dirname, 'templates'),
    layout: 'layouts/main',
    viewExt: 'hbs',
    options: {
      partials: {
        header: 'partials/header.hbs',
        sidebar: 'partials/sidebar.hbs',
        footer: 'partials/footer.hbs',
      },
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
  });

  registerHandlebarsHelpers(handlebars);

  const flagService = app.container.get<FeatureFlagService>(TYPES.FeatureFlagService);
  const auditService = app.container.get<AuditService>(TYPES.AuditService);
  const categoryService = app.container.get<CategoryService>(TYPES.CategoryService);
  const authService = app.container.get<AuthService>(TYPES.AuthService);

  const authMiddleware = app.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  const controllers = {
    page: new PageController(),
    dashboard: new DashboardController({
      flagService,
      categoryService,
      auditService,
    }),
    auth: new AuthController({
      authService,
    }),
  };

  app.get(
    '/',
    { preHandler: authMiddleware.authenticateUI },
    controllers.dashboard.index.bind(controllers.dashboard)
  );
  app.get('/login', controllers.page.login.bind(controllers.page));
  app.get('/setup', controllers.page.setup.bind(controllers.page));

  // Register other routes here
  // ...

  // API client routes for HTMX interactions
  app.register(async instance => {
    instance.addHook('preHandler', authMiddleware.authenticateUI);

    // Flag client API routes
    // instance.get(
    //   '/api/client/flags/search',
    //   controllers.dashboard.searchFlags.bind(controllers.dashboard)
    // );
    // instance.get(
    //   '/api/client/flags/validate-name',
    //   controllers.dashboard.validateFlagName.bind(controllers.dashboard)
    // );

    // Other client API routes
    // ...
  });
}
