import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialResearchNavigation,
  researchNavigation as reduce,
} from '../lib/research-navigation.ts';

test('cross-area previews preserve the current graph and its highlighted starting paper', () => {
  let s = reduce(initialResearchNavigation, { type: 'area', area: 'qual' });
  s = reduce(s, { type: 'paper', paper: 'q1', area: 'qual' });
  const origin = s.current;
  s = reduce(s, { type: 'paper', paper: 'a1', area: 'access' });
  assert.deepEqual(s.current, { area: 'qual', paper: 'a1', anchor: 'q1' });
  s = reduce(s, { type: 'paper', paper: 's1', area: 'social' });
  assert.equal(s.current.area, 'qual');
  s = reduce(s, { type: 'back' });
  assert.equal(s.current.paper, 'a1');
  s = reduce(s, { type: 'back' });
  assert.deepEqual(s.current, origin);
});
test('explicit locate changes area, and Previous restores the prior preview', () => {
  let s = reduce(initialResearchNavigation, { type: 'area', area: 'qual' });
  s = reduce(s, { type: 'paper', paper: 'q1', area: 'qual' });
  s = reduce(s, { type: 'paper', paper: 'a1', area: 'access' });
  const preview = s.current;
  s = reduce(s, { type: 'locate', area: 'access' });
  assert.deepEqual(s.current, { area: 'access', paper: 'a1', anchor: 'a1' });
  assert.deepEqual(reduce(s, { type: 'back' }).current, preview);
});
test('switching categories clears stale selections; returning restores them', () => {
  let s = reduce(initialResearchNavigation, { type: 'area', area: 'qual' });
  s = reduce(s, { type: 'paper', paper: 'q1', area: 'qual' });
  assert.equal(reduce(s, { type: 'area', area: 'qual' }), s);
  const prior = s.current;
  s = reduce(s, { type: 'area', area: 'home' });
  assert.deepEqual(s.current, { area: 'home', paper: null, anchor: null });
  assert.deepEqual(reduce(s, { type: 'back' }).current, prior);
});
test('overview can be undone and repeated selections do not create dead history steps', () => {
  assert.equal(
    reduce(initialResearchNavigation, { type: 'back' }),
    initialResearchNavigation,
  );
  let s = reduce(initialResearchNavigation, {
    type: 'paper',
    paper: 'q1',
    area: 'qual',
  });
  const prior = s.current;
  assert.equal(reduce(s, { type: 'paper', paper: 'q1', area: 'qual' }), s);
  s = reduce(s, { type: 'overview' });
  assert.deepEqual(s.current, initialResearchNavigation.current);
  assert.deepEqual(reduce(s, { type: 'back' }).current, prior);
});
