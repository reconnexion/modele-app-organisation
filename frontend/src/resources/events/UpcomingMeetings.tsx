import { useMemo } from 'react';
import { CreateButton } from '@refinedev/antd';
import { useList, useNavigation } from '@refinedev/core';
import { List } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import dayjs from 'dayjs';
import type { Event } from './types';

const UpcomingMeetings = ({ circleId, max = 4 }: { circleId: string; max?: number }) => {
  const { showUrl } = useNavigation();
  const { result, query } = useList<Event>({ resource: 'events', pagination: { mode: 'off' } });

  const meetings = useMemo(() => {
    const now = dayjs();
    return (result.data ?? [])
      .filter(event => event['pair:concerns'] === circleId && event.startTime)
      .filter(event => !dayjs(event.endTime ?? event.startTime).isBefore(now))
      .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
      .slice(0, max);
  }, [result.data, circleId, max]);

  return (
    <div style={{ width: '100%' }}>
      <List
        size="small"
        loading={query.isLoading}
        dataSource={meetings}
        locale={{ emptyText: 'Aucune réunion prévue pour le moment' }}
        renderItem={event => (
          <List.Item>
            <List.Item.Meta
              avatar={<CalendarOutlined />}
              title={<Link to={showUrl('events', event.id)}>{event.name}</Link>}
              description={dayjs(event.startTime).format('LLL')}
            />
          </List.Item>
        )}
      />
      <CreateButton resource="events" size="small" meta={{ query: { concerns: circleId } }}>
        Nouvelle réunion
      </CreateButton>
    </div>
  );
};

export default UpcomingMeetings;
