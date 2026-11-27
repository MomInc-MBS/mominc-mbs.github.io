// MOM Inc pong for the alarm: original code, same lifecycle as brick.js. First to 5 wins, the CPU reaching 5 loses. Digits and shapes only on screen.
// Player paddle at the bottom (broad, dragged in the lower area), CPU at the top. While waiting, the ball rides the player paddle; tap to serve.
// The CPU is beatable on purpose: it sees the ball with a short lag, picks a per-rally aim error, and its speed is capped below the ball's top speed.
// Real-time: stepped only between start()/resume() and pause(); resume() resets the clock. A restored terminal score finishes on start().
import {MONO} from './common.js';
const BG = '#1A0B30', DASH = '#3A1478', YEL = '#FFD60A', PUR = '#7B2FF7', INK = '#12081F', WIN = 5, VMAX = 1.4;

function create() {
  let cv, g, W = 0, H = 0, dpr = 1, raf = 0, last = 0, running = false, done = false, ctx = null, tap = null;
  const s = {player: 0, cpu: 0, px: 0.5, cpuPx: 0.5, phase: 'wait', bx: 0.5, by: 0.8, vx: 0, vy: 0, speedMul: 1, seen: 0.5, lag: 0, aim: 0};
  const L = () => ({hw: Math.max(35, W * 0.12), ph: 10, py: H * 0.88, cy: H * 0.1, r: Math.max(5, Math.min(W, H) * 0.021), v: Math.max(150, H * 0.7)});   // ONE half-width for draw, steer and hit test
  const pos = e => { const r = cv.getBoundingClientRect(); return {x: (e.clientX - r.left) * (W / (r.width || W)), y: (e.clientY - r.top) * (H / (r.height || H))}; };
  const steer = p => { const h = L().hw / W; s.px = Math.min(1 - h, Math.max(h, p.x / W)); };
  const onDown = e => { if (done) return; cv.setPointerCapture?.(e.pointerId); tap = {x: e.clientX, y: e.clientY, t: performance.now()}; const p = pos(e); if (p.y > H * 0.4) steer(p); };
  const onMove = e => { if (done || (e.pointerType !== 'mouse' && !e.buttons)) return; const p = pos(e); if (p.y > H * 0.4) steer(p); };
  const onUp = e => { const t = tap; tap = null; if (done || !t || !running) return; if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 12 && performance.now() - t.t < 450) serve(); };
  const serve = () => {
    if (s.phase !== 'wait') return;
    const l = L(), a = (Math.random() - 0.5) * (Math.PI / 2);     // up, within +-45 degrees
    s.vx = Math.sin(a) * l.v * s.speedMul; s.vy = -Math.cos(a) * l.v * s.speedMul; s.phase = 'play'; s.aim = (Math.random() - 0.5) * 1.2;
  };
  const rideBall = () => { const l = L(); s.bx = s.px; s.by = (l.py - l.r - 1) / H; };
  const resetServe = () => { s.phase = 'wait'; s.vx = s.vy = 0; rideBall(); };
  const terminal = () => s.player >= WIN ? 'won' : s.cpu >= WIN ? 'lost' : null;
  const finish = outcome => { if (done) return; done = true; running = false; cancelAnimationFrame(raf); draw(); ctx.finish(outcome, 'points', {player: s.player, cpu: s.cpu}); };
  function step(dt) {
    const l = L();
    if (s.phase === 'wait') { rideBall(); return; }
    s.lag += dt; if (s.lag >= 0.14) { s.lag = 0; s.seen = s.bx; }   // CPU only sees the ball every 140 ms
    const goal = s.vy < 0 ? Math.min(0.95, Math.max(0.05, s.seen + s.aim * l.hw / W)) : 0.5, cap = 0.6 * l.v * VMAX / W * dt;   // returns to centre while the ball goes away
    s.cpuPx += Math.max(-cap, Math.min(cap, goal - s.cpuPx));
    let bx = s.bx * W, by = s.by * H, vx = s.vx, vy = s.vy, px = s.px * W, cx = s.cpuPx * W;
    const n = Math.max(1, Math.ceil(Math.hypot(vx, vy) * dt / (l.r * 0.8)));
    for (let k = 0; k < n; k++) {
      bx += vx * dt / n; by += vy * dt / n;
      if (bx < l.r) { bx = l.r; vx = Math.abs(vx); } else if (bx > W - l.r) { bx = W - l.r; vx = -Math.abs(vx); }
      if (vy > 0 && by + l.r >= l.py && by + l.r <= l.py + l.ph + l.r && Math.abs(bx - px) <= l.hw + l.r * 0.5) {        // player paddle: ball must be going down; bounce up
        const o = Math.max(-1, Math.min(1, (bx - px) / l.hw)) * (Math.PI / 3);
        s.speedMul = Math.min(VMAX, s.speedMul + 0.04); const v2 = l.v * s.speedMul; vx = Math.sin(o) * v2; vy = -Math.cos(o) * v2; by = l.py - l.r; s.aim = (Math.random() - 0.5) * 1.2;
      }
      if (vy < 0 && by - l.r <= l.cy + l.ph && by - l.r >= l.cy - l.r && Math.abs(bx - cx) <= l.hw + l.r * 0.5) {        // CPU paddle: ball going up; bounce down
        const o = Math.max(-1, Math.min(1, (bx - cx) / l.hw)) * (Math.PI / 3);
        s.speedMul = Math.min(VMAX, s.speedMul + 0.04); const v2 = l.v * s.speedMul; vx = Math.sin(o) * v2; vy = Math.cos(o) * v2; by = l.cy + l.ph + l.r;
      }
      const out = by < -l.r ? 'player' : by > H + l.r ? 'cpu' : null;
      if (out) {
        s[out]++; s.speedMul = Math.max(1, s.speedMul - 0.1); ctx.save();
        const t = terminal(); if (t) finish(t); else resetServe();
        return;
      }
    }
    s.bx = bx / W; s.by = by / H; s.vx = vx; s.vy = vy;
  }
  function draw() {
    if (!g || !W) return;
    const l = L(), px = s.px * W, cx = s.cpuPx * W;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.strokeStyle = DASH; g.lineWidth = 2; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
    g.fillStyle = PUR; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.rect(cx - l.hw, l.cy, l.hw * 2, l.ph); g.fill(); g.stroke();
    g.fillStyle = YEL; g.beginPath(); g.rect(px - l.hw, l.py, l.hw * 2, l.ph); g.fill(); g.stroke();
    g.fillStyle = '#FFF'; g.strokeStyle = PUR; g.beginPath(); g.arc(s.bx * W, s.by * H, l.r, 0, 7); g.fill(); g.stroke();
    g.font = `bold 40px ${MONO}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = PUR; g.fillText(String(s.cpu), 14, H * 0.3);
    g.textAlign = 'right'; g.fillStyle = YEL; g.fillText(String(s.player), W - 14, H * 0.7);
    if (s.phase === 'wait' && !done) { g.beginPath(); g.arc(s.bx * W, s.by * H, l.r + 5 + Math.sin(performance.now() / 160) * 3, 0, 7); g.strokeStyle = YEL; g.lineWidth = 2.5; g.stroke(); }   // serve hint
  }
  const frame = t => { if (!running) return; step(Math.min(0.033, Math.max(0, (t - last) / 1000))); last = t; if (running) { draw(); raf = requestAnimationFrame(frame); } };
  return {
    mount(host, c) {
      ctx = c; const sv = c.saved;
      if (sv && Number.isInteger(sv.player) && Number.isInteger(sv.cpu) && sv.player >= 0 && sv.player <= WIN && sv.cpu >= 0 && sv.cpu <= WIN && !(sv.player === WIN && sv.cpu === WIN)) {
        s.player = sv.player; s.cpu = sv.cpu; s.px = Math.min(0.9, Math.max(0.1, +sv.px || 0.5));
      }
      cv = document.createElement('canvas'); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Pong. Drag to move your paddle, tap to serve. First to five wins.');
      cv.style.cssText = 'display:block;touch-action:none;user-select:none;-webkit-user-select:none';
      g = cv.getContext('2d'); host.replaceChildren(cv);
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', () => { tap = null; });
    },
    resize(b) {
      W = Math.max(1, b.width); H = Math.max(1, b.height); dpr = Math.min(3, globalThis.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      if (s.phase === 'wait') rideBall(); draw();
    },
    start() { const t = terminal(); if (t) return finish(t); this.resume(); },   // a restored finished score reports, it never plays on
    resume() { if (done || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    pause() { if (!running) return; running = false; cancelAnimationFrame(raf); draw(); },
    serialize() { return {player: s.player, cpu: s.cpu, px: s.px}; },
    state: s,
    destroy() { running = false; done = true; cancelAnimationFrame(raf); cv?.remove(); },
  };
}
export default {id: 'pong', rulesVersion: 1, create};
