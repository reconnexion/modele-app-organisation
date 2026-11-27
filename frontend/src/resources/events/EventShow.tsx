import { ShowSide } from '../../layout/SidePanels';
import { useShow } from '@refinedev/core';
import EventDetails from './EventDetails';

const EventShow = () => {
  const { result: record, query } = useShow();
  return (
    <ShowSide isLoading={query.isLoading} title={record?.name}>
      <EventDetails record={record} />
    </ShowSide>
  );
};

export default EventShow;
