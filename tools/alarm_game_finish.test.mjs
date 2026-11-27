import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../apps/alarm/remind.js';

const T0 = Date.parse('2026-11-26T07:00:00Z');
const ARMED = (() => {
  const r = {...R.blank(), id: 'rem_test_1', time: '07:00', tz: {mode: 'fixed', zone: 'UTC'}, enabled: true,
    sound: {...R.blank().sound, stage: Array(4).fill('air-horn')}, confirmed: {rev: 1, at: T0 - 1}};
  return R.saveReminder(R.emptyState(), {...r, rev: 1}, T0 - 3600_000, {deviceZone: 'UTC'}).state;
})();
const ringing = at => R.tick(ARMED, T0 + at).state;
const occOf = s => s.runs.rem_test_1.occ.id;
const WON = {bricksTotal: 24, bricksLeft: 0, lives: 2}, LOST = {bricksTotal: 24, bricksLeft: 9, lives: 0}, MID = {bricksTotal: 24, bricksLeft: 9, lives: 2};
const res = (s, over = {}) => ({gameId: 'brick', rulesVersion: 1, roundId: R.attemptId(s, occOf(s)) + ':1', outcome: 'won', finalState: WON, ...over});

test('setup is armed and rings', () => { const s = ringing(0); assert.equal(s.runs.rem_test_1.occ.status, 'ACTIVE'); });
for (const [name, at] of [['stage 1', 0], ['stage 2', 301_000], ['stage 3', 481_000], ['stage 4', 541_000]]) {
  test(`genuine win and loss complete at ${name}`, () => {
    const s = ringing(at), occ = occOf(s);
    const w = R.finishGame(s, occ, res(s), T0 + at);
    assert.notEqual(w, s); assert.equal(w.runs.rem_test_1.occ.status, 'COMPLETED'); assert.equal(w.runs.rem_test_1.occ.reason, 'win');
    const l = R.finishGame(s, occ, res(s, {outcome: 'lost', finalState: LOST}), T0 + at);
    assert.equal(l.runs.rem_test_1.occ.status, 'COMPLETED'); assert.equal(l.runs.rem_test_1.occ.reason, 'loss');
    assert.equal(l.reminders[0].enabled, true);                       // reminder stays on
    assert.ok(l.runs.rem_test_1.next, 'next occurrence is still planned');
  });
}
test('rejects: stale round, duplicate, wrong outcome, unfinished, unknown game, inactive occurrence', () => {
  const s = ringing(0), occ = occOf(s);
  assert.equal(R.finishGame(s, occ, res(s, {roundId: 'occ-old:1:1'}), T0), s);
  assert.equal(R.finishGame(s, occ, res(s, {roundId: undefined}), T0), s);
  assert.equal(R.finishGame(s, occ, res(s, {outcome: 'lost'}), T0), s);                    // claims lost, state is a win
  assert.equal(R.finishGame(s, occ, res(s, {outcome: 'won', finalState: MID}), T0), s);    // unfinished
  assert.equal(R.finishGame(s, occ, res(s, {outcome: 'lost', finalState: MID}), T0), s);
  assert.equal(R.finishGame(s, occ, res(s, {gameId: 'nope'}), T0), s);
  assert.equal(R.finishGame(s, occ, res(s, {rulesVersion: 9}), T0), s);
  assert.equal(R.finishGame(s, 'occ-other', res(s), T0), s);
  const r = res(s), done = R.finishGame(s, occ, r, T0);
  assert.equal(R.finishGame(done, occ, r, T0 + 1), done);                                   // duplicate: occurrence no longer active
  assert.equal(R.finishGame(ARMED, occ, r, T0), ARMED);                                     // not active yet
});
