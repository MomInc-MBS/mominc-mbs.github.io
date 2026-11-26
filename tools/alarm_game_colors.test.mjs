import test from 'node:test';
import assert from 'node:assert/strict';
import {PALETTE, STORAGE_KEY, loadTheme, saveTheme, textColorFor, GAME_COLOR_HELP} from '../apps/alarm/ui/game-colors.js';

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
