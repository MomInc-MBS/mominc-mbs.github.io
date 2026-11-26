// MOM's three-headed ASCII bust. Same API as mom-face.js (+ talk). Glyphs only, coloured from Ian's art (mom3.webp).
// Ported from the live OBS renderer (ai-visualizer/faces/mom3): cell sampling, tone->glyph, jaw-drop mouth. No deps, no per-char DOM.
// Static layer is drawn once per size; only the centre mouth and eye band are redrawn afterwards. aria-hidden, pointer-events:none.
import {MANIFEST as M} from './mom3-manifest.js';
export {baseForStage} from './mom-face.js';

const CB = M.content, SRC = M.source, GLYPHS = ".,':-=+10/|*8B#@", NONE = 255, TIERS = 16;
const FONT = "Consolas,'Cascadia Mono','SF Mono',Menlo,'Roboto Mono','Droid Sans Mono',monospace";   // never 'Courier New': Android maps it to hairline Cutive Mono
const COLS = 136, FLOOR = .06, REF_COLS = 154; // the OBS renderer uses ~154 cols; mouth travel scales by cols/REF_COLS
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, +v || 0));
const GI = c => GLYPHS.indexOf(c);
const G = {DOT: GI('.'), COM: GI(','), APO: GI("'"), COLON: GI(':'), DASH: GI('-'), EQ: GI('='), PLUS: GI('+'), O: GI('1'), Z: GI('0'), STAR: GI('*'), EIGHT: GI('8'), B: GI('B'), HASH: GI('#'), AT: GI('@')};
const hash = (c, r, s) => { let h = Math.imul(c + 1, 374761393) ^ Math.imul(r + 1, 668265263) ^ Math.imul(s + 1, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (a, h) => a[h * a.length | 0];
function glyphFor(t, c, r) {
  const h = hash(c, r, 7);
  if (t < .22) return pick([G.DOT, G.COLON, G.DOT, G.APO, G.COM], h);
  if (t < .45) return pick([G.O, G.Z, G.EQ, G.PLUS, G.O, G.Z], h);
  if (t < .68) return pick([G.Z, G.O, G.Z, G.EQ, G.PLUS, G.STAR, G.O], h);
  if (t < .86) return pick([G.Z, G.EIGHT, G.B, G.HASH, G.Z, G.EIGHT], h);
  return pick([G.HASH, G.AT, G.EIGHT, G.B, G.AT, G.Z], h);
}

/** Layout of the bust at a CSS width: height, and the combined eye-and-glasses band (all three heads) in CSS px. */
export function bustGeometry(w) {
  const k = w / CB.w, h = CB.h * k, eyeTop = (M.eye.y0 - CB.y) * k, eyeBot = (M.eye.y1 - CB.y) * k;
  return {w, h, eyeTop, eyeBot, strip: Math.min(eyeBot - eyeTop, h)};
}

/** stage emotion -> palette shift (tint colour + amount); stage 4 (furious, intensity 1) adds the red rim. Identity is untouched. */
function palette(emotion, k) {
  k = clamp(k);
  if (emotion === 'upset') return {tint: [255, 150, 80], m: .12 + .3 * k, rim: 0};
  if (emotion === 'furious') return {tint: [255, 58, 72], m: .22 + .42 * k, rim: k > .85 ? 1 : 0};
  return {tint: [255, 255, 255], m: 0, rim: 0};
}

let imgP = null;
const loadImg = () => imgP || (imgP = new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = new URL(M.asset.file, import.meta.url).href; }));

export function createMomFace(host, opts = {}) {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `display:block;width:100%;height:auto;aspect-ratio:${CB.w}/${CB.h};pointer-events:none`;
  host.appendChild(cv);
  const g = cv.getContext('2d');
  const S = {emo: 'happy', k: .3, rm: !!opts.reducedMotion, hc: !!opts.highContrast, talking: false, paused: false, dead: false, img: null,
    cols: 0, rows: 0, cw: 0, ch: 0, ox: 0, oy: 0, W: 0, H: 0, cells: null, heads: null, base: null, timer: 0, blinkT: 0, ap: -1, wide: 1, pose: 0};
  const rowCache = new Map();

  // ---- colour: source cell rgb -> boosted -> palette tint -> cached glyph row (all 16 glyphs in one strip) ----
  function rowFor(r, gr, b, t, pal) {
    const mx = Math.max(r, gr, b) / 255, mn = Math.min(r, gr, b) / 255, d = mx - mn, s = Math.min(1, (mx ? d / mx : 0) * 1.3);
    let v = Math.min(1, mx * 1.5 + .2) * (t < .4 ? .5 + .5 * t / .4 : 1);
    if (S.hc) v = Math.min(1, v * 1.2 + .08);
    // HSV boost (as the OBS renderer): keep hue, lift saturation and value
    let h = 0; if (d > 0) h = mx === r / 255 ? ((gr - b) / 255 / d + 6) % 6 : mx === gr / 255 ? (b - r) / 255 / d + 2 : (r - gr) / 255 / d + 4;
    const f = n => { const kk = (n + h) % 6; return v * (1 - s * Math.max(0, Math.min(1, 4 - kk, kk))) * 255; };
    let R = f(5), Gc = f(3), B = f(1); v *= 255;
    if (pal.m) { R += (pal.tint[0] * v / 255 - R) * pal.m; Gc += (pal.tint[1] * v / 255 - Gc) * pal.m; B += (pal.tint[2] * v / 255 - B) * pal.m; }
    const a = Math.min(1, .3 + 1.05 * t);
    const key = ((R | 0) >> 4) | (((Gc | 0) >> 4) << 4) | (((B | 0) >> 4) << 8) | (Math.round(a * 8) << 12);
    let c = rowCache.get(key);
    if (!c) {
      c = document.createElement('canvas'); c.width = S.cw * GLYPHS.length; c.height = S.ch;
      const x = c.getContext('2d'); x.font = `bold ${Math.round(S.cw * 1.75)}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = `rgba(${Math.min(255, ((R | 0) >> 4) * 16 + 8)},${Math.min(255, ((Gc | 0) >> 4) * 16 + 8)},${Math.min(255, ((B | 0) >> 4) * 16 + 8)},${a.toFixed(2)})`;
      for (let i = 0; i < GLYPHS.length; i++) x.fillText(GLYPHS[i], i * S.cw + S.cw / 2, S.ch / 2 + 1);
      rowCache.set(key, c);
    }
    return c;
  }
  const pal = () => palette(S.emo, S.k);

  // ---- sampling: art -> cell grid (tone, glyph, mean rgb). Once per size. ----
  function sample() {
    const {cols, rows, cw, ch} = S, c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch;
    const x = c.getContext('2d', {willReadFrequently: true}); x.imageSmoothingQuality = 'high'; x.drawImage(S.img, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data, w = c.width, area = cw * ch, n = cols * rows;
    const mean = new Float32Array(n), rgb = new Float32Array(n * 3);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
      let sum = 0, sr = 0, sg = 0, sb = 0;
      for (let y = 0; y < ch; y++) { let p = ((r * ch + y) * w + cc * cw) * 4; for (let xx = 0; xx < cw; xx++, p += 4) { sr += d[p]; sg += d[p + 1]; sb += d[p + 2]; sum += d[p] * .299 + d[p + 1] * .587 + d[p + 2] * .114; } }
      const i = r * cols + cc; mean[i] = sum / area / 255; rgb[i * 3] = sr / area; rgb[i * 3 + 1] = sg / area; rgb[i * 3 + 2] = sb / area;
    }
    const tone = new Float32Array(n), gl = new Uint8Array(n).fill(NONE);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
      const i = r * cols + cc; if (mean[i] <= FLOOR) continue;
      let b = 0, k = 0;
      for (let y = Math.max(0, r - 1); y <= Math.min(rows - 1, r + 1); y++) for (let xx = Math.max(0, cc - 1); xx <= Math.min(cols - 1, cc + 1); xx++) { b += mean[y * cols + xx]; k++; }
      const sharp = Math.max(0, mean[i] + 1.3 * (mean[i] - b / k)); // unsharp: keeps thin glasses frames
      const t = Math.min(1, Math.max(.14, Math.pow(Math.min(1, Math.max(0, (sharp - .08) / .5)), .9)));
      tone[i] = t; gl[i] = glyphFor(t, cc, r);
    }
    S.cells = {tone, gl, rgb};
    // centre mouth head (anchors normalized to the source image -> grid cells)
    const m = M.mouths.center, toCol = nx => (nx * SRC.w - CB.x) / CB.w * cols, toRow = ny => (ny * SRC.h - CB.y) / CB.h * rows;
    const hd = {cx: toCol(m.box[0] + m.box[2] / 2), hw: toCol(m.box[0] + m.box[2]) - toCol(m.box[0]) >> 1 || 1, lip: Math.round(toRow(m.lip)), jaw: Math.round(toRow(m.jaw)),
      x0: Math.max(0, Math.floor(toCol(m.region[0]))), x1: Math.min(cols - 1, Math.ceil(toCol(m.region[1]))), drop: m.maxDrop * cols / REF_COLS};
    hd.hw = (toCol(m.box[0] + m.box[2]) - toCol(m.box[0])) / 2;
    hd.shift = new Int16Array(cols); hd.box = new Uint8Array(cols); hd.u = new Float32Array(cols);
    S.heads = {center: hd};
  }
  function drawCell(c, r, dy, pl) {
    const i = r * S.cols + c, gi = S.cells.gl[i]; if (gi === NONE) return;
    const t = S.cells.tone[i], rg = S.cells.rgb, row = rowFor(rg[i * 3], rg[i * 3 + 1], rg[i * 3 + 2], t, pl);
    const x = S.ox + c * S.cw, y = S.oy + r * S.ch + (dy || 0);
    g.drawImage(row, gi * S.cw, 0, S.cw, S.ch, x, y, S.cw, S.ch);
    if (t > .88) g.drawImage(row, gi * S.cw, 0, S.cw, S.ch, x + 1, y, S.cw, S.ch);
  }
  function paint() { // whole static layer + palette + rim, then snapshot for blink restores
    const pl = pal(); rowCache.clear(); g.clearRect(0, 0, S.W, S.H);
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) drawCell(c, r, 0, pl);
    if (pl.rim) { // stage-4 red rim: inner edge glow, drawn into the base so mouth redraws never touch it
      g.save(); g.globalCompositeOperation = 'source-atop'; const e = Math.round(S.W * .09);
      for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, e, 0, 0, 0, e, S.H], [S.W, 0, S.W - e, 0, S.W - e, 0, e, S.H], [0, 0, 0, e, 0, 0, S.W, e]]) {
        const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,40,60,.85)'); gr.addColorStop(1, 'rgba(255,40,60,0)'); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh);
      }
      g.restore();
    }
    if (!S.base) S.base = document.createElement('canvas'); S.base.width = S.W; S.base.height = S.H;
    const bx = S.base.getContext('2d'); bx.clearRect(0, 0, S.W, S.H); bx.drawImage(cv, 0, 0);
    S.ap = -1; S.wide = 1; applyMouth(S.pose);
  }

  // ---- centre mouth: jaw-drop (lip row and below ride down by sh px per column; the closed mouth is replaced, never doubled) ----
  const POSES = [[0, 1], [.5, 1], [1, 1.15]]; // closed / open / wide: hard quantized apertures
  function applyMouth(idx) {
    const hd = S.heads?.center; if (!hd || !S.cells) return;
    const [ap, wide] = POSES[S.rm ? 0 : idx] || POSES[0]; if (ap === S.ap && wide === S.wide) return;
    S.ap = ap; S.wide = wide; const d = ap * hd.drop * S.ch;
    for (let c = hd.x0; c <= hd.x1; c++) {
      const dx = c + .5 - hd.cx, u = dx / (hd.hw * wide); hd.u[c] = u; hd.box[c] = Math.abs(u) <= 1 ? 1 : 0;
      let w;
      if (Math.abs(u) <= 1) w = .55 + .45 * Math.sqrt(1 - u * u);
      else { const edge = dx < 0 ? hd.cx - hd.hw * wide - hd.x0 : hd.x1 - (hd.cx + hd.hw * wide); const s = Math.min(1, (Math.abs(dx) - hd.hw * wide) / Math.max(1, edge)); w = .55 * .5 * (1 + Math.cos(Math.PI * s)); }
      hd.shift[c] = Math.round(d * w);
    }
    const pl = pal(), r0 = hd.lip, r1 = Math.min(S.rows - 1, hd.jaw + Math.ceil(hd.drop) + 1);
    const rx = S.ox + hd.x0 * S.cw, ry = S.oy + r0 * S.ch, rw = (hd.x1 - hd.x0 + 1) * S.cw + 1, rh = (r1 - r0 + 1) * S.ch;
    g.clearRect(rx, ry, rw, rh);
    for (let c = hd.x0; c <= hd.x1; c++) {
      const sp = hd.shift[c], sf = Math.floor(sp / S.ch);
      for (let r = r0; r <= r1 && r <= r0 + sf; r++) {
        if (!hd.box[c]) drawCell(c, r0, 0, pl); // cheeks stretch, never open
        else if (r === r0 && sp >= 1.5 * S.ch && Math.abs(hd.u[c]) < .7) { // lower-teeth line in the gap
          const row = rowFor(240, 200, 250, .5, pl); g.drawImage(row, G.DASH * S.cw, 0, S.cw, S.ch, S.ox + c * S.cw, S.oy + r * S.ch, S.cw, S.ch);
        }
      }
      for (let sr = r0; sr <= hd.jaw; sr++) drawCell(c, sr, sp, pl);
      for (let r = hd.jaw + 1 + sf; r <= r1; r++) drawCell(c, r, 0, pl);
    }
  }

  // ---- layout ----
  function layout() {
    if (S.dead || !S.img) return;
    const w = host.clientWidth; if (!(w > 0)) return;
    const dpr = Math.min(3, Math.max(1, globalThis.devicePixelRatio || 1)), Wd = Math.round(w * dpr), Hd = Math.round(Wd * CB.h / CB.w);
    if (Wd === S.W && Hd === S.H) return;
    S.W = Wd; S.H = Hd; cv.width = Wd; cv.height = Hd;
    S.cw = Math.max(3, Math.floor(Wd / COLS)); S.ch = Math.round(S.cw * 9 / 7);
    S.cols = Math.floor(Wd / S.cw); S.rows = Math.floor(Hd / S.ch); S.ox = (Wd - S.cols * S.cw) >> 1; S.oy = (Hd - S.rows * S.ch) >> 1;
    sample(); paint();
    try { opts.onLayout?.(bustGeometry(w)); } catch (e) {}
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
  ro?.observe(host);
  loadImg().then(i => { S.img = i; layout(); }).catch(() => {});

  // ---- animation ----
  const live = () => !S.dead && !S.paused && !S.rm && S.talking && !document.hidden;
  function step() { // hard pose changes, ~10/s; never the same open pose twice in a row
    const prev = S.pose, nxt = prev === 0 ? 1 + (Math.random() < .5 ? 1 : 0) : [0, 1, 2].filter(p => p !== prev)[Math.random() * 2 | 0];
    S.pose = nxt; applyMouth(nxt);
  }
  function sync() { clearInterval(S.timer); S.timer = 0; if (live()) S.timer = setInterval(step, 100); else if (S.pose) { S.pose = 0; applyMouth(0); } }
  const onVis = () => sync();
  document.addEventListener('visibilitychange', onVis);

  return {
    setBase(emotion, intensity) { S.emo = emotion || 'happy'; S.k = clamp(intensity); if (S.cells) paint(); },
    react(kind) {
      if (kind !== 'blink' || S.rm || !S.base || S.dead || document.hidden) return;
      const ey0 = S.oy + Math.round((M.eye.y0 - CB.y) / CB.h * S.rows) * S.ch, ey1 = S.oy + Math.round((M.eye.y1 - CB.y) / CB.h * S.rows) * S.ch;
      g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(7,3,13,.7)'; g.fillRect(0, ey0, S.W, ey1 - ey0); g.restore();
      clearTimeout(S.blinkT);
      S.blinkT = setTimeout(() => { if (S.dead) return; g.clearRect(0, ey0, S.W, ey1 - ey0); g.drawImage(S.base, 0, ey0, S.W, ey1 - ey0, 0, ey0, S.W, ey1 - ey0); }, 150);
    },
    look() {}, settle() {},
    talk(on) { if (!!on === S.talking) return; S.talking = !!on; if (!on) { S.pose = 0; applyMouth(0); } sync(); },   // repeat calls must not restart the pose timer
    setReducedMotion(b) { S.rm = !!b; if (S.rm) { S.pose = 0; applyMouth(0); } sync(); },
    pause() { S.paused = true; sync(); }, resume() { S.paused = false; sync(); },
    destroy() { S.dead = true; clearInterval(S.timer); clearTimeout(S.blinkT); ro?.disconnect(); document.removeEventListener('visibilitychange', onVis); cv.remove(); },
    geometry: () => bustGeometry(host.clientWidth || 0),
  };
}
