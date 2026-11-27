import type { ComponentProps } from 'react';
import { Create, DeleteButton, Edit, EditButton, Show } from '@refinedev/antd';
import { useGo, useResourceParams } from '@refinedev/core';
import { Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { ShareButton } from '@activitypods/refine-antd';
import { clientId } from 'virtual:app-manifest';

// Closing a panel goes back to the list alone
const usePanelProps = () => {
  const go = useGo();
  const { resource } = useResourceParams();
  return {
    breadcrumb: false,
    goBack: <CloseOutlined />,
    headerProps: { onBack: () => go({ to: { resource: resource!.name, action: 'list' } }) },
    contentProps: { variant: 'borderless' as const }
  };
};

export const ShowSide = (props: ComponentProps<typeof Show>) => {
  const { resource, id } = useResourceParams();
  return (
    <Show
      {...usePanelProps()}
      headerButtons={({ editButtonProps, deleteButtonProps }) => (
        // Hidden by the access control provider if the user cannot modify the record
        <Space wrap>
          <ShareButton clientId={clientId} resource={resource?.name} recordItemId={id?.toString()} />
          {editButtonProps && <EditButton {...editButtonProps} />}
          {deleteButtonProps && <DeleteButton {...deleteButtonProps} />}
        </Space>
      )}
      {...props}
      // Otherwise Refine shows "Show <resource>" while loading
      title={props.title ?? ''}
    />
  );
};

export const EditSide = (props: ComponentProps<typeof Edit>) => (
  <Edit {...usePanelProps()} headerButtons={null} {...props} />
);

export const CreateSide = (props: ComponentProps<typeof Create>) => <Create {...usePanelProps()} {...props} />;
