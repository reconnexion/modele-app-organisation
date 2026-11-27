import { resolveAuthAgent } from '@activitypods/refine-providers';
import { clientId } from 'virtual:app-manifest';
import { authProvider } from './providers';

// The access needs targeting the storage of the app are given to its members without asking them
export const ensureRegistration = async () => {
  const { webId, token } = authProvider.getSession()!;
  const res = await fetch(new URL('/.well-known/app-status', new URL(webId).origin), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`Impossible d'obtenir le statut de l'application (${res.status})`);
  const { installed, upgradeNeeded } = await res.json();
  if (installed && !upgradeNeeded) return true;

  // Without token, as the app is not registered yet
  const { authAgent } = await resolveAuthAgent(webId);
  const url = new URL(authAgent['interop:hasAuthorizationRedirectEndpoint']);
  url.searchParams.set('client_id', clientId);
  window.location.href = url.toString();
  return false;
};
