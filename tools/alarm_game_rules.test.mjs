import test from 'node:test';
import assert from 'node:assert/strict';
import {judge, GAMES} from '../apps/alarm/games/rules.js';

const j = (g, s) => judge(g, 1, s);
test('brick: win at 0 bricks (even on last life), loss at 0 lives, else null', () => {
  assert.equal(j('brick', {bricksTotal: 24, bricksLeft: 0, lives: 1}), 'won');
  assert.equal(j('brick', {bricksTotal: 24, bricksLeft: 0, lives: 0}), 'won');
  assert.equal(j('brick', {bricksTotal: 24, bricksLeft: 5, lives: 0}), 'lost');
  assert.equal(j('brick', {bricksTotal: 24, bricksLeft: 5, lives: 1}), null);
  assert.equal(j('brick', {bricksTotal: 24, bricksLeft: 5, lives: 5}), null);
  assert.equal(j('brick', {bricksTotal: 24, bricksLeft: 30, lives: 0}), null);
});
test('pong, match3, blocks, memory, odd', () => {
  assert.equal(j('pong', {player: 5, cpu: 2}), 'won'); assert.equal(j('pong', {player: 3, cpu: 5}), 'lost'); assert.equal(j('pong', {player: 4, cpu: 4}), null); assert.equal(j('pong', {player: 5, cpu: 5}), null);
  assert.equal(j('match3', {target: 10, progress: 10, swaps: 20}), 'won');           // win before budget
  assert.equal(j('match3', {target: 10, progress: 9, swaps: 20}), 'lost'); assert.equal(j('match3', {target: 10, progress: 9, swaps: 19}), null);
  assert.equal(j('blocks', {lines: 3, pieces: 30, toppedOut: true}), 'won');
  assert.equal(j('blocks', {lines: 2, pieces: 12, toppedOut: true}), 'lost'); assert.equal(j('blocks', {lines: 2, pieces: 30, toppedOut: false}), 'lost'); assert.equal(j('blocks', {lines: 2, pieces: 29, toppedOut: false}), null);
  assert.equal(j('memory', {pairs: 6, attempts: 18}), 'won'); assert.equal(j('memory', {pairs: 5, attempts: 18}), 'lost'); assert.equal(j('memory', {pairs: 5, attempts: 17}), null);
  assert.equal(j('odd', {answered: 12, correct: 8}), 'won'); assert.equal(j('odd', {answered: 12, correct: 7}), 'lost');
  assert.equal(j('odd', {answered: 11, correct: 11}), null); assert.equal(j('odd', {answered: 3, correct: 0}), null);
});
test('unknown game, wrong version, junk state -> null', () => {
  assert.deepEqual(GAMES, ['brick', 'pong', 'match3', 'blocks', 'memory', 'odd']);
  assert.equal(judge('nope', 1, {}), null); assert.equal(judge('brick', 2, {bricksTotal: 1, bricksLeft: 0, lives: 1}), null);
  assert.equal(judge('brick', 1, null), null); assert.equal(judge('brick', 1, {bricksTotal: '24', bricksLeft: 0, lives: 1}), null);
  assert.equal(judge('__proto__', 1, {}), null);
});
