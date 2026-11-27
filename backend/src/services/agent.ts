import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createPublicKey, generateKeyPairSync } from 'node:crypto';
import path from 'node:path';
import { Errors, type ServiceSchema } from 'moleculer';
import { signedFetch } from '../signature.ts';

// Name and description of the app, which override those of the manifest
export interface AppInfo {
  name?: string;
  description?: string;
}

export interface AgentConfig extends AppInfo {
  podProviderUrl: string;
  storageWebId: string;
  storageUri?: string;
  configuredAt: string;
}

// The data space chosen during the configuration, before the app is registered on it
interface PendingStorage extends AppInfo {
  storageWebId: string;
  storageUri: string;
}

const GROUP_TYPES = ['foaf:Group', 'foaf:Organization', 'Group', 'Organization'];

const getName = (actor: any): string | undefined =>
  [actor['foaf:name'], actor.name, actor['as:name'], actor.preferredUsername].flat().find(n => typeof n === 'string');

const cleanText = (value: unknown) => (typeof value === 'string' && value.trim()) || undefined;

const hasLink = (linkHeader: string | undefined, uri: string, rel: string) =>
  (linkHeader ?? '').split(/,\s*(?=<)/).some(link => {
    const [, target, params] = link.match(/^<([^>]+)>(.*)$/) ?? [];
    return target === uri && params?.includes(`rel="${rel}"`);
  });

const AgentService: ServiceSchema = {
  name: 'agent',
  settings: {
    dataDir: null,
    clientId: null
  },
  async started() {
    const { dataDir } = this.settings;
    await mkdir(dataDir, { recursive: true });

    const keyPath = path.join(dataDir, 'agent-key.pem');
    if (!existsSync(keyPath)) {
      const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      await writeFile(keyPath, privateKey, { mode: 0o600 });
      this.logger.info(`New agent key generated in ${keyPath}`);
    }
    this.privateKey = await readFile(keyPath, 'utf8');
    this.publicKey = createPublicKey(this.privateKey).export({ type: 'spki', format: 'pem' });

    this.configPath = path.join(dataDir, 'config.json');
    this.config = existsSync(this.configPath)
      ? (JSON.parse(await readFile(this.configPath, 'utf8')) as AgentConfig)
      : null;

    this.pendingPath = path.join(dataDir, 'pending-storage.json');
    this.pending = existsSync(this.pendingPath)
      ? (JSON.parse(await readFile(this.pendingPath, 'utf8')) as PendingStorage)
      : null;
  },
  actions: {
    status() {
      return {
        configured: !!this.config,
        storageWebId: this.config?.storageWebId,
        name: this.config?.name,
        description: this.config?.description
      };
    },
    getAppInfo(): AppInfo {
      const { name, description } = this.config ?? this.pending ?? {};
      return { name, description };
    },
    getPublicKey() {
      return this.publicKey;
    },
    async fetch(ctx) {
      const { url, method, headers, body, onBehalfOf } = ctx.params;
      const res = await signedFetch(
        url,
        { method, headers, body: body && typeof body !== 'string' ? JSON.stringify(body) : body, onBehalfOf },
        { keyId: `${this.settings.clientId}#main-key`, privateKeyPem: this.privateKey }
      );
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        // Not all responses are JSON
      }
      return { ok: res.ok, status: res.status, headers: Object.fromEntries(res.headers), body: json ?? text };
    },
    // The storages targeted by the access needs of the manifest, by key
    async getStorages() {
      if (this.config && !this.config.storageUri) {
        // Configured before the storage URI was kept
        const storage = await this.fetchGroup(this.config.storageWebId);
        this.config.storageUri = storage['pim:storage'];
        await writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      }
      const storageUri = this.config ? this.config.storageUri : this.pending?.storageUri;
      return storageUri ? { calendar: storageUri } : {};
    },
    // The name defaults to the one of the group
    async prepare(ctx): Promise<AppInfo> {
      const { storageWebId } = ctx.params;
      if (this.config) throw new Errors.MoleculerClientError('The application is already configured', 403, 'FORBIDDEN');

      const storage = await this.fetchGroup(storageWebId);
      if (!storage['pim:storage'])
        throw new Errors.MoleculerClientError('The group has no storage', 400, 'BAD_REQUEST');

      const previous: AppInfo = this.pending?.storageWebId === storageWebId ? this.pending : {};
      this.pending = {
        storageWebId,
        storageUri: storage['pim:storage'],
        name: cleanText(ctx.params.name) ?? previous.name ?? getName(storage),
        // A null description restores the one of the manifest
        description: 'description' in ctx.params ? cleanText(ctx.params.description) : previous.description
      };
      await writeFile(this.pendingPath, JSON.stringify(this.pending, null, 2));
      return this.actions.getAppInfo();
    },
    async configure(ctx) {
      const { storageWebId } = ctx.params;
      if (this.config) throw new Errors.MoleculerClientError('The application is already configured', 403, 'FORBIDDEN');
      const storage = await this.fetchGroup(storageWebId);

      // The authorization agent of the storage links to the app registration, if there is one
      const authAgentUri = storage['interop:hasAuthorizationAgent'];
      const { headers } = authAgentUri
        ? await this.actions.fetch(
            { url: authAgentUri, headers: { Accept: 'application/ld+json' } },
            { parentCtx: ctx }
          )
        : { headers: {} };
      if (!hasLink(headers.link, this.settings.clientId, 'http://www.w3.org/ns/solid/interop#registeredAgent')) {
        throw new Errors.MoleculerClientError('The application is not registered on this storage', 403, 'FORBIDDEN');
      }

      this.config = {
        podProviderUrl: new URL(storageWebId).origin,
        storageWebId,
        storageUri: storage['pim:storage'],
        ...(this.pending?.storageWebId === storageWebId && {
          name: this.pending.name,
          description: this.pending.description
        }),
        configuredAt: new Date().toISOString()
      };
      await writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      if (this.pending) await rm(this.pendingPath, { force: true });
      this.pending = null;
      this.logger.info(`Application configured with storage ${storageWebId}`);

      return this.actions.status();
    }
  },
  methods: {
    async fetchGroup(storageWebId: string) {
      if (!URL.canParse(storageWebId)) throw new Errors.MoleculerClientError('Invalid storage', 400, 'BAD_REQUEST');
      // Not signed: the Pod provider would fetch the client ID to check the signature, which calls this method
      const res = await fetch(storageWebId, { headers: { Accept: 'application/ld+json' } });
      const storage = res.ok ? await res.json() : undefined;
      if (![storage?.type ?? storage?.['@type']].flat().some(type => GROUP_TYPES.includes(type))) {
        throw new Errors.MoleculerClientError('The storage must be a group', 400, 'BAD_REQUEST');
      }
      return storage;
    }
  }
};

export default AgentService;
