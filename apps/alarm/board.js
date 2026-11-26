// The Goon 2048 board model, isolated from the Gala/Phaser scene (no rendering, no site story effects).
// SOURCE: site repo MomInc-MBS/mominc-mbs.github.io @ 83fd46a1187175d6e135db535f69738d0765238b (tv/games/goon/assets/index-gala-classic.js,
// last changed in 627e88ec7875da23c01b046852eff028bbe3c75c). Class GalaScene: resetBoard, slide, mergeRow, spawnTile, hasLegalMove,
// simulateSlide; constants Ce=4, wr (tier index -> value), winTier=12. Logic is a 1:1 port of that code, EXCEPT spawns:
// MOM's 2048 spawns tier 2 ($2, 90%) / tier 3 ($4, 10%), the classic opening (the Goon tier 5/6 spawn was a port leftover);
// the board stores TIER INDICES (wr[12] === 2048), never raw values. Rendering here is a flat DOM grid, not the 3D Gala board.
export const SIZE = 4;
export const WIN_TIER = 12; // build constant, D08: literal 2048, never lowered
export const WIN_VALUE = 2048;
export const SCHEMA = 'goon-tier-v1';
export const VALUE = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32, 7: 64, 8: 128, 9: 256, 10: 512, 11: 1024, 12: 2048};
const MAX_TIER = 13;

export function mergeRow(row, toStart) {
  const v = (toStart ? [...row] : [...row].reverse()).filter(x => x !== 0), out = [], merged = [];
  for (let i = 0; i < v.length;) {
    if (i + 1 < v.length && v[i + 1] === v[i]) { merged.push(out.length); out.push(v[i] + 1); i += 2; } else { out.push(v[i]); i++; }
  }
  while (out.length < SIZE) out.push(0);
  return {row: toStart ? out : out.reverse(), merged};
}

const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const empty = () => Array.from({length: SIZE}, () => Array(SIZE).fill(0));

/** Pure slide. Returns {board, changed, merged:[[r,c]...], gained} (gained = score added from merges, via VALUE). */
export function slide(board, dir) {
  const b = board.map(r => [...r]), merged = [];
  let changed = false, gained = 0;
  const horiz = dir === 'left' || dir === 'right', toStart = dir === 'left' || dir === 'up';
  for (let k = 0; k < SIZE; k++) {
    const line = horiz ? b[k] : b.map(r => r[k]);
    const res = mergeRow(line, toStart);
    if (!eq(line, res.row)) changed = true;
    for (const p of res.merged) {
      const idx = toStart ? p : SIZE - 1 - p;
      merged.push(horiz ? [k, idx] : [idx, k]);
      gained += VALUE[res.row[idx]];
    }
    if (horiz) b[k] = res.row; else for (let r = 0; r < SIZE; r++) b[r][k] = res.row[r];
  }
  return {board: b, changed, merged, gained};
}

export function spawn(board, rnd = Math.random) {
  const cells = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === 0) cells.push([r, c]);
  if (!cells.length) return board;
  const [r, c] = cells[Math.floor(rnd() * cells.length)], b = board.map(x => [...x]);
  b[r][c] = rnd() < .9 ? 2 : 3;
  return b;
}

export function hasLegalMove(board) {
  return ['left', 'right', 'up', 'down'].some(d => slide(board, d).changed);
}

export function newGame(rnd = Math.random) {
  return {board: spawn(spawn(empty(), rnd), rnd), score: 0, moves: 0, over: false};
}

/** One move. `won` is true ONLY when this very move merged two tier-11 tiles into tier >= WIN_TIER. */
export function move(game, dir, rnd = Math.random) {
  if (game.over) return {game, changed: false, won: false};
  const s = slide(game.board, dir);
  if (!s.changed) return {game, changed: false, won: false};
  const won = s.merged.some(([r, c]) => s.board[r][c] >= WIN_TIER);
  const board = spawn(s.board, rnd);
  return {game: {board, score: game.score + s.gained, moves: game.moves + 1, over: !won && !hasLegalMove(board)}, changed: true, won, merged: s.merged};
}

export const encode = g => JSON.stringify({schema: SCHEMA, board: g.board, score: g.score, moves: g.moves});

/** Restores a persisted snapshot; anything malformed returns null (caller starts a fresh board). Restoring never reports a win. */
export function decode(text) {
  try {
    const j = JSON.parse(text);
    if (j.schema !== SCHEMA || !Array.isArray(j.board) || j.board.length !== SIZE) return null;
    for (const r of j.board) if (!Array.isArray(r) || r.length !== SIZE || r.some(v => !Number.isInteger(v) || v < 0 || v > MAX_TIER)) return null;
    if (j.board.flat().some(v => v >= WIN_TIER)) return null; // a board holding 2048 without a recorded win is not a playable snapshot
    const g = {board: j.board, score: Number(j.score) || 0, moves: Number(j.moves) || 0, over: false};
    g.over = !hasLegalMove(g.board);
    return g;
  } catch { return null; }
}
