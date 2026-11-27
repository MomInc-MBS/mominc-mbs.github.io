import test from 'node:test';
import assert from 'node:assert/strict';
import {prune, entryOf, ROUNDS_KEY} from '../apps/alarm/games/play.js';
import {getChoice, setChoice, GAME_KEY, CHOICES} from '../apps/alarm/games/choice.js';

const mem = (init = {}) => { const d = {...init}; return {getItem: k => d[k] ?? null, setItem: (k, v) => { d[k] = String(v); }, d}; };

test('choice: default 2048, persists, rejects unknown, survives blocked storage', () => {
  const ls = mem();
  assert.equal(getChoice(ls), '2048');
  setChoice('memory', ls); assert.equal(ls.d[GAME_KEY], 'memory'); assert.equal(getChoice(ls), 'memory');
  setChoice('nope', ls); assert.equal(getChoice(ls), 'memory');
  ls.d[GAME_KEY] = 'junk'; assert.equal(getChoice(ls), '2048');
  const bad = {getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }};
  assert.equal(getChoice(bad), '2048'); setChoice('pong', bad);
  assert.deepEqual(CHOICES, ['2048', 'brick', 'pong', 'match3', 'blocks', 'memory', 'odd']);
});

test('rounds: one entry per attempt, pruned to live attempts', () => {
  const m = {};
  const a = entryOf(m, 'o1:1', 'brick'); a.n = 2; a.saved.brick = {lives: 3};
  assert.equal(entryOf(m, 'o1:1', 'pong'), a);                    // existing entry wins over the new default
  entryOf(m, 'o2:1', 'odd');
  prune(m, k => k === 'o1:1');
  assert.deepEqual(Object.keys(m), ['o1:1']);
  assert.equal(m['o1:1'].saved.brick.lives, 3);
  assert.equal(ROUNDS_KEY, 'mom-alarm-rounds-v1');
});
