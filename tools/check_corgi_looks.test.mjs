// node --test tools/check_corgi_looks.test.mjs : the 100-look catalogue is complete, matched and drawable.
import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOKS, lookById, applyLook, noseMarkup, pawMarkup, gripMarkup, FAMILY_IDS, PATTERN_IDS, LOOK_GROUPS, lum, DEFAULT_LOOK} from '../tv/channels/corgi-looks.mjs';

const hex = /^#[0-9a-f]{6}$/;

test('exactly 100 unique ids animal_001..animal_100, frozen', () => {
  assert.equal(LOOKS.length, 100);
  assert.deepEqual(LOOKS.map(l => l.id), Array.from({length: 100}, (_, i) => 'animal_' + String(i + 1).padStart(3, '0')));
  assert.equal(new Set(LOOKS.map(l => l.name)).size, 100, 'unique names');
  assert.ok(Object.isFrozen(LOOKS) && Object.isFrozen(LOOKS[5]));
  for (const l of LOOKS) {
    assert.ok(hex.test(l.base) && hex.test(l.mark) && hex.test(l.skin) && hex.test(l.claw), l.id);
    assert.ok(LOOK_GROUPS.includes(l.group), l.id + ' group');
    assert.ok(l.scale >= .9 && l.scale <= 1.1, l.id + ' scale');
  }
  assert.equal(LOOKS.filter(l => l.group === 'dog').length, 40);
  assert.equal(LOOKS.filter(l => l.group === 'wild canid').length, 10);
  assert.equal(LOOKS.filter(l => l.group === 'cat').length, 20);
  assert.equal(LOOKS.filter(l => l.group === 'wild cat').length, 12);
  assert.equal(LOOKS.filter(l => l.group === 'rabbit').length, 8);
  assert.equal(LOOKS.filter(l => l.group === 'bear').length, 10);
});

test('all 15 families and every pattern in use resolve to markup', () => {
  assert.equal(FAMILY_IDS.length, 15);
  const fams = new Set(LOOKS.map(l => l.family));
  assert.deepEqual([...fams].sort(), [...FAMILY_IDS].sort(), 'every family is used and known');
  for (const l of LOOKS) {
    assert.ok(PATTERN_IDS.includes(l.pattern), l.id + ' pattern ' + l.pattern);
    const n = noseMarkup(l), l1 = pawMarkup(l, 'l'), r1 = pawMarkup(l, 'r'), g = gripMarkup(l);
    for (const m of [n, l1, r1, g]) assert.match(m, /^<svg[\s\S]*<\/svg>$/, l.id);
    assert.ok(n.includes('var(--skin') && l1.includes('var(--skin') && g.includes('var(--skin'), l.id + ' skin shared by nose, paw, grip');
    assert.ok(n.includes('var(--fur,') && l1.includes('var(--fur,') && g.includes('var(--fur,'), l.id + ' fur shared');
    assert.ok(l1.includes('var(--claw') && g.includes('var(--claw'), l.id + ' claws');
    assert.ok(!/undefined|NaN/.test(n + l1 + r1 + g), l.id + ' bad number');
  }
});

test('animal_001 is today\'s corgi', () => {
  const l = lookById('animal_001');
  assert.equal(l.base, '#caa06a'); assert.equal(l.skin, '#2a1a10'); assert.equal(l.pattern, 'solid'); assert.equal(DEFAULT_LOOK, 'animal_001');
  assert.ok(noseMarkup(l).includes('M50 3C68 3 '), 'same cone as the original nose');
});

test('claws contrast with both the coat and the skin', () => {
  for (const l of LOOKS) {
    const d = Math.min(Math.abs(lum(l.claw) - lum(l.base)), Math.abs(lum(l.claw) - lum(l.skin)));
    assert.ok(d >= .2, `${l.id} ${l.name}: claw ${l.claw} vs fur ${l.base} / skin ${l.skin} diff ${d.toFixed(2)}`);
  }
});

test('lookById falls back to the default for unknown ids', () => {
  for (const id of ['animal_999', '', undefined, null, 'x', 'animal_000']) assert.equal(lookById(id).id, 'animal_001');
  assert.equal(lookById('animal_042').id, 'animal_042');
});

test('applyLook sets vars once and is idempotent', () => {
  const vars = {}, dataset = {}, el = {innerHTML: ''}, els = {'.cc-nose': {innerHTML: ''}, '.cc-paw.l': {innerHTML: ''}, '.cc-paw.r': {innerHTML: ''}, '.cc-grip': {innerHTML: ''}};
  const root = {style: {setProperty: (k, v) => { vars[k] = v; }}, dataset, querySelector: s => els[s] || el};
  const l = lookById('animal_047'); applyLook(root, l);
  assert.equal(vars['--fur'], l.base); assert.equal(vars['--skin'], l.skin); assert.equal(vars['--claw'], l.claw);
  assert.equal(dataset.lookFamily, 'fox'); assert.equal(dataset.lookPattern, 'dark-feet');
  assert.ok(els['.cc-grip'].innerHTML.includes('<svg') && els['.cc-nose'].innerHTML.includes('<svg'));
  els['.cc-nose'].innerHTML = 'kept'; applyLook(root, l); assert.equal(els['.cc-nose'].innerHTML, 'kept', 'same id: no redraw');
  applyLook(root, 'animal_003'); assert.notEqual(els['.cc-nose'].innerHTML, 'kept');
});
