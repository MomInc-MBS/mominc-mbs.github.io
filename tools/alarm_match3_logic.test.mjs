import test from 'node:test';
import assert from 'node:assert/strict';
import {SIZE, adjacent, matchesOf, findMove, newState, trySwap, reshuffle, restore, finalOf, BUDGET} from '../apps/alarm/games/match3.js';
import {judge} from '../apps/alarm/games/rules.js';

const clone = x => JSON.parse(JSON.stringify(x));
test('fresh boards: run-free, a legal move exists, deterministic per seed (many seeds)', () => {
  for (let s = 1; s < 200; s++) { const a = newState(s), b = newState(s); assert.deepEqual(a, b); assert.equal(matchesOf(a.grid).size, 0); assert.ok(findMove(a.grid)); assert.ok(a.grid.every(k => k >= 0 && k < 5)); }
});
test('a no-match swap changes nothing and spends nothing; a non-adjacent swap is rejected', () => {
  const st = newState(7), before = JSON.stringify(st);
  let pair = null;
  for (let i = 0; i < SIZE * SIZE && !pair; i++) for (const j of [i + 1, i + SIZE]) {
    if (j < 49 && adjacent(i, j)) { const g = st.grid.slice(); [g[i], g[j]] = [g[j], g[i]]; if (!matchesOf(g).size) { pair = [i, j]; break; } }
  }
  assert.ok(pair); assert.equal(trySwap(st, ...pair).ok, false); assert.equal(JSON.stringify(st), before);
  assert.equal(trySwap(st, 0, 2).ok, false); assert.equal(trySwap(st, 0, 0).ok, false); assert.equal(trySwap(st, -1, 0).ok, false); assert.equal(JSON.stringify(st), before);
});
test('a valid swap spends one move, resolves the full cascade, leaves a stable board', () => {
  for (let s = 1; s < 100; s++) {
    const st = newState(s), r = trySwap(st, ...findMove(st.grid));
    assert.ok(r.ok); assert.equal(st.swaps, 1); assert.ok(r.steps.length >= 1); assert.equal(matchesOf(st.grid).size, 0); assert.ok(r.verdict || findMove(st.grid)); assert.ok(st.grid.every(k => k >= 0 && k < 5));
  }
});
test('progress counts only the target kind; win is checked before the budget', () => {
  let hit = 0;
  for (let s = 1; s < 200 && !hit; s++) {
    const st = newState(s); st.target = 1; st.swaps = BUDGET - 1;
    const probe = clone(st); trySwap(probe, ...findMove(probe.grid));
    if (probe.progress >= 1) { const r = trySwap(st, ...findMove(st.grid)); assert.equal(st.swaps, BUDGET); assert.equal(r.verdict, 'won'); assert.equal(judge('match3', 1, finalOf(st)), 'won'); hit = 1; }
  }
  assert.ok(hit, 'found a target-clearing swap');
});
test('budget used without the target -> lost; verdict agrees with rules.js', () => {
  const st = newState(9); st.target = 1000; st.swaps = BUDGET - 1; const r = trySwap(st, ...findMove(st.grid));
  assert.equal(r.verdict, 'lost'); assert.equal(judge('match3', 1, finalOf(st)), 'lost');
});
test('reshuffle keeps counters, is deterministic, and always leaves a legal move and no runs', () => {
  for (let s = 1; s < 100; s++) {
    const a = newState(s); a.swaps = 5; a.progress = 4; const b = clone(a);
    reshuffle(a); reshuffle(b); assert.deepEqual(a, b); assert.equal(a.swaps, 5); assert.equal(a.progress, 4); assert.equal(matchesOf(a.grid).size, 0); assert.ok(findMove(a.grid));
  }
});
test('dead board (no legal swap) is detected', () => {
  const g = []; for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) g.push((x + 2 * y) % 5);   // diagonal stripes: no swap makes three
  assert.equal(matchesOf(g).size, 0); assert.equal(findMove(g), null);
});
test('restore validates and round-trips', () => {
  const st = newState(11); trySwap(st, ...findMove(st.grid)); const back = restore(clone(st));
  assert.deepEqual(back, st); assert.equal(restore({...st, grid: st.grid.slice(1)}), null); assert.equal(restore({...st, swaps: 99}), null); assert.equal(restore(null), null);
});
