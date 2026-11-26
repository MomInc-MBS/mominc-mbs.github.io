import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame, move, slide, hasLegalMove, encode, decode, spawn} from '../apps/alarm/board.js';

const seeded = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
const Z = () => Array.from({length: 4}, () => Array(4).fill(0));

test('fresh games: exactly two tiles, each tier 2 or 3, score 0 (many seeds)', () => {
  for (let i = 1; i < 200; i++) {
    const g = newGame(seeded(i)), t = g.board.flat().filter(Boolean);
    assert.equal(t.length, 2); assert.ok(t.every(x => x === 2 || x === 3)); assert.equal(g.score, 0);
  }
});
test('later spawns are tier 2 or 3 too, about 90/10', () => {
  const r = seeded(7); let two = 0, n = 2000;
  for (let i = 0; i < n; i++) { const t = spawn(Z(), r).flat().find(Boolean); assert.ok(t === 2 || t === 3); if (t === 2) two++; }
  assert.ok(two / n > .85 && two / n < .95);
});
test('merges and score: 2+2 -> 3 (+4), 3+3 -> 4 (+8)', () => {
  let b = Z(); b[0][0] = b[0][1] = 2;
  let m = move({board: b, score: 0, moves: 0, over: false}, 'left', seeded(1));
  assert.equal(m.game.board[0][0], 3); assert.equal(m.game.score, 4);
  b = Z(); b[1][0] = b[1][1] = 3;
  m = move({board: b, score: 10, moves: 0, over: false}, 'left', seeded(1));
  assert.equal(m.game.board[1][0], 4); assert.equal(m.game.score, 18);
});
test('invalid move leaves the game unchanged, no spawn', () => {
  const b = Z(); b[0][0] = 2;
  const g = {board: b, score: 0, moves: 0, over: false}, m = move(g, 'left', seeded(1));
  assert.equal(m.changed, false); assert.equal(m.game, g); assert.equal(m.game.board.flat().filter(Boolean).length, 1);
});
test('row [2,2,2,2] -> [3,3,0,0], no double merge', () => {
  const b = Z(); b[0] = [2, 2, 2, 2];
  assert.deepEqual(slide(b, 'left').board[0], [3, 3, 0, 0]);
});
test('full board: legal merge is not over, no legal move is over', () => {
  const dead = [[1, 2, 3, 4], [4, 3, 2, 1], [1, 2, 3, 4], [4, 3, 2, 1]];
  assert.equal(hasLegalMove(dead), false);
  assert.equal(decode(encode({board: dead, score: 0, moves: 0})).over, true);
  const live = dead.map(r => [...r]); live[0] = [1, 1, 3, 4];
  assert.equal(decode(encode({board: live, score: 0, moves: 0})).over, false);
});
test('old saved high board (tiers 5-9) restores unchanged', () => {
  const board = [[5, 6, 7, 8], [9, 5, 6, 7], [0, 0, 5, 5], [0, 0, 0, 6]];
  const g = decode(encode({board, score: 1234, moves: 77}));
  assert.deepEqual(g.board, board); assert.equal(g.score, 1234); assert.equal(g.moves, 77);
});
