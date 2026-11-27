import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, pack, type HierarchyCircularNode } from 'd3-hierarchy';
import { interpolateZoom, type ZoomView } from 'd3-interpolate';

export type Circle = {
  id: string;
  'pair:label'?: string;
  'pair:partOf'?: string;
  'hc:accountabilities'?: string;
};

type TreeNode = { id?: string; label: string; children: TreeNode[]; circle?: Circle };

// d3.schemePaired, as in OrganiGraph
const COLORS = [
  '#a6cee3',
  '#1f78b4',
  '#b2df8a',
  '#33a02c',
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928'
];

const textColor = (background: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(background.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#000' : '#fff';
};

// The circles without (known) parent are grouped under an anonymous root if there are several of them
const buildTree = (circles: Circle[]): TreeNode => {
  const nodes = new Map<string, TreeNode>(
    circles.map(circle => [circle.id, { id: circle.id, label: circle['pair:label'] ?? '', children: [], circle }])
  );
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(node.circle!['pair:partOf'] ?? '');
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots.length === 1 ? roots[0] : { label: '', children: roots };
};

// Like OrganiGraph, the more accountabilities, the bigger the circle
const weight = (node: TreeNode, depth: number) =>
  depth === 1 ? 10 : Math.max(2, node.circle?.['hc:accountabilities']?.split(/\r\n|\r|\n/).length ?? 0);

// With some margin around the circle
const zoomOn = (node: HierarchyCircularNode<TreeNode>): ZoomView => [node.x, node.y, node.r * 2.1];

const useSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  return { ref, ...size };
};

type CirclePackingProps = {
  circles: Circle[];
  selectedId?: string;
  onSelect: (id?: string) => void;
};

const CirclePacking = ({ circles, selectedId, onSelect }: CirclePackingProps) => {
  const { ref, width, height } = useSize();

  const root = useMemo(() => {
    const tree = hierarchy(buildTree(circles), node => node.children);
    const depths = new Map(tree.descendants().map(node => [node.data, node.depth]));
    tree.sum(node => (node.children.length ? 0 : weight(node, depths.get(node)!)));
    return pack<TreeNode>().size([1000, 1000]).padding(14)(tree);
  }, [circles]);

  const nodes = useMemo(() => root.descendants(), [root]);
  const selected = nodes.find(node => node.data.id && node.data.id === selectedId);
  // A circle without sub-circles is shown within its parent
  const focus = selected ? (selected.children ? selected : (selected.parent ?? selected)) : root;

  const [view, setView] = useState<ZoomView>(() => zoomOn(focus));
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const interpolate = interpolateZoom(viewRef.current, zoomOn(focus));
    const duration = 500;
    const start = performance.now();
    let frame: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setView(interpolate(t * (2 - t)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [focus]);

  const k = Math.min(width, height) / view[2];
  const position = (node: HierarchyCircularNode<TreeNode>) => ({
    x: (node.x - view[0]) * k,
    y: (node.y - view[1]) * k,
    r: node.r * k
  });

  const select = (node: HierarchyCircularNode<TreeNode>) => {
    if (node === selected) onSelect(node.parent?.data.id ?? root.data.id);
    else onSelect(node.data.id);
  };

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {width > 0 && (
        <svg
          viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
          width={width}
          height={height}
          style={{ display: 'block', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => onSelect(root.data.id)}
        >
          <style>{'.circle:hover { stroke: #444; stroke-width: 1.5px; }'}</style>
          {nodes.map(node => {
            const { x, y, r } = position(node);
            const color = COLORS[node.depth % COLORS.length];
            const isSelected = node === selected;
            return (
              <circle
                key={node.data.id ?? 'root'}
                className="circle"
                cx={x}
                cy={y}
                r={Math.max(0, r)}
                fill={color}
                stroke={isSelected ? '#000' : 'none'}
                strokeWidth={isSelected ? 2.5 : 0}
                onClick={e => {
                  e.stopPropagation();
                  select(node);
                }}
              >
                <title>{node.data.label}</title>
              </circle>
            );
          })}
          {nodes.map((node, i) => {
            const { x, y, r } = position(node);
            const fill = textColor(COLORS[node.depth % COLORS.length]);
            if (node.children) {
              // The name of a circle with sub-circles follows its top border
              const fontSize = 15;
              const arcRadius = r - fontSize - 6;
              if (arcRadius < 40 || !node.data.label) return null;
              return (
                <g key={`label-${node.data.id ?? 'root'}`} pointerEvents="none">
                  <path
                    id={`arc-${i}`}
                    d={`M ${x - arcRadius},${y} A ${arcRadius},${arcRadius} 0 0,1 ${x + arcRadius},${y}`}
                    fill="none"
                  />
                  <text fontSize={fontSize} fontWeight="bold" fill={fill} textAnchor="middle">
                    <textPath href={`#arc-${i}`} startOffset="50%">
                      {node.data.label}
                    </textPath>
                  </text>
                </g>
              );
            }
            const fontSize = 12;
            const maxChars = Math.floor((r * 1.8) / (fontSize * 0.6));
            if (r < 20 || maxChars < 3) return null;
            const label =
              node.data.label.length > maxChars ? `${node.data.label.slice(0, maxChars - 1)}…` : node.data.label;
            return (
              <text
                key={`label-${node.data.id}`}
                x={x}
                y={y}
                fontSize={fontSize}
                fontWeight="bold"
                fill={fill}
                textAnchor="middle"
                dominantBaseline="central"
                pointerEvents="none"
              >
                {label}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default CirclePacking;
