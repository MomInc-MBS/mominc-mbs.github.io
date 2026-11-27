// MOM Inc brick breaker for the alarm: original code. Mechanics follow the classic breakout recipe (MDN "2D breakout game using pure JavaScript" tutorial, CC0 examples): paddle, ball, brick grid, lives.
// Rules: ONE ball, 4 total lives (a miss spends one; the next ball waits for a tap), 24 bricks, win = no bricks left, loss = no lives left. serialize() keeps bricks+lives so returning never refills them.
// Real-time: stepped only between start()/resume() and pause(); resume() resets the clock (no catch-up), and a restored round always re-waits for a serve.
export const LIVES = 4, COLS = 6, ROWS = 4, N = COLS * ROWS;
import {MONO, themed} from './common.js';
const PURPLE = '#7B2FF7', PURPLE_D = '#3A1478', YELLOW = '#FFD60A', YELLOW_D = '#8A6B00', INK = '#12081F', BG = '#1A0B30';

function create() {
  let cv, g, W = 0, H = 0, dpr = 1, raf = 0, last = 0, running = false, done = false, ctx = null, tap = null;
  const s = {bricks: Array(N).fill(1), lives: LIVES, phase: 'wait', px: 0.5, bx: 0.5, by: 0, vx: 0, vy: 0, speedMul: 1};
  const left = () => s.bricks.reduce((a, b) => a + b, 0);
  const state = () => ({bricksTotal: N, bricksLeft: left(), lives: s.lives});
  const L = () => {                                              // layout in CSS px, from the host bounds
    const bh = Math.min(22, Math.max(14, H * 0.065));
    return {pw: Math.max(70, W * 0.26), ph: 10, py: H - Math.max(26, H * 0.09), top: Math.max(28, H * 0.11), bw: (W - 16) / COLS, bh, r: Math.max(5, Math.min(W, H) * 0.021), v: Math.max(150, H * 0.85)};
  };
  const brickRect = (i, l) => ({x: 8 + (i % COLS) * l.bw + 1.5, y: l.top + Math.floor(i / COLS) * (l.bh + 3), w: l.bw - 3, h: l.bh});
  const pos = e => { const r = cv.getBoundingClientRect(); return {x: (e.clientX - r.left) * (W / (r.width || W)), y: (e.clientY - r.top) * (H / (r.height || H))}; };
  const steer = p => { const h = L().pw / 2 / W; s.px = Math.min(1 - h, Math.max(h, p.x / W)); };
  const onDown = e => { if (done) return; cv.setPointerCapture?.(e.pointerId); tap = {x: e.clientX, y: e.clientY, t: performance.now()}; const p = pos(e); if (p.y > H * 0.4) steer(p); };
  const onMove = e => { if (done || (e.pointerType !== 'mouse' && !e.buttons)) return; const p = pos(e); if (p.y > H * 0.4) steer(p); };   // lower area drags the paddle
  const onUp = e => { const t = tap; tap = null; if (done || !t || !running) return; if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 12 && performance.now() - t.t < 450) serve(); };
  const serve = () => {
    if (s.phase !== 'wait') return;
    const l = L(), a = (Math.random() - 0.5) * (Math.PI / 2);     // up, within +-45 degrees
    s.vx = Math.sin(a) * l.v * s.speedMul; s.vy = -Math.cos(a) * l.v * s.speedMul; s.phase = 'play';
  };
  const finish = (outcome, reason) => { if (done) return; done = true; running = false; cancelAnimationFrame(raf); draw(); ctx.finish(outcome, reason, state()); };
  function step(dt) {
    const l = L(), px = s.px * W;
    if (s.phase === 'wait') { s.bx = s.px; s.by = (l.py - l.r - 1) / H; if (left() === 0) finish('won', 'cleared'); return; }
    let bx = s.bx * W, by = s.by * H, vx = s.vx, vy = s.vy;
    const n = Math.max(1, Math.ceil(Math.hypot(vx, vy) * dt / (l.r * 0.8)));
    for (let k = 0; k < n; k++) {
      bx += vx * dt / n; by += vy * dt / n;
      if (bx < l.r) { bx = l.r; vx = Math.abs(vx); } else if (bx > W - l.r) { bx = W - l.r; vx = -Math.abs(vx); }
      if (by < l.r) { by = l.r; vy = Math.abs(vy); }
      if (vy > 0 && by + l.r >= l.py && by + l.r <= l.py + l.ph + l.r && Math.abs(bx - px) <= l.pw / 2 + l.r * 0.5) {   // paddle: bounce angle follows where it hit
        const sp = Math.hypot(vx, vy), o = Math.max(-1, Math.min(1, (bx - px) / (l.pw / 2))) * (Math.PI / 3);
        vx = Math.sin(o) * sp; vy = -Math.cos(o) * sp; by = l.py - l.r;
      }
      for (let i = 0; i < N; i++) {
        if (!s.bricks[i]) continue;
        const b = brickRect(i, l), cx = Math.max(b.x, Math.min(bx, b.x + b.w)), cy = Math.max(b.y, Math.min(by, b.y + b.h));
        if ((bx - cx) ** 2 + (by - cy) ** 2 > l.r * l.r) continue;
        s.bricks[i] = 0; s.speedMul = Math.min(1.35, s.speedMul + 0.012);
        const ox = Math.min(Math.abs(bx - b.x), Math.abs(bx - b.x - b.w)), oy = Math.min(Math.abs(by - b.y), Math.abs(by - b.y - b.h));
        if (ox < oy) vx = -vx; else vy = -vy;
        const sp = Math.hypot(vx, vy), want = l.v * s.speedMul; vx *= want / sp; vy *= want / sp;
        ctx.save(); break;                                         // one brick per substep
      }
      if (by - l.r > H) {                                          // a miss: one life, the next ball waits for a tap
        s.lives--; s.phase = 'wait'; s.vx = s.vy = 0; ctx.save();
        if (s.lives <= 0) finish('lost', 'lives');
        return;
      }
    }
    s.bx = bx / W; s.by = by / H; s.vx = vx; s.vy = vy;
    if (left() === 0) finish('won', 'cleared');
  }
  function draw() {
    if (!g || !W) return;
    const l = L(), px = s.px * W, T = n => themed(cv, n, null);      // colour drawer: --gc-1 background, --gc-2 bricks, --gc-3 paddle (+ lives); unset = the original look
    const bg = T('--gc-1') || BG, ink = T('--gc-1-ink'), brk = T('--gc-2'), pad = T('--gc-3') || YELLOW;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < N; i++) if (s.bricks[i]) {                 // shapes as well as colour: purple rows carry a diamond, yellow rows a dot
      const b = brickRect(i, l), yel = Math.floor(i / COLS) % 2 === 1, cx = b.x + b.w / 2, cy = b.y + b.h / 2, q = Math.min(b.h * 0.28, 5);
      g.fillStyle = brk || (yel ? YELLOW : PURPLE); g.fillRect(b.x, b.y, b.w, b.h);
      g.strokeStyle = brk ? T('--gc-2-edge') : yel ? YELLOW_D : PURPLE_D; g.lineWidth = 2; g.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      g.fillStyle = brk ? T('--gc-2-ink') : yel ? INK : '#FFF'; g.beginPath();
      if (yel) g.arc(cx, cy, q, 0, 7); else { g.moveTo(cx, cy - q); g.lineTo(cx + q, cy); g.lineTo(cx, cy + q); g.lineTo(cx - q, cy); g.closePath(); }
      g.fill();
    }
    g.fillStyle = pad; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.rect(px - l.pw / 2, l.py, l.pw, l.ph); g.fill(); g.stroke();
    g.fillStyle = '#FFF'; g.strokeStyle = PURPLE; g.beginPath(); g.arc(s.bx * W, s.by * H, l.r, 0, 7); g.fill(); g.stroke();
    const txt = ink || '#FFF', acc = ink || pad;
    g.font = `bold 14px ${MONO}`; g.textBaseline = 'middle'; g.fillStyle = txt; g.textAlign = 'left';
    for (let i = 0; i < LIVES; i++) {                              // four slots: filled square per life left, hollow per life spent; digit beside them
      g.beginPath(); g.rect(10 + i * 16, 7, 11, 11);
      if (i < s.lives) { g.fillStyle = acc; g.fill(); } else { g.strokeStyle = ink ? acc : YELLOW_D; g.lineWidth = 1.5; g.stroke(); }
    }
    g.fillStyle = txt; g.fillText(String(s.lives), 78, 13);
    g.textAlign = 'right'; g.fillText(String(left()), W - 24, 13);   // bricks left, with a small purple brick icon
    g.fillStyle = brk || PURPLE; g.fillRect(W - 20, 8, 12, 9); g.strokeStyle = brk ? T('--gc-2-edge') : PURPLE_D; g.lineWidth = 1.5; g.strokeRect(W - 20, 8, 12, 9);
    if (s.phase === 'wait' && !done) {                              // serve hint: a pulsing ring round the ball (no words)
      g.beginPath(); g.arc(s.bx * W, s.by * H, l.r + 5 + Math.sin(performance.now() / 160) * 3, 0, 7); g.strokeStyle = pad; g.lineWidth = 2.5; g.stroke();
    }
  }
  const frame = t => {
    if (!running) return;
    step(Math.min(0.033, Math.max(0, (t - last) / 1000))); last = t;
    if (running) { draw(); raf = requestAnimationFrame(frame); }
  };
  return {
    mount(host, c) {
      ctx = c;
      const sv = c.saved;
      if (sv && Array.isArray(sv.bricks) && sv.bricks.length === N && Number.isInteger(sv.lives) && sv.lives >= 0 && sv.lives <= LIVES) {   // restore: never refills lives or bricks; the ball re-waits
        s.bricks = sv.bricks.map(b => b ? 1 : 0); s.lives = sv.lives; s.px = Math.min(0.95, Math.max(0.05, +sv.px || 0.5)); s.speedMul = Math.min(1.35, Math.max(1, +sv.speedMul || 1));
      }
      cv = document.createElement('canvas'); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Brick breaker. Drag to move the paddle, tap to serve.');
      cv.style.cssText = 'display:block;touch-action:none;user-select:none;-webkit-user-select:none';
      g = cv.getContext('2d'); host.replaceChildren(cv);
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', () => { tap = null; });
    },
    resize(b) {
      W = Math.max(1, b.width); H = Math.max(1, b.height); dpr = Math.min(3, globalThis.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      if (s.phase === 'wait') { s.bx = s.px; s.by = (L().py - L().r - 1) / H; }
      draw();
    },
    start() { this.resume(); },
    resume() { if (done || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    pause() { if (!running) return; running = false; cancelAnimationFrame(raf); draw(); },
    serialize() { return {bricks: s.bricks.slice(), lives: s.lives, px: s.px, speedMul: s.speedMul}; },
    state: s,                                                      // exposed for the visual harness only
    destroy() { running = false; done = true; cancelAnimationFrame(raf); cv?.remove(); },
  };
}
export default {id: 'brick', rulesVersion: 1, create};
