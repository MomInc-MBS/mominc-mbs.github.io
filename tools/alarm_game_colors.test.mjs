import test from 'node:test';
import assert from 'node:assert/strict';
import {PALETTE, STORAGE_KEY, GAME_STORAGE_KEY, GAME_TARGETS, TARGETS, loadTheme, saveTheme, loadGameTheme, saveGameTheme, textColorFor, GAME_COLOR_HELP} from '../apps/alarm/ui/game-colors.js';

const mem = (init = {}) => ({d: {...init}, getItem(k) { return k in this.d ? this.d[k] : null; }, setItem(k, v) { this.d[k] = v; }});

test('palette: 20 distinct valid hex colours in the agreed order', () => {
  assert.equal(PALETTE.length, 20);
  assert.ok(PALETTE.every(c => /^#[0-9A-F]{6}$/.test(c.hex) && c.name));
  assert.equal(new Set(PALETTE.map(c => c.hex)).size, 20);
  assert.equal(PALETTE[0].hex, '#0B0B14'); assert.equal(PALETTE[19].hex, '#F8FAFC'); assert.equal(PALETTE[8].name, 'Orange');
});
test('three targets persist independently', () => {
  const s = mem();
  assert.deepEqual(loadTheme(s), {v: 1, background: null, tiles: null, board: null});
  saveTheme({background: 3, tiles: null, board: 19}, s);
  assert.deepEqual(loadTheme(s), {v: 1, background: 3, tiles: null, board: 19});
  assert.ok(STORAGE_KEY === 'mom-alarm-2048-game-theme-v1' && s.d[STORAGE_KEY]);
});
test('malformed / old storage -> defaults, never throws', () => {
  const def = {v: 1, background: null, tiles: null, board: null};
  for (const bad of ['{', 'null', '5', '{"v":2,"tiles":1}', '{"v":1,"tiles":99,"board":"x","background":-1}', '[]'])
    assert.deepEqual(loadTheme(mem({[STORAGE_KEY]: bad})), bad.includes('"v":1') ? def : def);
  assert.deepEqual(loadTheme({getItem() { throw new Error('blocked'); }}), def);
  assert.doesNotThrow(() => saveTheme(def, {setItem() { throw new Error('full'); }}));
  assert.deepEqual(loadTheme(mem({[STORAGE_KEY]: '{"v":1,"tiles":4,"board":99}'})), {v: 1, background: null, tiles: 4, board: null});
});
test('textColorFor is readable on every swatch', () => {
  assert.equal(textColorFor('#F8FAFC'), '#10101C'); assert.equal(textColorFor('#0B0B14'), '#FFFFFF');
  for (const c of PALETTE) assert.match(textColorFor(c.hex), /^#(10101C|FFFFFF)$/);
});
test('help lines exist for every control key', () => {
  for (const k of ['handle', 'close', 'tab-background', 'tab-tiles', 'tab-board', 'swatch', 'reset']) assert.ok(GAME_COLOR_HELP[k]);
});

test('every game has exactly three targets, background first, each with a help line; 2048 keeps its own three', () => {
  assert.deepEqual(Object.keys(GAME_TARGETS), ['2048', 'brick', 'pong', 'match3', 'blocks', 'memory', 'odd']);
  for (const [id, t] of Object.entries(GAME_TARGETS)) {
    assert.equal(t.length, 3, id); assert.equal(new Set(t).size, 3, id); assert.equal(t[0], 'background', id);
    for (const k of t) assert.ok(GAME_COLOR_HELP['tab-' + k], `${id}/${k}`);
  }
  assert.deepEqual(GAME_TARGETS['2048'], TARGETS); assert.deepEqual(TARGETS, ['background', 'tiles', 'board']);
  for (const id of ['match3', 'blocks', 'memory', 'odd']) assert.ok(!GAME_TARGETS[id].some(k => /piece|face|answer|kind/.test(k)));   // nothing that tells pieces apart is recolourable
});
test('per-game themes round-trip independently under one key; 2048 key and format are untouched', () => {
  const s = mem();
  assert.deepEqual(loadGameTheme(s, 'pong'), {background: null, paddles: null, ball: null});
  assert.ok(saveGameTheme(s, 'pong', {background: 3, paddles: null, ball: 19}));
  assert.ok(saveGameTheme(s, 'odd', {background: null, slots: 8, frame: 0}));
  assert.deepEqual(loadGameTheme(s, 'pong'), {background: 3, paddles: null, ball: 19});
  assert.deepEqual(loadGameTheme(s, 'odd'), {background: null, slots: 8, frame: 0});
  assert.deepEqual(loadGameTheme(s, 'brick'), {background: null, bricks: null, paddle: null});
  assert.deepEqual(JSON.parse(s.d[GAME_STORAGE_KEY]), {pong: {background: 3, ball: 19}, odd: {slots: 8, frame: 0}});
  assert.equal(GAME_STORAGE_KEY, 'mom-alarm-game-themes-v1'); assert.equal(s.d[STORAGE_KEY], undefined);
  assert.deepEqual(loadTheme(s), {v: 1, background: null, tiles: null, board: null});   // 2048 is not affected
});
test('2048 back-compat: stored colours still load, and saving writes the same bytes as before', () => {
  const old = '{"v":1,"background":3,"tiles":null,"board":19}', s = mem({[STORAGE_KEY]: old});
  const t = loadTheme(s); assert.deepEqual(t, {v: 1, background: 3, tiles: null, board: 19});
  saveTheme(t, s); assert.equal(s.d[STORAGE_KEY], old);
  assert.equal(s.d[GAME_STORAGE_KEY], undefined);
});
test('game themes load defensively: bad JSON, wrong shapes, out-of-range / non-integer index -> default; blocked storage never throws', () => {
  const def = {background: null, bricks: null, paddle: null};
  for (const bad of ['{', 'null', '5', '[]', '"x"', '{"brick":5}', '{"brick":null}', '{"brick":[1,2]}']) assert.deepEqual(loadGameTheme(mem({[GAME_STORAGE_KEY]: bad}), 'brick'), def, bad);
  assert.deepEqual(loadGameTheme(mem({[GAME_STORAGE_KEY]: '{"brick":{"background":99,"bricks":-1,"paddle":1.5}}'}), 'brick'), def);
  assert.deepEqual(loadGameTheme(mem({[GAME_STORAGE_KEY]: '{"brick":{"background":4,"bricks":99,"paddle":"2","other":1}}'}), 'brick'), {background: 4, bricks: null, paddle: null});
  assert.deepEqual(loadGameTheme({getItem() { throw new Error('blocked'); }}, 'brick'), def);
  assert.equal(saveGameTheme({getItem() { throw new Error('x'); }, setItem() { throw new Error('full'); }}, 'brick', def), false);
  const s = mem({[GAME_STORAGE_KEY]: '[1]'}); assert.ok(saveGameTheme(s, 'pong', {background: 1, paddles: null, ball: null})); assert.deepEqual(JSON.parse(s.d[GAME_STORAGE_KEY]), {pong: {background: 1}});   // a corrupt map is replaced, not crashed on
});
test('the in-play game switch honours [hidden] and the colour drawer is no longer hidden for other games', async () => {
  const {readFileSync} = await import('node:fs'), css = readFileSync(new URL('../apps/alarm/app.css', import.meta.url), 'utf8');
  assert.match(css, /\.al-sw\[hidden\]\{display:none\}/); assert.ok(!/\.gm \.gc-root\{display:none/.test(css));
});
