import 'reflect-metadata';
import { FastifyInstance } from 'fastify';
import { createApp } from '@infrastructure/web/app/application';

async function bootstrap(): Promise<void> {
  let app: FastifyInstance | null = null;
  let shutdownInProgress = false;

  try {
    app = await createApp();
    const logger = app?.log;

    const gracefulShutdown = async (signal: string): Promise<void> => {
      if (shutdownInProgress) return;
      shutdownInProgress = true;

      logger?.info(`Received ${signal} signal, shutting down gracefully`);

      try {
        if (app) {
          await app.close();
          logger?.info('Server closed successfully');
        }
        process.exit(0);
      } catch (err) {
        logger?.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    signals.forEach(signal => {
      process.once(signal, () => gracefulShutdown(signal));
    });

    process.on('uncaughtException', err => {
      app?.log.error('Uncaught exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', reason => {
      app?.log.error('Unhandled rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    app.log.info(`Server started on ${host}:${port}`);
  } catch (err) {
    if (app?.log) {
      app.log.error('Failed to start server:', err);
    } else {
      console.error('Failed to start server:', err);
    }
    process.exit(1);
  }
}

bootstrap();
