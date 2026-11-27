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
          'GET /status': 'configuration.status',
          'POST /configure': 'configuration.configure',
          'POST /configure/storage': 'configuration.prepare'
        }
      }
    ]
  }
};

export default ApiService;
