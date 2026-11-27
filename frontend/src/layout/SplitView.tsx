import type { ReactNode } from 'react';
import { useOutlet } from 'react-router';
import { Grid } from 'antd';

export const TABS_HEIGHT = 46;

// The list on the left, the show/edit/create routes of the resource in a panel on the right
const SplitView = ({ list }: { list: ReactNode }) => {
  const screens = Grid.useBreakpoint();
  const panel = useOutlet();

  if (!screens.md) return <div style={{ padding: 16 }}>{panel ?? list}</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: `calc(100dvh - 48px - ${TABS_HEIGHT}px)` }}>
      <div style={{ flex: 7, minWidth: 0, padding: 24 }}>{list}</div>
      <div style={{ flex: 5, minWidth: 0, background: '#f0f0f0', borderLeft: '1px solid #e0e0e0' }}>
        <div
          style={{
            position: 'sticky',
            top: TABS_HEIGHT,
            maxHeight: `calc(100dvh - ${TABS_HEIGHT}px)`,
            overflowY: 'auto',
            padding: 16
          }}
        >
          {panel}
        </div>
      </div>
    </div>
  );
};

export default SplitView;
