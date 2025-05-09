import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    },
  });
}
