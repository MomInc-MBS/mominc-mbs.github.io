// The 2048 loss rule that dismisses an alarm: full board AND no legal move in any direction (rows and columns). A win needs no other condition.
import test from 'node:test';
import assert from 'node:assert/strict';
import {move, hasLegalMove, encode, decode, WIN_TIER} from '../apps/alarm/board.js';

const NOSPAWN = () => 0;                                   // rnd=0 -> deterministic spawn into the first empty cell (none on a full board)
const dead = [[1, 2, 3, 4], [4, 3, 2, 1], [1, 2, 3, 4], [4, 3, 2, 1]];          // full, nothing adjacent equal
const rowMerge = dead.map(r => [...r]); rowMerge[0] = [1, 1, 3, 4];             // full, one horizontal merge
const colMerge = dead.map(r => [...r]); colMerge[1] = [4, 3, 2, 1]; colMerge[2] = [4, 2, 3, 4]; // full, vertical merge (rows 1 and 2 share a 4 in column 0)

test('a full board with a merge available is NOT a loss (horizontal or vertical); a full dead board is', () => {
  assert.equal(hasLegalMove(dead), false);
  assert.equal(hasLegalMove(rowMerge), true); assert.equal(hasLegalMove(colMerge), true);
  assert.equal(decode(encode({board: dead, score: 0, moves: 0})).over, true);
  assert.equal(decode(encode({board: rowMerge, score: 0, moves: 0})).over, false);
  assert.equal(decode(encode({board: colMerge, score: 0, moves: 0})).over, false);
});

test('move(): the game is over only after the move that leaves a full dead board', () => {
  const g = {board: [[3, 1, 2, 3], [1, 2, 3, 1], [2, 3, 1, 2], [3, 1, 0, 2]], score: 0, moves: 0, over: false};
  const m = move(g, 'right', () => 0.99);                                       // 2 slides right, then a tier-2 or 3 tile spawns in the one gap
  assert.equal(m.changed, true); assert.equal(m.game.board.flat().includes(0), false);
  assert.equal(m.game.over, !hasLegalMove(m.game.board));
  const mergeLeft = {board: [[1, 1, 3, 4], [4, 3, 2, 1], [1, 2, 3, 4], [4, 3, 2, 0]], score: 0, moves: 0, over: false};
  const n = move(mergeLeft, 'left', () => 0.99);
  assert.equal(n.game.over, !hasLegalMove(n.game.board));                        // whatever the spawn does, `over` always equals "no legal move left"
});

test('a win is only a real merge into the 2048 tier, with no other requirement; a restored board holding 2048 is not a playable snapshot', () => {
  const b = [[WIN_TIER - 1, WIN_TIER - 1, 1, 2], [3, 4, 5, 6], [6, 5, 4, 3], [2, 1, 2, 1]];
  assert.equal(move({board: b, score: 0, moves: 0, over: false}, 'left', () => 0.99).won, true);
  assert.equal(move({board: b, score: 0, moves: 0, over: false}, 'up', () => 0.99).won, false);
  assert.equal(decode(encode({board: [[WIN_TIER, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], score: 0, moves: 0})), null);
});
