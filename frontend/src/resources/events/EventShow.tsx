import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import EventDetails from './EventDetails';

const EventShow = () => {
  const { result: record, query } = useShow();
  return (
    <Show isLoading={query.isLoading} title={record?.name} canEdit canDelete>
      <EventDetails record={record} />
    </Show>
  );
};

export default EventShow;
