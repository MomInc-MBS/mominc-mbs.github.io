// Pure logic of apps/alarm/ui/help.js: no DOM needed. node --test tools/check_alarm_help.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTyper, createJokeGate, wanted, kindOf, helpFor, TAGS} from '../apps/alarm/ui/help.js';

const fakeTimers = () => { let q = []; return {setT: (f, ms) => q.push({f, ms}) && q.length, clearT: () => { q = []; }, run: () => { const t = q.shift(); t?.f(); return !!t; }, size: () => q.length}; };

test('typer: a new line replaces the old one (no queue) and the mouth follows the reveal', () => {
  const tm = fakeTimers(), shown = [], talk = [];
  const t = createTyper({render: s => shown.push(s), talk: b => talk.push(b), setT: tm.setT, clearT: tm.clearT});
  t.say('Hello there.'); tm.run(); tm.run();
  t.say('Fresh.');                                   // replaces mid-type
  assert.equal(tm.size(), 1, 'one timer only');
  while (tm.run());
  assert.equal(shown.at(-1), 'Fresh.');
  assert.ok(!shown.some(s => s.startsWith('Hello there')), 'stale line never finishes');
  assert.equal(talk.at(-1), false, 'mouth closed at the end');
});
test('typer: skip reveals everything; reduced motion is instant; one announce per line', () => {
  const tm = fakeTimers(), shown = [], ann = [];
  const t = createTyper({render: s => shown.push(s), announce: a => ann.push(a), setT: tm.setT, clearT: tm.clearT});
  t.say('Whole line.'); t.skip(); assert.equal(shown.at(-1), 'Whole line.'); assert.equal(tm.size(), 0); assert.deepEqual(ann, ['Whole line.']);
  const r = createTyper({render: s => shown.push(s), instant: () => true, setT: tm.setT, clearT: tm.clearT}); r.say('Instant.'); assert.equal(shown.at(-1), 'Instant.');
});
test('typer: if rendering throws, the full text still lands', () => {
  let n = 0, last = ''; const t = createTyper({render: s => { if (n++ === 0) throw new Error('x'); last = s; }, setT: () => 0, clearT: () => {}});
  t.say('Plain text.'); assert.equal(last, 'Plain text.');
});
test('jokes: 15 s cooldown and never one of the last 5', () => {
  let now = 0, i = 0; const g = createJokeGate({now: () => now, rng: () => 0});
  const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  assert.equal(g.take(pool), 'a'); now = 14000; assert.equal(g.take(pool), null, 'cooldown');
  const seen = ['a']; for (i = 0; i < 4; i++) { now += 15000; seen.push(g.take(pool)); }
  assert.equal(new Set(seen).size, 5, 'five distinct in a row'); now += 15000; assert.equal(g.take(pool), 'f');
  now += 15000; assert.equal(g.take(['f']), null, 'recent line refused');
  assert.ok(TAGS.length >= 12);
});
test('sliders explain on commit only; text fields never', () => {
  const sl = {matches: s => s.includes('range')}, tx = {matches: s => s === 'input,textarea'}, bt = {matches: () => false};
  assert.equal(wanted('input', kindOf(sl)), false); assert.equal(wanted('click', kindOf(sl)), false); assert.equal(wanted('change', kindOf(sl)), true);
  assert.equal(wanted('click', kindOf(bt)), true); assert.equal(wanted('change', kindOf(tx)), false);
});
test('draft wording says selected / ready to arm, and saved only when saveUi is saved', () => {
  const S = {stageSel: 0, draft: {id: 'r', sound: {stage: ['air-horn', null, null, null], volume: 70, rotate: false, ramp: null}}, picked: true, saveUi: null};
  for (const k of ['snd:air-horn', 'vol', 'pat:continuous', 'rotate']) { const t = helpFor(k, {S, el: null}).t; assert.doesNotMatch(t, /saved/i, k); }
  assert.match(helpFor('snd:air-horn', {S, el: null}).t, /selected/);
  assert.match(helpFor('vol', {S, el: null}).t, /70 percent.*ready to arm/);
  assert.doesNotMatch(helpFor('save', {S, el: null})?.t || '', /saved and armed/i);
  assert.match(helpFor('save', {S: {...S, saveUi: 'saved', draft: null}, el: null}).t, /^Saved and armed/);
  assert.match(helpFor('save', {S: {...S, picked: false}, el: null}).t, /Nothing is saved/);
});
