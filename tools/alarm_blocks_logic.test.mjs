import test from 'node:test';
import assert from 'node:assert/strict';
import {COLS, ROWS, SHAPES, matrixOf, cellsOf, collides, spawn, tryMove, lockPiece, newState, settle, hardDrop, verdictOf, finalOf, restore} from '../apps/alarm/games/blocks.js';
import {judge} from '../apps/alarm/games/rules.js';

const empty = () => Array(COLS * ROWS).fill(0);
test('7 shapes, 4 cells each, four rotations return to the start', () => {
  assert.equal(SHAPES.length, 7);
  for (let k = 0; k < 7; k++) { assert.equal(cellsOf(spawn(k)).length, 4); assert.deepEqual(matrixOf(k, 4), matrixOf(k, 0)); assert.equal(matrixOf(k, 1).flat().filter(Boolean).length, 4); }
});
test('walls, floor and filled cells collide; spawn fits an empty well', () => {
  const g = empty(); for (let k = 0; k < 7; k++) assert.equal(collides(g, spawn(k)), false);
  assert.equal(collides(g, {...spawn(0), x: -1}), true); assert.equal(collides(g, {...spawn(0), x: COLS - 3}), true); assert.equal(collides(g, {...spawn(1), y: ROWS - 1}), true);
  g[5 * COLS + 5] = 1; assert.equal(collides(g, {k: 1, r: 0, x: 4, y: 4}), true);
});
test('rotation that would collide is rejected (no kicks), not shifted', () => {
  const g = empty();
  const flat = {k: 0, r: 0, x: 3, y: 3};
  assert.notEqual(tryMove(empty(), flat, 0, 0, 1), null);
  const blocked = empty(); blocked[4 * COLS + 3] = 1;               // the rotated bar keeps column x=3, rows 3..6
  assert.equal(tryMove(blocked, flat, 0, 0, 1), null);
});
test('lock writes the piece and clears full rows, counting them', () => {
  const g = empty(); for (let y = ROWS - 2; y < ROWS; y++) for (let x = 1; x < COLS; x++) g[y * COLS + x] = 3;
  g[(ROWS - 3) * COLS + 5] = 4;
  const p = {k: 0, r: 1, x: 0, y: ROWS - 4};                        // vertical bar in column 0, rows 12..15
  assert.equal(collides(g, p), false);
  assert.equal(lockPiece(g, p), 2);
  assert.equal(g.filter(Boolean).length, 3);                        // 2 surviving bar cells + the marker
  assert.equal(g[(ROWS - 1) * COLS + 5], 4);                        // the marker fell two rows
  assert.equal(g[(ROWS - 1) * COLS + 0], 1); assert.equal(g[(ROWS - 2) * COLS + 0], 1);   // surviving bar cells fell too
});
test('3 lines before 30 pieces -> won (win before budget)', () => {
  const st = newState(5); for (let y = ROWS - 3; y < ROWS; y++) for (let x = 1; x < COLS; x++) st.grid[y * COLS + x] = 2;
  st.piece = {k: 0, r: 1, x: 0, y: 0}; st.pieces = 29;
  assert.equal(hardDrop(st), 'won'); assert.ok(st.lines >= 3); assert.equal(judge('blocks', 1, finalOf(st)), 'won');
});
test('30 pieces without the goal -> lost; top-out -> lost; neither early', () => {
  const st = newState(5); st.pieces = 29; assert.equal(hardDrop(st), 'lost'); assert.equal(judge('blocks', 1, finalOf(st)), 'lost');
  const t = newState(6); for (let y = 0; y < 6; y++) for (let x = 0; x < COLS - 1; x++) t.grid[y * COLS + x] = 2;
  t.piece = {k: 1, r: 0, x: 8, y: 14}; assert.equal(settle(t), 'lost'); assert.equal(t.toppedOut, true); assert.equal(judge('blocks', 1, finalOf(t)), 'lost');
  const f = newState(7); assert.equal(verdictOf(f), null); assert.equal(hardDrop(f), null);
});
test('restore validates and round-trips', () => {
  const st = newState(8); hardDrop(st); const b = restore(JSON.parse(JSON.stringify(st))); assert.deepEqual(b, st);
  assert.equal(restore({...st, grid: st.grid.slice(2)}), null); assert.equal(restore(null), null); assert.equal(restore({...st, pieces: 31}), null);
});
