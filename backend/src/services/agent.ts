import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createPublicKey, generateKeyPairSync } from 'node:crypto';
import path from 'node:path';
import type { ServiceSchema } from 'moleculer';
import { signedFetch } from '../signature.ts';

// The app acts in its own name, with a key published in its client ID document
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
  },
  actions: {
    getClientId() {
      return this.settings.clientId;
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
    }
  }
};

export default AgentService;
