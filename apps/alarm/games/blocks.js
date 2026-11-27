// MOM Inc falling blocks for the alarm: original code, plain geometric pieces. Collision / lock / line-clear follow the standard recipe, cf. "javascript-tetris" (MIT); no code copied.
// 10x16 well, 7 pieces. Goal: clear 3 lines. Budget: 30 pieces (a piece counts when it LOCKS). Top-out (a new piece cannot appear) = loss. Win is checked first, then the budget, then top-out.
// Rotation is clockwise with NO wall kicks: a rotation that would collide is simply rejected. "drop" is a hard drop. Gravity runs only while the game is running (pause on hidden, no catch-up).
// State (serialisable, seeded bag): {grid, piece:{k,r,x,y}, next, rng, lines, pieces, toppedOut}. finalState for the host: {lines, pieces, toppedOut}. Digits and shapes only on screen.
import {MONO, rand, freshSeed, themed} from './common.js';
export const COLS = 10, ROWS = 16, GOAL = 3, BUDGET = 30;
const COLORS = ['#22D3EE', '#FFD60A', '#7B2FF7', '#A3E635', '#F97316', '#F472B6', '#38BDF8'], BG = '#1A0B30', CELL = '#241046';
// each piece as a matrix in its spawn orientation (1 = filled)
export const SHAPES = [
  [[1, 1, 1, 1]],                 // 0 bar
  [[1, 1], [1, 1]],               // 1 square
  [[0, 1, 0], [1, 1, 1]],         // 2 T
  [[0, 1, 1], [1, 1, 0]],         // 3 S
  [[1, 1, 0], [0, 1, 1]],         // 4 Z
  [[1, 0, 0], [1, 1, 1]],         // 5 J
  [[0, 0, 1], [1, 1, 1]],         // 6 L
];

// ---- pure logic (tested in tools/alarm_blocks_logic.test.mjs) ------------------------------------------------
export const rotateM = m => m[0].map((_, c) => m.map(row => row[c]).reverse());    // clockwise
export const matrixOf = (k, r) => { let m = SHAPES[k]; for (let i = 0; i < (r & 3); i++) m = rotateM(m); return m; };
/** Absolute cells [x, y] of a piece. */
export const cellsOf = p => { const out = [], m = matrixOf(p.k, p.r); m.forEach((row, j) => row.forEach((v, i) => { if (v) out.push([p.x + i, p.y + j]); })); return out; };
export const collides = (grid, p) => cellsOf(p).some(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && grid[y * COLS + x] !== 0));
export const spawn = k => ({k, r: 0, x: Math.floor((COLS - SHAPES[k][0].length) / 2), y: 0});
/** Returns a new piece after a move/rotation, or null if it would collide (rejected). */
export const tryMove = (grid, p, dx, dy, dr = 0) => { const q = {...p, x: p.x + dx, y: p.y + dy, r: (p.r + dr) & 3}; return collides(grid, q) ? null : q; };
/** Write the piece into the grid (mutates) and remove full rows. Returns the number of lines cleared. */
export function lockPiece(grid, p) {
  for (const [x, y] of cellsOf(p)) if (y >= 0) grid[y * COLS + x] = p.k + 1;
  let n = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid.slice(y * COLS, (y + 1) * COLS).every(v => v !== 0)) { grid.splice(y * COLS, COLS); grid.unshift(...Array(COLS).fill(0)); n++; y++; }
  }
  return n;
}
const draw7 = st => Math.floor(rand(st) * 7);
export function newState(seed = freshSeed()) { const st = {rng: seed, grid: Array(COLS * ROWS).fill(0), piece: null, next: 0, lines: 0, pieces: 0, toppedOut: false}; st.piece = spawn(draw7(st)); st.next = draw7(st); return st; }
/** The verdict from the state alone: win first, then budget, then top-out. */
export const verdictOf = st => st.lines >= GOAL ? 'won' : st.pieces >= BUDGET || st.toppedOut ? 'lost' : null;
/** Lock the current piece and bring in the next. Returns the verdict (or null). */
export function settle(st) {
  st.lines += lockPiece(st.grid, st.piece); st.pieces++;
  const v = verdictOf(st); if (v) return v;
  st.piece = spawn(st.next); st.next = draw7(st);
  if (collides(st.grid, st.piece)) st.toppedOut = true;
  return verdictOf(st);
}
export const hardDrop = st => { let p = st.piece, q; while ((q = tryMove(st.grid, p, 0, 1))) p = q; st.piece = p; return settle(st); };
export const finalOf = st => ({lines: st.lines, pieces: st.pieces, toppedOut: st.toppedOut});
export function restore(sv) {
  const ok = sv && Array.isArray(sv.grid) && sv.grid.length === COLS * ROWS && sv.grid.every(v => Number.isInteger(v) && v >= 0 && v <= 7) && sv.piece && [sv.piece.k, sv.piece.r, sv.piece.x, sv.piece.y, sv.next, sv.rng, sv.lines, sv.pieces].every(Number.isInteger)
    && sv.piece.k >= 0 && sv.piece.k < 7 && sv.next >= 0 && sv.next < 7 && sv.lines >= 0 && sv.pieces >= 0 && sv.pieces <= BUDGET && typeof sv.toppedOut === 'boolean';
  if (!ok) return null;
  const st = {rng: sv.rng | 0, grid: sv.grid.slice(), piece: {k: sv.piece.k, r: sv.piece.r & 3, x: sv.piece.x, y: sv.piece.y}, next: sv.next, lines: sv.lines, pieces: sv.pieces, toppedOut: sv.toppedOut};
  return !verdictOf(st) && collides(st.grid, st.piece) ? null : st;
}

// ---- the game --------------------------------------------------------------------------------------------------
const ICON = {
  left: '<path d="M15 5 L7 12 L15 19" />', right: '<path d="M9 5 L17 12 L9 19" />',
  rotate: '<path d="M19 12a7 7 0 1 1-2.5-5.4" /><path d="M19 3v5h-5" />', drop: '<path d="M12 4v13" /><path d="M6 12l6 7 6-7" /><path d="M6 21h12" />',
};
function create() {
  let root, cv, g, W = 0, H = 0, dpr = 1, raf = 0, last = 0, acc = 0, running = false, done = false, ctx = null, st = newState(), swipe = null, bar = null;
  const interval = () => Math.max(0.3, 0.75 - st.pieces * 0.015);
  const geo = () => { const ch = H - 52, c = Math.max(8, Math.floor(Math.min((W - 64) / COLS, (ch - 4) / ROWS))); return {c, x: Math.floor((W - 64 - c * COLS) / 2) + 4, y: Math.floor((ch - c * ROWS) / 2), ch}; };
  const finish = v => { if (done) return; done = true; running = false; cancelAnimationFrame(raf); draw(); ctx.finish(v, v === 'won' ? 'lines' : st.toppedOut ? 'topout' : 'pieces', finalOf(st)); };
  const act = a => {
    if (done || !running) return;
    if (a === 'drop') { const v = hardDrop(st); ctx.save(); acc = 0; if (v) finish(v); }
    else { const q = a === 'left' ? tryMove(st.grid, st.piece, -1, 0) : a === 'right' ? tryMove(st.grid, st.piece, 1, 0) : tryMove(st.grid, st.piece, 0, 0, 1); if (q) st.piece = q; }
    draw();
  };
  function tickDown() {
    const q = tryMove(st.grid, st.piece, 0, 1);
    if (q) { st.piece = q; return; }
    const v = settle(st); ctx.save(); if (v) finish(v);
  }
  function cell(x, y, c, k, a = 1) { g.globalAlpha = a; g.fillStyle = COLORS[k]; g.fillRect(x + 1, y + 1, c - 2, c - 2); g.strokeStyle = '#12081F'; g.lineWidth = 1.5; g.strokeRect(x + 1.5, y + 1.5, c - 3, c - 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 3, y + 3, c - 6, 2); g.globalAlpha = 1; }
  function draw() {
    if (!g || !W) return;
    const p = geo(), T = n => themed(cv, n, null);   // colour drawer: --gc-1 background, --gc-2 well, --gc-3 the button row (CSS vars); piece colours never change
    const bg = T('--gc-1') || BG, ink = T('--gc-1-ink') || '#FFF', well = T('--gc-2') || CELL;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = well; g.fillRect(p.x, p.y, p.c * COLS, p.c * ROWS);
    for (let i = 0; i < COLS * ROWS; i++) if (st.grid[i]) cell(p.x + (i % COLS) * p.c, p.y + Math.floor(i / COLS) * p.c, p.c, st.grid[i] - 1);
    if (!done) {
      let gh = st.piece; for (let q; (q = tryMove(st.grid, gh, 0, 1)); ) gh = q;               // landing shadow
      for (const [x, y] of cellsOf(gh)) { g.strokeStyle = '#FFF'; g.globalAlpha = 0.35; g.lineWidth = 1.5; g.strokeRect(p.x + x * p.c + 2, p.y + y * p.c + 2, p.c - 4, p.c - 4); g.globalAlpha = 1; }
      for (const [x, y] of cellsOf(st.piece)) if (y >= 0) cell(p.x + x * p.c, p.y + y * p.c, p.c, st.piece.k);
    }
    const sx = p.x + p.c * COLS + 10;                                                          // side panel: next piece, lines n/3, pieces left
    g.fillStyle = ink; g.font = `bold 16px ${MONO}`; g.textBaseline = 'middle'; g.textAlign = 'left';
    const m = SHAPES[st.next], q = Math.min(10, p.c * 0.7); m.forEach((row, j) => row.forEach((v, i) => { if (v) cell(sx + i * q, p.y + 4 + j * q, q, st.next); }));
    g.fillText(`${Math.min(st.lines, 9)}/${GOAL}`, sx, p.y + 64); g.fillStyle = T('--gc-1-ink') || '#FFD60A'; g.fillRect(sx + 40, p.y + 59, 12, 3); g.fillRect(sx + 40, p.y + 65, 12, 3);   // lines icon: two bars
    g.fillStyle = ink; g.fillText(String(Math.max(0, BUDGET - st.pieces)).padStart(2, '0'), sx, p.y + 90); cell(sx + 28, p.y + 83, 12, 2);                      // pieces left + piece icon
  }
  const frame = t => {
    if (!running) return;
    acc += Math.min(0.033, Math.max(0, (t - last) / 1000)); last = t;                           // dt capped, and last resets on resume: no catch-up
    while (running && acc >= interval()) { acc -= interval(); tickDown(); }
    if (running) { draw(); raf = requestAnimationFrame(frame); }
  };
  const btn = (name, label) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', label);
    b.style.cssText = 'flex:1;min-height:48px;margin:2px;border:2px solid var(--gc-3-edge,#7B2FF7);border-radius:10px;background:var(--gc-3,#2A1050);display:grid;place-items:center;touch-action:manipulation;padding:0;color:var(--gc-3-ink,#FFD60A)';
    b.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
    b.addEventListener('pointerdown', e => { e.preventDefault(); act(name); }); return b; };
  return {
    mount(host, c) {
      ctx = c; st = restore(c.saved) || newState();
      root = document.createElement('div'); root.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%';
      cv = document.createElement('canvas'); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Falling blocks. Clear three lines with thirty pieces. Buttons: left, right, rotate, drop.');
      cv.style.cssText = 'display:block;flex:1;min-height:0;touch-action:none;user-select:none;-webkit-user-select:none';
      bar = document.createElement('div'); bar.style.cssText = 'display:flex;height:52px;flex:none';
      bar.append(btn('left', 'Move left'), btn('rotate', 'Rotate'), btn('drop', 'Drop'), btn('right', 'Move right'));
      root.append(cv, bar); g = cv.getContext('2d'); host.replaceChildren(root);
      cv.addEventListener('pointerdown', e => { swipe = {x: e.clientX, y: e.clientY, t: performance.now(), n: 0}; cv.setPointerCapture?.(e.pointerId); });      // optional swipe: sideways = move, down = drop, tap = rotate
      cv.addEventListener('pointermove', e => { if (!swipe) return; const cs = geo().c, dx = e.clientX - swipe.x; while (Math.abs(dx) - swipe.n * cs >= cs * 1.2 && Math.abs(dx) > swipe.n * cs) { swipe.n++; act(dx > 0 ? 'right' : 'left'); swipe.moved = true; } });
      cv.addEventListener('pointerup', e => { const s = swipe; swipe = null; if (!s) return; const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (s.moved) return; if (dy > 40 && Math.abs(dy) > Math.abs(dx)) act('drop'); else if (Math.hypot(dx, dy) < 12 && performance.now() - s.t < 450) act('rotate'); });
      cv.addEventListener('pointercancel', () => { swipe = null; });
    },
    resize(b) {
      W = Math.max(1, b.width); H = Math.max(1, b.height); dpr = Math.min(3, globalThis.devicePixelRatio || 1);
      const ch = H - 52; cv.width = Math.round(W * dpr); cv.height = Math.round(ch * dpr); cv.style.width = W + 'px'; cv.style.height = ch + 'px'; draw();
    },
    start() { const v = verdictOf(st); if (v) return finish(v); this.resume(); },     // a restored finished round reports on start
    resume() { if (done || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    pause() { if (!running) return; running = false; cancelAnimationFrame(raf); draw(); },
    serialize() { return {rng: st.rng, grid: st.grid.slice(), piece: {...st.piece}, next: st.next, lines: st.lines, pieces: st.pieces, toppedOut: st.toppedOut}; },
    get state() { return st; },
    destroy() { running = false; done = true; cancelAnimationFrame(raf); root?.remove(); },
  };
}
export default {id: 'blocks', rulesVersion: 1, create};
