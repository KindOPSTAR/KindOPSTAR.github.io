import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  edgePath,
  layoutUnifiedResearch,
  researchLineage,
} from '../lib/research-hierarchy.ts';

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url)));
const graph = read('../data/research-map.json');
const categories = read('../data/research-categories.json');
const allKeys = categories.flatMap((category) => category.keys);

test('the map assigns every published work to exactly one area', () => {
  assert.equal(new Set(allKeys).size, allKeys.length);
  assert.deepEqual(
    [...allKeys].sort((a, b) => a.localeCompare(b)),
    graph.nodes.map((node) => node.key).sort((a, b) => a.localeCompare(b)),
  );
  for (const edge of graph.edges)
    assert.ok(allKeys.includes(edge.from) && allKeys.includes(edge.to));
});

test('every paper remains on the same canvas in every focus state', () => {
  const focuses = [null, ...categories.map((category) => category.id)];
  for (const compact of [false, true])
    for (const focus of focuses) {
      const layout = layoutUnifiedResearch(categories, focus, compact);
      assert.deepEqual(
        Object.keys(layout.positions).sort((a, b) => a.localeCompare(b)),
        [...allKeys].sort((a, b) => a.localeCompare(b)),
      );
      assert.deepEqual(
        Object.keys(layout.categories).sort((a, b) => a.localeCompare(b)),
        categories
          .map((category) => category.id)
          .sort((a, b) => a.localeCompare(b)),
      );
      for (const position of Object.values(layout.positions)) {
        assert.ok(position.x >= 0);
        assert.ok(position.x + position.width <= 1000.001);
        assert.ok(position.y >= 0);
        assert.ok(position.y + position.height <= layout.height + 12);
      }
    }
});

test('focusing an area enlarges its papers and keeps other papers visible', () => {
  for (const category of categories) {
    const layout = layoutUnifiedResearch(categories, category.id);
    for (const key of allKeys)
      assert.equal(
        layout.positions[key].scale,
        category.keys.includes(key) ? 'large' : 'small',
      );
  }
  const overview = layoutUnifiedResearch(categories, null);
  for (const key of allKeys)
    assert.equal(overview.positions[key].scale, 'regular');
});

test('node cards never overlap within a layout', () => {
  for (const compact of [false, true])
    for (const focus of [null, ...categories.map((category) => category.id)]) {
      const positions = Object.entries(
        layoutUnifiedResearch(categories, focus, compact).positions,
      );
      for (let index = 0; index < positions.length; index++) {
        const [key, position] = positions[index];
        for (const [otherKey, other] of positions.slice(index + 1))
          assert.ok(
            position.y + position.height <= other.y ||
              other.y + other.height <= position.y ||
              position.x + position.width <= other.x ||
              other.x + other.width <= position.x,
            `${key} overlaps ${otherKey} in ${focus || 'overview'}`,
          );
      }
    }
});

test('all relationship paths are valid in every layout', () => {
  for (const focus of [null, ...categories.map((category) => category.id)]) {
    const layout = layoutUnifiedResearch(categories, focus);
    for (const edge of graph.edges) {
      const path = edgePath(layout, edge);
      assert.match(path, /^M[-\d.]+,[-\d.]+ C/);
      assert.doesNotMatch(path, /NaN|undefined/);
    }
  }
});

test('lineage includes every ancestor, descendant, and connecting edge', () => {
  const edges = [
    { from: 'origin', to: 'middle' },
    { from: 'middle', to: 'future' },
    { from: 'future', to: 'latest' },
    { from: 'origin', to: 'sibling' },
  ];
  const lineage = researchLineage('middle', edges);
  assert.deepEqual([...lineage.ancestors], ['origin']);
  assert.deepEqual([...lineage.descendants], ['future', 'latest']);
  assert.deepEqual(
    [...lineage.edges].sort((a, b) => a.localeCompare(b)),
    ['future:latest', 'middle:future', 'origin:middle'],
  );
});
