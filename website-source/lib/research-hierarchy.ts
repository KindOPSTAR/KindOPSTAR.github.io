import type { Edge } from './research-graph';

export type ResearchCategory = { id: string; keys: string[] };
export type UnifiedNodePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: 'large' | 'regular' | 'small';
};
export type UnifiedCategoryPosition = {
  x: number;
  y: number;
  width: number;
  focused: boolean;
};
export type UnifiedLayout = {
  positions: Record<string, UnifiedNodePosition>;
  categories: Record<string, UnifiedCategoryPosition>;
  height: number;
};

const CANVAS_WIDTH = 1000;

function placeCluster(
  positions: Record<string, UnifiedNodePosition>,
  keys: string[],
  box: { x: number; y: number; width: number },
  columns: number,
  size: { height: number; gapX: number; gapY: number },
  scale: UnifiedNodePosition['scale'],
) {
  const width = (box.width - size.gapX * (columns - 1)) / columns;
  keys.forEach((key, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions[key] = {
      x: box.x + column * (width + size.gapX),
      y: box.y + row * (size.height + size.gapY),
      width,
      height: size.height,
      scale,
    };
  });
  return (
    Math.ceil(keys.length / columns) * (size.height + size.gapY) - size.gapY
  );
}

/**
 * Every paper is always assigned a position. Focusing an area only changes
 * geometry, so the UI can animate one continuous research landscape.
 */
export function layoutUnifiedResearch(
  categories: ResearchCategory[],
  focusArea: string | null,
  compact = false,
): UnifiedLayout {
  const positions: Record<string, UnifiedNodePosition> = {};
  const categoryPositions: Record<string, UnifiedCategoryPosition> = {};
  const overviewColumns = compact ? 2 : 3;
  const overviewGapX = compact ? 22 : 24;
  const overviewGapY = 28;
  const overviewWidth =
    (CANVAS_WIDTH - overviewGapX * (overviewColumns - 1)) / overviewColumns;

  if (!focusArea) {
    const rowHeights: number[] = [];
    for (
      let row = 0;
      row < Math.ceil(categories.length / overviewColumns);
      row++
    ) {
      const inRow = categories.slice(
        row * overviewColumns,
        (row + 1) * overviewColumns,
      );
      rowHeights[row] = Math.max(
        ...inRow.map((category) => category.keys.length * 39 + 30),
      );
    }
    let rowY = 8;
    categories.forEach((category, index) => {
      const column = index % overviewColumns;
      const row = Math.floor(index / overviewColumns);
      const x = column * (overviewWidth + overviewGapX);
      categoryPositions[category.id] = {
        x,
        y: rowY,
        width: overviewWidth,
        focused: false,
      };
      placeCluster(
        positions,
        category.keys,
        { x, y: rowY + 30, width: overviewWidth },
        1,
        { height: 32, gapX: 0, gapY: 7 },
        'regular',
      );
      if (column === overviewColumns - 1 || index === categories.length - 1)
        rowY += rowHeights[row] + overviewGapY;
    });
    return { positions, categories: categoryPositions, height: rowY - 12 };
  }

  const active = categories.find((category) => category.id === focusArea);
  if (!active) throw new Error(`Unknown research area: ${focusArea}`);
  const activeColumns = compact ? 2 : 3;
  categoryPositions[active.id] = {
    x: 0,
    y: 8,
    width: CANVAS_WIDTH,
    focused: true,
  };
  const activeHeight = placeCluster(
    positions,
    active.keys,
    { x: 0, y: 42, width: CANVAS_WIDTH },
    activeColumns,
    { height: 68, gapX: 22, gapY: 18 },
    'large',
  );

  const remaining = categories.filter((category) => category.id !== focusArea);
  const smallColumns = compact ? 2 : 3;
  const smallGapX = compact ? 22 : 24;
  const smallGapY = 24;
  const smallWidth =
    (CANVAS_WIDTH - smallGapX * (smallColumns - 1)) / smallColumns;
  const smallStartY = activeHeight + 88;
  const rowHeights: number[] = [];
  for (let row = 0; row < Math.ceil(remaining.length / smallColumns); row++) {
    const inRow = remaining.slice(row * smallColumns, (row + 1) * smallColumns);
    rowHeights[row] = Math.max(
      ...inRow.map((category) => Math.ceil(category.keys.length / 2) * 35 + 27),
    );
  }
  let rowY = smallStartY;
  remaining.forEach((category, index) => {
    const column = index % smallColumns;
    const row = Math.floor(index / smallColumns);
    const x = column * (smallWidth + smallGapX);
    categoryPositions[category.id] = {
      x,
      y: rowY,
      width: smallWidth,
      focused: false,
    };
    placeCluster(
      positions,
      category.keys,
      { x, y: rowY + 27, width: smallWidth },
      2,
      { height: 29, gapX: 8, gapY: 6 },
      'small',
    );
    if (column === smallColumns - 1 || index === remaining.length - 1)
      rowY += rowHeights[row] + smallGapY;
  });
  return { positions, categories: categoryPositions, height: rowY - 10 };
}

export function edgePath(layout: UnifiedLayout, edge: Edge) {
  const from = layout.positions[edge.from];
  const to = layout.positions[edge.to];
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height / 2;
  const x2 = to.x + to.width / 2;
  const y2 = to.y + to.height / 2;
  const curve = Math.max(24, Math.abs(y2 - y1) * 0.35);
  return `M${x1},${y1} C${x1},${y1 + curve} ${x2},${y2 - curve} ${x2},${y2}`;
}

export function researchLineage(key: string | null, edges: Edge[]) {
  const ancestors = new Set<string>();
  const descendants = new Set<string>();
  if (!key) return { ancestors, descendants, edges: new Set<string>() };
  const walk = (
    start: string,
    direction: 'before' | 'after',
    found: Set<string>,
  ) => {
    const queue = [start];
    while (queue.length) {
      const current = queue.shift()!;
      edges.forEach((edge) => {
        const source = direction === 'before' ? edge.to : edge.from;
        const target = direction === 'before' ? edge.from : edge.to;
        if (source === current && target !== key && !found.has(target)) {
          found.add(target);
          queue.push(target);
        }
      });
    }
  };
  walk(key, 'before', ancestors);
  walk(key, 'after', descendants);
  const lineageEdges = new Set(
    edges
      .filter(
        (edge) =>
          (ancestors.has(edge.from) &&
            (ancestors.has(edge.to) || edge.to === key)) ||
          ((descendants.has(edge.from) || edge.from === key) &&
            descendants.has(edge.to)),
      )
      .map((edge) => `${edge.from}:${edge.to}`),
  );
  return { ancestors, descendants, edges: lineageEdges };
}
