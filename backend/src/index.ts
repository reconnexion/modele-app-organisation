import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { ServiceBroker } from 'moleculer';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { CLIENT_DOCUMENT } from '@activitypods/app-manifest';
import AgentService from './services/agent.ts';
import ClientDocumentsService from './services/client-documents.ts';
import ApiService from './services/api.ts';

const root = path.resolve(import.meta.dirname, '../..');
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));

const publicUrl = (process.env.PUBLIC_URL || 'http://localhost:4000').replace(/\/?$/, '/');
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';

const broker = new ServiceBroker({
  logger: { type: 'Console', options: { formatter: 'short' } }
});

broker.createService({
  name: 'agent',
  mixins: [AgentService],
  settings: {
    dataDir: process.env.DATA_DIR || path.join(root, 'data'),
    clientId: new URL(CLIENT_DOCUMENT, publicUrl).href
  }
});
broker.createService({
  name: 'client-documents',
  mixins: [ClientDocumentsService],
  settings: { manifestPath: path.join(root, 'frontend', 'app-manifest.json'), publicUrl }
});
const api = broker.createService(ApiService);

await broker.start();

const app = express();

app.get([`/${CLIENT_DOCUMENT}`, '/access-needs/:file'], async (req, res, next) => {
  try {
    const document = await broker.call('client-documents.get', { path: req.path.slice(1) });
    if (!document) return res.sendStatus(404);
    // The Pod provider's frontend fetches these documents from another origin
    res.set('Access-Control-Allow-Origin', '*');
    res.json(document);
  } catch (e) {
    next(e);
  }
});

app.use(api.express());
// moleculer-web rewrites req.url before handing over unmatched requests
app.use((req, res, next) => (req.originalUrl.startsWith('/api/') ? res.sendStatus(404) : next()));

const server = app.listen(port, () => broker.logger.info(`Listening on ${publicUrl}`));

if (isProduction) {
  const dist = path.join(root, 'frontend', 'dist');
  app.use(express.static(dist, { index: false }));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  // Frontend and backend must share the same origin, so Vite is reached through the backend
  const viteProxy = createProxyMiddleware({ target: `http://127.0.0.1:${process.env.VITE_PORT || 5173}`, ws: true });
  app.use(viteProxy);
  server.on('upgrade', viteProxy.upgrade);
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.code >= 400 && err.code < 600 ? err.code : 500;
  if (status === 500) broker.logger.error(err);
  res.status(status).json({ message: status === 500 ? 'Internal error' : err.message, type: err.type });
});
