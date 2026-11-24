import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {TubFlight, TARGET} from '../arcade/tub-flight/engine.mjs';

const seeded = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
// Scripted pilot: flap whenever the tub sinks below the next gap's centre.
function fly(game, seconds, onFrame = () => {}) {
  game.flap();
  for (let t = 0; t < seconds * 60 && game.phase === 'running'; t++) {
    const next = game.pipes.find(p => p.x + 44 > 82 - 13);
    if (game.y > (next ? next.gap : 210) + 10 && game.velocity > 0) game.flap();
    game.step(1 / 60); onFrame();
  }
}

test('finite trial still completes at exactly eight pipes', () => {
  const game = new TubFlight(seeded(7)); fly(game, 120);
  assert.equal(TARGET, 8); assert.equal(game.phase, 'complete'); assert.equal(game.score, 8);
});

test('endless engine keeps running past eight and scores each pipe once', () => {
  const game = new TubFlight(seeded(7), {target: Infinity}), seen = [];
  fly(game, 60, () => { if (seen.at(-1) !== game.score) seen.push(game.score); });
  assert.equal(game.phase, 'running'); assert.ok(game.score > 8, `score ${game.score}`);
  assert.deepEqual(seen, [...Array(game.score + 1).keys()]); // +1 steps only, never skipped or repeated
  assert.equal(game.pipes.filter(p => p.passed).length <= game.score, true);
});

test('endless mount: best saved, no story receipt, no completion callback, retry restarts', async () => {
  const store = new Map(); let frame = null;
  const handlers = {}, nodes = new Map();
  const node = () => new Proxy({}, {get: (t, k) => k in t ? t[k] : k === 'getContext' ? () => new Proxy({}, {get: () => () => {}, set: () => true})
    : k === 'querySelector' ? sel => (nodes.has(sel) || nodes.set(sel, node()), nodes.get(sel))
    : k === 'classList' ? {add() {}} : k === 'addEventListener' ? (type, fn) => { handlers[type] = fn; } : () => {}, set: (t, k, v) => (t[k] = v, true)});
  Object.assign(globalThis, {
    localStorage: {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)},
    document: {hidden: false, addEventListener() {}, removeEventListener() {}},
    requestAnimationFrame: f => (frame = f, 1), cancelAnimationFrame() { frame = null; },
    location: {assign() { throw new Error('redirect'); }},
  });
  const {mountTubFlight, BEST_KEY, FUEL_KEY} = await import('../arcade/tub-flight/game.mjs');
  let completed = 0; store.set(BEST_KEY, '3');
  const host = node(), mounted = mountTubFlight(host, {endless: true, onComplete: () => completed++, autoFuel: true}), {game} = mounted;
  const tap = () => handlers.pointerdown({preventDefault() {}});
  let now = 1000; tap();
  for (let i = 0; i < 6000 && game.score < 10; i++) {
    const next = game.pipes.find(p => p.x + 44 > 69);
    if (game.y > (next ? next.gap : 210) + 10 && game.velocity > 0) tap();
    const f = frame; frame = null; now += 16.7; f(now);
  }
  assert.ok(game.score >= 10 && game.phase === 'running', `score ${game.score} ${game.phase}`);
  let reached = game.score;
  while (frame && game.phase === 'running') { const f = frame; frame = null; now += 16.7; f(now); } // stop flapping: tub falls
  assert.equal(game.phase, 'crashed');
  assert.equal(store.has(FUEL_KEY), false); assert.equal(completed, 0);
  assert.equal(Number(store.get(BEST_KEY)), game.score); assert.ok(game.score >= reached);
  reached = game.score;
  host.querySelector('[data-retry]').onclick();
  assert.equal(game.phase, 'ready'); assert.equal(game.score, 0); assert.equal(Number(store.get(BEST_KEY)), reached);
  mounted.dispose();
});

test('gen_apps is idempotent', () => {
  const sha = () => execFileSync('git', ['hash-object', 'apps/fuel/index.html', 'apps/fuel/manifest.webmanifest'], {encoding: 'utf8'});
  const before = sha(); execFileSync('python', ['tools/gen_apps.py']); assert.equal(sha(), before);
});
