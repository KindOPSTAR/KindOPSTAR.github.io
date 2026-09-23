import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layoutBranch } from '../lib/research-hierarchy.ts';
const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url)));
const graph = read('../data/research-map.json');
const categories = read('../data/research-categories.json');
test('the overview assigns every published work to exactly one area', () => {
  const keys = categories.flatMap((c) => c.keys);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual([...keys].sort(), graph.nodes.map((n) => n.key).sort());
  for (const edge of graph.edges) {
    assert.ok(keys.includes(edge.from) && keys.includes(edge.to));
  }
});
test('every branch fits mobile and desktop widths without overlap, and edges point downward', () => {
  for (const category of categories)
    for (const columns of [2, 3]) {
      const l = layoutBranch(category.keys, graph.edges, columns);
      assert.equal(Object.keys(l.positions).length, category.keys.length);
      for (const [key, p] of Object.entries(l.positions)) {
        assert.ok(p.x >= 0 && p.x + l.width <= 1000);
        assert.ok(p.y >= 0 && p.y + 72 <= l.height);
        for (const [other, q] of Object.entries(l.positions))
          if (other !== key) {
            assert.ok(
              p.y + 72 <= q.y ||
                q.y + 72 <= p.y ||
                p.x + l.width <= q.x ||
                q.x + l.width <= p.x,
            );
          }
      }
      for (const e of l.links)
        assert.ok(l.positions[e.from].y + 72 < l.positions[e.to].y);
    }
});
test('branch layout handles empty and single-node branches and rejects cycles', () => {
  assert.deepEqual(layoutBranch([], []).positions, {});
  assert.equal(Object.keys(layoutBranch(['a'], []).positions).length, 1);
  assert.throws(
    () =>
      layoutBranch(
        ['a', 'b'],
        [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
      ),
    /cycle/,
  );
});
