import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { traceLineage } from '../lib/research-graph.ts';
const graph = JSON.parse(
  readFileSync(new URL('../data/research-map.json', import.meta.url)),
);
const profile = JSON.parse(
  readFileSync(new URL('../data/profile.json', import.meta.url)),
);
test('every work has a unique map node and all edges refer to known works', () => {
  const works = [...profile.publications, ...profile.projects];
  assert.equal(graph.nodes.length, works.length);
  assert.equal(new Set(graph.nodes.map((n) => n.key)).size, works.length);
  for (const n of graph.nodes) {
    assert.ok(works.some((p) => p.id === n.publicationId));
    assert.ok(['sys', 'evd', 'con'].includes(n.arc));
  }
  for (const e of graph.edges) {
    assert.ok(graph.nodes.some((n) => n.key === e.from));
    assert.ok(graph.nodes.some((n) => n.key === e.to));
  }
});
test('lineage follows direction without incorrectly including sibling branches', () => {
  const result = traceLineage('b', [
    { from: 'a', to: 'b' },
    { from: 'a', to: 'sibling' },
    { from: 'b', to: 'c' },
  ]);
  assert.deepEqual([...result.ancestors], ['a']);
  assert.deepEqual([...result.descendants], ['c']);
});
test('cycles terminate and do not include selected node in its own lineage', () => {
  const r = traceLineage('a', [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'a' },
  ]);
  assert.deepEqual([...r.ancestors], ['b']);
  assert.deepEqual([...r.descendants], ['b']);
});
test('the new under-review project has no invented causal edges', () => {
  const r = traceLineage('project-vbc', graph.edges);
  assert.equal(r.ancestors.size + r.descendants.size, 0);
});

const { layoutResearch, CARD_WIDTH, CARD_HEIGHT } =
  await import('../lib/research-graph.ts');
const allWorks = [...profile.publications, ...profile.projects];
const layoutNodes = graph.nodes.map((n) => ({
  key: n.key,
  year: Number(
    allWorks.find((p) => p.id === n.publicationId).kind.match(/20\d{2}/)[0],
  ),
  lane: n.arc,
  order: n.y,
}));
test('all real nodes fit without overlap in path and timeline views', () => {
  for (const mode of ['paths', 'timeline']) {
    const l = layoutResearch(layoutNodes, graph.edges, mode);
    assert.equal(Object.keys(l.positions).length, layoutNodes.length);
    const positions = Object.values(l.positions);
    for (let i = 0; i < positions.length; i++) {
      const a = positions[i];
      assert.ok(a.x + CARD_WIDTH <= l.width && a.y + CARD_HEIGHT <= l.height);
      for (let j = i + 1; j < positions.length; j++) {
        const b = positions[j];
        assert.ok(
          a.x + CARD_WIDTH <= b.x ||
            b.x + CARD_WIDTH <= a.x ||
            a.y + CARD_HEIGHT <= b.y ||
            b.y + CARD_HEIGHT <= a.y,
          'Cards overlap',
        );
      }
    }
    if (mode === 'paths')
      for (const e of graph.edges)
        assert.ok(
          l.positions[e.from].x < l.positions[e.to].x,
          'Dependency must run left to right',
        );
  }
});
test('empty and single-work layouts remain finite, and cycles fail explicitly', () => {
  assert.equal(
    Object.keys(layoutResearch([], [], 'paths').positions).length,
    0,
  );
  const one = layoutResearch([layoutNodes[0]], graph.edges, 'timeline');
  assert.ok(Number.isFinite(one.height));
  assert.throws(
    () =>
      layoutResearch(
        [
          { key: 'a', year: 2025, lane: 'sys', order: 0 },
          { key: 'b', year: 2025, lane: 'sys', order: 1 },
        ],
        [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
        'paths',
      ),
    /cycle/,
  );
});
