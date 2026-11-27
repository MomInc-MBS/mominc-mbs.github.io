// MOM Inc match-3 for the alarm: original code. Mechanics (swap, find runs, clear, drop, refill, cascade) follow the usual match-3 recipe, cf. Rembound "Match-3-Game-HTML5" (MIT); no code copied.
// 7x7 board, 5 kinds distinct by SHAPE and colour. Collect TARGET pieces of the shown kind within 20 VALID swaps. A swap that makes no match swaps back and costs nothing.
// The whole cascade is resolved in logic first; the screen then replays it. The saved state is therefore always a stable board: {grid, rng, swaps, progress, target, kind}.
// Win is checked before the swap budget. A dead board is reshuffled deterministically (seeded) keeping the swaps left; the result always has a legal move and no ready-made runs.
// finalState for the host: {target, progress, swaps}. Digits and shapes only on screen.
import {MONO, rand, freshSeed} from './common.js';
export const SIZE = 7, KINDS = 5, BUDGET = 20, TARGET = 12;
const COLORS = ['#FFD60A', '#7B2FF7', '#22D3EE', '#F472B6', '#A3E635'], BG = '#1A0B30', CELL = '#2A1050';

// ---- pure logic (tested in tools/alarm_match3_logic.test.mjs) ----------------------------------------------
export const idx = (x, y) => y * SIZE + x;
export const adjacent = (a, b) => Math.abs((a % SIZE) - (b % SIZE)) + Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) === 1;
/** Cells in any horizontal or vertical run of 3+. */
export function matchesOf(grid) {
  const m = new Set();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const k = grid[idx(x, y)]; if (k < 0) continue;
    if (x + 2 < SIZE && grid[idx(x + 1, y)] === k && grid[idx(x + 2, y)] === k) m.add(idx(x, y)).add(idx(x + 1, y)).add(idx(x + 2, y));
    if (y + 2 < SIZE && grid[idx(x, y + 1)] === k && grid[idx(x, y + 2)] === k) m.add(idx(x, y)).add(idx(x, y + 1)).add(idx(x, y + 2));
  }
  return m;
}
const swapped = (grid, a, b) => { const n = grid.slice(); [n[a], n[b]] = [n[b], n[a]]; return n; };
/** First legal swap [a, b] (scan order), or null. */
export function findMove(grid) {
  for (let i = 0; i < SIZE * SIZE; i++) for (const j of [i + 1, i + SIZE]) {
    if (j >= SIZE * SIZE || !adjacent(i, j)) continue;
    if (matchesOf(swapped(grid, i, j)).size) return [i, j];
  }
  return null;
}
const dealCell = (st, grid, i) => {                         // a random kind that does not complete a run of 3 with the cells above/left already placed
  const x = i % SIZE, y = Math.floor(i / SIZE);
  for (let tries = 0; tries < 50; tries++) {
    const k = Math.floor(rand(st) * KINDS);
    if (x >= 2 && grid[i - 1] === k && grid[i - 2] === k) continue;
    if (y >= 2 && grid[i - SIZE] === k && grid[i - 2 * SIZE] === k) continue;
    return k;
  }
  return 0;
};
/** Fresh run: run-free board with a legal move. */
export function newState(seed = freshSeed()) {
  const st = {rng: seed, grid: Array(SIZE * SIZE).fill(-1), swaps: 0, progress: 0, target: TARGET, kind: 0};
  st.kind = Math.floor(rand(st) * KINDS);
  deal(st); return st;
}
function deal(st) { for (let guard = 0; guard < 100; guard++) { for (let i = 0; i < SIZE * SIZE; i++) st.grid[i] = dealCell(st, st.grid, i); if (findMove(st.grid)) return; } }
/** Deterministic reshuffle of the pieces on the board (seeded Fisher-Yates) until it is run-free with a legal move; falls back to a fresh deal. Keeps swaps/progress. */
export function reshuffle(st) {
  for (let t = 0; t < 200; t++) {
    const g = st.grid.slice();
    for (let i = g.length - 1; i > 0; i--) { const j = Math.floor(rand(st) * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
    if (!matchesOf(g).size && findMove(g)) { st.grid = g; return; }
  }
  deal(st);
}
/** Resolve the whole cascade on st (mutates). Returns the steps [{cleared:[idx], grid}] for the animation. */
export function resolve(st) {
  const steps = [];
  for (let guard = 0; guard < 50; guard++) {
    const m = matchesOf(st.grid); if (!m.size) break;
    for (const i of m) if (st.grid[i] === st.kind) st.progress++;
    const cleared = [...m]; for (const i of m) st.grid[i] = -1;
    for (let x = 0; x < SIZE; x++) {                          // gravity: pieces fall, new ones enter from the top
      const col = []; for (let y = SIZE - 1; y >= 0; y--) if (st.grid[idx(x, y)] >= 0) col.push(st.grid[idx(x, y)]);
      for (let y = SIZE - 1, k = 0; y >= 0; y--, k++) st.grid[idx(x, y)] = k < col.length ? col[k] : Math.floor(rand(st) * KINDS);
    }
    steps.push({cleared, grid: st.grid.slice()});
  }
  return steps;
}
/** Try a swap. {ok:false} when not adjacent or it makes no match (nothing changes, no move spent). Else spends one swap, resolves, and reports the verdict (win before budget) or reshuffles a dead board. */
export function trySwap(st, a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= SIZE * SIZE || b >= SIZE * SIZE || !adjacent(a, b)) return {ok: false};
  const g = swapped(st.grid, a, b); if (!matchesOf(g).size) return {ok: false, back: true};
  st.grid = g; st.swaps++;
  const steps = resolve(st);
  const verdict = st.progress >= st.target ? 'won' : st.swaps >= BUDGET ? 'lost' : null;
  let reshuffled = false;
  if (!verdict && !findMove(st.grid)) { reshuffle(st); reshuffled = true; }
  return {ok: true, steps, verdict, reshuffled};
}
export const finalOf = st => ({target: st.target, progress: st.progress, swaps: st.swaps});
const verdictOf = st => st.progress >= st.target ? 'won' : st.swaps >= BUDGET ? 'lost' : null;
export function restore(sv) {
  if (!sv || !Array.isArray(sv.grid) || sv.grid.length !== SIZE * SIZE || !sv.grid.every(k => Number.isInteger(k) && k >= 0 && k < KINDS)) return null;
  if (![sv.rng, sv.swaps, sv.progress, sv.target, sv.kind].every(Number.isInteger) || sv.swaps < 0 || sv.swaps > BUDGET || sv.progress < 0 || sv.target < 1 || sv.target > 1000 || sv.kind < 0 || sv.kind >= KINDS) return null;
  if (matchesOf(sv.grid).size) return null;                  // saved boards are always stable
  return {rng: sv.rng | 0, grid: sv.grid.slice(), swaps: sv.swaps, progress: sv.progress, target: sv.target, kind: sv.kind};
}

// ---- drawing ------------------------------------------------------------------------------------------------
function shape(g, k, cx, cy, r) {
  g.beginPath();
  if (k === 0) g.arc(cx, cy, r, 0, 7);                                                    // circle
  else if (k === 1) { g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); }   // diamond
  else if (k === 2) { g.moveTo(cx, cy - r); g.lineTo(cx + r, cy + r * 0.8); g.lineTo(cx - r, cy + r * 0.8); g.closePath(); }   // triangle
  else if (k === 3) g.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7);                                                   // square
  else for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }   // star
  g.closePath();
}

function create() {
  let cv, g, W = 0, H = 0, dpr = 1, ctx = null, st = newState(), view = null, sel = -1, locked = false, paused = false, done = false, timer = 0, flash = [], down = -1;
  const geo = () => { const top = 30, size = Math.max(70, Math.min(W - 8, H - top - 6)); return {c: size / SIZE, x: (W - size) / 2, y: top + (H - top - size) / 2, top}; };
  const cellAt = e => { const r = cv.getBoundingClientRect(), p = geo(), x = Math.floor(((e.clientX - r.left) * (W / (r.width || W)) - p.x) / p.c), y = Math.floor(((e.clientY - r.top) * (H / (r.height || H)) - p.y) / p.c); return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? -1 : idx(x, y); };
  const finish = v => { if (done) return; done = true; sel = -1; draw(); ctx.finish(v, v === 'won' ? 'target' : 'swaps', finalOf(st)); };
  function attempt(a, b) {
    const pre = st.grid.slice(), r = trySwap(st, a, b), before = r.ok ? swapped(pre, a, b) : pre;
    sel = -1;
    if (!r.ok) { draw(); return; }                              // a no-match swap: nothing spent, nothing moves
    locked = true; view = before; const frames = r.steps.slice(); let n = 0;
    const next = () => {
      if (done) return;
      if (n < frames.length) { flash = frames[n].cleared; view = n ? frames[n - 1].grid : before; draw(); timer = setTimeout(() => { view = frames[n].grid; flash = []; n++; draw(); timer = setTimeout(next, 120); }, 170); }
      else { view = null; flash = []; locked = false; draw(); ctx.save(); if (r.verdict) finish(r.verdict); }   // stable boundary: save, then report
    };
    next();
  }
  const onDown = e => { if (done || locked || paused) return; cv.setPointerCapture?.(e.pointerId); const c = cellAt(e); if (c < 0) return; down = c;
    if (sel >= 0 && c !== sel && adjacent(sel, c)) { const a = sel; down = -1; attempt(a, c); } else { sel = c === sel ? -1 : c; draw(); } };
  const onMove = e => { if (down < 0 || done || locked || paused) return; const c = cellAt(e); if (c >= 0 && c !== down && adjacent(down, c)) { const a = down; down = -1; attempt(a, c); } };   // optional drag
  const onUp = () => { down = -1; };
  function draw() {
    if (!g || !W) return;
    const p = geo(), b = view || st.grid; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.font = `bold 16px ${MONO}`; g.textBaseline = 'middle'; g.textAlign = 'left';
    shape(g, st.kind, 18, 15, 9); g.fillStyle = COLORS[st.kind]; g.fill();                               // target: the piece to collect, then progress / target
    g.fillStyle = '#FFF'; g.fillText(`${Math.min(st.progress, 99)}/${st.target}`, 34, 15);
    g.textAlign = 'right'; g.fillText(String(Math.max(0, BUDGET - st.swaps)).padStart(2, '0'), W - 30, 15);   // swaps left, with a swap-arrows icon
    g.strokeStyle = '#FFD60A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W - 24, 11); g.lineTo(W - 10, 11); g.lineTo(W - 14, 7); g.moveTo(W - 10, 19); g.lineTo(W - 24, 19); g.lineTo(W - 20, 23); g.stroke();
    for (let i = 0; i < SIZE * SIZE; i++) {
      const x = p.x + (i % SIZE) * p.c, y = p.y + Math.floor(i / SIZE) * p.c, k = b[i];
      g.fillStyle = CELL; g.fillRect(x + 1, y + 1, p.c - 2, p.c - 2);
      if (k < 0) continue;
      const hit = flash.includes(i); shape(g, k, x + p.c / 2, y + p.c / 2, p.c * (hit ? 0.5 : 0.34));
      g.fillStyle = hit ? '#FFF' : COLORS[k]; g.fill(); g.strokeStyle = '#12081F'; g.lineWidth = 1.5; g.stroke();
      if (k === st.kind && !hit) { g.fillStyle = '#12081F'; g.beginPath(); g.arc(x + p.c / 2, y + p.c / 2, 1.8, 0, 7); g.fill(); }   // collected kind carries a dot
    }
    if (sel >= 0) { g.strokeStyle = '#FFF'; g.lineWidth = 3; g.strokeRect(p.x + (sel % SIZE) * p.c + 2, p.y + Math.floor(sel / SIZE) * p.c + 2, p.c - 4, p.c - 4); }
    if (!locked && !done && st.swaps === 0 && sel < 0) {             // first-move hint: pulsing ring on one legal piece
      const m = findMove(st.grid)?.[0]; if (m != null) { g.strokeStyle = '#FFD60A'; g.lineWidth = 2.5; g.beginPath(); g.arc(p.x + (m % SIZE + 0.5) * p.c, p.y + (Math.floor(m / SIZE) + 0.5) * p.c, p.c * 0.42 + Math.sin(performance.now() / 160) * 2, 0, 7); g.stroke(); }
    }
  }
  let hintRaf = 0; const hintLoop = () => { if (done) return; if (st.swaps === 0 && !locked) draw(); hintRaf = requestAnimationFrame(hintLoop); };
  return {
    mount(host, c) {
      ctx = c; st = restore(c.saved) || newState();
      cv = document.createElement('canvas'); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Match three. Tap a piece, then a neighbour to swap. Collect the shown piece within twenty swaps.');
      cv.style.cssText = 'display:block;touch-action:none;user-select:none;-webkit-user-select:none';
      g = cv.getContext('2d'); host.replaceChildren(cv);
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    },
    resize(b) { W = Math.max(1, b.width); H = Math.max(1, b.height); dpr = Math.min(3, globalThis.devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; draw(); },
    start() { const v = verdictOf(st); if (v) return finish(v); hintLoop(); },   // a restored finished round reports on start
    resume() { paused = false; }, pause() { paused = true; },
    serialize() { return {rng: st.rng, grid: st.grid.slice(), swaps: st.swaps, progress: st.progress, target: st.target, kind: st.kind}; },
    get state() { return st; },
    destroy() { done = true; clearTimeout(timer); cancelAnimationFrame(hintRaf); cv?.remove(); },
  };
}
export default {id: 'match3', rulesVersion: 1, create};
