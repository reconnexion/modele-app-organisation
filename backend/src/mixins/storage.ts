import { Errors, type ServiceSchema } from 'moleculer';

const GROUP_TYPES = ['foaf:Group', 'foaf:Organization', 'Group', 'Organization'];

const REGISTERED_AGENT = 'http://www.w3.org/ns/solid/interop#registeredAgent';

export const arrayOf = (value: any) => [value ?? []].flat();

// The authorization agent links the agent to its registration, given as anchor
const getRegistrationUri = (linkHeader: string | undefined, agentUri: string) => {
  for (const link of (linkHeader ?? '').split(/,\s*(?=<)/)) {
    const [, target, params] = link.match(/^<([^>]+)>(.*)$/) ?? [];
    if (target === agentUri && params?.includes(`rel="${REGISTERED_AGENT}"`)) {
      return params.match(/anchor="([^"]+)"/)?.[1];
    }
  }
};

// Access to the data space of the app, through the agent
const StorageMixin: Partial<ServiceSchema> = {
  dependencies: ['agent'],
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
    },
    async getJson(ctx, url: string) {
      const { ok, status, body }: any = await ctx.call('agent.fetch', {
        url,
        headers: { Accept: 'application/ld+json' }
      });
      if (!ok) throw new Errors.MoleculerServerError(`Could not fetch ${url} (${status})`, 500, 'FETCH_FAILED');
      return body;
    },
    // The authorization agent of the storage links to the app registration, if there is one
    async findRegistrationUri(ctx, storage: any): Promise<string | undefined> {
      const authAgentUri = storage['interop:hasAuthorizationAgent'];
      if (!authAgentUri) return;
      const { headers }: any = await ctx.call('agent.fetch', {
        url: authAgentUri,
        headers: { Accept: 'application/ld+json' }
      });
      return getRegistrationUri(headers.link, await ctx.call('agent.getClientId'));
    },
    // The container is given by the access grant of the app for this shape tree
    async getContainerUri(ctx, storageWebId: string, shapeTreeUri: string): Promise<string | undefined> {
      const registrationUri = await this.findRegistrationUri(ctx, await this.fetchGroup(storageWebId));
      if (!registrationUri) return;
      const registration = await this.getJson(ctx, registrationUri);
      for (const grantOrUri of arrayOf(registration['interop:hasAccessGrant'])) {
        const grant = typeof grantOrUri === 'string' ? await this.getJson(ctx, grantOrUri) : grantOrUri;
        if (grant['interop:registeredShapeTree'] === shapeTreeUri) return grant['interop:hasDataRegistration'];
      }
    }
  }
};

export default StorageMixin;
