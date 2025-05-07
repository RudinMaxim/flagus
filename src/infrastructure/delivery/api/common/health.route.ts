import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
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
