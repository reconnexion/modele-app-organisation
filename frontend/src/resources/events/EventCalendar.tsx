import { useMemo, useState } from 'react';
import { CreateButton, List } from '@refinedev/antd';
import { useCan, useGo, useList } from '@refinedev/core';
import { Badge, Calendar, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import EventModal from './EventModal';
import { ShareButton } from '@activitypods/refine-antd';
import { clientId } from 'virtual:app-manifest';
import { EVENT_SHAPE_TREE } from '../../providers';

type Event = { id: string; name?: string; startTime?: string; endTime?: string };

const EventCalendar = ({ storageWebId }: { storageWebId?: string }) => {
  const go = useGo();
  const { data: canCreate } = useCan({ resource: 'events', action: 'create' });
  const [openEventId, setOpenEventId] = useState<string>();
  const { result, query } = useList<Event>({ resource: 'events', pagination: { mode: 'off' } });

  const eventsByDay = useMemo(() => {
    const days = new Map<string, Event[]>();
    for (const event of result.data ?? []) {
      if (!event.startTime) continue;
      const end = dayjs(event.endTime ?? event.startTime);
      for (let day = dayjs(event.startTime).startOf('day'); !day.isAfter(end, 'day'); day = day.add(1, 'day')) {
        const key = day.format('YYYY-MM-DD');
        days.set(key, [...(days.get(key) ?? []), event]);
      }
    }
    for (const events of days.values()) events.sort((a, b) => a.startTime!.localeCompare(b.startTime!));
    return days;
  }, [result.data]);

  const dateCellRender = (date: Dayjs) => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {(eventsByDay.get(date.format('YYYY-MM-DD')) ?? []).map(event => (
        <li
          key={event.id}
          onClick={e => {
            e.stopPropagation();
            setOpenEventId(event.id);
          }}
          style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
        >
          <Badge status="processing" text={`${dayjs(event.startTime).format('HH:mm')} ${event.name ?? ''}`} />
        </li>
      ))}
    </ul>
  );

  return (
    <List
      title="Calendrier"
      headerButtons={
        <>
          <ShareButton clientId={clientId} resource="events" shapeTreeUri={EVENT_SHAPE_TREE} podOwner={storageWebId}>
            Permissions
          </ShareButton>
          <CreateButton>Nouvel événement</CreateButton>
        </>
      }
    >
      <Spin spinning={query.isLoading}>
        <Calendar
          cellRender={(date, info) => (info.type === 'date' ? dateCellRender(date) : info.originNode)}
          onSelect={(date, { source }) => {
            if (source === 'date' && canCreate?.can) {
              go({
                to: { resource: 'events', action: 'create' },
                query: { startTime: date.hour(18).minute(0).second(0).millisecond(0).toISOString() }
              });
            }
          }}
        />
      </Spin>
      <EventModal id={openEventId} onClose={() => setOpenEventId(undefined)} />
    </List>
  );
};

export default EventCalendar;
