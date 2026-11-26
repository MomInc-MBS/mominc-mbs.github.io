// Coach Jump pyramid menu: selector state machine, the P11 `hold` patch in the vendored game, GO guarding. No browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATS, layout, initialState, fixTrack, pick, step, toLook, runConfig, saveLook, LOOK_KEY} from '../apps/jump/selector.mjs';
import {PAPER_SHAPES, PAPER_PALETTES} from '../tv/channels/girlfriend-roster.js';

const catalog = {shapes: PAPER_SHAPES.map(s => s.id), palettes: PAPER_PALETTES.map(p => p.id), tracks: ['t-a', 't-b', 't-c']};
const defaults = {shapeId: 'myr5', paletteId: 0, eyes: 2, trackId: 't-a'};
const fresh = (over = {}) => initialState({saved: null, round: null, catalog, defaults, ...over});
const memory = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)}; };

test('swap table: every active selector puts that category bottom-centre and Music in its vacated slot (PLAN section 4)', () => {
  assert.deepEqual(layout('music'), {left: 'color', right: 'coach', center: 'music'});
  assert.deepEqual(layout('coach'), {left: 'color', right: 'music', center: 'coach'});
  assert.deepEqual(layout('color'), {left: 'music', right: 'coach', center: 'color'});
  // all nine transitions: the layout depends only on the target, so inactive categories always return home first
  for (const from of CATS) for (const to of CATS) {
    const s = pick({...fresh(), active: from}, to);
    assert.equal(s.active, to);
    assert.deepEqual(layout(s.active), layout(to), `${from} -> ${to}`);
    const l = layout(s.active);
    assert.deepEqual([l.left, l.right, l.center].sort(), ['coach', 'color', 'music']);
  }
  // Coach -> Color: Coach returns to the right tile and Music moves to the left tile
  assert.deepEqual(layout(pick({...fresh(), active: 'coach'}, 'color').active), {left: 'music', right: 'coach', center: 'color'});
});

test('default = music mode; a category tap changes only the active selector', () => {
  const s = fresh();
  assert.equal(s.active, 'music');
  const t = pick(s, 'coach');
  assert.deepEqual({...t, active: 'music'}, s);
  assert.equal(pick(t, 'coach'), t, 'tapping the active category again is a no-op');
  assert.equal(pick(s, 'nonsense'), s);
});

test('arrows move only the active category, wrap at both ends, and the three values stay independent', () => {
  let s = pick(fresh(), 'coach');
  const before = {palette: s.paletteId, track: s.trackId, eyes: s.eyes};
  s = step(s, 1, catalog);
  assert.equal(s.shapeId, catalog.shapes[1]);
  assert.deepEqual({palette: s.paletteId, track: s.trackId, eyes: s.eyes}, before);
  s = step(step(s, -1, catalog), -1, catalog);                       // back to the start, then wrap to the last
  assert.equal(s.shapeId, catalog.shapes.at(-1));
  s = step(s, 1, catalog);
  assert.equal(s.shapeId, catalog.shapes[0], 'forward wrap');
  s = pick(s, 'color');
  s = step(step(s, -1, catalog), -1, catalog);
  assert.equal(s.paletteId, catalog.palettes.at(-2));
  assert.equal(s.shapeId, catalog.shapes[0], 'colour never changes the shape');
  s = pick(s, 'music');
  s = step(step(step(s, 1, catalog), 1, catalog), 1, catalog);
  assert.equal(s.trackId, 't-a', 'three tracks, three steps = full wrap');
  // switching category keeps every value
  const kept = {shapeId: s.shapeId, paletteId: s.paletteId, trackId: s.trackId};
  for (const c of CATS) assert.deepEqual({shapeId: pick(s, c).shapeId, paletteId: pick(s, c).paletteId, trackId: pick(s, c).trackId}, kept);
  // Previous returns to the exact preceding variant
  const k = pick(fresh(), 'coach');
  assert.equal(step(step(k, 1, catalog), -1, catalog).shapeId, k.shapeId);
  // no catalog yet (music still loading): the arrows are a no-op, never a crash
  assert.equal(step(pick(fresh({catalog: {...catalog, tracks: []}}), 'music'), 1, {...catalog, tracks: []}).trackId, 't-a');
});

test('saved look: ids not indexes, each invalid field falls back on its own, then the round, then the fixed default', () => {
  const saved = {v: 1, shapeId: catalog.shapes[7], paletteId: catalog.palettes[5], eyes: 4, trackId: 't-c'};
  const s = fresh({saved});
  assert.deepEqual(toLook(s), saved);
  // reordering the catalogue keeps the SAME ids selected (an index would have moved)
  const reordered = {...catalog, shapes: [...catalog.shapes].reverse(), tracks: ['t-c', 't-b', 't-a']};
  assert.equal(initialState({saved, catalog: reordered, defaults}).shapeId, catalog.shapes[7]);
  assert.equal(initialState({saved, catalog: reordered, defaults}).trackId, 't-c');
  // a number where an id belongs must not be read as an index into the shapes
  assert.equal(fresh({saved: {shapeId: 3}}).shapeId, 'myr5');
  // field-by-field fallback: only the bad field changes
  const bad = fresh({saved: {shapeId: 'gone', paletteId: 999, eyes: 9, trackId: 'gone-track'}});
  assert.deepEqual(toLook(bad), {v: 1, shapeId: 'myr5', paletteId: 0, eyes: 2, trackId: 't-a'});
  const mixed = fresh({saved: {shapeId: catalog.shapes[3], paletteId: 'x', eyes: 5, trackId: 'nope'}});
  assert.equal(mixed.shapeId, catalog.shapes[3]); assert.equal(mixed.paletteId, 0); assert.equal(mixed.eyes, 5); assert.equal(mixed.trackId, 't-a');
  // order: saved, then the saved round's Coach, then default
  const round = {shapeId: catalog.shapes[9], paletteId: catalog.palettes[2], eyes: 3};
  const r = fresh({saved: {shapeId: 'gone', paletteId: catalog.palettes[8]}, round});
  assert.equal(r.shapeId, catalog.shapes[9]); assert.equal(r.paletteId, catalog.palettes[8]); assert.equal(r.eyes, 3);
  // junk of any type never throws
  for (const junk of [null, undefined, 5, 'str', [], {v: 1}]) assert.ok(fresh({saved: junk, round: junk}).shapeId);
});

test('track id survives until the soundtrack catalogue arrives, then is validated', () => {
  const early = initialState({saved: {trackId: 'laboratory-violence'}, catalog: {...catalog, tracks: []}, defaults});
  assert.equal(early.trackId, 'laboratory-violence', 'an empty catalogue must not wipe the saved song');
  assert.equal(fixTrack(early, ['laboratory-violence', 'x'], 'x').trackId, 'laboratory-violence');
  assert.equal(fixTrack(early, ['a', 'b'], 'b').trackId, 'b', 'unknown id -> default');
  assert.equal(fixTrack(early, ['a', 'b'], 'zzz').trackId, 'a', 'unknown default -> first');
  assert.equal(fixTrack(early, [], 'b'), early, 'still empty: unchanged');
});

test('persistence: {v:1, shapeId, paletteId, eyes, trackId} under the look key, and RunConfig is a frozen snapshot', () => {
  const store = memory();
  const s = pick(fresh(), 'color');
  saveLook(store, s);
  assert.equal(LOOK_KEY, 'mbs-app-jump-look-v1');
  assert.deepEqual(JSON.parse(store.getItem(LOOK_KEY)), {v: 1, shapeId: 'myr5', paletteId: 0, eyes: 2, trackId: 't-a'});
  assert.ok(!('active' in JSON.parse(store.getItem(LOOK_KEY))), 'the active selector is never saved: every open starts in music mode');
  const cfg = runConfig(s);
  assert.ok(Object.isFrozen(cfg));
  const moved = step(s, 1, catalog);
  assert.equal(cfg.paletteId, 0, 'later menu changes never reach a snapshot');
  assert.notEqual(moved.paletteId, cfg.paletteId);
  assert.doesNotThrow(() => saveLook({setItem() { throw new Error('quota'); }}, s));
});

// ---- P11 hold, against the real vendored game.mjs with a minimal fake DOM ----------------------------------------------------
function installFakeDom() {
  const noop = () => {};
  const ctx = new Proxy({}, {get: (t, k) => k === 'createImageData' ? () => ({data: new Uint8ClampedArray(96 * 96 * 4)}) : (k === 'createPattern') ? () => ({}) : /^create(Linear|Radial)Gradient$/.test(k) ? () => ({addColorStop: noop}) : k === 'measureText' ? () => ({width: 1}) : t[k] ?? noop, set: (t, k, v) => ((t[k] = v), true)});
  const el = () => {
    const e = {style: {}, dataset: {}, isConnected: true, children: [], setAttribute: noop, append() {}, remove: noop, addEventListener: noop, removeEventListener: noop, closest: () => null, getContext: () => ctx,
      getBoundingClientRect: () => ({left: 0, top: 0, width: 360, height: 640}), width: 360, height: 640, textContent: '', replaceChildren: noop};
    return e;
  };
  const queue = [], handlers = {};
  Object.assign(globalThis, {
    Path2D: class {moveTo() {} lineTo() {} closePath() {} arc() {} rect() {} quadraticCurveTo() {} bezierCurveTo() {} ellipse() {}},
    ResizeObserver: class {observe() {} disconnect() {}},
    devicePixelRatio: 1,
    requestAnimationFrame: cb => (queue.push(cb), queue.length),
    cancelAnimationFrame: noop,
    addEventListener: (type, fn) => { (handlers[type] ||= []).push(fn); },
    removeEventListener: (type, fn) => { handlers[type] = (handlers[type] || []).filter(f => f !== fn); },
    localStorage: {getItem: () => null, setItem: noop, removeItem: noop},
  });
  const doc = {createElement: el, hidden: false, addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, defaultView: globalThis};
  Object.defineProperty(globalThis, 'document', {value: doc, configurable: true, writable: true});
  return {root: el(), queue, handlers};
}
const frames = (dom, n, t0 = 1000) => { for (let i = 0; i < n; i++) { const cb = dom.queue.shift(); cb?.(t0 + i * 16); } };

test('P11 hold: the game draws but never steps (no physics, score, keys, tilt) until the hold resolves', async () => {
  const dom = installFakeDom();
  const {startGame} = await import(new URL('../arcade/pyramid-jump/game.mjs', import.meta.url).href + '?hold');
  let release, tiltCb;
  const hold = new Promise(r => (release = r));
  const phases = [];
  const g = startGame(dom.root, {startLevel: 1, seed: 7, hold, subscribeMotion: cb => { tiltCb = cb; return () => {}; }});
  const y0 = g.state().p.y, x0 = g.state().p.x;
  tiltCb({steerX: 1});
  for (const fn of dom.handlers.keydown || []) fn({key: 'ArrowRight'});
  frames(dom, 30);
  assert.equal(g.state().p.y, y0, 'no physics while held');
  assert.equal(g.state().p.x, x0, 'keys and tilt ignored while held');
  assert.equal(g.state().maxY, 0);
  release(); await Promise.resolve(); await Promise.resolve();
  frames(dom, 30, 2000);
  assert.notEqual(g.state().p.y, y0, 'physics runs after release');
  g.dispose();
  void phases;
});

test('P11 hold: without `hold` the game steps from the very first frame (the TV Dr Girlfriend page relies on this)', async () => {
  const dom = installFakeDom();
  const {startGame} = await import(new URL('../arcade/pyramid-jump/game.mjs', import.meta.url).href + '?nohold');
  const g = startGame(dom.root, {startLevel: 1, seed: 7});
  const y0 = g.state().p.y;
  frames(dom, 5);
  assert.notEqual(g.state().p.y, y0);
  g.dispose();
});

test('P11 is applied by tools/sync_pyramid_jump.py and listed in SYNC.json; the TV page passes no hold', () => {
  const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const tool = read('tools/sync_pyramid_jump.py');
  for (const anchor of ['hold=null}={}', 'if(holding)return;tilt=', 'if(holding)return;const k=e.key', '&&!holding&&', 'if(!holding)step(dt)']) assert.ok(tool.includes(anchor), anchor);
  assert.ok(JSON.parse(read('arcade/pyramid-jump/SYNC.json')).patches.some(p => p.startsWith('P11')));
  assert.ok(!/hold/.test(read('tv/channels/girlfriend.js').match(/startGame\([^)]*\)/g)?.join(' ') || ''), 'girlfriend.js must keep calling startGame without hold');
});

// ---- GO is guarded: a double tap starts exactly one run ----------------------------------------------------------------------
test('GO double/triple tap -> exactly one startGame (run.mjs guard)', () => {
  const src = readFileSync(new URL('../apps/jump/run.mjs', import.meta.url), 'utf8');
  // the first GO flips phase synchronously, before any await; every later tap returns at the guard
  const go = src.slice(src.indexOf('async function go()'), src.indexOf('/** Mounts the game'));
  assert.ok(go.indexOf("if (phase !== 'menu'") < go.indexOf("phase = 'starting'") && go.indexOf("phase = 'starting'") < go.indexOf('await'), 'guard, then phase flip, then the first await');
  assert.equal((src.match(/startGame\(/g) || []).length, 1, 'one call site');
  assert.ok(/menu\.lock\(true\)/.test(go), 'menu is inert after the first GO');
});
