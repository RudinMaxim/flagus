import { createApp } from '@infrastructure/web/app';
import 'reflect-metadata';

async function start() {
  try {
    const app = await createApp();

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        app.log.info(`Received ${signal} signal, shutting down gracefully`);
        await app.close();
        process.exit(0);
      });
    }
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
