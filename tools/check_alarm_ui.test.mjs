// Pure checks for apps/alarm/ui: face presets/stage mapping/reaction bounds, HH:MM:SS + countdown, weekday date columns,
// the on-screen recurrence preview against the contract vectors, glyph hygiene and challenge answers.  node --test tools/check_alarm_ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {baseForStage, paramsFor, REACTIONS, envelope, compose, NEUTRAL} from '../apps/alarm/ui/mom-face.js';
import {hms, countdown, weekColumns, monthCells, nextDue, upcoming, offsetLabel} from '../apps/alarm/ui/time.js';
import {G, icon, strip, VIB_WAVE, SOUND_WAVE, CAP_GLYPH, OUTCOME_GLYPH} from '../apps/alarm/ui/glyphs.js';
import {makeMath, makePattern} from '../apps/alarm/ui/challenges.js';
import {N, CAP, STATE} from '../apps/alarm/ui/names.js';

test('stage -> base emotion follows the contract', () => {
  assert.deepEqual(baseForStage(1), ['happy', .5]);
  assert.deepEqual(baseForStage(2), ['upset', .7]);
  assert.deepEqual(baseForStage(3), ['furious', .7]);
  assert.deepEqual(baseForStage(4), ['furious', 1]);
  assert.deepEqual(baseForStage(null), ['happy', .3]);
});

test('presets: three readable emotions, stage 4 = same furious family with a static accent', () => {
  const [h, u, f3, f4] = [1, 2, 3, 4].map(s => paramsFor(...baseForStage(s)));
  assert.ok(h.mouth > .4 && u.mouth < -.2 && f3.mouth < u.mouth, 'smile vs frown vs harder frown');
  assert.ok(h.brow < 0 && u.brow > .2 && f3.brow > u.brow + .3, 'brows: raised, lowered, sharply angled');
  assert.ok(f3.open > .3 && u.open === 0, 'furious mouth is open, upset is pressed');
  assert.equal(h.accent, 0); assert.equal(u.accent, 0);
  assert.ok(f3.accent > 0 && f3.accent < .8 && f4.accent === 1 && f4.lean > 0, 'stage 4 adds accent + lean, not a new emotion');
  for (const k of Object.keys(NEUTRAL)) assert.equal(paramsFor('furious', .7)[k], f3[k], 'deterministic');
  assert.deepEqual(paramsFor('nonsense', 2), paramsFor('happy', 1), 'unknown emotion / out-of-range intensity is clamped');
});

test('reactions: 150-500 ms, one additive offset, never mutate the base', () => {
  for (const [k, r] of Object.entries(REACTIONS)) {
    assert.ok(r.ms >= 150 && r.ms <= 500, k + ' duration');
    assert.equal(envelope(k, 0), 0); assert.ok(Math.abs(envelope(k, 1)) < 1e-9, k + ' ends at rest');
  }
  assert.deepEqual(Object.keys(REACTIONS).sort(), ['blink', 'concern', 'glance', 'lean', 'neutral', 'nod', 'sleepy', 'tilt']);
  const base = paramsFor('furious', 1), snap = JSON.stringify(base);
  const p = compose(base, {x: 1, y: 1}, REACTIONS.nod.f(), 1);
  assert.equal(JSON.stringify(base), snap, 'base untouched');
  assert.equal(p.brow, base.brow, 'a nod during a furious alarm keeps the furious brows');
  assert.ok(p.oy > base.oy);
  const b = compose(base, null, REACTIONS.blink.f(), 1); assert.equal(b.lid, 0, 'lid clamped at 0');
  const g = compose(base, {x: 5, y: -5}); assert.ok(g.gx <= 1 && g.gy >= -1, 'gaze clamped');
  for (const k of ['neutral', 'nod']) { const d = REACTIONS[k].f(); assert.ok(!('brow' in d) && !('mouth' in d), k + ' adds no emotion'); }
});

test('durations are HH:MM:SS; lock countdown rounds up and stops at zero', () => {
  assert.equal(hms(0), '00:00:00'); assert.equal(hms(30), '00:00:30'); assert.equal(hms(300), '00:05:00'); assert.equal(hms(3725), '01:02:05'); assert.equal(hms(-5), '00:00:00');
  assert.equal(countdown(10_000, 0), '00:00:10'); assert.equal(countdown(10_001, 0), '00:00:11'); assert.equal(countdown(0, 5000), '00:00:00');
  assert.equal(countdown(540_000, 330_000), '00:03:30');
});

test('weekday columns: 7 real date columns starting today, weeks stacked', () => {
  const cols = weekColumns('2026-11-26', 3);                     // Thursday
  assert.equal(cols.length, 7);
  assert.deepEqual(cols.map(c => c.wd), [4, 5, 6, 0, 1, 2, 3]);
  assert.deepEqual(cols[0].keys, ['2026-11-26', '2026-12-03', '2026-12-10']);
  assert.deepEqual(cols[6].keys, ['2026-12-02', '2026-12-09', '2026-12-16']);
  assert.ok(cols.every(c => new Set(c.keys.map(k => new Date(k + 'T12:00:00Z').getUTCDay())).size === 1), 'one weekday per column');
  const m = monthCells(2026, 2); assert.equal(m.length, 42); assert.equal(m.filter(c => c.inMonth).length, 28); assert.equal(m.find(c => c.inMonth).key, '2026-02-01');
});

test('on-screen recurrence preview passes the contract vectors (America/Los_Angeles)', () => {
  const LA = 'America/Los_Angeles', T = s => Date.parse(s);
  const r = (time, recur) => ({time, recur: {skip: [], skipNext: false, ...recur}, tz: {mode: 'fixed', zone: LA}});
  const V = [
    [r('07:30', {kind: 'daily'}), '2026-11-26T08:00:00-08:00', '2026-11-27T07:30:00-08:00'],
    [r('07:30', {kind: 'weekly', days: [1, 3, 5]}), '2026-11-26T08:00:00-08:00', '2026-11-27T07:30:00-08:00'],
    [r('07:30', {kind: 'weekly', days: [1], skip: ['2026-11-30']}), '2026-11-26T00:00:00-08:00', '2026-12-07T07:30:00-08:00'],
    [r('09:00', {kind: 'interval', every: 3, start: '2026-11-26'}), '2026-11-26T10:00:00-08:00', '2026-11-29T09:00:00-08:00'],
    [r('02:30', {kind: 'daily'}), '2027-03-13T12:00:00-08:00', '2027-03-14T03:30:00-07:00'],
    [r('01:30', {kind: 'daily'}), '2026-10-31T12:00:00-07:00', '2026-11-01T01:30:00-07:00'],
    [r('08:00', {kind: 'dates', dates: ['2026-12-01', '2026-11-28']}), '2026-11-26T00:00:00-08:00', '2026-11-28T08:00:00-08:00'],
    [r('07:30', {kind: 'daily', skipNext: true}), '2026-11-26T08:00:00-08:00', '2026-11-28T07:30:00-08:00'],
  ];
  V.forEach(([rec, after, want], i) => assert.equal(nextDue(rec, T(after)).due, T(want), 'vector ' + (i + 1)));
  const d = V[6][0], a = upcoming(d, T('2026-11-26T00:00:00-08:00'), 5).map(o => o.key);
  assert.deepEqual(a, ['2026-11-28', '2026-12-01'], 'dates: then 12-01, then nothing');
  assert.equal(nextDue(d, T('2026-12-02T00:00:00-08:00')).due, null);
  assert.equal(nextDue(V[7][0], T('2026-11-26T08:00:00-08:00')).skipNext, false, 'skipNext consumed');
  const sk = upcoming(V[2][0], T('2026-11-26T00:00:00-08:00'), 2);
  assert.deepEqual(sk.map(o => [o.key, o.skipped]), [['2026-11-30', true], ['2026-12-07', false]], 'skipped dates stay visible, crossed');
  assert.equal(offsetLabel(LA, T('2026-07-01T00:00:00Z')), '−07:00');
});

test('glyphs: code-authored SVG only, no text/title/emoji; every capability, outcome and pattern has a picture', () => {
  for (const [k, v] of Object.entries(G)) {
    assert.doesNotMatch(v, /<(text|title|desc|foreignObject|image)\b/i, k);
    assert.doesNotMatch(v, /[\u{1F300}-\u{1FAFF}☀-➿]/u, k + ' emoji');
  }
  for (const g of [...Object.values(CAP_GLYPH), ...Object.values(OUTCOME_GLYPH)]) assert.ok(G[g], 'glyph ' + g);
  assert.match(icon('bell'), /aria-hidden="true"/);
  for (const w of [...Object.values(VIB_WAVE), ...Object.values(SOUND_WAVE)]) assert.doesNotMatch(strip(w), /<text/);
  for (const id of Object.keys(CAP_GLYPH)) assert.ok(CAP[id], 'accessible name for ' + id);
  for (const s of ['available', 'permission', 'active', 'unsupported', 'foreground', 'disconnected', 'error']) assert.ok(STATE[s]);
  assert.ok(N.emergency && N.lockedOff && N.save);
});

test('challenges: math answers check out, pattern has exactly one right tile', () => {
  let seed = 1; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 200; i++) {
    const m = makeMath(rand), [a, , b, op, c] = m.text.split(' ');
    assert.equal(m.answer, op === '+' ? a * b + +c : a * b - c); assert.ok(m.answer > 0);
    assert.match(m.text, /^[\d ×+−]+$/, 'digits and math symbols only');
    const p = makePattern(rand);
    assert.equal(p.seq[p.gap], p.answer); assert.equal(new Set(p.choices).size, 3); assert.ok(p.choices.includes(p.answer));
    assert.ok(p.choices.every(v => Number.isInteger(v) && v >= 2 && (v & (v - 1)) === 0), '2048 tile values');
  }
});
