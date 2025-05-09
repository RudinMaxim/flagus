import 'fastify';
import '@fastify/cookie';
import type { Container } from 'inversify';

declare module 'fastify' {
  interface FastifyInstance {
    container: Container;
    config: any;
    cookies: {
      [cookieName: string]: string;
    };
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
