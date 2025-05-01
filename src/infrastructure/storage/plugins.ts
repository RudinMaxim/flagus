import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DatabaseFactory, DatabaseType } from './factories';
import { IDatabase } from './interfaces';

export interface DatabasePluginOptions {
  type: DatabaseType;
  connectionName?: string;
  autoInitialize?: boolean;
  sqlite?: {
    path?: string;
    enableForeignKeys?: boolean;
    verbose?: boolean;
    timeout?: number;
    maxRetries?: number;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    db: IDatabase;
    databases?: Record<string, IDatabase>;
  }
}

const databasePlugin: FastifyPluginAsync<DatabasePluginOptions> = async (
  fastify: FastifyInstance,
  options: DatabasePluginOptions
) => {
  const { type = DatabaseType.SQLITE, connectionName = 'default', autoInitialize = true } = options;

  const createDb = () => {
    const config: any = { type, connectionName, autoInitialize };

    if (type === DatabaseType.SQLITE && options.sqlite) {
      config.sqlite = options.sqlite;
    }

    return DatabaseFactory.createConnection(config);
  };

  const db = createDb();

  if (!fastify.databases) {
    fastify.decorate('databases', {});
  }

  fastify.databases![connectionName] = db;

  if (connectionName === 'default') {
    fastify.decorate('db', db);
  }

  if (autoInitialize) {
    await db.initialize();
    fastify.log.info(`Database connection initialized: ${connectionName}`);
  }

  fastify.addHook('onClose', async () => {
    fastify.log.info(`Closing database connection: ${connectionName}`);
    await db.close();
  });
};

export default fp(databasePlugin, {
  name: 'fastify-database',
  dependencies: [],
});
