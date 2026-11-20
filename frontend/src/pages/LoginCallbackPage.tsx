import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Result, Spin } from 'antd';
import { resolveAuthAgent, STORAGE_KEY_REDIRECT } from '@activitypods/refine-providers';
import { clientId } from 'virtual:app-manifest';
import { authProvider } from '../providers';

// The access needs targeting the storage of the app are given to its members without asking them
const ensureRegistration = async () => {
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

export const LoginCallbackPage = ({ configured, storageWebId }: { configured: boolean; storageWebId?: string }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      authProvider
        .handleCallback()
        .then(async ({ redirect }) => {
          if (configured && storageWebId && !(await ensureRegistration())) return;
          navigate(redirect, { replace: true });
        })
        .catch(e => setError(e.message));
    } else if (params.has('register_app') && !configured) {
      navigate('/configure?registered', { replace: true });
    } else if (params.has('register_app')) {
      // Back from the share screen of the Pod provider
      const redirect = localStorage.getItem(STORAGE_KEY_REDIRECT) || '/';
      localStorage.removeItem(STORAGE_KEY_REDIRECT);
      navigate(redirect, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, configured, storageWebId]);

  return error ? <Result status="error" title={error} /> : <Spin fullscreen />;
};
