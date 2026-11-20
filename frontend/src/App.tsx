import { Refine, Authenticated } from '@refinedev/core';
import { useNotificationProvider, ErrorComponent, RefineThemes } from '@refinedev/antd';
import routerProvider, { CatchAllNavigate, DocumentTitleHandler, NavigateToResource } from '@refinedev/react-router';
import { LoginPage } from '@activitypods/refine-antd';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router';
import { useMemo } from 'react';
import { App as AntdApp, ConfigProvider, Result, Spin } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { CalendarOutlined } from '@ant-design/icons';

import '@ant-design/v5-patch-for-react-19';
import '@refinedev/antd/dist/reset.css';

import { authProvider, createProviders, DEFAULT_POD_PROVIDER } from './providers';
import Layout, { APP_NAME } from './Layout';
import { i18nProvider } from './i18n';
import useAppStatus, { AppStatus } from './useAppStatus';
import { ConfigurePage } from './pages/ConfigurePage';
import { LoginCallbackPage } from './pages/LoginCallbackPage';
import { NotConfiguredPage } from './pages/NotConfiguredPage';
import EventCalendar from './resources/events/EventCalendar';
import EventCreate from './resources/events/EventCreate';
import EventEdit from './resources/events/EventEdit';
import EventShow from './resources/events/EventShow';

const PublicLayout = ({ storageWebId }: { storageWebId?: string }) => (
  <Layout groupWebId={storageWebId}>
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

const AppRoutes = ({ status }: { status: AppStatus }) => (
  <Routes>
    <Route path="/configure" element={status.configured ? <Navigate to="/" replace /> : <ConfigurePage />} />
    {status.configured ? (
      <>
        {/* The events shared with everyone can be seen without being logged in */}
        <Route element={<PublicLayout storageWebId={status.storageWebId} />}>
          <Route index element={<NavigateToResource resource="events" />} />
          <Route path="/events">
            <Route index element={<EventCalendar storageWebId={status.storageWebId} />} />
            <Route path="show/:id" element={<EventShow />} />
            <Route element={<AuthenticatedLayout />}>
              <Route path="create" element={<EventCreate />} />
              <Route path="edit/:id" element={<EventEdit />} />
            </Route>
          </Route>
          <Route path="*" element={<ErrorComponent />} />
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

const App = () => {
  const { status, error } = useAppStatus();
  const providers = useMemo(() => status && createProviders(status.storageWebId), [status]);

  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue} locale={frFR}>
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
                {
                  name: 'events',
                  list: '/events',
                  show: '/events/show/:id',
                  create: '/events/create',
                  edit: '/events/edit/:id',
                  meta: { label: 'Calendrier', icon: <CalendarOutlined />, canDelete: true }
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
              <DocumentTitleHandler handler={() => APP_NAME} />
            </Refine>
          )}
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
