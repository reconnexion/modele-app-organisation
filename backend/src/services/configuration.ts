import { watch } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Errors, type ServiceSchema } from 'moleculer';
import StorageMixin from '../mixins/storage.ts';

// Name, description and icon of the app, which override those of the manifest
export interface AppInfo {
  name?: string;
  description?: string;
  thumbnail?: string;
}

export interface AppConfig extends AppInfo {
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

const getName = (actor: any): string | undefined =>
  [actor['foaf:name'], actor.name, actor['as:name'], actor.preferredUsername].flat().find(n => typeof n === 'string');

const getIcon = (actor: any): string | undefined =>
  [actor.icon, actor['as:icon'], actor.image, actor['as:image']]
    .flat()
    .map(image => (typeof image === 'string' ? image : (image?.url ?? image?.['as:url'])))
    .find(url => typeof url === 'string' && URL.canParse(url));

const cleanText = (value: unknown) => (typeof value === 'string' && value.trim()) || undefined;

const ConfigurationService: ServiceSchema = {
  name: 'configuration',
  mixins: [StorageMixin],
  settings: {
    dataDir: null
  },
  async started() {
    const { dataDir } = this.settings;
    this.configPath = path.join(dataDir, 'config.json');
    this.pendingPath = path.join(dataDir, 'pending-storage.json');
    await this.load();

    // Files edited or deleted by hand are taken into account without restarting
    let timeout: NodeJS.Timeout;
    this.watcher = watch(dataDir, (_event: string, filename: string | null) => {
      if (filename !== 'config.json' && filename !== 'pending-storage.json') return;
      clearTimeout(timeout);
      timeout = setTimeout(() => this.load().then(() => this.logger.info(`${filename} reloaded`)), 100);
    });
  },
  stopped() {
    this.watcher?.close();
  },
  methods: {
    async readJson(filePath: string) {
      try {
        return JSON.parse(await readFile(filePath, 'utf8'));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') this.logger.warn(`Could not read ${filePath}`, e);
        return null;
      }
    },
    async load() {
      this.config = (await this.readJson(this.configPath)) as AppConfig | null;
      this.pending = (await this.readJson(this.pendingPath)) as PendingStorage | null;
    }
  },
  actions: {
    status() {
      return {
        configured: !!this.config,
        storageWebId: this.config?.storageWebId,
        name: this.config?.name,
        description: this.config?.description,
        thumbnail: this.config?.thumbnail
      };
    },
    getAppInfo(): AppInfo {
      const { name, description, thumbnail } = this.config ?? this.pending ?? {};
      return { name, description, thumbnail };
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
      return storageUri ? { organization: storageUri } : {};
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
        description: 'description' in ctx.params ? cleanText(ctx.params.description) : previous.description,
        thumbnail: getIcon(storage)
      };
      await writeFile(this.pendingPath, JSON.stringify(this.pending, null, 2));
      return this.actions.getAppInfo();
    },
    async configure(ctx) {
      const { storageWebId } = ctx.params;
      if (this.config) throw new Errors.MoleculerClientError('The application is already configured', 403, 'FORBIDDEN');
      const storage = await this.fetchGroup(storageWebId);

      if (!(await this.findRegistrationUri(ctx, storage))) {
        throw new Errors.MoleculerClientError('The application is not registered on this storage', 403, 'FORBIDDEN');
      }

      await ctx.call('task-statuses.createDefaults', { storageWebId });

      this.config = {
        podProviderUrl: new URL(storageWebId).origin,
        storageWebId,
        storageUri: storage['pim:storage'],
        ...(this.pending?.storageWebId === storageWebId && {
          name: this.pending.name,
          description: this.pending.description,
          thumbnail: this.pending.thumbnail
        }),
        configuredAt: new Date().toISOString()
      };
      await writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      if (this.pending) await rm(this.pendingPath, { force: true });
      this.pending = null;
      this.logger.info(`Application configured with storage ${storageWebId}`);

      return this.actions.status();
    }
  }
};

export default ConfigurationService;
