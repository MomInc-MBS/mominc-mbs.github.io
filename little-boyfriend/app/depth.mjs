// 1:1 port of DepthMath.kt, FrameMath.kt (+FrameTune), MaterialColor.kt, FramePalette.kt. Same names, same constants.
// tools/web/check_parity.mjs compares CONSTANTS here with the Kotlin source and effects.v1.json.
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export const CONSTANTS = {
  depthMath: {BLUR_START_PX: 34, PARALLAX_CAP: 0.03, RESP_RIM: 1, RESP_WALL: 0.6, RESP_CAM: 0.2, PARALLAX_TAU: 0.1, SDF_RANGE: 0.2},
  frameMath: {OVERSCAN: 1.04, SIGN_X: 1, SIGN_Y: -1, RESERVE_USE: 0.99},
};
const D = CONSTANTS.depthMath, F = CONSTANTS.frameMath;

/** DepthParams defaults (Kotlin data class). Pixel values are at 720 short side. */
export const DEPTH_DEFAULTS = {
  rimStart: 1.10, camStart: 1.45, camDelayMs: 100, camDurMs: 850,
  wallDepth: 0.07, edgeBlurPx: 18, edgeFall: 0.10,
  contact: 0.50, contactFall: 0.045, vignette: 0.40, vignetteFall: 0.20,
  rimDefocusPx: 6,
};
/** DepthParams.loadFrom clamps. */
export const DEPTH_RANGES = {
  rimStart: [1, 1.25], camStart: [1, 1.8], camDelayMs: [0, 300], camDurMs: [300, 1600], wallDepth: [0, 0.15],
  edgeBlurPx: [0, 48], contact: [0, 0.85], vignette: [0, 0.75], rimDefocusPx: [0, 24],
};

export const layer = (start, end, delayMs, durMs) => ({start, end, delayMs, durMs});

/** DepthParams with the derived rim/wall/cam/blur layers. */
export function depthParams(over = {}) {
  const d = {...DEPTH_DEFAULTS};
  for (const [k, v] of Object.entries(over)) if (k in d && Number.isFinite(v)) { const r = DEPTH_RANGES[k]; d[k] = r ? clamp(v, r[0], r[1]) : v; }
  d.rim = layer(d.rimStart, 1, 0, 480);
  d.wall = layer(Math.max(1.16, d.rimStart + 0.06), 1, 30, 570);
  d.cam = layer(d.camStart, 1, d.camDelayMs, d.camDurMs);
  d.blur = layer(D.BLUR_START_PX, 0, 180, 750);
  return d;
}

const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const FrameMath = {
  ...F,
  softClamp(x, limit) { if (limit <= 0 || Number.isNaN(x)) return 0; return limit * Math.tanh(x / limit); },
  reserve(c, size) { return Math.max(0, Math.min(c - size / 2, 1 - c - size / 2)); },
  shift(poseN, reserve, move, sign) { return FrameMath.softClamp(sign * poseN * reserve * move, reserve * F.RESERVE_USE); },
  uv(o, c, size, shift) { return c + (o - 0.5) * size + shift; },
  progress(scale, finalScale) { const span = 1 - finalScale; if (span < 1e-4) return 1; return 1 - clamp((scale - finalScale) / span, 0, 1); },
  revealZoomStart(rx, ry, fvx, fvy) {
    const ex = rx / fvx, ey = ry / fvy;
    if (ex <= 0 || ey <= 0) return 1;
    return clamp(1.03 * 0.5 * Math.max(1 / ex, 1 / ey), 1, 3);
  },
  revealZoom(scale, finalScale, mStart) {
    if (finalScale >= 0.999 || finalScale <= 0 || mStart <= 1) return 1;
    const e = clamp(Math.log(clamp(scale, 1e-4, 1)) / Math.log(finalScale), 0, 1);
    return Math.exp((1 - e) * Math.log(mStart));
  },
  zoomCentre(m, mStart, oAp) {
    const t = mStart - 1 < 1e-4 ? 0 : clamp((m - 1) / (mStart - 1), 0, 1);
    return 0.5 + (oAp - 0.5) * t;
  },
  smooth(cur, target, dtSec, tauSec) { return cur + (target - cur) * (1 - Math.exp(-Math.max(dtSec, 0) / tauSec)); },
};

export const DepthMath = {
  ...D,
  easeOutCubic(u) { const k = 1 - clamp(u, 0, 1); return 1 - k * k * k; },
  progress(l, ms) { return l.durMs <= 0 ? 1 : clamp((ms - l.delayMs) / l.durMs, 0, 1); },
  value(l, ms) { return l.start + (l.end - l.start) * DepthMath.easeOutCubic(DepthMath.progress(l, ms)); },
  totalMs(p) { return Math.max(...[p.rim, p.wall, p.cam, p.blur].map(l => l.delayMs + l.durMs)); },
  cameraCover(travel) { return 1 / (1 - 2 * clamp(travel, 0, 0.2)); },
  camTravel(apW) { return D.PARALLAX_CAP * D.RESP_CAM * apW; },
  anchorCentre(m, a) { return a * (1 - 1 / m) + 0.5 / m; },
  wallShift(rimShift, cap) { const rel = clamp((1 - D.RESP_WALL) * rimShift, -cap, cap); return rimShift - rel; },
  camShift(rimDisp, travel) { return FrameMath.softClamp(D.RESP_CAM * rimDisp, travel); },
  sigmaToF(s) { return s < 6.4 ? s / 6.4 : Math.min(4, 1 + Math.log2(s / 6.4)); },
  edgeWeight(d, fall) { return 1 - smoothstep(0, fall, d); },
  contactShadow(d, strength, fall) { return strength * Math.exp(-Math.max(d, 0) / fall); },
  vignette(d, strength, fall) { return strength * (1 - smoothstep(0, fall, d)); },
  transmission(d, p, reveal = 1) {
    return clamp((1 - reveal * DepthMath.contactShadow(d, p.contact, p.contactFall)) * (1 - reveal * DepthMath.vignette(d, p.vignette, p.vignetteFall)), 0, 1);
  },
  revealMul(wallProgress) { return 0.8 + 0.2 * DepthMath.easeOutCubic(wallProgress); },
  edgeSigmaPx(d, p, pxScale) { return 0.5 * p.edgeBlurPx * pxScale * DepthMath.edgeWeight(d, p.edgeFall); },
  rimBlend(px, fvx) { return clamp(px * fvx / (0.016 * 720), 0, 1); },
};

// ---- FrameTune (Settings > Scene > Frame)
export const FRAME_TUNE_DEFAULTS = {outerBlur: 0.75, edgeBlur: 0.2, hue: 0, sat: 1, light: 0, tint: 1, move: 1};
export const FRAME_TUNE_RANGES = {outerBlur: [0, 1], edgeBlur: [0, 1], hue: [-180, 180], sat: [0, 2], light: [-0.5, 0.5], tint: [0, 1], move: [0, 1.5]};
export function frameTune(over = {}) {
  const t = {...FRAME_TUNE_DEFAULTS};
  for (const [k, v] of Object.entries(over)) if (k in t && Number.isFinite(v)) t[k] = clamp(v, ...FRAME_TUNE_RANGES[k]);
  return t;
}

// ---- MaterialColor: palette index 0 = original art; the rest recolour the mask (R sharp / G blurred).
export const PALETTES = {
  dollhouse: [0, 0x2BB5A8, 0x9A6BD6, 0x4D9BE6, 0xF2C230, 0xD83A3A],
  birdhouse: [0, 0x5A3A22, 0xC88A3C, 0x3F7A4A, 0x2F4F85, 0xB8AE9C],
  mason_jar: [0, 0x3E6FC0, 0x4FA05A, 0xE6B93A, 0x8A5CC0, 0x4A4A4A],
  cardboard_box: [0, 0xC0392B, 0x2F6FC0, 0xE8C020, 0x2E9A55, 0x2A2A2A],
};
const floorMod = (a, n) => ((a % n) + n) % n;
export const MaterialColor = {
  PALETTES,
  size: id => (PALETTES[id] ? PALETTES[id].length : 1),
  clamp: (id, i) => floorMod(i, MaterialColor.size(id)),
  next: (id, i) => MaterialColor.clamp(id, i + 1),
  label: (id, i) => (MaterialColor.clamp(id, i) === 0 ? 'Original' : `${MaterialColor.clamp(id, i)}/${MaterialColor.size(id) - 1}`),
  luma: (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b,
  /**
   * One pixel (straight rgb 0..255 in, out). shading = Y / refLuma, out = target * shading; overflow above 1 spills into the
   * other channels; blended by mask m (0..1). Same arithmetic as Kotlin.
   */
  recolor(r8, g8, b8, m, refLuma, target) {
    if (m <= 0) return [r8, g8, b8];
    const r = r8 / 255, g = g8 / 255, b = b8 / 255;
    const k = MaterialColor.luma(r, g, b) / Math.max(refLuma, 1e-3);
    const t = [(target >> 16 & 255) / 255 * k, (target >> 8 & 255) / 255 * k, (target & 255) / 255 * k];
    const over = Math.max(0, Math.max(...t) - 1) * 0.5;
    const src = [r, g, b], mm = Math.min(m, 1);
    return src.map((s, i) => clamp(Math.trunc((s + (clamp(t[i] + over, 0, 1) - s) * mm) * 255 + 0.5), 0, 255));
  },
};

// ---- FramePalette (metal shades / strip colours for the Coach frame; the shell may use these for the housing)
export const FramePalette = {
  DEFAULT_METAL: 0x4D3D4F, DEFAULT_STRIP: 0xB026FF,
  HUE_STEPS: Array.from({length: 8}, (_, i) => i * 3),
  mix(c, t, to) {
    const ch = sh => clamp(Math.round(((c >> sh) & 255) * (1 - t) + ((to >> sh) & 255) * t), 0, 255);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  },
  hsl(hDeg, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (((hDeg % 360) + 360) % 360) / 60;
    const x = c * (1 - Math.abs(hp % 2 - 1));
    const [r1, g1, b1] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.min(5, Math.trunc(hp))];
    const m = l - c / 2, q = v => clamp(Math.round((v + m) * 255), 0, 255);
    return (q(r1) << 16) | (q(g1) << 8) | q(b1);
  },
  get METAL() { return [FramePalette.DEFAULT_METAL, ...FramePalette.HUE_STEPS.map(h => FramePalette.hsl(h * 15, 0.65, 0.40))]; },
  get SIZE() { return FramePalette.METAL.length; },
  clamp: i => floorMod(i, FramePalette.SIZE),
  next: i => floorMod(i + 1, FramePalette.SIZE),
  tintedStrip: i => (FramePalette.clamp(i) === 0 ? FramePalette.DEFAULT_STRIP : FramePalette.hsl(FramePalette.HUE_STEPS[FramePalette.clamp(i) - 1] * 15, 0.65, 0.60)),
  shades: pm => [FramePalette.mix(pm, 0.38, 0xFFFFFF), FramePalette.mix(pm, 0.25, 0x000000), FramePalette.mix(pm, 0.45, 0x000000), FramePalette.mix(pm, 0.10, 0xFFFFFF)],
  stripSeq: c => [c, FramePalette.mix(c, 0.6, 0x000000), c, FramePalette.mix(c, 0.55, 0xFFFFFF)],
  /** strip colour, or null when mode is 'OFF'. mode: 'COACH' | 'TINTED' | 'OFF' */
  stripColor: (i, mode) => (mode === 'OFF' ? null : mode === 'COACH' ? FramePalette.DEFAULT_STRIP : FramePalette.tintedStrip(i)),
};
