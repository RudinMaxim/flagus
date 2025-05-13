import path from 'path';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import handlebars from 'handlebars';
import { AuthMiddleware } from '../middlewares';
import { registerHandlebarsHelpers } from '../../../shared/utils';
import { TYPES } from '../../config/types';

interface IRouter {
  register(app: FastifyInstance): void;
}

class RouterFactory {
  static createPublicRouter(app: FastifyInstance): PublicRouter {
    const pageController = app.container.get(TYPES.PageController);
    return new PublicRouter(pageController);
  }

  static createProtectedRouter(app: FastifyInstance): ProtectedRouter {
    const flagController = app.container.get(TYPES.FlagController);
    const authMiddleware = app.container.get<AuthMiddleware>(TYPES.AuthMiddleware);
    return new ProtectedRouter(flagController, authMiddleware);
  }

  static createErrorRouter(app: FastifyInstance): ErrorRouter {
    const pageController = app.container.get(TYPES.PageController);
    return new ErrorRouter(pageController);
  }
}

class PublicRouter implements IRouter {
  constructor(private pageController: any) {}

  register(app: FastifyInstance): void {
    app.get('/login', this.pageController.login.bind(this.pageController));
    app.get('/setup', this.pageController.setup.bind(this.pageController));
  }
}

class ProtectedRouter implements IRouter {
  constructor(
    private flagController: any,
    private authMiddleware: AuthMiddleware
  ) {}

  register(app: FastifyInstance): void {
    app.register(async instance => {
      instance.addHook('preHandler', this.authMiddleware.authenticateUI);

      instance.get('/', this.flagController.index.bind(this.flagController));
      instance.get('/flags', this.flagController.index.bind(this.flagController));
      instance.get('/flags/create', this.flagController.create.bind(this.flagController));
      instance.get('/flags/:id', this.flagController.show.bind(this.flagController));
      instance.get('/flags/:id/edit', this.flagController.edit.bind(this.flagController));
      instance.post(
        '/flags/:id/toggle',
        this.flagController.toggleStatus.bind(this.flagController)
      );
    });
  }
}

class ErrorRouter implements IRouter {
  constructor(private pageController: any) {}

  register(app: FastifyInstance): void {
    app.setErrorHandler(this.pageController.error.bind(this.pageController));
    app.setNotFoundHandler(this.pageController.notFound.bind(this.pageController));
  }
}

class ViewConfigService {
  static async configure(app: FastifyInstance): Promise<void> {
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

    registerHandlebarsHelpers(handlebars);
  }
}

class StaticAssetsService {
  static async configure(app: FastifyInstance): Promise<void> {
    await app.register(fastifyStatic, {
      root: path.join(__dirname, 'assets'),
      prefix: '/assets/',
      decorateReply: false,
    });

    app.get('/robots.txt', (request, reply) => {
      reply.sendFile('robots.txt', path.join(__dirname, 'assets'));
    });
  }
}

export async function registerClient(app: FastifyInstance): Promise<void> {
  await Promise.all([ViewConfigService.configure(app), StaticAssetsService.configure(app)]);

  const routers: IRouter[] = [
    RouterFactory.createPublicRouter(app),
    RouterFactory.createProtectedRouter(app),
    RouterFactory.createErrorRouter(app),
  ];

  routers.forEach(router => router.register(app));
}
