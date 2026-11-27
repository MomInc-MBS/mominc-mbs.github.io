import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {TubFlight, TUB_X, MOUTH} from '../arcade/tub-flight/engine.mjs';
import {createFx, EFFECTS, MAX_MODULES} from '../arcade/tub-flight/fx.mjs';

const seeded = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
// Noisy pilot: aims near the gap centre with jitter and the odd random flap, so the tub velocity at release time covers a wide range.
function play(game, rnd, {dt = 1 / 60, maxTicks = 20000, onStep = () => {}} = {}) {
  let inputs = 0;
  for (let i = 0; i < maxTicks && game.phase !== 'crashed' && game.phase !== 'complete'; i++) {
    const next = game.pipes.find(p => p.x + 44 > 69), aim = (next ? next.gap : 210) + (rnd() - .5) * 24 + 10;
    if ((game.y > aim && game.velocity > 0) || rnd() < .004 || game.phase === 'ready') { if (game.flap()) inputs++; }
    game.step(dt * (.5 + rnd())); onStep();
  }
  return inputs;
}

test('every released scoop is caught unless a crash comes first; powder falls straight from the nozzle', t => {
  let released = 0, caught = 0, pending = 0, runs = 0;
  for (let seed = 1; released < 1500 && seed < 400; seed++, runs++) {
    const rnd = seeded(seed), game = new TubFlight(seeded(seed * 7), {target: Infinity, ramp: seed % 2 === 0});
    const rel = new Map(), got = new Set();
    const inputs = play(game, rnd, {onStep() {
      for (const s of game.scoops) assert.equal(s.x, TUB_X, 'powder x never changes');
      for (const e of game.events.splice(0)) {
        if (e.type === 'release') {
          const p = game.pipes.find(q => q.id === e.id); assert.ok(p); assert.equal(e.y, p.gap - 75); assert.equal(e.x, TUB_X);
          assert.ok(Math.abs(p.x + 22 - TUB_X) <= 108 * 2.2 / 60 * 1.5 + 1, 'released at the nozzle crossing'); rel.set(e.id, e);
        } else if (e.type === 'catch') { assert.ok(rel.has(e.id)); assert.ok(!got.has(e.id), 'scoop counted once'); got.add(e.id); }
      }
      assert.equal(game.stage, Math.floor(game.score / 5));
    }});
    assert.equal(game.flaps, inputs, 'one engine flap per accepted input');
    released += rel.size; caught += got.size; pending += game.scoops.length;
    for (const id of rel.keys()) assert.ok(got.has(id) || (game.phase === 'crashed' && game.scoops.some(s => s.id === id)), `scoop ${id} lost without a crash`);
    assert.equal(game.powder, got.size);
  }
  t.diagnostic(`${released} scoops over ${runs} runs, ${caught} caught, ${pending} in flight at a crash`);assert.ok(released >= 1000, `only ${released} scoops over ${runs} runs`); assert.ok(caught >= released - pending);
});

test('a crash on the same step wins over a catch', () => {
  const g = new TubFlight(seeded(1)); g.phase = 'running'; g.y = 300; g.velocity = 0; g.pipes = [{x: 70, gap: 100, passed: false, id: 0, released: true}];
  g.scoops = [{id: 0, x: TUB_X, y: g.y + MOUTH - 1, vy: 600}]; g.step(1 / 60);
  assert.equal(g.phase, 'crashed'); assert.equal(g.powder, 0);
});

test('physics are untouched: same seed + inputs reproduce origin/main exactly', async () => {
  const src = execFileSync('git', ['show', 'origin/main:arcade/tub-flight/engine.mjs'], {encoding: 'utf8'});
  const Old = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).TubFlight;
  for (const ramp of [false, true]) for (let seed = 1; seed <= 25; seed++) {
    const a = new Old(seeded(seed), {target: Infinity, ramp}), b = new TubFlight(seeded(seed), {target: Infinity, ramp}), r = seeded(seed + 99);
    for (let i = 0; i < 6000 && a.phase !== 'crashed'; i++) {
      const tap = i === 0 || r() < .06; if (tap) { a.flap(); b.flap(); }
      const dt = 1 / 60 * (.5 + r()); a.step(dt); b.step(dt);
      assert.equal(b.phase, a.phase); assert.equal(b.score, a.score); assert.equal(b.y, a.y); assert.equal(b.velocity, a.velocity);
      assert.deepEqual(b.pipes.map(p => [p.x, p.gap, p.passed]), a.pipes.map(p => [p.x, p.gap, p.passed]));
    }
  }
});

test('hallucination library: >= 10 effects, never more than 6 live modules, Reduced drops the motion ones', () => {
  assert.ok(EFFECTS.length >= 10);
  for (const reduced of [false, true]) for (let stage = 0; stage <= 8; stage++) {
    const fx = createFx(.37); let peak = 0, t = 0;
    for (let i = 0; i < 60 * 120; i++) { t += 1 / 60; fx.update(1 / 60, stage, t, reduced, 200); peak = Math.max(peak, fx.active()); }
    assert.ok(peak <= MAX_MODULES, `stage ${stage} peak ${peak}`);
    if (stage === 0) assert.equal(peak, 0);
  }
  const fx = createFx(.5); for (let i = 0; i < 600; i++) fx.update(1 / 60, 6, i / 60, true, 200);
  assert.ok(fx.active() > 0);
});

// ---- the mounted game: Classic vs Reduced outcomes, input filtering ----
async function mounted(mode, rndSeed) {
  const store = new Map([['nitro-fuel-settings-v1', JSON.stringify({v: 1, fx: mode, seen: true})]]);
  let frame = null; const handlers = {}, nodes = new Map();
  const node = () => new Proxy({}, {get: (t, k) => k in t ? t[k] : k === 'getContext' ? () => new Proxy({}, {get: () => () => {}, set: () => true})
    : k === 'querySelector' ? sel => (nodes.has(sel) || nodes.set(sel, node()), nodes.get(sel))
    : k === 'classList' ? {add() {}} : k === 'addEventListener' ? (type, fn) => { handlers[type] = fn; } : () => {}, set: (t, k, v) => (t[k] = v, true)});
  Object.defineProperty(globalThis, 'performance', {value: {now: () => 1000}, configurable: true, writable: true}); // first frame dt must not depend on wall time
  const realRandom = Math.random, rnd = seeded(rndSeed); Math.random = rnd;
  Object.assign(globalThis, {
    localStorage: {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)},
    document: {hidden: false, addEventListener() {}, removeEventListener() {}},
    requestAnimationFrame: f => (frame = f, 1), cancelAnimationFrame() { frame = null; }, location: {assign() {}},
  });
  const {mountTubFlight} = await import('../arcade/tub-flight/game.mjs?' + mode + rndSeed);
  const m = mountTubFlight(node(), {endless: true}), {game} = m, pilot = seeded(5);
  let now = 1000, accepted = 0, tap = (e = {}) => { const was = game.flaps; handlers.pointerdown({preventDefault() {}, ...e}); accepted += game.flaps - was; };
  tap({isPrimary: false}); assert.equal(game.flaps, 0, 'secondary pointer ignored');
  handlers.keydown({code: 'Space', repeat: true, preventDefault() {}}); assert.equal(game.flaps, 0, 'key auto-repeat ignored');
  tap(); let pipeKey = [];
  for (let i = 0; i < 4000 && frame && game.phase === 'running'; i++) {
    const next = game.pipes.find(p => p.x + 44 > 69);
    if (game.y > (next ? next.gap : 210) + 10 + (pilot() - .5) * 40 && game.velocity > 0) tap();
    const f = frame; frame = null; now += 16.7; f(now);
  }
  pipeKey = game.pipes.map(p => [p.x, p.gap]);
  const out = {score: game.score, phase: game.phase, y: game.y, flaps: game.flaps, accepted, caught: game.powder, pipes: pipeKey};
  m.dispose(); Math.random = realRandom; return out;
}
test('Classic and Reduced Effects give identical pipes, catches and crash outcomes for the same seed and inputs', async () => {
  for (const seed of [3, 11, 42]) {
    const a = await mounted('classic', seed), b = await mounted('reduced', seed);
    assert.deepEqual(a, b); assert.equal(a.flaps, a.accepted, 'flap count equals accepted input count'); assert.ok(a.score >= 1);
  }
});
