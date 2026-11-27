import { useMemo, useState } from 'react';
import { useCan, useGo, useList, useNavigation, useResourceParams } from '@refinedev/core';
import { Badge, Calendar, Select, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { circleOptions, getDescendants, useCircles } from '../circles/common';
import type { Event } from './types';

const EventCalendar = () => {
  const go = useGo();
  // Unlike go(), it encodes the URI of the event
  const { show } = useNavigation();
  const { data: canCreate } = useCan({ resource: 'events', action: 'create' });
  const { id: openEventId } = useResourceParams();
  const { result, query } = useList<Event>({ resource: 'events', pagination: { mode: 'off' } });
  const { circles } = useCircles();
  // Kept while records are opened in the panel, as the calendar is not rendered again
  const [circleId, setCircleId] = useState<string>();

  // TODO filter on the server, once LDP containers can do it
  const events = useMemo(() => {
    if (!circleId) return result.data ?? [];
    const circleIds = getDescendants(circles, circleId);
    return (result.data ?? []).filter(event => event['pair:concerns'] && circleIds.has(event['pair:concerns']));
  }, [result.data, circles, circleId]);

  const eventsByDay = useMemo(() => {
    const days = new Map<string, Event[]>();
    for (const event of events) {
      if (!event.startTime) continue;
      const end = dayjs(event.endTime ?? event.startTime);
      for (let day = dayjs(event.startTime).startOf('day'); !day.isAfter(end, 'day'); day = day.add(1, 'day')) {
        const key = day.format('YYYY-MM-DD');
        days.set(key, [...(days.get(key) ?? []), event]);
      }
    }
    for (const events of days.values()) events.sort((a, b) => a.startTime!.localeCompare(b.startTime!));
    return days;
  }, [events]);

  const dateCellRender = (date: Dayjs) => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {(eventsByDay.get(date.format('YYYY-MM-DD')) ?? []).map(event => (
        <li
          key={event.id}
          onClick={e => {
            e.stopPropagation();
            show('events', event.id);
          }}
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            fontWeight: event.id === openEventId ? 'bold' : undefined
          }}
        >
          <Badge status="processing" text={`${dayjs(event.startTime).format('HH:mm')} ${event.name ?? ''}`} />
        </li>
      ))}
    </ul>
  );

  return (
    <Spin spinning={query.isLoading}>
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        options={circleOptions(circles)}
        value={circleId}
        onChange={setCircleId}
        placeholder="Tous les cercles"
        style={{ width: 240 }}
      />
      <Calendar
        cellRender={(date, info) => (info.type === 'date' ? dateCellRender(date) : info.originNode)}
        onSelect={(date, { source }) => {
          if (source === 'date' && canCreate?.can) {
            go({
              to: { resource: 'events', action: 'create' },
              query: {
                startTime: date.hour(18).minute(0).second(0).millisecond(0).toISOString(),
                concerns: circleId
              }
            });
          }
        }}
      />
    </Spin>
  );
};

export default EventCalendar;
