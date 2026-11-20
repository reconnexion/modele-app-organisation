import { DeleteButton, EditButton } from '@refinedev/antd';
import { useOne } from '@refinedev/core';
import { Modal, Space, Spin } from 'antd';
import { ShareButton } from '@activitypods/refine-antd';
import { clientId } from 'virtual:app-manifest';
import EventDetails from './EventDetails';

const EventModal = ({ id, onClose }: { id?: string; onClose: () => void }) => {
  const { result: record, query } = useOne({ resource: 'events', id, queryOptions: { enabled: !!id } });
  return (
    <Modal
      open={!!id}
      title={record?.name}
      onCancel={onClose}
      footer={
        // Hidden by the access control provider if the user cannot modify the event
        <Space>
          <ShareButton clientId={clientId} resource="events" recordItemId={id} />
          <EditButton resource="events" recordItemId={id} />
          <DeleteButton resource="events" recordItemId={id} onSuccess={onClose} />
        </Space>
      }
    >
      <Spin spinning={query.isLoading}>
        <EventDetails record={record} />
      </Spin>
    </Modal>
  );
};

export default EventModal;
