import type { ReactNode } from 'react';
import { useGetIdentity, useLogout, useMenu, useResourceParams } from '@refinedev/core';
import { CreateButton } from '@refinedev/antd';
import type { Identity } from '@activitypods/refine-providers';
import { useAccessControlRefresh, useGroupMembership } from '@activitypods/refine-hooks';
import { JoinGroupButton, ShareButton } from '@activitypods/refine-antd';
import { App, Avatar, Button, Dropdown, Grid, Layout as AntdLayout, Space, Tabs, Typography } from 'antd';
import { LogoutOutlined, UserDeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { clientId } from 'virtual:app-manifest';
import { TABS_HEIGHT } from './SplitView';

export const PRIMARY_COLOR = '#21b082';

const UserMenu = ({ identity, groupWebId }: { identity?: Identity; groupWebId?: string }) => {
  const { mutate: logout } = useLogout();
  const { modal } = App.useApp();
  const { status, leave } = useGroupMembership(groupWebId);

  const confirmLeave = () =>
    modal.confirm({
      title: 'Quitter le groupe ?',
      content: "Vous n'aurez plus accès aux données réservées à ses membres.",
      okText: 'Quitter',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: () => leave()
    });

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          { key: 'name', label: identity?.name, disabled: true },
          { type: 'divider' },
          ...(status === 'member'
            ? [{ key: 'leave', label: 'Quitter le groupe', icon: <UserDeleteOutlined />, onClick: confirmLeave }]
            : []),
          { key: 'logout', label: 'Se déconnecter', icon: <LogoutOutlined />, onClick: () => logout() }
        ]
      }}
    >
      <Avatar
        src={identity?.avatar}
        icon={!identity?.avatar && <UserOutlined />}
        style={{ cursor: 'pointer', border: '2px solid rgba(255,255,255,0.8)' }}
      />
    </Dropdown>
  );
};

// One tab per resource, with the buttons acting on the current one
const TabsMenu = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const { menuItems } = useMenu();
  const { resource } = useResourceParams();

  return (
    <Tabs
      activeKey={resource?.name}
      onChange={key => navigate(menuItems.find(item => item.name === key)!.route!)}
      tabBarStyle={{ margin: 0, height: TABS_HEIGHT }}
      items={menuItems.map(item => ({
        key: item.name,
        label: screens.sm ? item.label : undefined,
        icon: item.icon
      }))}
      tabBarExtraContent={
        resource && (
          <Space>
            <ShareButton clientId={clientId} resource={resource.name}>
              {screens.sm && 'Permissions'}
            </ShareButton>
            <CreateButton resource={resource.name} hideText={!screens.sm} />
          </Space>
        )
      }
    />
  );
};

const Layout = ({
  children,
  groupWebId,
  appName,
  appIcon
}: {
  children: ReactNode;
  groupWebId?: string;
  appName: string;
  appIcon?: string;
}) => {
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();
  useAccessControlRefresh();

  return (
    <AntdLayout style={{ minHeight: '100dvh', background: '#fff' }}>
      <AntdLayout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          height: 48,
          padding: '0 16px',
          backgroundImage: `radial-gradient(circle at 50% 14em, #71C252 0%, ${PRIMARY_COLOR} 100%)`
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, lineHeight: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {appIcon && <Avatar shape="square" src={appIcon} style={{ flexShrink: 0, background: '#fff' }} />}
          <Typography.Text strong ellipsis style={{ fontSize: 20, lineHeight: 1.4, color: '#fff' }}>
            {appName}
          </Typography.Text>
        </div>
        {identity ? (
          <Space size={12}>
            {groupWebId && <JoinGroupButton groupWebId={groupWebId} />}
            <UserMenu identity={identity} groupWebId={groupWebId} />
          </Space>
        ) : (
          <Button onClick={() => navigate('/login')}>Se connecter</Button>
        )}
      </AntdLayout.Header>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '0 16px',
          background: '#eeeeee',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <TabsMenu />
      </div>
      <AntdLayout.Content>{children}</AntdLayout.Content>
    </AntdLayout>
  );
};

export default Layout;
