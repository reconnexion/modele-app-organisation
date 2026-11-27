import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { resolveAuthAgent, type AuthSession } from '@activitypods/refine-providers';
import { clientId } from 'virtual:app-manifest';
import { Alert, Button, Card, Input, Space, Spin, Steps, Typography } from 'antd';
import { authProvider, DEFAULT_POD_PROVIDER } from '../providers';
import manifest from '../../app-manifest.json';

// The data space created on the Pod provider, until the app is registered on it
const PENDING_STORAGE_KEY = 'configure.pendingStorage';

const getAuthorizeEndpoint = async (session: AuthSession): Promise<string> => {
  const { authAgent } = await resolveAuthAgent(session.webId, session.token);
  return authAgent['interop:hasAuthorizationRedirectEndpoint'];
};

const goToGroupSelection = async (session: AuthSession) => {
  // The group selection page is on the same frontend as the authorization page
  // It goes directly to the group creation if the user manages no group
  const url = new URL('/groups/select', await getAuthorizeEndpoint(session));
  url.searchParams.set('redirect', `${window.location.origin}/configure`);
  url.searchParams.set('id', manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  url.searchParams.set('name', manifest.name);
  window.location.href = url.toString();
};

const goToAuthorization = async (session: AuthSession, storageWebId: string) => {
  // The access needs of the app target the storage of the group
  const response = await fetch('/api/configure/storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storageWebId })
  });
  if (!response.ok) throw new Error((await response.json()).message);

  const url = new URL(await getAuthorizeEndpoint(session));
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('podOwner', storageWebId);
  window.location.href = url.toString();
};

export const ConfigurePage = () => {
  const [searchParams] = useSearchParams();
  const [podProviderUrl, setPodProviderUrl] = useState(DEFAULT_POD_PROVIDER);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const session = authProvider.getSession();
  const pendingStorage = localStorage.getItem(PENDING_STORAGE_KEY);
  const handled = useRef(false);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setIsProcessing(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (handled.current || !session) return;
    const group = searchParams.get('group');

    if (group) {
      // Back from the group selection or creation page
      handled.current = true;
      localStorage.setItem(PENDING_STORAGE_KEY, group);
      run(() => goToAuthorization(session, group));
    } else if (searchParams.has('registered') && pendingStorage) {
      // Back from the authorization page
      handled.current = true;
      run(async () => {
        const response = await fetch('/api/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storageWebId: pendingStorage })
        });
        if (!response.ok) throw new Error((await response.json()).message);
        localStorage.removeItem(PENDING_STORAGE_KEY);
        window.location.href = '/';
      });
    }
  }, [session, searchParams, pendingStorage, run]);

  const startOver = () => {
    localStorage.removeItem(PENDING_STORAGE_KEY);
    window.location.href = '/configure';
  };

  const current = !session ? 0 : pendingStorage ? 2 : 1;

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: '0 16px' }}>
      <Card title="Configurer l'application">
        <Steps
          current={current}
          size="small"
          style={{ marginBottom: 24 }}
          items={[{ title: 'Hébergeur' }, { title: 'Porte-données' }, { title: 'Autorisation' }]}
        />

        {error && (
          <Alert
            type="error"
            message={error}
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={startOver}>
                Recommencer
              </Button>
            }
          />
        )}

        {isProcessing ? (
          <div style={{ textAlign: 'center' }}>
            <Spin />
          </div>
        ) : current === 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Paragraph>
              Les données de cette application seront stockées dans un porte-données dont vous serez propriétaire, chez
              un hébergeur. Choisissez l'hébergeur et connectez-vous avec votre compte, ou créez-en un.
            </Typography.Paragraph>
            <Input value={podProviderUrl} onChange={e => setPodProviderUrl(e.target.value)} />
            <Space>
              <Button
                type="primary"
                onClick={() => run(() => authProvider.login({ issuer: podProviderUrl, redirect: '/configure' }))}
              >
                Se connecter
              </Button>
              <Button
                onClick={() => run(() => authProvider.register!({ issuer: podProviderUrl, redirect: '/configure' }))}
              >
                Créer un compte
              </Button>
            </Space>
          </Space>
        ) : current === 1 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Paragraph>
              Connecté en tant que <Typography.Text code>{session!.webId}</Typography.Text>. Choisissez maintenant le
              porte-données de l'application chez votre hébergeur : un porte-données collectif que vous gérez déjà, ou
              un nouveau, dont vous serez le propriétaire.
            </Typography.Paragraph>
            <Space>
              <Button type="primary" onClick={() => run(() => goToGroupSelection(session!))}>
                Choisir le porte-données
              </Button>
              <Button onClick={() => authProvider.logout({}).then(() => window.location.reload())}>
                Changer de compte
              </Button>
            </Space>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Paragraph>
              Autorisez l'application à accéder au porte-données{' '}
              <Typography.Text code>{pendingStorage}</Typography.Text>.
            </Typography.Paragraph>
            <Space>
              <Button type="primary" onClick={() => run(() => goToAuthorization(session!, pendingStorage!))}>
                Autoriser l'application
              </Button>
              <Button onClick={startOver}>Recommencer</Button>
            </Space>
          </Space>
        )}
      </Card>
    </div>
  );
};
