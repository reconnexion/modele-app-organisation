import { CLIENT_DOCUMENT, generateDocuments, readManifest } from '@activitypods/app-manifest';
import type { ServiceSchema } from 'moleculer';
import type { AppInfo } from './agent.ts';

const SECURITY_CONTEXT = {
  sec: 'https://w3id.org/security#',
  publicKey: { '@id': 'sec:publicKey', '@type': '@id' },
  owner: { '@id': 'sec:owner', '@type': '@id' },
  publicKeyPem: 'sec:publicKeyPem'
};

const ClientDocumentsService: ServiceSchema = {
  name: 'client-documents',
  settings: {
    manifestPath: null,
    publicUrl: null
  },
  dependencies: ['agent'],
  actions: {
    async get(ctx) {
      const { path } = ctx.params;
      const { manifestPath, publicUrl } = this.settings;

      // Read on every call, so that changes to the manifest are taken into account without restarting
      const manifest = await readManifest(manifestPath);
      const { name, description }: AppInfo = await ctx.call('agent.getAppInfo');
      const documents: Record<string, any> = generateDocuments(
        { ...manifest, ...(name && { name }), ...(description && { description }) },
        publicUrl,
        { storages: await ctx.call('agent.getStorages') }
      );
      const document = documents[path];
      if (!document || path !== CLIENT_DOCUMENT) return document ?? null;

      const clientId = new URL(CLIENT_DOCUMENT, publicUrl).href;
      return {
        ...document,
        '@context': [...document['@context'], SECURITY_CONTEXT],
        publicKey: {
          id: `${clientId}#main-key`,
          owner: clientId,
          publicKeyPem: await ctx.call('agent.getPublicKey')
        }
      };
    }
  }
};

export default ClientDocumentsService;
