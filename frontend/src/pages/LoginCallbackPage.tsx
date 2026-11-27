import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Result, Spin } from 'antd';
import { STORAGE_KEY_REDIRECT } from '@activitypods/refine-providers';
import { authProvider } from '../providers';
import { ensureRegistration } from '../registration';

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
