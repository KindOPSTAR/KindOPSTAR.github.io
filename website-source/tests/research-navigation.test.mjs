import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialResearchNavigation,
  researchNavigation as reduce,
} from '../lib/research-navigation.ts';

test('selecting a paper focuses its area on the same canvas', () => {
  const state = reduce(initialResearchNavigation, {
    type: 'paper',
    paper: 'q1',
    area: 'qual',
  });
  assert.deepEqual(state.current, { area: 'qual', paper: 'q1' });
  assert.deepEqual(state.past, [initialResearchNavigation.current]);
});

test('switching areas clears the paper and Previous restores it', () => {
  let state = reduce(initialResearchNavigation, {
    type: 'paper',
    paper: 'q1',
    area: 'qual',
  });
  const paperState = state.current;
  state = reduce(state, { type: 'area', area: 'home' });
  assert.deepEqual(state.current, { area: 'home', paper: null });
  assert.deepEqual(reduce(state, { type: 'back' }).current, paperState);
});

test('closing details retains the focused area and can be undone', () => {
  let state = reduce(initialResearchNavigation, {
    type: 'paper',
    paper: 'q1',
    area: 'qual',
  });
  const paperState = state.current;
  state = reduce(state, { type: 'clear-paper' });
  assert.deepEqual(state.current, { area: 'qual', paper: null });
  assert.deepEqual(reduce(state, { type: 'back' }).current, paperState);
});

test('Show all retains history and repeated actions add no dead steps', () => {
  assert.equal(
    reduce(initialResearchNavigation, { type: 'back' }),
    initialResearchNavigation,
  );
  let state = reduce(initialResearchNavigation, { type: 'area', area: 'qual' });
  assert.equal(reduce(state, { type: 'area', area: 'qual' }), state);
  const focused = state.current;
  state = reduce(state, { type: 'area', area: null });
  assert.deepEqual(state.current, initialResearchNavigation.current);
  assert.deepEqual(reduce(state, { type: 'back' }).current, focused);
});
