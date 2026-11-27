// Endless Corgi: corner scares with the original school-drawing pages, plus a quiet ambience bed.
// No dependencies. The pure parts (scheduler, thresholds, detector) run in node; overlay/audio need a DOM / AudioContext.
//
// HOST CONTRACT (corgi.js wires this; nothing here reads game state):
//   const scare = createCorgiScare({ seed, state, audio: {ctx, dest}, reducedMotion, onStart, onEnd, document });
//   - scare.ready            Promise: the 3 derivative images are fetched + decoded. The clock does not run before then.
//   - scare.setLayout(L)     call for every new section (genEndlessSection output). Does NOT reset the timer.
//   - scare.tick(dtSec)      call ONLY while the game is really playing (not paused, backgrounded, loading, on paper/perk
//                            screens, in capture, or while a scare is showing). dt is ACTIVE seconds; the host clamps it.
//   - scare.step(x, z, teleported)  every sim step with the player position. teleported=true for spawn / respawn /
//                            section entry / recovery placement: re-primes the line sides, can never fire.
//   - onStart({page})        a scare begins NOW (650 ms). Host must: freeze the simulation (chaser, health, timers),
//                            clear held/stale movement input, and remember performance.now().
//   - onEnd({pausedMs, recoveryMs})  the overlay is gone. Host must: add pausedMs to every absolute-time deadline
//                            (sniff, visibility grace, protection, hit cooldown...), resume the sim, and give the player a
//                            short recovery window of recoveryMs in which the chaser cannot catch them.
//   - scare.serialize() / createCorgiScare({state}) persist remaining delay, armed flag and RNG. A restored armed scare
//                            fires only after a NEW threshold crossing once the host is stepping again.
//   - scare.suspend() / resume()  audio + ambience only (tab hidden, game inactive). dispose() frees everything.
//   Audio is routed to `dest` through its own bus. Big Ears never touches it. Honor the master mute by passing a dest
//   that is already muted/gain-controlled, or call suspend().

export const MIN_DELAY_S = 20, MAX_DELAY_S = 90, SHOW_MS = 650, RECOVERY_MS = 1200, HYST = 0.25;
export const PAGES = [
  { src: '/tv/assets/school-drawing-1-scare.webp', caption: 'HE IS IN THE HALL' },
  { src: '/tv/assets/school-drawing-2-scare.webp', caption: 'DONT LET HIM SEE YOU' },
  { src: '/tv/assets/school-drawing-3-scare.webp', caption: 'HE KNOWS MY NAME' }
];

// ---------- scheduler: COOLDOWN -> ARMED -> SHOWING -> COOLDOWN (pure; state is plain JSON)
export function createScheduler({ seed = 1, state } = {}) {
  let a = seed >>> 0, phase = 'cooldown', remaining = 0, last = -1;
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const draw = () => MIN_DELAY_S + rnd() * (MAX_DELAY_S - MIN_DELAY_S);
  const ok = s => s && s.v === 1 && ['cooldown', 'armed', 'showing'].includes(s.phase) && Number.isFinite(s.remaining) && Number.isInteger(s.rng) && s.last >= -1 && s.last < PAGES.length;
  if (ok(state)) { a = state.rng >>> 0; remaining = Math.max(0, Math.min(MAX_DELAY_S, state.remaining)); last = state.last; phase = state.phase; if (phase === 'showing') { phase = 'cooldown'; remaining = draw(); } }
  else remaining = draw();
  return {
    get phase() { return phase; }, get remaining() { return remaining; },
    tick(dt) { if (phase === 'cooldown' && dt > 0 && Number.isFinite(dt) && (remaining -= dt) <= 0) { remaining = 0; phase = 'armed'; } return phase; },
    // a real threshold crossing: fires only when armed. Returns the page index, or -1.
    crossing() {
      if (phase !== 'armed') return -1;
      let p = Math.floor(rnd() * (PAGES.length - 1)); if (p >= last && last >= 0) p++;   // never the same page twice in a row
      last = p; phase = 'showing'; return p;
    },
    finish() { if (phase === 'showing') { phase = 'cooldown'; remaining = draw(); } },     // next delay drawn only now
    serialize() { return { v: 1, phase, remaining, rng: a, last }; }
  };
}

// ---------- thresholds: one segment per area mouth on the corridor wall line, derived from the layout object
// {id, ax,az,bx,bz, nx,nz (unit normal pointing from corridor into the area), area}
export function thresholdsFromLayout(L) {
  const out = [];
  for (const area of L.areas || []) {
    const s = area.side >= 0 ? 1 : -1;
    // wall line = the nearest corridor wall on this side (read from the layout, never hard-coded)
    const zs = (L.corridorWalls || []).map(([, cz]) => cz * s).filter(z => z > 0);
    if (!zs.length) continue;
    const z = s * Math.min(...zs);
    area.mouths.forEach(([lo, hi], k) => out.push({ id: `${area.id}:${k}`, area: area.id, ax: lo, az: z, bx: hi, bz: z, nx: 0, nz: s }));
  }
  return out;
}

// ---------- crossing detector with hysteresis: a latched side flips only after moving > HYST past the line
export function createCrossingDetector(thresholds = [], hyst = HYST) {
  let list = thresholds, side = list.map(() => 0);
  const dist = (t, x, z) => (x - t.ax) * t.nx + (z - t.az) * t.nz;
  const along = (t, x, z) => { const dx = t.bx - t.ax, dz = t.bz - t.az; return ((x - t.ax) * dx + (z - t.az) * dz) / (dx * dx + dz * dz || 1); };
  return {
    setThresholds(l) { list = l; side = l.map(() => 0); },
    reset() { side = list.map(() => 0); },
    // returns {id, dir:+1 into area / -1 out} or null. teleported just re-primes.
    step(x, z, teleported = false) {
      let hit = null;
      list.forEach((t, i) => {
        const d = dist(t, x, z);
        if (Math.abs(d) <= hyst) return;
        const ns = d > 0 ? 1 : -1;
        if (teleported) { side[i] = ns; return; }
        if (side[i] && side[i] !== ns) { const u = along(t, x, z); if (u >= 0 && u <= 1 && !hit) hit = { id: t.id, dir: ns }; }
        side[i] = ns;
      });
      return teleported ? null : hit;
    }
  };
}

// ---------- overlay: one page + animated grain/scan (low-contrast, never full-screen white/black flashing)
export function createOverlay({ document: doc = globalThis.document, reducedMotion = false, setTimeout: st = globalThis.setTimeout.bind(globalThis), clearTimeout: ct = globalThis.clearTimeout.bind(globalThis) } = {}) {
  let root, img, grain, gctx, idata, u32, timer, raf = 0, imgs = null;
  const build = () => {
    root = doc.createElement('div');
    root.setAttribute('role', 'img'); root.hidden = true;
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0b0907;display:flex;align-items:center;justify-content:center;pointer-events:none';
    img = doc.createElement('img'); img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;filter:contrast(1.08) brightness(.92)';
    grain = doc.createElement('canvas'); grain.width = grain.height = 128;
    grain.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;opacity:.32;mix-blend-mode:overlay';
    const scan = doc.createElement('div');
    scan.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px);box-shadow:inset 0 0 120px rgba(0,0,0,.7)';
    root.append(img, grain, scan); doc.body.appendChild(root);
    gctx = grain.getContext('2d'); idata = gctx.createImageData(128, 128); u32 = new Uint32Array(idata.data.buffer);
  };
  const noise = () => { for (let i = 0; i < u32.length; i++) { const g = (Math.random() * 255) | 0; u32[i] = 0xFF000000 | (g << 16) | (g << 8) | g; } gctx.putImageData(idata, 0, 0); };
  const loop = () => { noise(); raf = globalThis.requestAnimationFrame(loop); };
  return {
    // fetch + decode all pages once; resolves true when every page is usable
    preload() {
      return imgs || (imgs = Promise.all(PAGES.map(p => { const i = new globalThis.Image(); i.decoding = 'async'; i.src = p.src; return (i.decode ? i.decode() : new Promise((r, j) => { i.onload = r; i.onerror = j; })).then(() => i); })).then(l => { imgs = l; return true; }, () => false));
    },
    show(page, ms = SHOW_MS) {
      if (!root) build();
      img.src = PAGES[page].src; root.setAttribute('aria-label', PAGES[page].caption);
      root.hidden = false;
      if (!reducedMotion) { noise(); raf = globalThis.requestAnimationFrame(loop); } else grain.style.display = 'none';
      return new Promise(res => { timer = st(() => { this.hide(); res(); }, ms); });
    },
    hide() { ct(timer); if (raf) globalThis.cancelAnimationFrame(raf); raf = 0; if (root) root.hidden = true; },
    dispose() { this.hide(); if (root) root.remove(); root = null; }
  };
}

// ---------- audio: bounded, quiet bed (~-21 dB under the stinger) + one-at-a-time boom/crash
export function createAudio(ctx, dest, { rand = Math.random, setTimeout: st = globalThis.setTimeout.bind(globalThis), clearTimeout: ct = globalThis.clearTimeout.bind(globalThis) } = {}) {
  const STING = 0.9, AMB = 0.08;                                  // 20*log10(.9/.08) = 21 dB at the default ambience level (0.5)
  const out = ctx.createDynamicsCompressor();
  out.threshold.value = -8; out.knee.value = 4; out.ratio.value = 12; out.attack.value = 0.002; out.release.value = 0.12; out.connect(dest);
  const ambBus = ctx.createGain(); ambBus.gain.value = 0;
  const muffle = ctx.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 18000; ambBus.connect(muffle); muffle.connect(out);   // a locker closes over the hall
  const stBus = ctx.createGain(); stBus.gain.value = STING; stBus.connect(out);
  // one shared 2 s noise buffer, created once (brown-ish: leaky integrator, no DC, no sub-20 Hz content after the filters)
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
  let lp = 0; for (let i = 0; i < d.length; i++) { lp = lp * 0.97 + (Math.random() * 2 - 1) * 0.3; d[i] = lp; }
  const src = loop => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = loop; return s; };
  const fx = (type, f, q) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q) n.Q.value = q; return n; };
  const env = (g, t, peak, a, r) => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + r); };
  let fixed = null, timers = [], live = { creak: false, breath: false, steps: false, tick: false, rattle: false }, sting = null, on = false, disposed = false, level = 0.5;
  const ambGain = () => AMB * 2 * level;                          // the slider: 0 silent, 0.5 = the shipped mix, 1 = +6 dB
  const busy = () => Object.values(live).filter(Boolean).length;
  const pan = (n, g) => { if (!ctx.createStereoPanner) { n.connect(g); return [] ; } const p = ctx.createStereoPanner(); p.pan.value = rand() * 1.6 - 0.8; n.connect(p); p.connect(g); return [p]; };

  const startFixed = () => {
    const bed = src(true), bf = fx('lowpass', 420), bg = ctx.createGain(); bg.gain.value = 0.9; bed.connect(bf); bf.connect(bg); bg.connect(ambBus);
    const hf = fx('lowpass', 420), hg = ctx.createGain(); hg.gain.value = 0.1; hf.connect(hg); hg.connect(ambBus);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), ld = ctx.createGain();
    o1.type = o2.type = 'triangle'; o1.frequency.value = 100; o2.frequency.value = 103.4;   // detuned pair, beats ~3.4 Hz (audible carrier, no subsonic)
    lfo.frequency.value = 37; ld.gain.value = 0.04; lfo.connect(ld); ld.connect(hg.gain); // faint amplitude roughness
    o1.connect(hf); o2.connect(hf);
    [bed, o1, o2, lfo].forEach(n => n.start());
    fixed = [bed, o1, o2, lfo, bf, bg, hf, hg, ld];
  };
  // decorative events: one irregular clock (8-22 s), a shuffle bag so no kind repeats back to back, at most two sounding at once.
  // Halting clears the clock; starting draws a fresh delay, so a pause or a background tab never releases a backlog.
  const KINDS = ['creak', 'steps', 'tick', 'rattle', 'breath'];
  let bag = [], lastKind = null;
  const draw = () => {
    if (!bag.length) { bag = KINDS.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } if (bag[bag.length - 1] === lastKind) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]; }
    return (lastKind = bag.pop());
  };
  const sched = (lo, hi) => {
    const go = () => { timers = timers.filter(x => x !== h); if (!on) return; const k = draw(); if (!live[k] && busy() < 2) EVENTS[k](); arm(); };
    const arm = () => { h = st(go, (lo + rand() * (hi - lo)) * 1000); timers.push(h); };
    let h; arm();
  };
  const creak = () => {
    live.creak = true; const t = ctx.currentTime, dur = 0.4 + rand() * 0.5, o = ctx.createOscillator(), f = fx('bandpass', 600 + rand() * 400, 8), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(260 + rand() * 120, t); o.frequency.linearRampToValueAtTime(150 + rand() * 60, t + dur);
    o.connect(f); f.connect(g); g.connect(ambBus); env(g, t, 0.3, 0.08, dur);
    o.onended = () => { live.creak = false; [o, f, g].forEach(n => n.disconnect()); }; o.start(t); o.stop(t + dur + 0.15);
  };
  const breath = () => {
    live.breath = true; const t = ctx.currentTime, s = src(false), f = fx('bandpass', 850, 1.1), g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(ambBus); env(g, t, 0.28, 0.7, 0.7);
    s.onended = () => { live.breath = false; [s, f, g].forEach(n => n.disconnect()); }; s.start(t); s.stop(t + 1.5);
  };
  // distant footsteps: slow, heavy, heel-first and lowpassed far away (the pursuer's own steps are soft padded thuds, close and dry)
  const steps = () => {
    live.steps = true; const g = ctx.createGain(), f = fx('lowpass', 340, 0.7), n = 3 + Math.floor(rand() * 3), extra = pan(f, g); g.gain.value = 0.55; g.connect(ambBus);
    let t = ctx.currentTime + 0.05, left = n;
    for (let i = 0; i < n; i++) { const s = src(false), e = ctx.createGain(); s.connect(e); e.connect(f); env(e, t, 0.6, 0.01, 0.16); s.onended = () => { s.disconnect(); e.disconnect(); if (--left === 0) { live.steps = false; [f, g, ...extra].forEach(x => x.disconnect()); } }; s.start(t); s.stop(t + 0.25); t += 0.62 + rand() * 0.35; }
  };
  const tick = () => {                                            // a locker door settling: one dry metal tick
    live.tick = true; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), extra = pan(o, g); o.type = 'triangle'; o.frequency.setValueAtTime(1900 + rand() * 900, t);
    g.connect(ambBus); env(g, t, 0.22, 0.002, 0.05);
    o.onended = () => { live.tick = false; [o, g, ...extra].forEach(n => n.disconnect()); }; o.start(t); o.stop(t + 0.1);
  };
  const rattle = () => {                                          // a faint far rattle: a few loose taps through a bandpass
    live.rattle = true; const t = ctx.currentTime, s = src(false), f = fx('bandpass', 1500 + rand() * 600, 4), g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(ambBus); g.gain.setValueAtTime(0.0001, t);
    for (let i = 0, at = t; i < 5; i++, at += 0.06 + rand() * 0.05) { g.gain.setValueAtTime(0.18, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04); }
    s.onended = () => { live.rattle = false; [s, f, g].forEach(n => n.disconnect()); }; s.start(t); s.stop(t + 0.5);
  };
  const EVENTS = { creak: () => creak(), breath: () => breath(), steps, tick, rattle };
  const begin = () => {
    if (disposed) return; on = true; if (!fixed) startFixed();
    timers.forEach(ct); timers = [];                              // never two clocks
    ambBus.gain.cancelScheduledValues(ctx.currentTime); ambBus.gain.setTargetAtTime(ambGain(), ctx.currentTime, 0.4);
    sched(8, 22);
  };
  const halt = () => { on = false; timers.forEach(ct); timers = []; ambBus.gain.cancelScheduledValues(ctx.currentTime); ambBus.gain.setTargetAtTime(0, ctx.currentTime, 0.08); };
  return {
    start: begin, suspend: halt, resume: begin,
    setLevel(v) { level = Math.min(1, Math.max(0, Number(v) || 0)); if (on) { ambBus.gain.cancelScheduledValues(ctx.currentTime); ambBus.gain.setTargetAtTime(ambGain(), ctx.currentTime, 0.2); } },
    setMuffle(m) { muffle.frequency.cancelScheduledValues(ctx.currentTime); muffle.frequency.setTargetAtTime(m ? 650 : 18000, ctx.currentTime, 0.15); },   // crossfade, not a cut
    stinger() {                                                   // ~0.55 s: noise crash through a falling lowpass + a 90->50 Hz thump
      if (disposed) return; const t = ctx.currentTime;
      if (sting) { try { sting.g.gain.cancelScheduledValues(t); sting.g.gain.setTargetAtTime(0, t, 0.005); sting.stop(t + 0.03); } catch (e) {} }
      const g = ctx.createGain(), n = src(false), f = fx('lowpass', 2600, 0.7), th = ctx.createOscillator(), tg = ctx.createGain();
      f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(220, t + 0.5);
      n.connect(f); f.connect(g); env(g, t, 1, 0.004, 0.5);
      th.type = 'sine'; th.frequency.setValueAtTime(90, t); th.frequency.exponentialRampToValueAtTime(50, t + 0.4); th.connect(tg); tg.connect(g); env(tg, t, 1, 0.006, 0.4);
      g.connect(stBus); n.start(t); n.stop(t + 0.6); th.start(t); th.stop(t + 0.5);
      const me = { g, stop(tt) { try { n.stop(tt); th.stop(tt); } catch (e) {} } }; sting = me;
      n.onended = () => { [n, f, g, th, tg].forEach(x => x.disconnect()); if (sting === me) sting = null; };
    },
    dispose() { disposed = true; halt(); if (fixed) { fixed.slice(0, 4).forEach(n => { try { n.stop(); } catch (e) {} }); fixed.forEach(n => n.disconnect()); fixed = null; } if (sting) sting.stop(ctx.currentTime); [ambBus, muffle, stBus, out].forEach(n => n.disconnect()); },
    _debug: () => ({ live: { ...live }, timers: timers.length, fixed: fixed ? fixed.length : 0, on, level, busy: busy() })
  };
}

// ---------- controller: scheduler + detector + overlay + audio behind the host contract above
export function createCorgiScare({ seed = 1, state, audio, reducedMotion, onStart = () => {}, onEnd = () => {}, document: doc = globalThis.document } = {}) {
  let sch = createScheduler({ seed, state }), au = null;
  const det = createCrossingDetector([]);
  const rm = reducedMotion ?? !!(globalThis.matchMedia && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ov = createOverlay({ document: doc, reducedMotion: rm });
  if (audio) au = createAudio(audio.ctx, audio.dest, { rand: audio.rand });
  let ready = false, showing = false;
  const readyP = ov.preload().then(ok => (ready = ok));
  return {
    ready: readyP, get phase() { return sch.phase; },
    setLayout(L) { det.setThresholds(thresholdsFromLayout(L)); },
    tick(dt) { if (ready && !showing) sch.tick(dt); },
    step(x, z, teleported = false) {
      if (showing) return null;
      const hit = det.step(x, z, teleported); if (!hit) return null;
      const page = sch.crossing(); if (page < 0) return null;
      showing = true; const t0 = Date.now(); if (au) au.stinger(); onStart({ page });
      ov.show(page).then(() => { showing = false; sch.finish(); det.reset(); onEnd({ pausedMs: Date.now() - t0, recoveryMs: RECOVERY_MS }); });
      return hit;
    },
    attachAudio(a) { if (!au && a) au = createAudio(a.ctx, a.dest, { rand: a.rand }); },    // the host's AudioContext only exists after the first gesture; rand = its own seeded stream
    setAmbience(v) { au && au.setLevel(v); }, setMuffle(m) { au && au.setMuffle(m); },
    startAmbience() { au && au.start(); },
    reset(newSeed) { sch = createScheduler({ seed: newSeed }); det.reset(); },  // a brand-new run: fresh delay, no carried scare
    armNow() { sch.tick(MAX_DELAY_S + 1); },                              // tests only
    get showing() { return showing; }, get audioDebug() { return au ? au._debug() : null; },
    suspend() { au && au.suspend(); }, resume() { au && au.resume(); },
    serialize: () => sch.serialize(),
    dispose() { ov.dispose(); au && au.dispose(); }
  };
}
