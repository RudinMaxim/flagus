import 'fastify';
import type { Container } from 'inversify';

declare module 'fastify' {
  interface FastifyInstance {
    container: Container;
    config: any;
  }
}
