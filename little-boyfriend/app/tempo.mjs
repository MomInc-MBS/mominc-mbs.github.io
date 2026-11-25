// 1:1 port of Cadence.kt, TempoModel.kt (+MotionOnset) and Stability.kt's FrameDiff. Pure logic, no GL, no DOM.
// Kotlin times: Cadence = nanoseconds, TempoModel/MotionOnset = seconds on one monotonic clock. Here Cadence takes ms.
// check_parity.mjs compares CONSTANTS with the Kotlin source and effects.v1.json.
export const CONSTANTS = {
  cadence: {HALF_TICK_MS: 1000 / 60, LIVE: 'Extreme 8 Live'},
  tempoModel: {targetDelay: 0.15, maxDelay: 0.45, holdSec: 0.25, speed: 1.5, safety: 0.05, minSpacing: 1.0, maxAge: 0.575, MIN_HOLD: 0.125},
  motionOnset: {need: 3, quiet: 0.2, floorHi: 0.012},
  frameDiff: {CENTRE_WEIGHT: 0.08},
};
export const PRESETS = {'Natural': 0, 'Light 20': 20, 'LB 15': 15, 'Clay 12': 12, 'Extreme 10': 10, 'Exp 8': 8, [CONSTANTS.cadence.LIVE]: 8};

const f32 = Math.fround;

/** Live stop-motion scheduler: slot = floor((now - origin) * uniqueFps); a new image only when the slot changes. */
export class Cadence {
  #fps = 15; origin = -1; lastSlot = -1;
  ticks = 0; refreshes = 0; misses = 0;
  get uniqueFps() { return this.#fps; }
  set uniqueFps(v) { if (v !== this.#fps) { this.#fps = v; this.origin = -1; } }
  get natural() { return this.#fps <= 0 || this.#fps >= 30; }
  /** True = process and retain a fresh camera image. [nowMs] must be monotonic. */
  tick(nowMs) {
    this.ticks++;
    if (this.natural) { this.refreshes++; return true; }
    if (this.origin < 0) { this.origin = nowMs; this.lastSlot = 0; this.refreshes++; return true; }
    const slot = Math.trunc((nowMs - this.origin + CONSTANTS.cadence.HALF_TICK_MS) * this.#fps / 1000);
    if (slot === this.lastSlot) return false;
    if (slot > this.lastSlot + 1) this.misses += slot - this.lastSlot - 1;
    this.lastSlot = slot; this.refreshes++;
    return true;
  }
  resetWindow() { this.ticks = 0; this.refreshes = 0; }
}

export const State = Object.freeze({WARMUP: 'WARMUP', NORMAL: 'NORMAL', HOLD: 'HOLD', CATCH_UP: 'CATCH_UP', RECOVERY: 'RECOVERY'});

/** Extreme 8 Live time model. WARMUP -> NORMAL -> HOLD -> CATCH_UP -> NORMAL; NORMAL/CATCH_UP -> RECOVERY -> NORMAL. */
export class TempoModel {
  constructor(capacity = 22) {
    this.capacity = capacity;
    Object.assign(this, CONSTANTS.tempoModel);
    this.anticipate = true;
    this.state = State.WARMUP; this.playhead = NaN; this.events = 0; this.head = -1; this.lastSel = -1;
    this.ts = new Float64Array(capacity);
    this.dt = 1 / 30; this.lastNow = NaN; this.holdUntil = 0; this.lastEventAt = -1e9; this.recoverUntil = 0; this.pinned = -1;
  }
  get #target() { return this.anticipate ? this.targetDelay : 0; }
  get count() { return this.head < 0 ? 0 : Math.min(this.head + 1, this.capacity); }
  tsOf(id) { return this.ts[id % this.capacity]; }
  #oldest() { return Math.max(0, this.head - this.capacity + 1); }
  lag(now) { return Number.isNaN(this.playhead) ? 0 : now - this.playhead; }
  #ageMax() { return Math.min(this.maxAge, (this.capacity - 3) * this.dt); }
  reset() { this.head = -1; this.lastSel = -1; this.pinned = -1; this.playhead = NaN; this.lastNow = NaN; this.state = State.WARMUP; }

  /** Ingest a camera frame at time [t] (s); returns its id (the GL side copies it into slot id % capacity). Non-monotonic t clears everything. */
  onFrame(t) {
    if (this.head >= 0) {
      const prev = this.tsOf(this.head);
      if (t <= prev) this.reset();
      else {
        this.dt += 0.1 * (Math.min(t - prev, 0.2) - this.dt);
        if (t - prev > 0.3 && this.state !== State.WARMUP) { this.state = State.RECOVERY; this.recoverUntil = t + 0.2; }
      }
    }
    this.head++; this.ts[this.head % this.capacity] = t;
    return this.head;
  }

  /** Move the playhead to wall time [now] (s); call after onFrame, every tick. */
  advance(now) {
    if (this.head < 0) return;
    const target = this.#target;
    if (this.state === State.WARMUP) {
      if (now - this.tsOf(this.#oldest()) < target) return;
      this.playhead = now - target; this.state = State.NORMAL; this.lastNow = now; return;
    }
    let t = Number.isNaN(this.lastNow) ? now : this.lastNow;
    this.lastNow = now;
    let guard = 0;
    while (t < now - 1e-9 && guard++ < 8) {
      const rem = now - t;
      switch (this.state) {
        case State.HOLD: {
          const seg = Math.min(rem, this.holdUntil - t); t += Math.max(seg, 0);
          if (t >= this.holdUntil - 1e-9) this.state = State.CATCH_UP;
          break;
        }
        case State.CATCH_UP: {
          const need = (t - this.playhead - target) / (this.speed - 1);
          if (need <= 1e-9) { this.playhead = Math.max(this.playhead, t - target); this.state = State.NORMAL; break; }
          const seg = Math.min(rem, need); this.playhead += seg * this.speed; t += seg;
          if (seg >= need - 1e-9) { this.playhead = t - target; this.state = State.NORMAL; }
          break;
        }
        case State.NORMAL: {
          const lag = t - this.playhead;
          if (lag > target + 0.003) { this.state = State.CATCH_UP; break; }
          const slow = lag < target - 0.003;
          const seg = slow ? Math.min(rem, (target - lag) / 0.25) : rem;
          this.playhead += seg * (slow ? 0.75 : 1.0); t += seg;
          break;
        }
        case State.RECOVERY:
          this.playhead = Math.max(this.playhead, now - target); t = now; if (now >= this.recoverUntil) this.state = State.NORMAL;
          break;
        default: return;
      }
    }
    if ((this.state === State.NORMAL || this.state === State.CATCH_UP) &&
        (now - this.playhead > this.maxDelay + 0.02 || now - this.tsOf(Math.max(this.lastSel, this.#oldest())) > this.#ageMax() + this.dt)) {
      this.state = State.RECOVERY; this.recoverUntil = now + 0.2; this.playhead = Math.max(this.playhead, now - target);
    }
  }

  /** Motion onset whose first moving frame is [onsetTs]. Starts an anticipation hold if allowed; false = skipped. */
  onset(now, onsetTs) {
    if (!this.anticipate || this.state !== State.NORMAL || this.lastSel < this.#oldest() || now - this.lastEventAt < this.minSpacing) return false;
    if (Math.abs(now - this.playhead - this.#target) > 0.02 || this.tsOf(this.lastSel) >= onsetTs) return false;
    const hold = Math.min(this.holdSec, this.#ageMax() - this.safety - (now - this.tsOf(this.lastSel)), this.maxDelay - (now - this.playhead) - this.safety);
    if (hold < this.MIN_HOLD) return false;
    this.state = State.HOLD; this.holdUntil = now + hold; this.lastEventAt = now; this.pinned = this.lastSel; this.events++;
    return true;
  }

  abortHold() { if (this.state === State.HOLD) this.state = State.CATCH_UP; }

  /** Frame id to show on a selection tick: latest retained frame at or before the playhead (the pinned one while holding). */
  select() {
    if (this.head < 0) return -1;
    let cand;
    if (this.state === State.HOLD && this.pinned >= this.#oldest()) cand = this.pinned;
    else if (this.state === State.WARMUP) cand = this.#oldest();
    else { let i = this.head; while (i > this.#oldest() && this.tsOf(i) > this.playhead) i--; cand = i; }
    this.lastSel = Math.max(cand, this.lastSel, this.#oldest());
    return this.lastSel;
  }
}

/** Per-pixel luma-diff motion score on same-size grids (centre ellipse downweighted). */
export const FrameDiff = {
  CENTRE_WEIGHT: CONSTANTS.frameDiff.CENTRE_WEIGHT,
  weight(x, y, w, h, centre = CONSTANTS.frameDiff.CENTRE_WEIGHT) {
    const nx = (x + 0.5) / w - 0.5, ny = (y + 0.5) / h - 0.5;
    const e = (nx / 0.30) * (nx / 0.30) + (ny / 0.33) * (ny / 0.33);
    return e < 1 ? centre : 1;
  },
  score(a, b, w, h, centre = CONSTANTS.frameDiff.CENTRE_WEIGHT) {
    if (a.length !== w * h || b.length !== w * h) return 0;
    let sw = 0, ma = 0, mb = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = FrameDiff.weight(x, y, w, h, centre), i = y * w + x; sw += k; ma += k * a[i]; mb += k * b[i]; }
    ma /= sw; mb /= sw;
    let s = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; s += FrameDiff.weight(x, y, w, h, centre) * Math.abs((a[i] - ma) - (b[i] - mb)); }
    return s / sw / 255;
  },
};

/** Motion-onset trigger: rolling stationary median + 4 MAD for [need] consecutive frames, re-arm below median + 2 MAD for [quiet] s. */
export class MotionOnset {
  constructor({need, quiet, floorHi} = CONSTANTS.motionOnset) {
    this.need = need; this.quiet = quiet; this.floorHi = f32(floorHi);
    this.hist = new Float32Array(45); this.n = 0; this.armed = true; this.run = 0; this.runStart = 0; this.quietSince = -1;
  }
  reset() { this.n = 0; this.armed = true; this.run = 0; this.quietSince = -1; }
  /** Returns the ts of the first moving frame when an onset fires, else NaN. [suppress] = phone moving / not ready. */
  feed(t, score, suppress) {
    if (suppress) { this.run = 0; return NaN; }
    const k = Math.min(this.n, this.hist.length);
    const s = this.hist.slice(0, k).sort();
    const med = k === 0 ? score : s[k >> 1];
    const dev = Float32Array.from(s, v => Math.abs(v - med)).sort();
    const mad = Math.max(k === 0 ? 0 : dev[k >> 1], 0.0015);
    const hi = Math.max(this.floorHi, med + 4 * mad), lo = Math.max(this.floorHi / 2, med + 2 * mad);
    if (!this.armed) {
      if (score < lo) { if (this.quietSince < 0) this.quietSince = t; if (t - this.quietSince >= this.quiet) this.armed = true; } else this.quietSince = -1;
      return NaN;
    }
    if (score > hi && k >= 8) {
      if (this.run++ === 0) this.runStart = t;
      if (this.run >= this.need) { this.armed = false; this.run = 0; this.quietSince = -1; return this.runStart; }
    } else { this.run = 0; this.hist[this.n++ % this.hist.length] = score; }
    return NaN;
  }
}
