import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { resolveAuthAgent, type AuthSession } from '@activitypods/refine-providers';
import { clientId } from 'virtual:app-manifest';
import { Alert, Button, Card, Form, Input, Space, Spin, Steps, Typography } from 'antd';
import { authProvider, DEFAULT_POD_PROVIDER } from '../providers';
import manifest from '../../app-manifest.json';

// The data space created on the Pod provider, until the app is registered on it
const PENDING_STORAGE_KEY = 'configure.pendingStorage';

const DEFAULT_DESCRIPTION = manifest.description.fr;

interface AppInfo {
  name?: string;
  description?: string;
}

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

// The access needs of the app target the storage of the group
// Without name, the backend returns the one of the group
const prepareStorage = async (storageWebId: string, info?: { name: string; description: string | null }) => {
  const response = await fetch('/api/configure/storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storageWebId, ...info })
  });
  if (!response.ok) throw new Error((await response.json()).message);
  return (await response.json()) as AppInfo;
};

const goToAuthorization = async (session: AuthSession, storageWebId: string) => {
  const url = new URL(await getAuthorizeEndpoint(session));
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('podOwner', storageWebId);
  window.location.href = url.toString();
};

export const ConfigurePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [podProviderUrl, setPodProviderUrl] = useState(DEFAULT_POD_PROVIDER);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const session = authProvider.getSession();
  const [pendingStorage, setPendingStorage] = useState(() => localStorage.getItem(PENDING_STORAGE_KEY));
  const [appInfo, setAppInfo] = useState<AppInfo>();
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
      localStorage.setItem(PENDING_STORAGE_KEY, group);
      setPendingStorage(group);
      setAppInfo(undefined);
      setSearchParams({}, { replace: true });
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
  }, [session, searchParams, setSearchParams, pendingStorage, run]);

  useEffect(() => {
    if (!session || !pendingStorage || appInfo || searchParams.has('group') || searchParams.has('registered')) return;
    prepareStorage(pendingStorage)
      .then(setAppInfo)
      .catch(e => setError(e.message));
  }, [session, pendingStorage, appInfo, searchParams]);

  const authorize = (values: { name: string; description: string }) =>
    run(async () => {
      const description = values.description?.trim();
      await prepareStorage(pendingStorage!, {
        name: values.name,
        // The manifest has translations of the default description
        description: description && description !== DEFAULT_DESCRIPTION ? description : null
      });
      await goToAuthorization(session!, pendingStorage!);
    });

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
        ) : !appInfo ? (
          !error && (
            <div style={{ textAlign: 'center' }}>
              <Spin />
            </div>
          )
        ) : (
          <Form
            layout="vertical"
            initialValues={{ name: appInfo.name, description: appInfo.description ?? DEFAULT_DESCRIPTION }}
            onFinish={authorize}
          >
            <Typography.Paragraph>
              Donnez un nom à l'application, puis autorisez-la à accéder au porte-données{' '}
              <Typography.Text code>{pendingStorage}</Typography.Text>.
            </Typography.Paragraph>
            <Form.Item name="name" label="Nom" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea autoSize={{ minRows: 2 }} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Autoriser l'application
              </Button>
              <Button onClick={startOver}>Recommencer</Button>
            </Space>
          </Form>
        )}
      </Card>
    </div>
  );
};
