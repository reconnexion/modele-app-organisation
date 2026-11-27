import { Refine, Authenticated } from '@refinedev/core';
import { useNotificationProvider, ErrorComponent } from '@refinedev/antd';
import routerProvider, { CatchAllNavigate, DocumentTitleHandler, NavigateToResource } from '@refinedev/react-router';
import { LoginPage } from '@activitypods/refine-antd';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router';
import { useEffect, useMemo } from 'react';
import { App as AntdApp, ConfigProvider, Result, Spin } from 'antd';
import frFR from 'antd/locale/fr_FR';
import Icon, { CalendarOutlined, CheckSquareOutlined, FileTextOutlined } from '@ant-design/icons';

import '@ant-design/v5-patch-for-react-19';
import '@refinedev/antd/dist/reset.css';

import { authProvider, createProviders, DEFAULT_POD_PROVIDER } from './providers';
import Layout, { PRIMARY_COLOR } from './layout/Layout';
import SplitView from './layout/SplitView';
import SimpleList from './common/SimpleList';
import { i18nProvider } from './i18n';
import useAppStatus, { AppStatus } from './useAppStatus';
import { ConfigurePage } from './pages/ConfigurePage';
import { LoginCallbackPage } from './pages/LoginCallbackPage';
import { NotConfiguredPage } from './pages/NotConfiguredPage';
import EventCalendar from './resources/events/EventCalendar';
import EventCreate from './resources/events/EventCreate';
import EventEdit from './resources/events/EventEdit';
import EventShow from './resources/events/EventShow';
import { CircleCreate, CircleEdit, CircleList, CircleShow } from './resources/circles';
import { DescribedCreate, DescribedEdit, DescribedShow } from './resources/described';
import manifest from '../app-manifest.json';

const CircleIcon = () => (
  <Icon
    component={() => (
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9" />
      </svg>
    )}
  />
);

const getAppName = (status: AppStatus) => status.name ?? manifest.name;

const PublicLayout = ({ status }: { status: AppStatus }) => (
  <Layout groupWebId={status.storageWebId} appName={getAppName(status)} appIcon={status.thumbnail}>
    <Outlet />
  </Layout>
);

const AuthenticatedLayout = () => (
  <Authenticated key="authenticated-routes" fallback={<CatchAllNavigate to="/login" />}>
    <Outlet />
  </Authenticated>
);

// Read on each navigation, as the routes are not rendered again
const LoginRoute = ({ storageWebId }: { storageWebId?: string }) => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.has('code') || params.has('register_app') ? (
    <LoginCallbackPage configured storageWebId={storageWebId} />
  ) : (
    <LoginPage defaultPodProvider={DEFAULT_POD_PROVIDER} />
  );
};

// The show, create and edit pages are displayed next to the list
const resourceRoutes = (
  name: string,
  pages: { list: ReactNode; show: ReactNode; create: ReactNode; edit: ReactNode }
) => (
  <Route path={`/${name}`} element={<SplitView list={pages.list} />}>
    <Route path="show/:id" element={pages.show} />
    <Route element={<AuthenticatedLayout />}>
      <Route path="create" element={pages.create} />
      <Route path="edit/:id" element={pages.edit} />
    </Route>
  </Route>
);

const AppRoutes = ({ status }: { status: AppStatus }) => (
  <Routes>
    <Route path="/configure" element={status.configured ? <Navigate to="/" replace /> : <ConfigurePage />} />
    {status.configured ? (
      <>
        {/* The public data can be seen without being logged in */}
        <Route element={<PublicLayout status={status} />}>
          <Route index element={<NavigateToResource resource="circles" />} />
          {resourceRoutes('circles', {
            list: <CircleList />,
            show: <CircleShow />,
            create: <CircleCreate />,
            edit: <CircleEdit />
          })}
          {resourceRoutes('events', {
            list: <EventCalendar />,
            show: <EventShow />,
            create: <EventCreate />,
            edit: <EventEdit />
          })}
          {resourceRoutes('tasks', {
            list: <SimpleList />,
            show: <DescribedShow />,
            create: <DescribedCreate title="Nouveau projet" />,
            edit: <DescribedEdit title="Modifier le projet" />
          })}
          {resourceRoutes('documents', {
            list: <SimpleList />,
            show: <DescribedShow />,
            create: <DescribedCreate title="Nouveau document" />,
            edit: <DescribedEdit title="Modifier le document" />
          })}
          <Route
            path="*"
            element={
              <div style={{ padding: 24 }}>
                <ErrorComponent />
              </div>
            }
          />
        </Route>
        <Route path="/login" element={<LoginRoute storageWebId={status.storageWebId} />} />
      </>
    ) : (
      <>
        <Route path="/login" element={<LoginCallbackPage configured={false} />} />
        <Route path="*" element={<NotConfiguredPage />} />
      </>
    )}
  </Routes>
);

const crudRoutes = (name: string) => ({
  name,
  list: `/${name}`,
  show: `/${name}/show/:id`,
  create: `/${name}/create`,
  edit: `/${name}/edit/:id`
});

const App = () => {
  const { status, error } = useAppStatus();
  const providers = useMemo(() => status && createProviders(status.storageWebId), [status]);

  useEffect(() => {
    if (!status?.thumbnail) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement('link');
    link.rel = 'icon';
    link.href = status.thumbnail;
    document.head.appendChild(link);
  }, [status?.thumbnail]);

  return (
    <BrowserRouter>
      <ConfigProvider theme={{ token: { colorPrimary: PRIMARY_COLOR, colorLink: PRIMARY_COLOR } }} locale={frFR}>
        <AntdApp>
          {error ? (
            <Result status="error" title={error.message} />
          ) : !status || !providers ? (
            <Spin fullscreen />
          ) : (
            <Refine
              authProvider={authProvider}
              dataProvider={providers.dataProvider}
              accessControlProvider={providers.accessControlProvider}
              liveProvider={providers.liveProvider}
              routerProvider={routerProvider}
              i18nProvider={i18nProvider}
              resources={[
                { ...crudRoutes('circles'), meta: { label: 'Cercles', icon: <CircleIcon />, canDelete: true } },
                { ...crudRoutes('events'), meta: { label: 'Agenda', icon: <CalendarOutlined />, canDelete: true } },
                { ...crudRoutes('tasks'), meta: { label: 'Projets', icon: <CheckSquareOutlined />, canDelete: true } },
                {
                  ...crudRoutes('documents'),
                  meta: { label: 'Documents', icon: <FileTextOutlined />, canDelete: true }
                }
              ]}
              notificationProvider={useNotificationProvider}
              options={{
                syncWithLocation: true,
                disableTelemetry: true,
                liveMode: 'auto'
              }}
            >
              <AppRoutes status={status} />
              <DocumentTitleHandler handler={() => getAppName(status)} />
            </Refine>
          )}
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
