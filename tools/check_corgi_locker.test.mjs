import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../tv/channels/corgi-endless.mjs';
import * as K from '../tv/channels/corgi-locker.mjs';

const withLockers = L => { const { lockers, rects } = K.lockersFor(L); return { L: { ...L, collisionRects: [...L.collisionRects, ...rects] }, lockers, rects }; };
// follow a polyline for `budget` units, never past its end (the host's endlessMove stops at the goal the same way)
function advance(path, budget) {
  let [x, z] = path[0];
  for (let i = 1; i < path.length && budget > 1e-9; i++) {
    const dx = path[i][0] - x, dz = path[i][1] - z, d = Math.hypot(dx, dz); if (d < 1e-9) continue;
    const s = Math.min(d, budget); x += dx / d * s; z += dz / d * s; budget -= s;
  }
  return [x, z];
}
// drive one encounter with the real router: speed u/s, frame schedule dts; returns the trace
function drive(Lk, locker, start, speed, dts, opts = {}) {
  let enc = K.newEncounter(opts.id || 'enc:1', locker, start), cur = start.slice(), t = 0, inspectStart = null, inspectEnd = null;
  const segs = [];
  for (const dt of dts) {
    const g = K.encounterGoal(enc, locker); if (!g) break;
    const prev = cur.slice();
    if (!g.hold) { const p = E.routePath(Lk, cur[0], cur[1], g.x, g.z); assert.ok(p, 'route to goal'); cur = advance(p, speed * dt); }
    segs.push([prev, cur.slice()]);
    const before = enc.stage;
    enc = K.stepEncounter(enc, { locker, L: Lk, prev, cur, dt, ...opts.step?.(t, enc) });
    t += dt;
    if (before !== 'INSPECT' && enc.stage === 'INSPECT') { inspectStart = t; assert.ok(Math.hypot(cur[0] - locker.inspect[0], cur[1] - locker.inspect[1]) <= K.ARRIVE_R + 1e-9, 'physically at the inspection point'); }
    if (before === 'INSPECT' && enc.stage !== 'INSPECT') inspectEnd = t;
    if (enc.stage === 'DONE') break;
  }
  return { enc, cur, t, segs, inspectStart, inspectEnd };
}
const frames = (n, dt = 1 / 60) => Array.from({ length: n }, () => dt);
const L3 = E.genEndlessSection(424242, 3), W3 = withLockers(L3);

test('A10 unlock + placement: none before section 3 or on v1; later v2 sections get validated, reachable, non-blocking banks on the hall side walls', { timeout: 300000 }, () => {
  for (const seed of [1, 99, 424242]) for (const s of [1, 2]) assert.equal(K.lockersFor(E.genEndlessSection(seed, s)).lockers.length, 0);
  assert.equal(K.lockersFor(E.genEndlessSection(7, 5, 1)).lockers.length, 0);                      // a saved v1 section keeps its old hall
  const sweep = [];
  for (let seed = 1; seed <= 12; seed++) for (const sec of [3, 4, 6, 9, 14, 22, 30, 60, 100]) sweep.push(E.genEndlessSection(seed * 7919, sec));
  for (const L of sweep) {
    const before = JSON.stringify(L), { L: Lk, lockers, rects } = withLockers(L), half = L.clear.hall / 2;
    assert.equal(JSON.stringify(L), before, 'post-pass: the generated layout is untouched');
    assert.deepEqual(K.lockersFor(L).lockers, lockers, 'deterministic');
    assert.ok(lockers.length >= 4, 'every eligible section has hiding spots');
    assert.ok(E.validateLayout(Lk).ok, 'routes, spawns, papers, exit all still valid with the lockers in collision');
    for (const l of lockers) {
      assert.ok(Math.abs(Math.abs(l.side > 0 ? l.rect.z1 : l.rect.z0) - half) < 1e-9, 'back against the side wall');
      assert.equal(l.yawOut, l.side > 0 ? 0 : Math.PI);
      assert.ok(Math.sign(l.slit[1]) === l.side && Math.abs(l.inspect[1]) < Math.abs(l.slit[1]) && Math.abs(l.entry[1]) < Math.abs(l.slit[1]), 'door faces the hall');
      assert.ok(l.rect.x0 >= 3 && l.rect.x1 <= L.corridorLength - 3, 'clear of spawn and exit');
      for (const a of L.areas) for (const [m0, m1] of a.mouths) if (a.side === l.side) assert.ok(l.rect.x1 <= m0 - 0.3 + 1e-9 || l.rect.x0 >= m1 + 0.3 - 1e-9, 'never across a doorway');
      for (const p of [L.playerSpawn, L.chaserSpawn, ...L.recoveryPoints, ...L.mainAnchors, ...L.objectives.map(o => o.approachPoint)]) assert.ok(!E.circleHitsRect(p[0], p[1], E.ACTOR_R, l.rect));
      assert.ok(!rects.some(r => r !== l.rect && E.circleHitsRect(l.entry[0], l.entry[1], K.DOG_R, r)) && !L.collisionRects.some(r => E.circleHitsRect(l.entry[0], l.entry[1], K.DOG_R, r)), 'entry spot is open floor');
      assert.ok(E.clearSeg(Lk.collisionRects, l.inspect[0], l.inspect[1], l.x, 0, K.CHASER_R), 'the creature fits at the inspection point');
      const facing = lockers.some(o => o.side !== l.side && o.rect.x0 < l.rect.x1 + 0.6 && o.rect.x1 > l.rect.x0 - 0.6);
      const tip = half - K.LK_D - K.DOOR_W; assert.ok(tip + half - (facing ? K.LK_D : 0) >= 2 * K.CHASER_R + 0.3, 'open door still leaves the creature room, even across a facing bank');
      assert.ok(!lockers.some(o => o !== l && o.side === l.side && o.rect.x0 < l.rect.x1 - 1e-9 && o.rect.x1 > l.rect.x0 + 1e-9), 'no overlap on one wall');
    }
    // spacing along the whole chase route: no stretch of hall is far from a locker, and the end stretches are short
    const xs = [...new Set(lockers.map(l => l.x))].sort((a, b) => a - b);
    const G = K.reachGap(L.section);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] <= G + 1e-9, `gap ${(xs[i] - xs[i - 1]).toFixed(2)} > ${G.toFixed(2)} in section ${L.section}`);
    assert.ok(xs[0] <= 7 && xs[xs.length - 1] >= L.corridorLength - 8);
  }
});

test('A11 entry + safety: one latched sequence (open .3, turn .4, back .4, close .4), protected from acceptance to grace end, look snapshot held', () => {
  const l = W3.lockers[0], rects = W3.L.collisionRects, at = { alive: true, section: 3, locker: l, x: l.entry[0], z: l.entry[1] + 0.3 * -l.side, rects };
  let p = K.newPlayerLock();
  assert.equal(K.canEnter(p, { ...at, section: 2 }), false);
  assert.equal(K.canEnter(p, { ...at, alive: false }), false);
  assert.equal(K.canEnter(p, { ...at, x: l.x + 3 }), false);
  assert.equal(K.canEnter(p, { ...at, locker: null }), false);
  assert.ok(K.canEnter(p, at));
  p = K.enter(p, l, 'animal_042');
  let starts = 1;
  const seen = [];
  for (let i = 0; i < 120; i++) {
    if (K.canEnter(p, at)) { p = K.enter(p, l, 'x'); starts++; }                                  // spam tapping during the sequence
    if (p.mode === 'ENTERING') seen.push(K.phaseAt(K.ENTRY, p.t).name);
    assert.equal(K.damageEligible(p), false); assert.equal(p.look, 'animal_042');
    p = K.tickPlayer(p, 1 / 60);
  }
  assert.equal(starts, 1); assert.equal(p.mode, 'HIDDEN');
  assert.deepEqual([...new Set(seen)], ['open', 'turn', 'back', 'close']);
  assert.ok(Math.abs(K.seqLen(K.ENTRY) - 1.5) < 1e-9);
  assert.deepEqual(K.phaseAt(K.ENTRY, 0.29).name, 'open'); assert.deepEqual(K.phaseAt(K.ENTRY, 0.31).name, 'turn'); assert.deepEqual(K.phaseAt(K.ENTRY, 1.2).name, 'close'); assert.ok(K.phaseAt(K.ENTRY, 1.6).done);
  for (let i = 0; i < 36000; i++) p = K.tickPlayer(p, 1 / 60);                                     // ten minutes: no ejection, no drain
  assert.equal(p.mode, 'HIDDEN'); assert.equal(K.damageEligible(p), false);
  assert.ok(K.damageEligible(K.newPlayerLock()) && K.damageEligible(null));                        // story mode / no locker: ordinary rules
});

test('A12 encounter: the real creature routes to the locker, sniffs 2-4 s once, passes, clears the doorway with reach, then the exit is open', () => {
  const { L: Lk, lockers } = W3;
  for (const l of [lockers[0], lockers[Math.floor(lockers.length / 2)], lockers[lockers.length - 1]]) {
    const r = drive(Lk, l, L3.chaserSpawn.slice(), E.chaserSpeed(3), frames(60 * 90));
    assert.deepEqual(r.enc.log, ['APPROACH', 'INSPECT', 'PASS', 'CLEAR', 'DONE']);
    assert.ok(r.enc.inspected && !r.enc.skipped);
    const dur = r.inspectEnd - r.inspectStart; assert.ok(dur >= K.INSPECT_MIN_S - 1e-6 && dur <= K.INSPECT_MAX_S + 1 / 60 + 1e-6, 'bounded inspection ' + dur);
    assert.ok(r.inspectStart > 1, 'travel time is separate: a distant creature physically arrives');
    const gap = Math.hypot(r.cur[0] - l.entry[0], r.cur[1] - l.entry[1]);
    assert.ok(gap >= K.DOG_R + K.CHASER_R + K.MAX_REACH, 'collider and reach are off the exit spot: ' + gap.toFixed(2));
    assert.ok(K.exitClear(l, r.cur, Lk.collisionRects));
    for (const [a, b] of r.segs) assert.ok(E.clearSeg(Lk.collisionRects, a[0], a[1], b[0], b[1], K.CHASER_R - 0.03), 'never through a locker or wall');
    let e = r.enc; for (let i = 0; i < 600; i++) e = K.stepEncounter(e, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 1 / 60 });   // proximity spam after the fact
    assert.equal(e, r.enc, 'a finished encounter never restarts');
    assert.equal(K.encounterGoal(e, l), null);
  }
  // inspection timer completes even while the creature sits on the marker every tick
  const l = lockers[0]; let e = K.newEncounter('stay', l, [l.x + 5, 0]);
  e = K.stepEncounter(e, { locker: l, L: Lk, prev: [l.x + 1, 0], cur: l.inspect, dt: 0.1 });
  assert.equal(e.stage, 'INSPECT');
  for (let i = 0; i < 60 && e.stage === 'INSPECT'; i++) e = K.stepEncounter(e, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 0.1 });
  assert.equal(e.stage, 'PASS'); assert.ok(e.inspected && e.clear);
  assert.ok(e.clear.dir === -1, 'keeps going the way it came');
  assert.ok(K.inspectSeconds('a') >= 2 && K.inspectSeconds('a') <= 4 && K.inspectSeconds('a') === K.inspectSeconds('a'));
});

test('A13 exit + reentry: exit never onto the creature or a wall, grace once per encounter, reentry keeps the pass, no forced ejection, nav failure keeps a way out', () => {
  const { L: Lk, lockers } = W3, l = lockers[1];
  const sniffing = { ...K.newEncounter('s', l, [l.x + 5, 0]), stage: 'INSPECT' };
  assert.equal(K.canExit(sniffing, l, l.inspect, Lk.collisionRects), false, 'creature sniffing at the door: stay inside, still protected');
  assert.equal(K.canExit({ ...sniffing, stage: 'PASS' }, l, [l.x + 1.2, 0], Lk.collisionRects), true, 'an early exit behind a passing creature is the player choice');
  assert.equal(K.exitClear(l, l.entry, Lk.collisionRects), false, 'never onto the creature');
  assert.equal(K.exitClear(l, [l.x + 3, 0], Lk.collisionRects), true);
  assert.equal(K.exitClear(l, null, [...Lk.collisionRects, { x0: l.entry[0] - 0.1, x1: l.entry[0] + 0.1, z0: l.entry[1] - 0.1, z1: l.entry[1] + 0.1 }]), false, 'blocked exit spot');
  const hide = p => { p = K.enter(p, l, 'animal_001'); for (let i = 0; i < 100; i++) p = K.tickPlayer(p, 1 / 60); return p; };
  const out = p => { const seq = []; for (let i = 0; i < 200; i++) { p = K.tickPlayer(p, 1 / 60); seq.push(p.mode); } return { p, seq }; };
  let p = hide(K.newPlayerLock()); assert.equal(p.mode, 'HIDDEN');
  assert.equal(K.exit(K.newPlayerLock(), 'e1').mode, 'PLAYING', 'exit only from inside');
  let r = out(K.exit(p, 'e1'));
  const graceFrames = r.seq.filter(m => m === 'EXIT_GRACE').length;
  assert.ok(Math.abs(graceFrames / 60 - K.GRACE_S) < 2 / 60, 'about 0.75 s of grace'); assert.equal(r.p.mode, 'PLAYING');
  assert.ok(r.seq.filter(m => m === 'EXITING').length / 60 >= K.seqLen(K.EXIT_SEQ) - 2 / 60);
  r = out(K.exit(hide(r.p), 'e1')); assert.equal(r.seq.filter(m => m === 'EXIT_GRACE').length, 0, 'same encounter: no fresh grace');
  r = out(K.exit(hide(r.p), 'e2')); assert.ok(r.seq.includes('EXIT_GRACE'), 'a later encounter has its own grace');
  // reentry during an existing pass: the encounter is not rearmed, so the host keeps it (no new sniffing)
  let e = K.newEncounter('re', l, [l.x + 6, 0]);
  e = K.stepEncounter(e, { locker: l, L: Lk, prev: [l.x + 1, 0], cur: l.inspect, dt: 0.1 });
  while (e.stage === 'INSPECT') e = K.stepEncounter(e, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 0.1 });
  assert.equal(e.stage, 'PASS');
  assert.equal(K.rearmed(e, K.newPlayerLock(), l, l.x + 5, 0), false, 'mid-pass: not a new encounter');
  const done = { ...e, stage: 'DONE' };
  assert.equal(K.rearmed(done, { mode: 'HIDDEN' }, l, l.entry[0], l.entry[1]), false, 'still inside: the creature ignores the occupied locker');
  assert.equal(K.rearmed(done, K.newPlayerLock(), l, l.entry[0], l.entry[1]), false, 'still in the trigger');
  assert.equal(K.rearmed(done, K.newPlayerLock(), l, l.entry[0] + 2, l.entry[1]), true);
  // an early exit before the creature arrives cancels the approach (ordinary pursuit), never strands it
  assert.equal(K.stepEncounter(K.newEncounter('c', l, [l.x + 8, 0]), { locker: l, L: Lk, prev: [l.x + 8, 0], cur: [l.x + 7.9, 0], dt: 0.1, playerOut: true }).stage, 'DONE');
  // nav failure: approach cannot route -> keep the pass commitment without a sniff; pass cannot route -> re-plan the other way
  const nf = K.stepEncounter(K.newEncounter('nf', l, [l.x + 8, 0]), { locker: l, L: Lk, prev: [l.x + 8, 0], cur: [l.x + 8, 0], dt: 0.1, navFailed: true });
  assert.deepEqual([nf.stage, nf.inspected, nf.skipped], ['PASS', true, true]); assert.ok(nf.clear);
  const rp = K.stepEncounter(nf, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 0.1, navFailed: true });          // now at the door, and that way is lost too
  assert.equal(rp.stage, 'PASS'); assert.equal(rp.clear.dir, -nf.clear.dir); assert.equal(rp.replans, 1);
  // stuck (no movement for 2.5 s) counts as a failure too; with no clear point at all it holds, never retargets the player
  let st = K.newEncounter('st', l, [l.x + 8, 0]);
  for (let i = 0; i < 30; i++) st = K.stepEncounter(st, { locker: l, L: Lk, prev: [l.x + 8, 0], cur: [l.x + 8, 0], dt: 0.1 });
  assert.equal(st.stage, 'PASS');
  const tiny = { ...Lk, corridorLength: 2 }; const hold = K.stepEncounter(K.newEncounter('h', l, [l.x + 8, 0]), { locker: l, L: tiny, prev: [0, 0], cur: [0, 0], dt: 0.1, navFailed: true });
  assert.deepEqual([hold.stage, K.encounterGoal(hold, l).hold], ['INSPECT', true]);
});

test('A14 fastest creature + a 250 ms frame: no tunnelling, no skipped state; pause (dt 0) freezes every timer', () => {
  const { L: Lk, lockers } = W3, fast = E.chaserSpeed(100);   // ~15 u/s, far past any section a run reaches
  assert.ok(fast > 15);
  for (const l of lockers) {
    const sched = [...frames(10), 0.25, ...frames(30), 0.25, 0.25, ...frames(600), 0.25, ...frames(600)];
    const r = drive(Lk, l, L3.chaserSpawn.slice(), fast, sched);
    assert.deepEqual(r.enc.log, ['APPROACH', 'INSPECT', 'PASS', 'CLEAR', 'DONE'], 'locker ' + l.id);
    assert.ok(r.inspectEnd - r.inspectStart >= K.INSPECT_MIN_S - 1e-6);
    for (const [a, b] of r.segs) assert.ok(E.clearSeg(Lk.collisionRects, a[0], a[1], b[0], b[1], K.CHASER_R - 0.03), 'swept move stays in the hall');
  }
  // one huge frame through the doorway and the clear point at once still records PASS and CLEAR, in order
  const l = lockers[0]; let e = K.newEncounter('big', l, [l.x + 9, 0]);
  e = K.stepEncounter(e, { locker: l, L: Lk, prev: [l.x + 9, 0], cur: l.inspect, dt: 0.25 });
  while (e.stage === 'INSPECT') e = K.stepEncounter(e, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 0.25 });
  e = K.stepEncounter(e, { locker: l, L: Lk, prev: l.inspect, cur: [e.clear.x + e.clear.dir * 3, 0], dt: 0.25 });
  assert.deepEqual(e.log, ['APPROACH', 'INSPECT', 'PASS', 'CLEAR', 'DONE']);
  // pause: the host stops calling with dt; a dt of 0 changes nothing, and the timers carry on exactly where they were
  let p = K.enter(K.newPlayerLock(), l, 'animal_001'); p = K.tickPlayer(p, 0.5);
  assert.deepEqual(K.tickPlayer(p, 0), p);
  p = K.tickPlayer(p, 1.0); assert.equal(p.mode, 'HIDDEN');
  let i1 = K.stepEncounter(K.newEncounter('pz', l, [l.x + 9, 0]), { locker: l, L: Lk, prev: [l.x + 1, 0], cur: l.inspect, dt: 0.1 });
  i1 = K.stepEncounter(i1, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 1 });
  const frozen = K.stepEncounter(i1, { locker: l, L: Lk, prev: l.inspect, cur: l.inspect, dt: 0 });
  assert.equal(frozen.inspectT, i1.inspectT); assert.equal(frozen.stage, 'INSPECT');
});

test('A15 ambience: seeded shuffle bag every 8-22 s, never the same kind twice running, <=2 at once, slider + mute-safe level, locker muffle, no resume backlog', async () => {
  const { createAudio } = await import('../tv/channels/corgi-scare.mjs');
  const fake = () => {
    const made = [], ap = () => ({ value: 0, last: null, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(v) { this.last = v; } });
    const node = () => { const n = { connect() {}, disconnect() { n.dc = true; }, start() {}, stop() {}, frequency: ap(), gain: ap(), Q: { value: 0 }, pan: ap(), threshold: {}, knee: {}, ratio: {}, attack: {}, release: {} }; made.push(n); return n; };
    return { made, sampleRate: 8000, currentTime: 0, createDynamicsCompressor: node, createGain: node, createBiquadFilter: node, createOscillator: node, createBufferSource: node, createStereoPanner: node, createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }) };
  };
  const run = seed => {
    const ctx = fake(), q = [], kinds = [], delays = [];
    const au = createAudio(ctx, { connect() {} }, { rand: E.mulberry32(seed), setTimeout: (f, ms) => { q.push(f); delays.push(ms); return q.length; }, clearTimeout: () => {} });
    au.start();
    for (let i = 0; i < 60; i++) {
      const before = { ...au._debug().live }; q.shift()();
      const after = au._debug().live, fired = Object.keys(after).find(k => after[k] && !before[k]);
      if (fired) kinds.push(fired);
      for (const n of ctx.made) if (n.onended) { const f = n.onended; n.onended = null; f(); }   // every voice finishes before the next tick
    }
    return { ctx, au, kinds, delays, q };
  };
  const a = run(77), b = run(77), c = run(78);
  assert.deepEqual(a.kinds, b.kinds, 'own seeded stream: reproducible'); assert.notDeepEqual(a.kinds, c.kinds);
  assert.ok(a.delays.every(ms => ms >= 8000 && ms <= 22000), 'irregular 8-22 s');
  assert.ok(new Set(a.kinds).size === 5, 'creaks, distant steps, locker ticks, rattles, breaths all occur');
  for (let i = 1; i < a.kinds.length; i++) assert.notEqual(a.kinds[i], a.kinds[i - 1], 'no immediate repeat');
  // at most two decorative voices at once: with nothing ever finishing, only two can start
  const ctx = fake(), q = []; const au = createAudio(ctx, { connect() {} }, { rand: E.mulberry32(5), setTimeout: f => (q.push(f), q.length), clearTimeout: () => {} });
  au.start(); for (let i = 0; i < 20; i++) q.shift()();
  assert.equal(au._debug().busy, 2);
  // level: 0.5 = the shipped mix (21 dB under the stinger), 0 silent, 1 = +6 dB; muffle crossfades the hall
  const bus = ctx.made.find(n => n.gain.last !== null && n.gain.last > 0 && n.gain.last < 0.2); assert.ok(Math.abs(20 * Math.log10(0.9 / bus.gain.last) - 21) < 0.1);
  au.setLevel(0); assert.equal(bus.gain.last, 0); au.setLevel(1); assert.ok(Math.abs(bus.gain.last - 0.16) < 1e-9); au.setLevel('junk'); assert.equal(bus.gain.last, 0);
  const lp = ctx.made.find(n => n.frequency.value === 18000); au.setMuffle(true); assert.equal(lp.frequency.last, 650); au.setMuffle(false); assert.equal(lp.frequency.last, 18000);
  // pause/background: suspend clears the clock; resume arms ONE fresh delay and fires nothing on the spot
  au.suspend(); assert.equal(au._debug().timers, 0);
  const busyBefore = au._debug().busy; q.length = 0; au.resume();
  assert.equal(au._debug().timers, 1); assert.equal(q.length, 1); assert.equal(au._debug().busy, busyBefore, 'no backlog burst');
  au.resume(); assert.equal(au._debug().timers, 1, 'a double resume never stacks two clocks');
});

test('A10/A14 reach at speed: spacing follows chaserSpeed; from the worst point of every section the sprinting dog makes a locker before a fair-seated pursuer, at 3/30/60/100 with 250 ms frames', () => {
  assert.equal(K.reachGap(3), K.MAX_GAP); assert.equal(K.reachGap(30), K.MAX_GAP);
  assert.ok(K.reachGap(100) < K.MAX_GAP && K.reachGap(100) > 6, 'section 100 needs denser banks: ' + K.reachGap(100).toFixed(2));
  for (const sec of [3, 30, 60, 100]) for (let seed = 1; seed <= 8; seed++) {
    const L = E.genEndlessSection(seed * 104729, sec), { lockers } = K.lockersFor(L), vc = E.chaserSpeed(sec);
    const before = JSON.stringify(L); K.lockersFor(L); assert.equal(JSON.stringify(L), before, 'layout and papers untouched');
    const xs = [...new Set(lockers.map(l => l.x))].sort((a, b) => a - b);
    assert.ok(xs.length >= 4, `section ${sec}: lockers exist`);
    // worst start: the middle of the widest stretch; the pursuer is FAIR_LEAD behind; the dog sprints to the locker ahead
    let at = 0, gap = 0; for (let i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] > gap) { gap = xs[i] - xs[i - 1]; at = i; }
    const target = xs[at]; let dog = (xs[at] + xs[at - 1]) / 2, mon = dog - K.FAIR_LEAD, hidden = false, caught = false;
    for (let t = 0; t < 30 && !hidden && !caught; t += 0.25) {          // 250 ms frames, swept: a pass through the dog this frame counts
      const d1 = Math.min(target, dog + K.DOG_SPRINT * 0.25), m1 = mon + vc * 0.25;
      if (m1 >= d1 - K.MAX_REACH) caught = true;
      dog = d1; mon = m1;
      if (!caught && Math.abs(target - dog) <= K.TRIGGER_R - 0.2) hidden = true;   // inside the trigger, with a margin
    }
    assert.ok(hidden && !caught, `section ${sec} seed ${seed}: widest stretch ${gap.toFixed(2)}, pursuer ${vc.toFixed(2)} u/s`);
  }
});
