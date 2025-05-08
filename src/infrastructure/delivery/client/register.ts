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

export default async function registerClient(fastify: FastifyInstance): Promise<void> {
  // Register view engine
  await fastify.register(fastifyView, {
    engine: {
      handlebars,
    },
    root: path.join(__dirname, 'templates'),
    layout: 'layouts/main',
    viewExt: 'hbs',
    options: {
      partials: {
        header: 'partials/header',
        sidebar: 'partials/sidebar',
        footer: 'partials/footer',
      },
    },
  });

  // Register static assets
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
  });

  // Setup handlebars helpers
  registerHandlebarsHelpers(handlebars);

  // Get service dependencies from container
  const flagService = fastify.container.get<FeatureFlagService>(TYPES.FeatureFlagService);
  const auditService = fastify.container.get<AuditService>(TYPES.AuditService);
  const categoryService = fastify.container.get<CategoryService>(TYPES.CategoryService);

  // Initialize controllers
  const controllers = {
    page: new PageController(),
    dashboard: new DashboardController({
      flagService,
      categoryService,
      auditService,
    }),
  };

  // Auth middleware for protected routes
  const authMiddleware = fastify.container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  // Client routes
  fastify.get(
    '/',
    { preHandler: authMiddleware.authenticateUI },
    controllers.dashboard.index.bind(controllers.dashboard)
  );
  fastify.get('/login', controllers.page.login.bind(controllers.page));

  // Register other routes here
  // ...

  // API client routes for HTMX interactions
  fastify.register(async instance => {
    instance.addHook('preHandler', authMiddleware.authenticateUI);

    // Flag client API routes
    instance.get(
      '/api/client/flags/search',
      controllers.dashboard.searchFlags.bind(controllers.dashboard)
    );
    instance.get(
      '/api/client/flags/validate-name',
      controllers.dashboard.validateFlagName.bind(controllers.dashboard)
    );

    // Other client API routes
    // ...
  });
}
