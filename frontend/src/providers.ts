import {
  accessControlProvider as apAccessControlProvider,
  authProvider as apAuthProvider,
  dataProvider as apDataProvider,
  liveProvider as apLiveProvider,
  type DataProviderConfig,
  type ResourcesConfig
} from '@activitypods/refine-providers';
import { clientId } from 'virtual:app-manifest';

export const DEFAULT_POD_PROVIDER = import.meta.env.VITE_POD_PROVIDER_URL || 'http://localhost:3000';

export const authProvider = apAuthProvider({
  clientId,
  // Already done by the BackgroundChecks component
  appStatusCheckInterval: false
});

const SHAPE_TREES = 'https://shapes.activitypods.org/shapetrees/';

// Created and listed in the storage of the organization
const organizationResource = (shapeTree: string) => ({
  shapeTreeUri: `${SHAPE_TREES}${shapeTree}`,
  list: { storages: 'organization' },
  create: { storage: 'organization' }
});

const resources: ResourcesConfig = {
  circles: organizationResource('hc/Circle'),
  events: organizationResource('as/Event'),
  tasks: organizationResource('pair/Task'),
  'task-statuses': organizationResource('pair/TaskStatus'),
  documents: organizationResource('pair/Document')
};

const jsonContext = [
  'https://www.w3.org/ns/activitystreams',
  {
    pair: 'http://virtual-assembly.org/ontologies/pair#',
    hc: 'https://reconnexion.coop/ns/holacracy#',
    'pair:partOf': { '@type': '@id' },
    'pair:documents': { '@type': '@id' },
    'pair:concerns': { '@type': '@id' },
    'pair:hasStatus': { '@type': '@id' },
    'pair:assignedTo': { '@type': '@id' },
    'pair:affiliates': { '@type': '@id' },
    'pair:homePage': { '@type': '@id' },
    'hc:leadBy': { '@type': '@id' }
  }
];

// The data of the organization is in the storage chosen when the app was configured
export const createProviders = (storageWebId?: string) => {
  const config: DataProviderConfig = {
    authProvider,
    jsonContext,
    storages: storageWebId ? { organization: { uri: storageWebId } } : {},
    resources: storageWebId ? resources : {}
  };
  return {
    dataProvider: apDataProvider(config),
    liveProvider: apLiveProvider(config),
    accessControlProvider: apAccessControlProvider(config)
  };
};
