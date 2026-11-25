// Little Boyfriend PWA render engine: WebGL2 port of the Android chain
//   MiniatureFilter (held pose, tilt-shift) -> GlassFilter (frame + curved glass, every tick) -> FinishFilter (grade/grain, last).
// Shaders are the Kotlin strings verbatim (gen/shaders.mjs); the math is a 1:1 port (tempo.mjs, depth.mjs, Look below).
// Contract: docs/PWA_PLAN.md section 2.
import {shaders} from './gen/shaders.mjs';
import {Cadence, TempoModel, MotionOnset, FrameDiff, State, PRESETS as MOTION_PRESETS, CONSTANTS as TC} from './tempo.mjs';
import {DepthMath, FrameMath, depthParams, frameTune, MaterialColor, DEPTH_DEFAULTS} from './depth.mjs';

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const f32 = Math.fround;
const RAD = Math.PI / 180;

// ------------------------------------------------------------------ Look (Look.kt)
export function makeLook(L) {
  const PARAMS = L.params, N = PARAMS.length;
  const index = Object.fromEntries(PARAMS.map((p, i) => [p.key, i]));
  const idx = key => { if (!(key in index)) throw new Error('unknown look key ' + key); return index[key]; };
  const COLOR_KEYS = new Set(['saturation', 'contrast', 'gamma', 'exposure', 'temperature', 'tint', 'vibrance', 'rolloff', 'grain']);
  const BLUR_KEYS = new Set(['top', 'bottom', 'radius', 'sharpness']);
  const presetArray = name => Float32Array.from(PARAMS, p => L.presets[name][p.key]);
  const neutralOn = (eff, keys) => PARAMS.every((p, i) => !keys.has(p.key) || eff[i] === f32(p.neutral));
  return {
    PARAMS, N, idx, has: key => key in index, DEFAULT: L.default, SCHEMA: L.schema, SPEEDS: L.speeds, GRAIN_AMP: L.grainAmp,
    presetNames: () => Object.keys(L.presets),
    preset: presetArray,
    /** Intensity master: 0 = neutral look, 1 = preset. Geometry (neutral == null) is kept. */
    effective(values, intensity = 1) {
      const t = clamp(intensity, 0, 1);
      return Float32Array.from(PARAMS, (p, i) => (p.neutral == null ? values[i] : p.neutral + (values[i] - p.neutral) * t));
    },
    isBlurNeutral: eff => neutralOn(eff, BLUR_KEYS),
    isColorNeutral: eff => neutralOn(eff, COLOR_KEYS),
    grainAmp: g => (g <= 1 ? g : 1 + (g - 1) * 2),
    luma709: (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b,
    neutralValues: () => Float32Array.from(PARAMS, p => p.neutral ?? p.def),
    seedOf: tick => f32((tick % 997) * f32(0.6180339)),
  };
}

// ------------------------------------------------------------------ small GL helpers
const WEB_COVER_FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uScale;
uniform float uMirror;
varying vec2 v;
void main() {
  vec2 q = vec2(uMirror > 0.5 ? 1.0 - v.x : v.x, v.y);
  q = (q - 0.5) * uScale + 0.5;
  gl_FragColor = vec4(texture2D(uTex, q).rgb, 1.0);
}
`;

function compile(gl, type, src, label) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(`shader ${label} failed: ${log}`); }
  return s;
}
function makeProgram(gl, vs, fs, name) {
  const p = gl.createProgram();
  const v = compile(gl, gl.VERTEX_SHADER, vs, name + ' vert'), f = compile(gl, gl.FRAGMENT_SHADER, fs, name + ' frag');
  gl.attachShader(p, v); gl.attachShader(p, f);
  gl.bindAttribLocation(p, 0, 'aPosition'); gl.bindAttribLocation(p, 1, 'aTextureCoord'); gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`program ${name} failed to link: ${gl.getProgramInfoLog(p)}`);
  gl.deleteShader(v); gl.deleteShader(f);
  const cache = new Map();
  return {id: p, name, u(n) { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n)); return cache.get(n); }};
}
const MAT_VERT = 'attribute vec3 aPos; varying vec2 vUv; void main(){ vUv = aPos.xy*0.5+0.5; gl_Position = vec4(aPos.xy,0.,1.); }';
function texParams(gl, filter = gl.LINEAR) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
function makeTarget(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  texParams(gl);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return {tex, fbo, w, h};
}
function freeTarget(gl, t) { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); } }
const make2d = (w, h) => { const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), {width: w, height: h}); return [c, c.getContext('2d', {willReadFrequently: true})]; };

/** Compile + link every shader in shaders.mjs on a throwaway context (harness/e2e check). */
export function compileAll(canvas = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas'))) {
  const gl = canvas.getContext('webgl2');
  if (!gl) return [{group: '-', name: '-', ok: false, log: 'no webgl2'}];
  const out = [];
  for (const [group, set] of Object.entries(shaders)) {
    for (const name of Object.keys(set)) if (name.endsWith('_FRAG')) {
      try { makeProgram(gl, set.VERT, set[name], `${group}.${name}`); out.push({group, name, ok: true}); } catch (e) { out.push({group, name, ok: false, log: String(e.message)}); }
    }
  }
  try { makeProgram(gl, shaders.miniature.VERT, WEB_COVER_FRAG, 'web.COVER_FRAG'); out.push({group: 'web', name: 'COVER_FRAG', ok: true}); } catch (e) { out.push({group: 'web', name: 'COVER_FRAG', ok: false, log: String(e.message)}); }
  return out;
}

// ------------------------------------------------------------------ renderer
export async function createRenderer(canvas, {effects, base} = {}) {
  base = base ?? new URL('./', import.meta.url).href;
  if (!effects || typeof effects === 'string') effects = await (await fetch(effects ?? new URL('./effects.v1.json', base).href)).json();
  const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  if (!gl) throw new Error('WebGL2 is not available');
  return new Renderer(canvas, gl, effects, base).ready();
}

class Renderer {
  constructor(canvas, gl, effects, base) {
    this.canvas = canvas; this.outputCanvas = canvas; this.gl = gl; this.fx = effects; this.base = base;
    const W = effects.web, K = effects.constants;
    this.W = W; this.K = K;
    this.Look = makeLook(effects.look);
    this.frames = Object.fromEntries(effects.frames.map(f => [f.id, f]));
    this.tiers = W.quality.tiers;

    // ---- state set by the setters
    this.lookValues = this.Look.preset(this.Look.DEFAULT); this.intensity = 1; this.mono = false; this.bypass = false;
    this.eff = this.Look.effective(this.lookValues, 1);
    this.tempoMode = null; this.anticipate = true;
    this.dp = depthParams(); this.tune = frameTune();
    this.frameWanted = null; this.matIdx = {};
    this.source = null; this.mirror = false;
    this.pose = null; this.poseRef = null; this.poseLockPending = false; this.rel = {yaw: 0, pitch: 0, tilt: 0};
    this.phone = 0; this.lastPoseAt = 0; this.lastPose = null;
    this.vstate = 'scanning'; this.revealPending = false; this.revealStart = 0;
    this.ceiling = W.quality.start; this.tier = W.quality.start; this.adaptive = true;
    this.lastNow = 0; this.lastDraw = 0; this.disposed = false; this.lost = false; this.loadSeq = 0; this.dpOn = true;

    // ---- per-frame working state
    this.cadence = new Cadence(); this.needsRender = true; this.frameId = 0; this.shownId = -1; this.tempoUnique = 0;
    this.model = null; this.ring = null; this.onsetDet = new MotionOnset(); this.lumaPrev = null; this.lumaBuf = null;
    this.shiftX = 0; this.shiftY = 0; this.lastGlassAt = 0; this.wZ = 1; this.wCx = 0.5; this.wCy = 0.5; this.wShX = 0; this.wShY = 0; this.wReveal = 1;
    this.camSh = [0, 0];
    this.haveCam = false; this.srcDirty = false; this.srcSize = [0, 0]; this.lastVideoTime = -1; this.nextVirtual = 0; this.pending = 0;
    this.fs = null; this.fsCache = new Map(); this.frameTok = 0; this.loading = null;
    this.stat = {fps: 0, uniqueFps: 0, ms: 0, w: 0, h: 0, held: 0, misses: 0};
    this.win = {t0: 0, frames: 0, ticks: 0}; this.dtEma = 16.7; this.lowSince = 0; this.headSince = 0; this.headCount = 0; this.lastTierChange = 0; this.gpuMs = 0; this.sampleN = 0;
    this.log = {unique: [], states: []};
    this.matReg = null; this.matWanted = 'original'; this.matActive = null; this.matCache = new Map(); this.matStatus = ''; this.matExec = 0; this.matSwitches = 0; this.presented = 0; this.matSeq = 0;
    const self = this;
    this.debug = {
      get adaptive() { return self.adaptive; }, set adaptive(v) { self.adaptive = !!v; },
      log: this.log, compileAll: () => compileAll(),
      setSize: (w, h) => { this.tiers = [{name: 'custom', w, h, fpsCap: 60}]; this.tier = this.ceiling = 'custom'; this.adaptive = false; this.#resize(); },
      programs: [], get vstate() { return self.vstate; }, get tempoState() { return self.model ? self.model.state : null; },
      get lostCount() { return self.lostCount || 0; },
      get ringInfo() { return self.model ? {count: self.model.count, capacity: self.model.capacity, events: self.model.events} : null; },
      get glass() { return {frameReady: !!self.fsGpu, depthMode: self.depthMode()}; },
    };
    this.#installContextEvents();
    this.#build();
  }

  // ============================================================ GL resources
  #installContextEvents() {
    this.onLost = e => { e.preventDefault(); this.lost = true; this.lostCount = (this.lostCount || 0) + 1; console.warn('LBF: webgl context lost'); };
    this.onRestored = () => { console.warn('LBF: webgl context restored'); this.lost = false; this.#build(); if (this.frameWanted) this.#loadFrame(this.frameWanted); };
    this.canvas.addEventListener('webglcontextlost', this.onLost);
    this.canvas.addEventListener('webglcontextrestored', this.onRestored);
  }

  #build() {
    const gl = this.gl, S = shaders;
    this.prog = {
      cover: makeProgram(gl, S.miniature.VERT, WEB_COVER_FRAG, 'web.cover'),
      copy: makeProgram(gl, S.miniature.VERT, S.miniature.COPY_FRAG, 'miniature.copy'),
      blur: makeProgram(gl, S.miniature.VERT, S.miniature.BLUR_FRAG, 'miniature.blur'),
      down: makeProgram(gl, S.miniature.VERT, S.miniature.DOWN_FRAG, 'miniature.down'),
      composite: makeProgram(gl, S.miniature.VERT, S.miniature.COMPOSITE_FRAG, 'miniature.composite'),
      compose: makeProgram(gl, S.glass.VERT, S.glass.COMPOSE_FRAG, 'glass.compose'),
      fin: makeProgram(gl, S.glass.VERT, S.glass.FINAL_FRAG, 'glass.final'),
      finish: makeProgram(gl, S.finish.VERT, S.finish.FRAG, 'finish'),
    };
    this.debug.programs = Object.values(this.prog).map(p => p.name);
    // unit quad: pos(x,y,z) uv(u,v), same as the Kotlin squareVertex
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 0, 1, -1, 0, 1, 0, -1, 1, 0, 0, 1, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    this.dummy = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.dummy);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); texParams(gl);
    this.srcTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.srcTex); texParams(gl);
    this.srcSize = [0, 0]; this.haveCam = false; this.staticDone = false; this.nextVirtual = 0; this.pending = 0;
    this.fsGpu = null;
    this.matCache = new Map(); this.matActive = null;   // programs belong to the old context
    this.#resize();
    if (this.matWanted !== 'original') this.setMaterial(this.matWanted);
  }

  tierInfo() { return this.tiers.find(t => t.name === this.tier) ?? this.tiers[0]; }

  #resize() {
    const gl = this.gl, t = this.tierInfo();
    this.#freeTargets();
    this.w = t.w; this.h = t.h;
    if (this.canvas.width !== t.w) this.canvas.width = t.w;
    if (this.canvas.height !== t.h) this.canvas.height = t.h;
    this.cam = makeTarget(gl, t.w, t.h); this.held = makeTarget(gl, t.w, t.h);
    this.cf = makeTarget(gl, t.w, t.h); this.glassOut = makeTarget(gl, t.w, t.h);
    this.mT = []; this.mO = []; this.gT = []; this.gO = [];
    let w = t.w, h = t.h;
    for (let i = 0; i < 4; i++) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      this.mT.push(makeTarget(gl, w, h)); this.mO.push(makeTarget(gl, w, h)); this.gT.push(makeTarget(gl, w, h)); this.gO.push(makeTarget(gl, w, h));
    }
    this.lumaW = this.K.miniature.LUMA_W; this.lumaH = clamp(Math.trunc(this.lumaW * t.h / t.w), 16, 64);
    this.lumaT = makeTarget(gl, this.lumaW, this.lumaH); this.lumaBuf = new Uint8Array(this.lumaW * this.lumaH * 4);
    this.#freeRing();
    this.needsRender = true; this.cadence.origin = -1; this.lumaPrev = null;
    this.stat.w = t.w; this.stat.h = t.h;
  }

  #freeTargets() {
    const gl = this.gl;
    for (const m of this.matCache.values()) for (const ps of m.passes) { freeTarget(gl, ps.target); ps.target = null; }
    for (const t of [this.cam, this.held, this.cf, this.glassOut, this.lumaT, ...(this.mT || []), ...(this.mO || []), ...(this.gT || []), ...(this.gO || [])]) freeTarget(gl, t);
    this.cam = this.held = this.cf = this.glassOut = this.lumaT = null;
  }

  #freeRing() {
    if (this.ring) for (const t of this.ring) freeTarget(this.gl, t);
    this.ring = null; this.model = null; this.shownId = -1; this.needsRender = true;
  }

  // ============================================================ contract setters
  setSource(src) {
    if (this.source && this.vfcId != null && this.source.cancelVideoFrameCallback) this.source.cancelVideoFrameCallback(this.vfcId);
    this.source = src || null; this.vfcId = null; this.pending = 0; this.lastVideoTime = -1; this.haveCam = false; this.srcDirty = true; this.srcSize = [0, 0];
    this.staticDone = false;
    if (this.source && typeof HTMLVideoElement !== 'undefined' && this.source instanceof HTMLVideoElement && this.source.requestVideoFrameCallback) {
      const v = this.source;
      const cb = () => { this.pending++; this.vfcId = v.requestVideoFrameCallback(cb); };
      this.vfcId = v.requestVideoFrameCallback(cb);
    }
  }
  setMirror(on) { this.mirror = !!on; this.needsRender = true; }

  /** lookObj: {preset?, intensity?, bw?, ...paramKey: value}. Raw preset values; the intensity master is applied here. */
  setLook(o = {}) {
    const L = this.Look;
    let values = o.preset ? L.preset(o.preset) : Float32Array.from(this.lookValues);
    for (const [k, v] of Object.entries(o)) if (typeof v === 'number' && L.has(k)) values[L.idx(k)] = v;
    this.lookValues = values;
    if (typeof o.intensity === 'number') this.intensity = o.intensity;
    if (typeof o.bw === 'boolean') this.mono = o.bw;
    this.eff = L.effective(values, this.intensity);
    this.needsRender = true; // stage 1 re-renders the held pose with the new look
  }
  /** Freeze the quality tier (e.g. while recording: a canvas resize mid-recording breaks MediaRecorder). Self-stepping resumes with true. */
  setAdaptive(on) { this.adaptive = !!on; this.lowSince = 0; this.headCount = 0; }
  setBypass(on) { this.bypass = !!on; this.needsRender = true; }
  setFrameTune(o) { this.tune = frameTune({...this.tune, ...o}); }
  setDepth(o) { this.dp = depthParams({...this.dp, ...o}); }

  setFrame(id) {
    if (id != null && !this.frames[id]) throw new Error('unknown frame ' + id);
    const had = this.vstate !== 'scanning';
    this.frameWanted = id; this.frameTok++;
    if (id == null) { this.#dropFrame(); this.vstate = 'scanning'; this.revealPending = false; return; }
    this.vstate = 'scanning'; this.revealPending = had || this.revealPending; // a re-selected frame replays the reveal if one had run
    this.#loadFrame(id);
  }
  setMaterialColor(index) {
    const id = this.frameWanted; if (!id) return 0;
    const i = MaterialColor.clamp(id, index);
    this.matIdx[id] = i;
    this.#loadFrame(id);
    return i;
  }
  setTempo(modeName) {
    if (modeName != null && !(modeName in MOTION_PRESETS)) throw new Error('unknown tempo mode ' + modeName);   // null = the look's own cadence value
    this.tempoMode = modeName; this.needsRender = true;
  }
  setAnticipation(on) { this.anticipate = !!on; this.needsRender = true; }

  /** {yaw, pitch, roll} radians, yaw + = aimed right, pitch + = aimed up, roll ignored (like PoseMath). null = no parallax. */
  setPose(p, nowMs = performance.now()) {
    if (!p) { this.pose = null; this.lastPose = null; this.phone = 0; return; }
    if (this.lastPose) {
      const dt = Math.max((nowMs - this.lastPoseAt) / 1000, 1e-3);
      const rate = Math.hypot(p.yaw - this.lastPose.yaw, p.pitch - this.lastPose.pitch) / dt;
      this.phone += 0.25 * (rate / this.K.pose.GYRO_THR - this.phone);
    }
    this.lastPose = {yaw: p.yaw, pitch: p.pitch}; this.lastPoseAt = nowMs; this.pose = this.lastPose;
    if (this.poseLockPending) { this.poseRef = {yaw: p.yaw, pitch: p.pitch}; this.poseLockPending = false; }
    this.rel = this.poseRef ? relativePose(this.poseRef, this.pose) : {yaw: 0, pitch: 0, tilt: 0};
  }
  recenter() { this.poseLockPending = true; }

  reveal() { this.revealPending = true; this.poseLockPending = true; this.poseRef = null; this.rel = {yaw: 0, pitch: 0, tilt: 0}; }

  async ready() { await this.#loadRegistry(); return this; }

  // ============================================================ material stage (MATERIALS_CONTRACT.md): registry + GLSL in materials/, no per-material code here
  async #loadRegistry() {
    if (!this.matReg) {
      try { this.matReg = await (await fetch(new URL('materials/materials.json', this.base).href)).json(); }
      catch (e) { console.warn('materials.json', e); this.matReg = {materials: [{id: 'original', name: 'Original', status: 'ship', passes: []}]}; }
    }
    return this.matReg;
  }
  /** [{id, name, status, disabled}] — 'original' first; candidate/rejected are listed with their status so the shell can hide them. */
  listMaterials() { return (this.matReg?.materials ?? [{id: 'original', name: 'Original', status: 'ship'}]).map(m => ({id: m.id, name: m.name, status: m.status, disabled: !!this.matCache.get(m.id)?.failed})); }
  /** Unknown id -> original. A failed compile disables that material and leaves original. Re-renders the held pose without advancing motion. */
  async setMaterial(id) {
    this.matWanted = id || 'original'; const my = ++this.matSeq;
    const reg = await this.#loadRegistry();
    if (my !== this.matSeq) return this.matWanted;
    const def = reg.materials.find(m => m.id === this.matWanted);
    if (!def || !def.passes?.length) { this.matActive = null; this.matStatus = def || this.matWanted === 'original' ? '' : 'unknown material, using Original'; this.matSwitches++; this.needsRender = true; return 'original'; }
    let m = this.matCache.get(def.id);
    if (!m) { m = await this.#compileMaterial(def); this.matCache.set(def.id, m); }
    if (my !== this.matSeq) return this.matWanted;
    this.matSwitches++; this.needsRender = true;
    if (m.failed) { this.matActive = null; this.matStatus = `${def.name} disabled: ${m.failed}`; return 'original'; }
    this.matActive = m; this.matStatus = ''; return def.id;
  }
  async #compileMaterial(def) {
    const gl = this.gl, dir = new URL('materials/', this.base).href, txt = async n => { const r = await fetch(dir + n); if (!r.ok) throw new Error(n + ' ' + r.status); return r.text(); };
    const m = {id: def.id, name: def.name, passes: [], texs: [], failed: ''};
    try {
      const common = await txt('common.glsl').catch(() => '');
      const head = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
      for (const ps of def.passes) {
        const frag = head + common + '\n' + await txt(ps.frag);
        m.passes.push({scale: ps.scale ?? 1, prog: makeProgram(gl, MAT_VERT, frag, 'material.' + ps.frag), target: null});
      }
      for (const t of (def.textures ?? []).slice(0, 4)) {
        const img = new Image(); img.src = dir + (t.startsWith?.('textures/') ? t : 'textures/' + t); await img.decode();
        const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);   // POT, REPEAT + mipmaps (contract)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        m.texs.push(tex);
      }
    } catch (e) { m.failed = String(e.message || e).split('\n')[0].slice(0, 160); console.warn('material', def.id, e); }
    return m;
  }
  /** Runs the active material's passes on `src` (a w x h texture, already oriented/cropped). Returns the texture the tilt-shift should read. */
  #material(src) {
    const m = this.matActive; if (!m) return src;
    const gl = this.gl, w = this.w, h = this.h, seed = this.Look.seedOf(this.frameId);
    this.matExec++;
    m.passes.forEach((ps, i) => {
      if (!ps.target) ps.target = makeTarget(gl, Math.max(1, Math.round(w * ps.scale)), Math.max(1, Math.round(h * ps.scale)));
      const t = ps.target, P = ps.prog, last = i === m.passes.length - 1;
      if (last) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.colorMask(true, true, true, false); }   // final texture is forced opaque: an alpha feature layer must never leak into miniature/glass
      this.#pass(P, t, t.w, t.h, () => {
        this.#bind(P, 'uSrc', 0, src);
        for (let j = 0; j < 4; j++) this.#bind(P, 'uPass' + j, 1 + j, j < i ? m.passes[j].target.tex : this.dummy);
        for (let j = 0; j < 4; j++) this.#bind(P, 'uTex' + j, 5 + j, m.texs[j] ?? this.dummy);
        gl.uniform2f(P.u('uTexel'), 1 / w, 1 / h); gl.uniform2f(P.u('uSize'), t.w, t.h);
        gl.uniform1f(P.u('uRef'), Math.min(t.w, t.h) / 1080); gl.uniform1f(P.u('uSeed'), seed);
      });
      if (last) gl.colorMask(true, true, true, true);
    });
    gl.activeTexture(gl.TEXTURE0);
    return m.passes[m.passes.length - 1].target.tex;
  }

  setQuality(q) {
    if (!this.tiers.some(t => t.name === q)) throw new Error('unknown quality ' + q);
    this.ceiling = q; if (this.tier !== q) this.#setTier(q, 'user');
  }
  #setTier(q, why) {
    if (q === this.tier) return;
    this.log.states.push({t: this.lastNow, tier: q, why});
    if (why === 'misses' && this.lastWhy === 'headroom' && this.lastNow - this.lastTierChange < 20000) this.upBlockedUntil = this.lastNow + 60000;   // stepped up, fell straight back: stop flapping
    this.lastWhy = why;
    this.tier = q; this.lastTierChange = this.lastNow; this.lowSince = 0; this.headCount = 0; this.#resize();
  }

  stats() { return {fps: this.stat.fps, uniqueFps: this.stat.uniqueFps, ms: this.stat.ms, quality: this.tier, w: this.w, h: this.h, held: this.stat.held, misses: this.stat.misses, reveal: this.vstate, tempo: this.model ? this.model.state : null, material: this.matActive ? this.matActive.id : 'original', material_executions: this.matExec, material_switches: this.matSwitches, unique_poses: this.frameId, presented: this.presented, material_status: this.matStatus}; }

  async photo() {
    this.frame(this.lastNow || performance.now(), true);
    return new Promise((res, rej) => this.canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', 0.92));
  }

  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.setSource(null);
    this.canvas.removeEventListener('webglcontextlost', this.onLost); this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    const gl = this.gl;
    this.#freeTargets(); this.#freeRing(); this.#dropFrame();
    for (const p of Object.values(this.prog)) gl.deleteProgram(p.id);
    gl.deleteTexture(this.dummy); gl.deleteTexture(this.srcTex); gl.deleteBuffer(this.vbo); gl.deleteVertexArray(this.vao);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  // ============================================================ frame assets (PhotoFrameSource.kt + GlassFilter upload)
  // Plain <img> decode + texImage2D(UNPACK_PREMULTIPLY_ALPHA) instead of createImageBitmap options: Safari honours these everywhere.
  async #img(id, name) {
    const i = new Image(); i.decoding = 'async'; i.src = `${this.base}frames/${id}/${name}`;
    await i.decode();
    return i;
  }

  async #fetchSet(id) {
    if (this.fsCache.has(id)) return this.fsCache.get(id);
    const [frame, blur, mask, sdf] = await Promise.all(['frame.webp', 'blur.webp', 'mask.png', 'sdf.png'].map(n => this.#img(id, n)));
    const set = {id, frame, blur, mask, sdf, layout: this.frames[id], tinted: new Map()};
    this.fsCache.set(id, set);
    while (this.fsCache.size > 2) this.fsCache.delete(this.fsCache.keys().next().value);   // PhotoFrameSource.CACHE = 2
    return set;
  }

  /** Recoloured (frame, blur) canvases for material index idx > 0: CPU, mask R for the sharp image, mask G for the blurred one. */
  async #tinted(set, idx) {
    if (set.tinted.has(idx)) return set.tinted.get(idx);
    const target = MaterialColor.PALETTES[set.id][idx];
    const px = img => { const [c, x] = make2d(img.naturalWidth, img.naturalHeight); x.drawImage(img, 0, 0); return [c, x, x.getImageData(0, 0, img.naturalWidth, img.naturalHeight)]; };
    const [fc, fx, fd] = px(set.frame), [bc, bx, bd] = px(set.blur), md = px(set.mask)[2];
    const n = fd.width * fd.height;
    let sum = 0, cnt = 0;
    for (let i = 0; i < n; i++) if (md.data[i * 4] > 127) { sum += MaterialColor.luma(fd.data[i * 4] / 255, fd.data[i * 4 + 1] / 255, fd.data[i * 4 + 2] / 255); cnt++; }
    const ref = cnt > 0 ? sum / cnt : 0.5;   // one reference luma for both images, like PhotoFrameSource.tint
    const apply = (d, x, c, ch) => { for (let i = 0; i < n; i++) { const m = md.data[i * 4 + ch] / 255; if (m > 0) { const o = MaterialColor.recolor(d.data[i * 4], d.data[i * 4 + 1], d.data[i * 4 + 2], m, ref, target); d.data[i * 4] = o[0]; d.data[i * 4 + 1] = o[1]; d.data[i * 4 + 2] = o[2]; } } x.putImageData(d, 0, 0); return c; };
    await new Promise(r => setTimeout(r));   // let a frame paint between the decode and the CPU loop
    const out = {frame: apply(fd, fx, fc, 0), blur: apply(bd, bx, bc, 1)};
    set.tinted.set(idx, out);
    while (set.tinted.size > 2) set.tinted.delete(set.tinted.keys().next().value);
    return out;
  }

  async #loadFrame(id) {
    const my = ++this.loadSeq;
    try {
      const set = await this.#fetchSet(id);
      const idx = MaterialColor.clamp(id, this.matIdx[id] ?? 0);
      const bm = idx === 0 ? {frame: set.frame, blur: set.blur} : await this.#tinted(set, idx);
      if (this.disposed || this.lost || this.frameWanted !== id || my !== this.loadSeq) return;
      const gl = this.gl;
      // sharp + blurred upload premultiplied (Android bitmaps are premultiplied); mask + sdf are data, straight
      const up = (src, premul) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); texParams(gl); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); return t; };
      const old = this.fsGpu, keep = old && old.id === id ? old : null;   // a recolour keeps the resident mask + sdf
      this.fsGpu = {id, layout: set.layout, tex: [up(bm.frame, true), up(bm.blur, true), keep ? keep.tex[2] : up(set.mask, false), keep ? keep.tex[3] : up(set.sdf, false)]};
      if (old) { gl.deleteTexture(old.tex[0]); gl.deleteTexture(old.tex[1]); if (!keep) { gl.deleteTexture(old.tex[2]); gl.deleteTexture(old.tex[3]); } }
      this.onFrameReady?.(id);
    } catch (e) { console.error('frame load failed', id, e); this.loadError = String(e); }
  }

  #dropFrame() {
    const gl = this.gl;
    if (this.fsGpu) for (const t of this.fsGpu.tex) gl.deleteTexture(t);
    this.fsGpu = null;
  }

  // ============================================================ camera input
  /** Gets a fresh camera/test image into srcTex if there is one. Returns true when a new camera frame exists this tick. */
  #pollSource(now) {
    const gl = this.gl, s = this.source;
    const up = (src, w, h) => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      if (this.srcSize[0] === w && this.srcSize[1] === h) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
      else { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); texParams(gl); this.srcSize = [w, h]; }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      this.haveCam = true;
    };
    if (s && typeof HTMLVideoElement !== 'undefined' && s instanceof HTMLVideoElement) {
      if (s.readyState < 2 || !s.videoWidth) return false;
      let fresh = false;
      if (s.requestVideoFrameCallback) { if (this.pending > 0) { this.pending = 0; fresh = true; } }
      else if (s.currentTime !== this.lastVideoTime) { this.lastVideoTime = s.currentTime; fresh = true; }
      if (fresh) up(s, s.videoWidth, s.videoHeight);
      return fresh;
    }
    // test pattern or a still/canvas stand-in, at a virtual 30 fps
    if (now < this.nextVirtual) return false;
    this.nextVirtual = this.nextVirtual === 0 || now - this.nextVirtual > 100 ? now + 1000 / 30 : this.nextVirtual + 1000 / 30;
    if (s) {
      const isStatic = (typeof HTMLImageElement !== 'undefined' && s instanceof HTMLImageElement) || (typeof ImageBitmap !== 'undefined' && s instanceof ImageBitmap);
      if (!isStatic || !this.staticDone) { up(s, s.width ?? s.videoWidth, s.height ?? s.videoHeight); this.staticDone = true; }
      return true;
    }
    this.#drawPattern(now);
    up(this.patternCanvas, this.patternCanvas.width, this.patternCanvas.height);
    return true;
  }

  /** Moving test card for harnesses without a camera: static detail + a bouncing ball + a periodic big sweep (triggers motion onsets). */
  #drawPattern(now) {
    if (!this.patternCanvas) { const [c, x] = make2d(270, 480); this.patternCanvas = c; this.patternCtx = x; }
    const x = this.patternCtx, W = 270, H = 480, t = now / 1000;
    const cyc = this.W.testPattern.sweepPeriodS, ph = (t % cyc) / cyc, sweep = ph > this.W.testPattern.sweepStart && ph < this.W.testPattern.sweepEnd ? (ph - this.W.testPattern.sweepStart) / (this.W.testPattern.sweepEnd - this.W.testPattern.sweepStart) : -1;
    const pan = sweep >= 0 ? Math.sin(sweep * Math.PI) * 24 : 0;
    x.save(); x.translate(pan, 0);
    let g = x.createLinearGradient(0, 0, 0, H * 0.55); g.addColorStop(0, '#78b8ff'); g.addColorStop(1, '#e3f1ff'); x.fillStyle = g; x.fillRect(-30, 0, W + 60, H * 0.55);
    g = x.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, '#4a9a54'); g.addColorStop(1, '#2f6b3a'); x.fillStyle = g; x.fillRect(-30, H * 0.55, W + 60, H * 0.45);
    const cols = ['#d1495b', '#edae49', '#00798c', '#66a182', '#8d5a97', '#f4d58d'];
    for (let i = 0; i < 9; i++) { x.fillStyle = cols[i % cols.length]; const bw = 22 + (i * 7) % 18, bh = 60 + (i * 37) % 90; x.fillRect(-10 + i * 32, H * 0.55 - bh, bw, bh); x.fillStyle = 'rgba(255,255,255,.55)'; for (let j = 0; j < 3; j++) x.fillRect(-6 + i * 32, H * 0.55 - bh + 10 + j * 22, 6, 8); }
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(W / 2, H * 0.58); x.lineTo(-40 + i * 52, H); x.stroke(); }
    x.fillStyle = '#fff'; for (let i = 0; i < 6; i++) x.fillRect(20 + i * 44, H * 0.8 + (i % 2) * 18, 22, 6);
    // person-ish figure, gentle sway
    const sx = W / 2 + Math.sin(t * 1.3) * 6;
    x.fillStyle = '#2b2d42'; x.beginPath(); x.roundRect?.(sx - 22, H * 0.52, 44, 110, 14); if (!x.roundRect) x.rect(sx - 22, H * 0.52, 44, 110); x.fill();
    x.fillStyle = '#f2c9a0'; x.beginPath(); x.arc(sx, H * 0.49, 19, 0, 7); x.fill();
    x.restore();
    // bouncing ball (continuous motion for cadence checks)
    const bx = 20 + Math.abs(((t * 70) % 460) - 230) / 230 * (W - 40), by = H * 0.86 - Math.abs(Math.sin(t * 3.1)) * 60;
    x.fillStyle = '#ff3d00'; x.beginPath(); x.arc(bx, by, 11, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(bx - 4, by - 4, 3.5, 0, 7); x.fill();
    if (sweep >= 0) { x.fillStyle = 'rgba(255,255,255,.85)'; const bw = W * 0.38; x.fillRect(-bw + sweep * (W + bw), 0, bw, H); }
  }

  // ============================================================ passes
  #pass(prog, target, w, h, setup) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog.id);
    gl.bindVertexArray(this.vao);
    setup?.();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  #bind(prog, name, unit, tex) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u(name), unit); }

  #cover(prog, target, srcTex) {
    const gl = this.gl, [sw, sh] = this.srcSize, a = sw / sh, t = target.w / target.h;
    this.#pass(prog, target, target.w, target.h, () => {
      this.#bind(prog, 'uTex', 0, srcTex);
      gl.uniform2f(prog.u('uScale'), a > t ? t / a : 1, a > t ? 1 : a / t);
      gl.uniform1f(prog.u('uMirror'), this.mirror ? 1 : 0);
    });
  }

  // ============================================================ stage 1: MiniatureFilter
  #miniature(now, newFrame) {
    const gl = this.gl, P = this.prog, p = this.eff, I = this.Look.idx, tempoMode = this.tempoMode;
    const tempoOn = tempoMode === TC.cadence.LIVE;
    const live = tempoOn && this.anticipate;
    this.cadence.uniqueFps = tempoMode != null ? (tempoOn ? 8 : MOTION_PRESETS[tempoMode]) : p[I('cadence')];
    if (!this.haveCam || (!newFrame && !this.needsRender)) return;
    if (live) { if (newFrame) this.#ingest(now); else if (!this.model) return; } else this.#freeRingIfAny();   // no ring yet (just resized / mode just switched): wait for a camera frame
    let fresh = (newFrame && this.cadence.tick(now)) || this.needsRender;
    let src = this.cam.tex, coverDone = false;
    if (live && fresh) {
      const m = this.model, id = m.select();
      fresh = id !== this.shownId || this.needsRender;
      if (fresh) { src = this.ring[id % m.capacity].tex; coverDone = true; this.shownId = id; this.tempoUnique++; this.#logUnique({t: now / 1000, src: m.tsOf(id), state: m.state, id}); }
    } else if (fresh) this.#logUnique({t: now / 1000, src: now / 1000, state: null, id: this.frameId + 1});
    if (!fresh) return;
    this.needsRender = false;
    this.frameId++;
    if (!coverDone) this.#cover(P.cover, this.cam, this.srcTex);
    src = this.#material(src);   // held camera pose -> material (only when a new pose is accepted) -> tilt-shift
    const out = this.held, w = this.w, h = this.h;
    if (this.bypass || this.Look.isBlurNeutral(p)) {
      this.#pass(P.copy, out, w, h, () => this.#bind(P.copy, 'uTex', 0, src));
    } else {
      let s = src;
      for (let i = 0; i < 4; i++) {
        const lw = this.mT[i].w, lh = this.mT[i].h, STEP = this.K.miniature.STEP;
        this.#pass(P.blur, this.mT[i], lw, lh, () => { this.#bind(P.blur, 'uTex', 0, s); gl.uniform2f(P.blur.u('uDir'), STEP / lw, 0); });
        this.#pass(P.blur, this.mO[i], lw, lh, () => { this.#bind(P.blur, 'uTex', 0, this.mT[i].tex); gl.uniform2f(P.blur.u('uDir'), 0, STEP / lh); });
        s = this.mO[i].tex;
      }
      this.#pass(P.composite, out, w, h, () => {
        const c = P.composite;
        this.#bind(c, 's0', 0, src);
        for (let i = 0; i < 4; i++) this.#bind(c, 's' + (i + 1), i + 1, this.mO[i].tex);
        gl.uniform1f(c.u('uFocusY'), p[I('focusY')]); gl.uniform1f(c.u('uWidth'), p[I('focusWidth')]); gl.uniform1f(c.u('uFeather'), p[I('feather')]);
        gl.uniform1f(c.u('uTop'), p[I('top')]); gl.uniform1f(c.u('uBottom'), p[I('bottom')]);
        gl.uniform1f(c.u('uRadiusPx'), p[I('radius')] * w / 1080);   // radius is in 1080-wide reference px
        gl.uniform1f(c.u('uAngle'), p[I('angle')] * RAD);
        gl.uniform1f(c.u('uAspect'), w / h);
        gl.uniform1f(c.u('uSharp'), p[I('sharpness')]);
      });
    }
    gl.activeTexture(gl.TEXTURE0);
  }

  #logUnique(e) { const l = this.log.unique; l.push(e); if (l.length > 4000) l.splice(0, 1000); }
  #freeRingIfAny() { if (this.ring) this.#freeRing(); }

  /** Copy this camera frame into its ring slot, then feed the motion detector from a tiny luma readback. */
  #ingest(nowMs) {
    const gl = this.gl, t = nowMs / 1000, P = this.prog;
    let m = this.model;
    if (!m) {
      const slots = clamp(Math.trunc(this.W.tempo.ringBudgetBytes / (this.w * this.h * 4)), 8, 22);
      m = this.model = new TempoModel(slots); m.anticipate = this.anticipate;
      this.ring = Array.from({length: slots}, () => makeTarget(gl, this.w, this.h));
      this.shownId = -1; this.lumaPrev = null; this.onsetDet.reset();
    }
    m.anticipate = this.anticipate;
    const before = m.head, id = m.onFrame(t);
    if (id <= before) { this.shownId = -1; this.lumaPrev = null; this.onsetDet.reset(); }
    m.advance(t);
    const slot = this.ring[id % m.capacity];
    this.#cover(P.cover, slot, this.srcTex);
    this.#pass(P.down, this.lumaT, this.lumaW, this.lumaH, () => { this.#bind(P.down, 'uTex', 0, slot.tex); gl.uniform2f(P.down.u('uCell'), 1 / this.lumaW, 1 / this.lumaH); });
    gl.readPixels(0, 0, this.lumaW, this.lumaH, gl.RGBA, gl.UNSIGNED_BYTE, this.lumaBuf);
    const b = this.lumaBuf, luma = new Uint8Array(this.lumaW * this.lumaH);
    for (let i = 0; i < luma.length; i++) luma[i] = (b[i * 4] * 77 + b[i * 4 + 1] * 150 + b[i * 4 + 2] * 29) >> 8;
    const prev = this.lumaPrev; this.lumaPrev = luma;
    const phone = this.phone;
    if (phone >= 1) m.abortHold();
    if (prev) {
      const onset = this.onsetDet.feed(t, FrameDiff.score(prev, luma, this.lumaW, this.lumaH, 1), phone >= 0.6 || m.state !== State.NORMAL);
      if (!Number.isNaN(onset)) m.onset(t, onset);
    }
  }

  // ============================================================ stage 1.5: GlassFilter
  depthMode() { return !!this.fsGpu && !!this.fsGpu.tex[3] && this.dpOn !== false; }

  #glass(now) {
    const gl = this.gl, P = this.prog, K = this.K.glass, W = this.w, H = this.h;
    const fsg = this.fsGpu, frameMode = this.frameWanted != null && !!fsg && fsg.id === this.frameWanted;
    if (!frameMode) {   // normal-camera bypass: pass-through, no zoom/glass/blur
      this.#pass(P.copy, this.glassOut, W, H, () => this.#bind(P.copy, 'uTex', 0, this.held.tex));
      return;
    }
    // --- reveal bookkeeping (the Kotlin coordinator's SCANNING -> REVEALING -> FOCUSED, minus the readiness checks the shell owns)
    const dp = this.dp, depth = this.depthMode(), totalMs = depth ? DepthMath.totalMs(dp) : this.K.reveal.revealMs;
    if (this.revealPending && this.haveCam) { this.revealPending = false; this.vstate = 'revealing'; this.revealStart = now; this.log.states.push({t: now / 1000, reveal: 'revealing'}); }
    if (this.vstate === 'revealing' && now - this.revealStart >= totalMs) { this.vstate = 'focused'; this.log.states.push({t: now / 1000, reveal: 'focused'}); }
    const sceneOk = this.vstate !== 'scanning';
    const fl = fsg.layout, fScale = this.K.reveal.finalScale;
    // optics: RevealMath.sample (scale, defocus)
    let oScale = 1, oDef = 1;
    if (sceneOk) {
      if (this.vstate === 'revealing') {
        const u = clamp((now - this.revealStart) / this.K.reveal.revealMs, 0, 1), e = smoothstep(0, 1, u);
        oScale = Math.exp(Math.log(1) + (Math.log(fScale) - Math.log(1)) * e); oDef = 1 - smoothstep(0.10, 0.85, u);
      } else { oScale = fScale; oDef = 0; }
    }
    const depthMs = !sceneOk ? 0 : this.vstate === 'revealing' ? now - this.revealStart : 1e6;
    if (depth && sceneOk && this.vstate === 'revealing') oDef = DepthMath.value(dp.blur, depthMs) / DepthMath.BLUR_START_PX;
    // AR hold zone: sharp inside safeDeg of the locked pose, blurs out completely by limitDeg
    const pz = sceneOk && this.pose && this.poseRef ? this.rel : null;
    const safe = this.K.pose.safeDeg, limit = this.K.pose.limitDeg;
    if (pz) oDef = Math.max(oDef, smoothstep(safe, limit, pz.tilt));
    // frame parallax: pose offset as a fraction of the safe zone -> soft-clamped shift inside the frame's reserve, smoothed
    const dt = this.lastGlassAt === 0 ? 0 : Math.min((now - this.lastGlassAt) / 1000, 0.1);
    this.lastGlassAt = now;
    const vw = fl.neutral.u1 - fl.neutral.u0, vh = 1 / FrameMath.OVERSCAN;
    const tx = pz ? FrameMath.shift(clamp(pz.yaw / safe, -1.5, 1.5), FrameMath.reserve((fl.neutral.u0 + fl.neutral.u1) / 2, vw), this.tune.move, FrameMath.SIGN_X) : 0;
    const ty = pz ? FrameMath.shift(clamp(pz.pitch / safe, -1.5, 1.5), FrameMath.reserve(0.5, vh), this.tune.move, FrameMath.SIGN_Y) : 0;
    const tau = depth ? DepthMath.PARALLAX_TAU : K.PARALLAX_TAU;
    this.shiftX = FrameMath.smooth(this.shiftX, tx, dt, tau); this.shiftY = FrameMath.smooth(this.shiftY, ty, dt, tau);
    // frame zoom-out: photo + frame pull back together from the aperture centre
    const a = fl.aperture, fvx = vw, fvy = vh;
    const ms = FrameMath.revealZoomStart(a.rx, a.ry, fvx, fvy);
    let zM = FrameMath.revealZoom(oScale, fScale, ms);
    let zCx = FrameMath.zoomCentre(zM, ms, 0.5 + (a.cx - (fl.neutral.u0 + fl.neutral.u1) / 2) / fvx);
    let zCy = FrameMath.zoomCentre(zM, ms, 0.5 + (a.cy - 0.5) / fvy);
    let camZ = zM, camCx = zCx, camCy = zCy;
    const camSh = this.camSh; camSh[0] = 0; camSh[1] = 0;
    if (depth) {   // layers zoom independently about the aperture centre; at the end every layer is its neutral crop
      const ax = 0.5 + (a.cx - (fl.neutral.u0 + fl.neutral.u1) / 2) / fvx, ay = 0.5 + (a.cy - 0.5) / fvy;
      const apW = 2 * a.rx / fvx, capW = DepthMath.PARALLAX_CAP * Math.min(2 * a.rx, 2 * a.ry * fl.h / fl.w);
      zM = DepthMath.value(dp.rim, depthMs); zCx = DepthMath.anchorCentre(zM, ax); zCy = DepthMath.anchorCentre(zM, ay);
      this.wZ = DepthMath.value(dp.wall, depthMs); this.wCx = DepthMath.anchorCentre(this.wZ, ax); this.wCy = DepthMath.anchorCentre(this.wZ, ay);
      this.wReveal = DepthMath.revealMul(DepthMath.progress(dp.wall, depthMs));
      this.wShX = DepthMath.wallShift(this.shiftX, capW); this.wShY = DepthMath.wallShift(this.shiftY, capW * fl.w / fl.h);
      const trv = DepthMath.camTravel(apW);
      camZ = DepthMath.cameraCover(trv) * DepthMath.value(dp.cam, depthMs);
      camCx = DepthMath.anchorCentre(camZ, ax); camCy = DepthMath.anchorCentre(camZ, ay);
      camSh[0] = DepthMath.camShift(-this.shiftX / fvx, trv); camSh[1] = DepthMath.camShift(-this.shiftY / fvy, trv);
    }
    // --- compose pass (composePass, frame mode): live fills the window, rigid zoom about (camCx, camCy), curved glass
    const aspect = W / H, s = 0.60;
    this.#pass(P.compose, this.cf, W, H, () => {
      const p = P.compose;
      this.#bind(p, 'uLive', 0, this.held.tex); this.#bind(p, 'uScene', 1, this.dummy);
      gl.uniform1f(p.u('uFrame'), 1);
      gl.uniform2f(p.u('uC'), 0.5, 0.5 - 0.10 * (1 - s));
      gl.uniform2f(p.u('uCz'), camCx, camCy);
      gl.uniform1f(p.u('uS'), s); gl.uniform1f(p.u('uZ'), camZ); gl.uniform1f(p.u('uAspect'), aspect);
      gl.uniform1f(p.u('uK'), K.GLASS_K); gl.uniform1f(p.u('uR2Max'), 0.25 * aspect * aspect + 0.25);
      gl.uniform1f(p.u('uHas'), 0);
      gl.uniform2f(p.u('uCamSh'), camSh[0], camSh[1]); gl.uniform2f(p.u('uPar'), 0, 0);
    });
    // --- frosted blur levels from the composed scene
    const levels = 4, f = oDef < 0.003 ? 0 : oDef * levels;
    if (f > 0 || depth) {
      let src = this.cf.tex;
      for (let i = 0; i < levels; i++) {
        const lw = this.gT[i].w, lh = this.gT[i].h;
        this.#pass(P.blur, this.gT[i], lw, lh, () => { this.#bind(P.blur, 'uTex', 0, src); gl.uniform2f(P.blur.u('uDir'), K.STEP / lw, 0); });
        this.#pass(P.blur, this.gO[i], lw, lh, () => { this.#bind(P.blur, 'uTex', 0, this.gT[i].tex); gl.uniform2f(P.blur.u('uDir'), 0, K.STEP / lh); });
        src = this.gO[i].tex;
      }
    }
    // --- final pass: defocus levels, frame, depth wall/shadow, glass edge, vignette, rounded aperture
    const T = this.tune;
    this.#pass(P.fin, this.glassOut, W, H, () => {
      const p = P.fin;
      this.#bind(p, 's0', 0, this.cf.tex);
      for (let i = 0; i < levels; i++) this.#bind(p, 's' + (i + 1), i + 1, this.gO[i].tex);
      this.#bind(p, 'fS', 5, fsg.tex[0]); this.#bind(p, 'fB', 6, fsg.tex[1]); this.#bind(p, 'fM', 7, fsg.tex[2]); this.#bind(p, 'fD', 8, fsg.tex[3] || this.dummy);
      gl.uniform1f(p.u('uF'), f); gl.uniform1f(p.u('uD'), oDef); gl.uniform1f(p.u('uAspect'), aspect); gl.uniform1f(p.u('uFr'), 1);
      gl.uniform2f(p.u('uFc'), (fl.neutral.u0 + fl.neutral.u1) / 2, 0.5);
      gl.uniform2f(p.u('uFv'), fl.neutral.u1 - fl.neutral.u0, 1 / FrameMath.OVERSCAN);
      gl.uniform2f(p.u('uFsh'), this.shiftX, this.shiftY);
      gl.uniform2f(p.u('uZc'), zCx, zCy); gl.uniform1f(p.u('uZ'), zM);
      gl.uniform4f(p.u('uAp'), a.cx, a.cy, a.rx, a.ry);
      const on = this.frameBlurOn === false ? 0 : 1;
      gl.uniform2f(p.u('uBl'), clamp(T.outerBlur, 0, 1) * on, clamp(T.edgeBlur, 0, 1) * on);
      const st = clamp(T.tint, 0, 1), tintOn = st > 0 && (T.hue !== 0 || T.sat !== 1 || T.light !== 0);
      gl.uniform4f(p.u('uTint'), T.hue * RAD, clamp(T.sat, 0, 2), clamp(T.light, -0.5, 0.5), tintOn ? st : 0);
      gl.uniform1f(p.u('uDp'), depth ? 1 : 0);
      if (depth) {
        const d = dp, ps = Math.min(W, H) / 720, apShort = Math.min(2 * a.rx, 2 * a.ry * fl.h / fl.w), capW = DepthMath.PARALLAX_CAP * apShort;
        gl.uniform1f(p.u('uWz'), this.wZ); gl.uniform2f(p.u('uWc'), this.wCx, this.wCy); gl.uniform2f(p.u('uWsh'), this.wShX, this.wShY);
        gl.uniform4f(p.u('uDa'), d.wallDepth, 0.5 * d.edgeBlurPx * ps, d.edgeFall, capW / apShort + 0.02);
        gl.uniform4f(p.u('uDb'), d.contact, d.contactFall, d.vignette, d.vignetteFall);
        gl.uniform4f(p.u('uDc'), apShort, fl.w / fl.h, this.wReveal, DepthMath.rimBlend(d.rimDefocusPx, fl.neutral.u1 - fl.neutral.u0) * on);
      }
    });
    gl.activeTexture(gl.TEXTURE0);
  }

  // ============================================================ stage 2: FinishFilter
  #finish(now) {
    const gl = this.gl, P = this.prog.finish, I = this.Look.idx;
    const neutral = this.bypass || this.Look.isColorNeutral(this.eff);
    const n = neutral ? this.Look.neutralValues() : this.eff;
    const seed = this.Look.seedOf(this.frameId);
    this.#pass(P, null, this.w, this.h, () => {
      this.#bind(P, 'uTex', 0, this.glassOut.tex);
      gl.uniform1f(P.u('uExpo'), n[I('exposure')]); gl.uniform1f(P.u('uTemp'), n[I('temperature')]); gl.uniform1f(P.u('uTint'), n[I('tint')]);
      gl.uniform1f(P.u('uCon'), n[I('contrast')]); gl.uniform1f(P.u('uRoll'), n[I('rolloff')]); gl.uniform1f(P.u('uSat'), n[I('saturation')]);
      gl.uniform1f(P.u('uVib'), n[I('vibrance')]); gl.uniform1f(P.u('uGamma'), n[I('gamma')]);
      gl.uniform1f(P.u('uGrain'), this.Look.grainAmp(n[I('grain')]) * this.Look.GRAIN_AMP);
      gl.uniform1f(P.u('uGrainPx'), Math.max(1, n[I('grainSize')] * this.w / 720));   // size is in 720-wide reference px
      gl.uniform1f(P.u('uSeed'), seed);
      gl.uniform1f(P.u('uMono'), this.mono && !this.bypass ? 1 : 0);
    });
  }

  // ============================================================ tick
  /** Draw one tick. Returns true if a frame was drawn (false = skipped by the 30 fps cap or a lost context). */
  frame(nowMs, force = false) {
    if (this.disposed || this.lost || !this.cam) return false;
    const tier = this.tierInfo(), minDt = 1000 / tier.fpsCap;
    const dt = nowMs - this.lastNow;
    if (!force && this.lastDraw && nowMs - this.lastDraw < minDt - 2) { this.#trackDt(nowMs, dt); this.lastNow = nowMs; return false; }
    const timed = !force && (++this.sampleN % this.W.quality.sampleEvery === 0);
    const gl = this.gl;
    if (timed) gl.finish();
    const t0 = performance.now();
    this.lastNow = nowMs; this.lastDraw = nowMs;
    const fresh = this.#pollSource(nowMs);
    this.#miniature(nowMs, fresh);
    this.#glass(nowMs);
    this.#finish(nowMs);
    this.win.frames++; this.presented++;
    if (timed) { gl.finish(); this.gpuMs = this.gpuMs ? this.gpuMs * 0.7 + (performance.now() - t0) * 0.3 : performance.now() - t0; this.stat.ms = this.gpuMs; }
    this.#publish(nowMs, isLive(this));
    if (!force) { this.#trackDt(nowMs, dt); this.#adapt(nowMs, timed); }
    return true;
  }

  #publish(now, isLive) {
    const w = this.win;
    if (!w.t0) w.t0 = now;
    const span = now - w.t0;
    if (span < 1000) return;
    const k = 1000 / span, uq = isLive ? this.tempoUnique : this.cadence.refreshes;
    this.stat.fps = w.frames * k; this.stat.uniqueFps = uq * k; this.stat.held = (this.cadence.ticks - uq) * k; this.stat.misses = this.cadence.misses;
    this.tempoUnique = 0; this.cadence.resetWindow(); w.frames = 0; w.t0 = now;
  }

  #trackDt(now, dt) { if (dt > 0 && dt < 500) this.dtEma += 0.1 * (Math.min(dt, 66) - this.dtEma); }

  /** Adaptive quality: step down on sustained misses (<~45 fps while uncapped, or slow GPU samples), step up on measured headroom. */
  #adapt(now, timed) {
    const Q = this.W.quality;
    if (!this.adaptive || now - this.lastTierChange < Q.settleMs) return;
    const i = this.tiers.findIndex(t => t.name === this.tier), tier = this.tiers[i];
    const capped = tier.fpsCap < 60;
    const slow = capped ? false : this.dtEma > Q.slowDtMs;
    const gpuSlow = timed && this.gpuMs > Q.slowGpuMs;
    if ((slow || gpuSlow) && i < this.tiers.length - 1) {
      if (!this.lowSince) this.lowSince = now;
      if (now - this.lowSince > Q.downAfterMs) this.#setTier(this.tiers[i + 1].name, 'misses');
      return;
    }
    this.lowSince = 0;
    // step up only when rAF itself runs near 60 Hz (a 30 Hz rAF, e.g. iOS Low Power Mode, is not headroom) and the GPU samples are cheap
    if (timed && i > 0 && this.dtEma <= Q.slowDtMs && now >= (this.upBlockedUntil || 0) && this.tiers.findIndex(t => t.name === this.ceiling) < i) {
      const up = this.tiers[i - 1], ratio = (up.w * up.h) / (tier.w * tier.h);
      if (this.gpuMs * ratio < Q.upGpuMs) { if (++this.headCount >= Q.upSamples && now - this.lastTierChange > Q.upAfterMs) this.#setTier(up.name, 'headroom'); } else this.headCount = 0;
    }
  }
}

function isLive(r) { return r.tempoMode === TC.cadence.LIVE && r.anticipate; }

/** PoseMath.relative for yaw/pitch aim vectors: where the camera now points seen from the locked reference pose, degrees. */
function relativePose(ref, cur) {
  const aim = (y, p) => [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
  const ra = aim(ref.yaw, ref.pitch), w = aim(cur.yaw, cur.pitch);
  const right = [Math.cos(ref.yaw), 0, Math.sin(ref.yaw)];
  const up = [-Math.sin(ref.yaw) * Math.sin(ref.pitch), Math.cos(ref.pitch), Math.cos(ref.yaw) * Math.sin(ref.pitch)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const fz = dot(w, ra), D = 180 / Math.PI;
  return {yaw: Math.atan2(dot(w, right), fz) * D, pitch: Math.atan2(dot(w, up), fz) * D, tilt: Math.acos(clamp(fz, -1, 1)) * D};
}
export const _test = {relativePose};
