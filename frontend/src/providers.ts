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

export const EVENT_SHAPE_TREE = 'https://shapes.activitypods.org/shapetrees/as/Event';

const resources: ResourcesConfig = {
  events: {
    shapeTreeUri: EVENT_SHAPE_TREE,
    list: { storages: 'calendar' },
    create: { storage: 'calendar' }
  }
};

// The calendar is in the storage chosen when the app was configured
export const createProviders = (storageWebId?: string) => {
  const config: DataProviderConfig = {
    authProvider,
    storages: storageWebId ? { calendar: { uri: storageWebId } } : {},
    resources: storageWebId ? resources : {}
  };
  return {
    dataProvider: apDataProvider(config),
    liveProvider: apLiveProvider(config),
    accessControlProvider: apAccessControlProvider(config)
  };
};
