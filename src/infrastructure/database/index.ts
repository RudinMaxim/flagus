// Экспорт интерфейсов
export type * from './interfaces';

// Экспорт плагина для Fastify
export { default as databasePlugin } from './plugins';

// Экспорт фабрик
export * from './factories';

// Экспорт репозиториев
export * from './repositories';
