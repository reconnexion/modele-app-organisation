import type { ReactNode } from 'react';
import { useGetIdentity, useLogout } from '@refinedev/core';
import type { Identity } from '@activitypods/refine-providers';
import { useAccessControlRefresh, useGroupMembership } from '@activitypods/refine-hooks';
import { JoinGroupButton } from '@activitypods/refine-antd';
import { App, Avatar, Button, Dropdown, Layout as AntdLayout, Space, Typography } from 'antd';
import { LogoutOutlined, UserDeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

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
        style={{ cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)' }}
      />
    </Dropdown>
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
    <AntdLayout style={{ minHeight: '100dvh' }}>
      <AntdLayout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '0 16px',
          background: '#ebebeb',
          borderBottom: '1px solid #d9d9d9'
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, lineHeight: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {appIcon && <Avatar shape="square" src={appIcon} style={{ flexShrink: 0 }} />}
          <Typography.Text strong ellipsis style={{ fontSize: 20, lineHeight: 1.4 }}>
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
      <AntdLayout.Content style={{ padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {children}
      </AntdLayout.Content>
    </AntdLayout>
  );
};

export default Layout;
