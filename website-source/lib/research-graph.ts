export type Edge = { from: string; to: string };
export function traceLineage(key: string, edges: Edge[]) {
  const ancestors = new Set<string>(),
    descendants = new Set<string>();
  function walk(start: string, direction: 'up' | 'down', seen: Set<string>) {
    const queue = [start];
    while (queue.length) {
      const next = queue.shift()!;
      for (const edge of edges) {
        const a = direction === 'up' ? edge.to : edge.from;
        const b = direction === 'up' ? edge.from : edge.to;
        if (a === next && b !== start && !seen.has(b)) {
          seen.add(b);
          queue.push(b);
        }
      }
    }
  }
  walk(key, 'up', ancestors);
  walk(key, 'down', descendants);
  return { ancestors, descendants };
}
export type GraphNode = {
  key: string;
  year: number;
  lane: string;
  order: number;
};
export const CARD_WIDTH = 188,
  CARD_HEIGHT = 64;
/** Stable, non-overlapping lanes; longest-path columns separate same-year developments. */
export function layoutResearch(
  nodes: GraphNode[],
  edges: Edge[],
  mode: 'paths' | 'timeline',
) {
  const keys = new Set(nodes.map((n) => n.key));
  const links = edges.filter((e) => keys.has(e.from) && keys.has(e.to));
  const rank: Record<string, number> = {};
  const incoming = new Map(
    nodes.map((n) => [n.key, links.filter((e) => e.to === n.key).length]),
  );
  const queue = nodes
    .filter((n) => incoming.get(n.key) === 0)
    .sort((a, b) => a.year - b.year || a.order - b.order)
    .map((n) => n.key);
  let visited = 0;
  for (const key of queue) {
    visited++;
    rank[key] ??= 0;
    for (const e of links.filter((e) => e.from === key)) {
      rank[e.to] = Math.max(rank[e.to] ?? 0, rank[key] + 1);
      incoming.set(e.to, incoming.get(e.to)! - 1);
      if (incoming.get(e.to) === 0) queue.push(e.to);
    }
  }
  if (visited !== nodes.length)
    throw new Error('Research development graph contains a cycle.');
  const years = [...new Set(nodes.map((n) => n.year))].sort();
  const columns =
    mode === 'timeline'
      ? years.map(String)
      : Array.from(
          { length: Math.max(1, ...Object.values(rank).map((r) => r + 1)) },
          (_, i) => (i === 0 ? 'Foundations' : `Development ${i}`),
        );
  const lanes = [...new Set(nodes.map((n) => n.lane))];
  const positions: Record<string, { x: number; y: number }> = {};
  const bands: { key: string; y: number; height: number }[] = [];
  let y = 62;
  for (const lane of lanes) {
    const inLane = nodes.filter((n) => n.lane === lane);
    let maxRows = 1;
    const base = y;
    for (let col = 0; col < columns.length; col++) {
      const group = inLane
        .filter(
          (n) =>
            (mode === 'timeline' ? years.indexOf(n.year) : rank[n.key]) === col,
        )
        .sort((a, b) => a.year - b.year || a.order - b.order);
      maxRows = Math.max(maxRows, group.length);
      group.forEach(
        (n, i) =>
          (positions[n.key] = { x: 150 + col * 228, y: base + 24 + i * 88 }),
      );
    }
    const height = maxRows * 88 + 35;
    bands.push({ key: lane, y: base, height });
    y += height + 14;
  }
  return {
    positions,
    bands,
    columns,
    width: Math.max(650, 170 + columns.length * 228),
    height: Math.max(300, y + 10),
  };
}
