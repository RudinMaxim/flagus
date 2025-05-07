import 'reflect-metadata';
import './shared/kernel/global.types';
import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';
import { createApp } from './application';

dotenv.config();

async function start() {
  try {
    const app = await createApp();

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
