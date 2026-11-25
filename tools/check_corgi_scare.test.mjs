// node --test tools/check_corgi_scare.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduler, createCrossingDetector, thresholdsFromLayout, createAudio, PAGES, MIN_DELAY_S, MAX_DELAY_S } from '../tv/channels/corgi-scare.mjs';
import { genEndlessSection } from '../tv/channels/corgi-endless.mjs';

const first = seed => createScheduler({ seed }).remaining;
const seeds = Array.from({ length: 400 }, (_, i) => i + 1);
const lo = seeds.reduce((b, s) => first(s) < first(b) ? s : b), hi = seeds.reduce((b, s) => first(s) > first(b) ? s : b);

test('delay is uniform-ish in 20..90 and arms exactly at the extremes', () => {
  for (const s of seeds) assert.ok(first(s) >= MIN_DELAY_S && first(s) <= MAX_DELAY_S);
  for (const s of [lo, hi]) {
    const sc = createScheduler({ seed: s }), r = sc.remaining;
    assert.equal(sc.tick(r - 0.01), 'cooldown');
    assert.equal(sc.tick(0.02), 'armed');
  }
  assert.ok(first(lo) < 21 && first(hi) > 89, `extremes ${first(lo)} ${first(hi)}`);
});

test('pause: no tick, no progress; dt<=0 or NaN is ignored', () => {
  const sc = createScheduler({ seed: 7 }), r = sc.remaining;
  sc.tick(0); sc.tick(-5); sc.tick(NaN);
  assert.equal(sc.remaining, r);
});

test('arming alone never fires; a crossing fires once; no backlog; next delay drawn after finish', () => {
  const sc = createScheduler({ seed: lo });
  assert.equal(sc.crossing(), -1);                       // cooldown: crossing does nothing
  sc.tick(100); sc.tick(100);                            // extra time while armed is not a backlog
  assert.equal(sc.phase, 'armed');
  const p = sc.crossing(); assert.ok(p >= 0 && p < 3); assert.equal(sc.phase, 'showing');
  assert.equal(sc.crossing(), -1);                       // one at a time
  sc.tick(999); assert.equal(sc.phase, 'showing');       // simulation clock frozen while showing
  const rngBefore = sc.serialize().rng; sc.finish();
  assert.equal(sc.phase, 'cooldown'); assert.notEqual(sc.serialize().rng, rngBefore); assert.ok(sc.remaining >= 20);
});

test('same page never twice in a row, all pages used', () => {
  const sc = createScheduler({ seed: 99 }); let last = -1; const seen = new Set();
  for (let i = 0; i < 300; i++) { sc.tick(1000); const p = sc.crossing(); assert.notEqual(p, last); seen.add(p); last = p; sc.finish(); }
  assert.equal(seen.size, PAGES.length);
});

test('serialize/restore keeps remaining time, rng and last page', () => {
  const a = createScheduler({ seed: 5 }); a.tick(8);
  const b = createScheduler({ state: JSON.parse(JSON.stringify(a.serialize())) });
  assert.equal(b.remaining, a.remaining);
  a.tick(1000); b.tick(1000); assert.equal(a.crossing(), b.crossing());
  assert.equal(createScheduler({ seed: 5, state: { v: 9 } }).phase, 'cooldown');   // junk state -> fresh
});

test('armed restore does not fire on its own; needs a new crossing; showing restores as cooldown', () => {
  const a = createScheduler({ seed: 3 }); a.tick(1000);
  const b = createScheduler({ state: a.serialize() });
  assert.equal(b.phase, 'armed'); b.tick(50); assert.equal(b.phase, 'armed');
  assert.ok(b.crossing() >= 0);                          // only the host's crossing starts it
  const c = createScheduler({ state: b.serialize() });   // saved mid-scare
  assert.equal(c.phase, 'cooldown'); assert.ok(c.remaining >= 20);
});

// ---------- thresholds on real generated layouts
const layouts = [[1, 1], [7, 2], [123, 3], [2024, 5], [99991, 9]].map(([r, s]) => genEndlessSection(r, s));

test('thresholds: 3 mouths per area on the corridor wall line, normals face the area', () => {
  for (const L of layouts) {
    const t = thresholdsFromLayout(L);
    assert.equal(t.length, L.areas.length * 3);
    for (const x of t) {
      const a = L.areas[x.area];
      assert.ok(x.bx > x.ax && x.az === x.bz && x.nz === Math.sign(a.side) && Math.abs(x.az) > 1 && Math.abs(x.az) < 2);
    }
  }
});

test('straight hall never fires; walking into every mouth fires exactly once', () => {
  for (const L of layouts) {
    const det = createCrossingDetector(thresholdsFromLayout(L)), t = thresholdsFromLayout(L);
    det.step(1, 0, true);
    for (let x = 1; x < L.corridorLength - 1; x += 0.05) assert.equal(det.step(x, 0), null);
    for (const m of t) {
      det.reset(); det.step((m.ax + m.bx) / 2, 0, true);
      const hits = []; for (let k = 0; k <= 60; k++) { const h = det.step((m.ax + m.bx) / 2, m.nz * 0.05 * k * 1.0); if (h) hits.push(h); }
      assert.equal(hits.length, 1, `layout ${L.runSeed} ${m.id}`); assert.equal(hits[0].dir, 1);
    }
  }
});

test('hysteresis: wobble on the line gives no fire; real travel after it fires once', () => {
  const m = thresholdsFromLayout(layouts[0])[0], x = (m.ax + m.bx) / 2, det = createCrossingDetector([m]);
  det.step(x, 0, true);
  for (let k = 0; k < 200; k++) assert.equal(det.step(x, m.az + Math.sin(k) * 0.2), null);
  assert.ok(det.step(x, m.az + m.nz * 0.6));
  for (let k = 0; k < 200; k++) assert.equal(det.step(x, m.az + m.nz * 0.6 + Math.sin(k) * 0.3), null);
});

test('teleport / spawn across a line never fires and re-primes', () => {
  const m = thresholdsFromLayout(layouts[0])[0], x = (m.ax + m.bx) / 2, det = createCrossingDetector([m]);
  det.step(x, 0, true);
  assert.equal(det.step(x, m.nz * 3, true), null);
  assert.equal(det.step(x, m.nz * 3.1), null);           // already on the far side: nothing to cross
  assert.ok(det.step(x, 0));                             // real walk back out does count
});

// ---------- audio with a fake context: bounded voices, mix ratio, cleanup
function fakeCtx() {
  const made = []; const node = () => { const n = { connect() {}, disconnect() { n.dc = true; }, start() {}, stop() {}, frequency: ap(), gain: ap(), Q: { value: 0 }, threshold: {}, knee: {}, ratio: {}, attack: {}, release: {} }; made.push(n); return n; };
  const ap = () => ({ value: 0, last: null, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(v) { this.last = v; } });
  return { made, sampleRate: 8000, currentTime: 0, createDynamicsCompressor: node, createGain: node, createBiquadFilter: node, createOscillator: node, createBufferSource: node, createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }) };
}
test('audio: fixed node count, ≤1 creak and ≤1 breath alive, ambience 18-24 dB under stinger, dispose disconnects', () => {
  const ctx = fakeCtx(), q = []; let id = 0;
  const au = createAudio(ctx, { connect() {} }, { rand: () => 0.5, setTimeout: f => (q.push(f), ++id), clearTimeout: () => {} });
  au.start(); const base = ctx.made.length;
  const amb = ctx.made.find(n => n.gain.last !== null && n.gain.last > 0 && n.gain.last < 0.2);
  assert.ok(amb); const db = 20 * Math.log10(0.9 / amb.gain.last); assert.ok(db >= 18 && db <= 24, 'mix ' + db);
  for (let i = 0; i < 40 && q.length; i++) { q.shift()(); const d = au._debug(); assert.ok(d.live.creak !== undefined && d.timers <= 2); }
  assert.ok(ctx.made.length - base <= 40 * 4, 'node growth is per event, bounded');
  au.stinger(); au.stinger();                            // second stinger cuts the first: still one at a time
  au.suspend(); assert.equal(au._debug().timers, 0);
  au.dispose(); assert.ok(ctx.made.slice(0, base).every(n => n.dc));
});

test('run.scare survives the store round trip and junk is rejected by the scheduler', async () => {
  const EL = await import('../tv/channels/corgi-endless.mjs');
  const run = EL.newRun(42), sc = createScheduler({ seed: 9 }); sc.tick(5); run.scare = sc.serialize();
  const mem = {}, st = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  const store = EL.emptyStore(); store.run = run; EL.saveStore(st, store);
  const back = EL.loadStore(st).run;
  assert.deepEqual(back.scare, run.scare);
  assert.equal(createScheduler({ state: back.scare }).remaining, sc.remaining);
  assert.equal(createScheduler({ seed: 1, state: { ...back.scare, remaining: 'x' } }).phase, 'cooldown');
});
