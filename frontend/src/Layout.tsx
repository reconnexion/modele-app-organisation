import type { ReactNode } from 'react';
import { useGetIdentity, useLogout } from '@refinedev/core';
import type { Identity } from '@activitypods/refine-providers';
import { useAccessControlRefresh } from '@activitypods/refine-hooks';
import { Avatar, Button, Dropdown, Layout as AntdLayout, Typography, theme } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

export const APP_NAME = 'Calendrier partagé';

const UserMenu = ({ identity }: { identity?: Identity }) => {
  const { mutate: logout } = useLogout();
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          { key: 'name', label: identity?.name, disabled: true },
          { type: 'divider' },
          { key: 'logout', label: 'Se déconnecter', icon: <LogoutOutlined />, onClick: () => logout() }
        ]
      }}
    >
      <Avatar
        src={identity?.avatar}
        icon={!identity?.avatar && <UserOutlined />}
        style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.5)' }}
      />
    </Dropdown>
  );
};

const Layout = ({ children }: { children: ReactNode }) => {
  const { token } = theme.useToken();
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();
  useAccessControlRefresh();

  return (
    <AntdLayout style={{ minHeight: '100dvh' }}>
      <AntdLayout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '0 16px',
          background: token.colorPrimary
        }}
      >
        <Typography.Text
          strong
          ellipsis
          style={{ color: '#fff', fontSize: 20, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {APP_NAME}
        </Typography.Text>
        {identity ? (
          <UserMenu identity={identity} />
        ) : (
          <Button ghost onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        )}
      </AntdLayout.Header>
      <AntdLayout.Content style={{ padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {children}
      </AntdLayout.Content>
    </AntdLayout>
  );
};

export default Layout;
