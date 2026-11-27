import { useList, useNavigation } from '@refinedev/core';
import { Space, Tag } from 'antd';
import { Link } from 'react-router';
import type { Circle } from './CirclePacking';

// All the circles, shared by the views which need them
export const useCircles = () => {
  const { result, query } = useList<Circle>({ resource: 'circles', pagination: { mode: 'off' } });
  return { circles: result.data ?? [], isLoading: query.isLoading };
};

// The circle and all its sub-circles, at any depth
export const getDescendants = (circles: Circle[], id?: string) => {
  const descendants = new Set<string>(id ? [id] : []);
  let added = true;
  while (added) {
    added = false;
    for (const circle of circles) {
      if (circle['pair:partOf'] && descendants.has(circle['pair:partOf']) && !descendants.has(circle.id)) {
        descendants.add(circle.id);
        added = true;
      }
    }
  }
  return descendants;
};

export const circleOptions = (circles: Circle[], excluded = new Set<string>()) =>
  circles
    .filter(circle => !excluded.has(circle.id))
    .map(circle => ({ value: circle.id, label: circle['pair:label'] ?? '' }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const CircleTags = ({ circles }: { circles: Circle[] }) => {
  const { showUrl } = useNavigation();
  return (
    <Space size={[0, 8]} wrap>
      {circles.map(circle => (
        <Link key={circle.id} to={showUrl('circles', circle.id)}>
          <Tag color="green">{circle['pair:label']}</Tag>
        </Link>
      ))}
    </Space>
  );
};
