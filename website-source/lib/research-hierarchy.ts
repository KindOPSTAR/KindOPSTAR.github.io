import type { Edge } from './research-graph';

/** A bounded, top-to-bottom DAG: every node fits the available columns. */
export function layoutBranch(keys: string[], edges: Edge[], columns = 3) {
  if (!Number.isInteger(columns) || columns < 1)
    throw new Error('Invalid column count');
  const included = new Set(keys);
  const links = edges.filter((e) => included.has(e.from) && included.has(e.to));
  const incoming = new Map(
    keys.map((key) => [key, links.filter((e) => e.to === key).length]),
  );
  const ranks: Record<string, number> = Object.fromEntries(
    keys.map((k) => [k, 0]),
  );
  const queue = keys.filter((k) => incoming.get(k) === 0);
  for (const key of queue) {
    for (const e of links.filter((e) => e.from === key)) {
      ranks[e.to] = Math.max(ranks[e.to], ranks[key] + 1);
      incoming.set(e.to, incoming.get(e.to)! - 1);
      if (incoming.get(e.to) === 0) queue.push(e.to);
    }
  }
  if (queue.length !== keys.length)
    throw new Error('Research graph contains a cycle');
  const positions: Record<string, { x: number; y: number }> = {};
  let row = 0;
  const width = 1000 / columns - 24;
  for (let rank = 0; rank <= Math.max(0, ...Object.values(ranks)); rank++) {
    const group = keys.filter((k) => ranks[k] === rank);
    for (let offset = 0; offset < group.length; offset += columns) {
      const chunk = group.slice(offset, offset + columns);
      chunk.forEach((key, i) => {
        positions[key] = {
          x: (1000 - chunk.length * (width + 24)) / 2 + i * (width + 24) + 12,
          y: row * 108 + 8,
        };
      });
      row++;
    }
  }
  return { positions, links, width, height: Math.max(96, row * 108 - 20) };
}

/** Route skipped generations through the outer gutter, never through another card. */
export function branchEdgePoints(
  layout: ReturnType<typeof layoutBranch>,
  edge: Edge,
) {
  const a = layout.positions[edge.from],
    b = layout.positions[edge.to];
  const x1 = a.x + layout.width / 2,
    x2 = b.x + layout.width / 2;
  const y1 = a.y + 72,
    y2 = b.y - 3;
  if (y2 - y1 < 60) {
    const middle = (y1 + y2) / 2;
    return [
      { x: x1, y: y1 },
      { x: x1, y: middle },
      { x: x2, y: middle },
      { x: x2, y: y2 },
    ];
  }
  const gutter = x1 + x2 < 1000 ? 3 : 997;
  return [
    { x: x1, y: y1 },
    { x: x1, y: y1 + 16 },
    { x: gutter, y: y1 + 16 },
    { x: gutter, y: y2 - 16 },
    { x: x2, y: y2 - 16 },
    { x: x2, y: y2 },
  ];
}
