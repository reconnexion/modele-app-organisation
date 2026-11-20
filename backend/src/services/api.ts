import ApiGateway from 'moleculer-web';
import type { ServiceSchema } from 'moleculer';

const ApiService: ServiceSchema = {
  name: 'api',
  mixins: [ApiGateway],
  settings: {
    server: false,
    routes: [
      {
        path: '/api',
        mappingPolicy: 'restrict',
        bodyParsers: { json: true },
        aliases: {
          'GET /status': 'agent.status',
          'POST /configure': 'agent.configure',
          'POST /configure/storage': 'agent.prepare'
        }
      }
    ]
  }
};

export default ApiService;
