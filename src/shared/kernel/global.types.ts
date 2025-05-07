import 'fastify';
import type { Container } from 'inversify';

declare module 'fastify' {
  interface FastifyInstance {
    container: Container;
    config: any;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
