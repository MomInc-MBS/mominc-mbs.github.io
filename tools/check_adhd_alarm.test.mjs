// MOM's: 2048 Reminder client: multi-reminder state machine, escalation timing, capability card. Pure modules, no browser.
process.env.TZ = 'UTC';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../apps/alarm/remind.js';
import {review, arm, tick, acknowledge, stop, win, lose, checkin, snooze, snoozed, offLockLeft, attemptId, current, lookup, applyRemote, ranked, snapshot,
  setEnabled, removeReminder, saveReminder, reminderOf, blank, emptyState, load, save, SOUNDS, MAX_HISTORY} from '../apps/alarm/remind.js';
import {stageFor, stageStart, faceFor, faceUrl, topFace, labelText, copyFor, APP_NAME, MISS_MS} from '../apps/alarm/stages.js';
import {capability} from '../apps/alarm/push.js';

const T0 = Date.UTC(2026, 10, 25, 12, 0, 0);
const draft = (o = {}) => ({time: '12:05', recur: 'daily', label: '', sound: 'air-horn', followups: true, ...o});
const A = 'r_alpha0001', B = 'r_bravo0002', DAY = 86_400_000;
const armed = (o = {}, now = T0, s = emptyState(), id = A) => arm(s, review(draft(o), {id, ...(reminderOf(s, id) || {})}), now);
const due = (s, id = A) => s.runs[id].next.due;
const ring = (o = {}, id = A) => { const s = armed(o, T0, emptyState(), id), d = due(s, id); return {s: tick(s, d + 1000).state, d}; };
const occ = (s, id = A) => s.runs[id].occ;
const rec = (o = {}) => ({...blank(), id: A, time: '12:05', tz: {mode: 'fixed', zone: 'UTC'}, sound: {...blank().sound, stage: Array(4).fill('crash')}, ...o});

test('setup: no sound is preselected, only the four intense sounds exist, review is required, edits need a fresh review', () => {
  assert.deepEqual(SOUNDS.map(s => s.name), ['Air Horn', 'Train Horn', 'Industrial Buzzer', 'Crash Alarm']);
  assert.throws(() => review(draft({sound: undefined})), /Choose a sound/);
  assert.throws(() => review(draft({sound: 'gentle-chime'})), /Choose a sound/);
  assert.throws(() => review(draft({time: ''})), /time/);
  assert.throws(() => arm(emptyState(), draft(), T0), /Review the alarm/);
  assert.throws(() => arm(emptyState(), {draft: blank(), key: 'x', summary: []}, T0), /Review the alarm/);
  const rev = review(draft()); rev.draft.time = '06:00';
  assert.throws(() => arm(emptyState(), rev, T0), /Review the alarm/);
  const s1 = armed();
  assert.equal(reminderOf(s1, A).rev, 1); assert.equal(reminderOf(s1, A).confirmed.rev, 1);
  const s2 = armed({sound: 'buzzer'}, T0 + 1000, s1);
  assert.equal(reminderOf(s2, A).rev, 2); assert.deepEqual(reminderOf(s2, A).sound.stage, Array(4).fill('buzzer'));
  assert.equal(reminderOf(armed({sound: 'buzzer'}, T0 + 2000, s2), A).rev, 2);                        // same config re-confirmed: same revision
  assert.equal(reminderOf(armed({sound: 'buzzer', label: 'pills'}, T0 + 3000, s2), A).rev, 2);       // title-only edit: no new confirmation, no new revision
});

test('contract record: armed only when confirmed.rev == rev; unknown fields survive; invalid input is reported by field', () => {
  const base = {...rec(), futureField: {x: 1}};
  const r1 = saveReminder(emptyState(), base, T0);                                                     // not confirmed: saved, NOT armed
  assert.equal(r1.ok, true); assert.equal(r1.state.runs[A].next, null); assert.equal(R.isArmed(r1.reminder), false); assert.deepEqual(r1.reminder.futureField, {x: 1});
  const r2 = saveReminder(emptyState(), {...base, confirmed: {rev: 1, at: 5}}, T0);
  assert.equal(R.isArmed(r2.reminder), true); assert.equal(r2.state.runs[A].next.due, Date.UTC(2026, 10, 25, 12, 5));
  const noSound = saveReminder(emptyState(), {...base, sound: blank().sound, confirmed: {rev: 1, at: 5}}, T0);
  assert.equal(R.isArmed(noSound.reminder), false);                                                     // a confirmation never arms a reminder without an explicit sound pick
  const stale = saveReminder(r2.state, {...r2.reminder, time: '13:00', confirmed: r2.reminder.confirmed}, T0 + 1);
  assert.equal(stale.reminder.rev, 2); assert.equal(stale.reminder.confirmed, null);                    // changed after confirmation: must be confirmed again
  for (const [patch, field] of [[{time: '25:00'}, 'time'], [{recur: {kind: 'weekly', days: []}}, 'recur.days'], [{tz: {mode: 'fixed', zone: 'Mars/Base'}}, 'tz'], [{id: '!'}, 'id'], [{snooze: -1}, 'snooze'],
    [{webhook: {url: 'http://x.example/'}}, 'webhook'], [{challenge: {extra: 'laser'}}, 'challenge']]) {
    const bad = saveReminder(emptyState(), {...base, ...patch}, T0); assert.deepEqual([bad.ok, bad.error, bad.field], [false, 'invalid', field], field);
  }
  assert.equal(saveReminder(emptyState(), {...base, title: 'x'.repeat(300)}, T0).reminder.title.length, 200);
});

test('arming creates a PENDING occurrence at the next local time; weekly recurrence and skipNext work through the model', () => {
  const s = armed(); assert.equal(s.runs[A].next.status, 'PENDING'); assert.equal(due(s), Date.UTC(2026, 10, 25, 12, 5));
  assert.equal(tick(s, T0 + 60_000).events.length, 0);
  const wk = saveReminder(emptyState(), rec({recur: {...blank().recur, kind: 'weekly', days: [1]}, confirmed: {rev: 1, at: 1}}), Date.UTC(2026, 10, 27, 13));
  assert.equal(wk.state.runs[A].next.due, Date.UTC(2026, 10, 30, 12, 5));                              // Fri -> Mon
  const sk = saveReminder(wk.state, {...wk.reminder, recur: {...wk.reminder.recur, kind: 'daily', skipNext: true}, confirmed: {rev: 2, at: 2}}, Date.UTC(2026, 10, 25, 13));
  assert.equal(sk.state.runs[A].next.due, Date.UTC(2026, 10, 27, 12, 5)); assert.equal(reminderOf(sk.state, A).recur.skipNext, false);
});

test('opening / tapping a notice / opening Settings never stops, pauses or resets the escalation', () => {
  let {s, d} = ring();
  const id = occ(s).id;
  assert.equal(occ(s).status, 'ACTIVE');
  s = acknowledge(s, id, d + 5000);
  assert.equal(occ(s).status, 'ACTIVE'); assert.equal(s.runs[A].session.state, 'ALERTING'); assert.equal(occ(s).ackedAt, d + 5000);
  assert.equal(acknowledge(s, id, d + 9000), s);
  const seen = [];
  for (let t = 6; t <= 700; t++) { const r = tick(s, d + t * 1000); s = r.state; for (const e of r.events) seen.push([t, e.stage]); }
  assert.deepEqual(seen.map(x => x[0]), [300, 480, 540, 570, 600, 630, 660, 690]);
  assert.equal(occ(s).status, 'ACTIVE'); assert.equal(lookup(s, id).status, 'ACTIVE');
});

test('escalation timing from T0: 0, 300, 480, 540 s, then every 30 s; one alert per boundary, repeats stay on stage 4', () => {
  let {s, d} = ring({label: 'Call Alex'});
  assert.equal(s.runs[A].session.stage, 0);
  const seen = [];
  for (let t = 2; t <= 640; t++) { const r = tick(s, d + t * 1000); s = r.state; for (const e of r.events) seen.push([t, e.type, e.stage, faceFor(e.stage), e.text, e.reminderId]); }
  assert.deepEqual(seen.map(e => e.slice(0, 4)), [[300, 'stage', 1, 1], [480, 'stage', 2, 2], [540, 'stage', 3, 3], [570, 'stage', 4, 3], [600, 'stage', 5, 3], [630, 'stage', 6, 3]]);
  assert.ok(seen.every(e => e[5] === A));
  assert.match(seen[0][4], /^Still waiting: “Call Alex”\.$/); assert.match(seen[3][4], /^Still pending: “Call Alex”\. Finish the game or open Settings/);
  assert.deepEqual([0, 299, 300, 479, 480, 539, 540, 569, 570, 599, 600, 629, 630].map(stageFor), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(stageStart), [0, 300, 480, 540, 570, 600, 630]);
});

test('start fires exactly at due time; a delayed tick reconciles to the current alert (one event, no burst)', () => {
  const s = armed({label: 'take pills'}), d = due(s);
  assert.equal(tick(s, d - 1).events.length, 0);
  const r = tick(s, d); assert.equal(r.events[0].type, 'start'); assert.match(r.events[0].text, /^Reminder: “take pills”\.$/);
  assert.equal(tick(r.state, d + 1).events.length, 0);
  const {s: ringing, d: d0} = ring({label: 'Laundry'}), slept = tick(ringing, d0 + 612_000);          // page slept through 300/480/540/570/600
  assert.deepEqual(slept.events.map(e => e.stage), [5]);
  assert.equal(tick(slept.state, d0 + 613_000).events.length, 0);
  const a = armed({label: 'Laundry'}), late = tick(a, due(a) + 575_000);
  assert.deepEqual(late.events.map(e => [e.type, e.stage]), [['start', 4]]);
});

test('escalation is opt-in: without it there is only the first alert, ever', () => {
  const {s, d} = ring({followups: false});
  const evs = []; for (const t of [40, 301, 481, 541, 600, 1000]) evs.push(...tick(s, d + t * 1000).events);
  assert.equal(evs.length, 0);
});

test('TWO reminders are independent: own stages, own stop/win/off; completing one leaves the other ringing', () => {
  let s = armed({time: '12:05'}, T0, emptyState(), A); s = armed({time: '12:10', label: 'two'}, T0, s, B);
  const dA = due(s, A), dB = due(s, B);
  assert.notEqual(dA, dB);
  s = tick(s, dA + 1000).state; s = tick(s, dB + 1000).state;                                          // both ring; A is 300 s ahead
  assert.equal(s.runs[A].session.stage, 1); assert.equal(s.runs[B].session.stage, 0);
  const idA = occ(s, A).id, idB = occ(s, B).id, genA = s.runs[A].session.gen, genB = s.runs[B].session.gen;
  const w = win(s, idA, dB + 2000);
  assert.equal(occ(w, A).status, 'COMPLETED'); assert.equal(occ(w, B).status, 'ACTIVE'); assert.equal(w.runs[B].session.state, 'ALERTING');
  assert.ok(w.runs[A].next && w.runs[B].next);                                                         // both recurrences stay
  assert.ok(!current(w, idA, genA)); assert.ok(current(w, idB, genB));                                 // each has its own generation
  const st = stop(s, idB, dB + 5000); assert.equal(occ(st, A).status, 'ACTIVE'); assert.equal(occ(st, B).outcome, 'emergency');
  assert.equal(lose(s, 'nothing', dB), s); assert.equal(win(s, idA + 'x', dB), s);
  assert.notEqual(attemptId(s, idA), attemptId(s, idB));                                               // board ownership is per occurrence
  assert.equal(attemptId(w, idA), null);
  assert.equal(setEnabled(s, A, false, dB + 3000).error, 'locked'); assert.equal(removeReminder(s, B, dB + 3000).error, 'locked');
  const offA = setEnabled(s, A, false, dA + 540_000);                                                  // A passed 540 s: it can go off, B (not yet) stays on
  assert.equal(offA.ok, true); assert.equal(occ(offA.state, B).status, 'ACTIVE'); assert.equal(setEnabled(offA.state, B, false, dA + 540_000).error, 'locked');
});

test('global stage/face: highest unresolved stage, ties to earliest due; none -> happy/relaxed', () => {
  const none = snapshot(emptyState(), T0);
  assert.deepEqual([none.stage, none.emotion, none.intensity, none.iconId, none.offAllowed, none.unlockAt], [null, 'happy', 0.3, 'stage1', true, null]);
  let s = armed({time: '12:05'}, T0, emptyState(), A); s = armed({time: '12:10'}, T0, s, B);
  assert.equal(snapshot(s, T0).nextDue, due(s, A));
  s = tick(s, due(s, A) + 1000).state;
  assert.equal(snapshot(s, due(s, A) + 1000).stage, 1);
  s = tick(s, due(s, B) + 1000).state;                                                                // A at +301 s (stage 2), B at +1 s (stage 1)
  const snap = snapshot(s, occ(s, B).due + 1000);
  assert.deepEqual([snap.stage, snap.emotion, snap.intensity, snap.occId], [2, 'upset', 0.7, occ(s, A).id]);
  s = tick(s, occ(s, A).due + 540_000).state;                                                          // A reaches stage 4
  const s4 = snapshot(s, occ(s, A).due + 540_000);
  assert.deepEqual([s4.stage, s4.emotion, s4.intensity, s4.iconId], [4, 'furious', 1, 'stage4']);
  assert.equal(s4.offAllowed, false); assert.equal(s4.unlockAt, occ(s, B).due + 540_000);              // A unlocked, B still locked
  assert.equal(s4.pendingSync, true);
  let t = armed({time: '12:05'}, T0, emptyState(), A); t = armed({time: '12:06'}, T0, t, B);           // tie on face: earliest due first
  t = tick(t, due(t, A) + 1000).state; t = tick(t, due(t, B) + 1000).state;
  assert.deepEqual(ranked(t).map(x => x.reminderId), [A, B]);
  assert.equal(topFace([{face: 0, due: 5}, {face: 2, due: 9}, {face: 1, due: 1}]), 2);
});

test('Stop (emergency hold) ends THIS occurrence only: never restarts, later recurrences stay, reminder stays on', () => {
  let {s, d} = ring({label: 'x'});
  const gen = s.runs[A].session.gen, id = occ(s).id;
  assert.ok(current(s, id, gen));
  s = stop(s, id, d + 20_000);
  assert.equal(occ(s).status, 'CANCELLED'); assert.equal(occ(s).reason, 'stopped'); assert.equal(s.runs[A].session.state, 'SILENCED'); assert.equal(reminderOf(s, A).enabled, true);
  assert.ok(!current(s, id, gen));
  const evs = []; for (const t of [300, 540, 600, 3600]) { const r = tick(s, d + t * 1000); s = r.state; evs.push(...r.events); }
  assert.deepEqual(evs, []);
  assert.equal(s.runs[A].next.due, d + DAY);
  assert.ok(s.outbox.some(o => o.k === 'occ' && o.act === 'cancel'));
  assert.equal(win(s, id, d + 30_000), s); assert.equal(lose(s, id, d + 30_000), s);
  assert.equal(s.history[0].outcome, 'emergency'); assert.equal(s.history[0].reminderId, A);
});

test('a win or a loss on THIS occurrence dismisses it at EVERY stage; the recurrence stays; stale / other / free-play results are ignored', () => {
  for (const [name, fn, reason] of [['win', win, 'win'], ['loss', lose, 'loss']])
    for (const at of [1, 299, 300, 479, 480, 539, 540, 569, 570, 631]) {
      let {s, d} = ring({label: 'Go to the store'});
      s = tick(s, d + at * 1000).state;
      const id = occ(s).id;
      assert.equal(fn(s, null, d + at * 1000), s, name + ' free play');
      assert.equal(fn(s, 'other-reminder:1', d + at * 1000), s, name + ' other occurrence');
      const done = fn(s, id, d + at * 1000);
      assert.equal(occ(done).status, 'COMPLETED', `${name} at ${at}`); assert.equal(occ(done).reason, reason); assert.equal(done.runs[A].session.state, 'SILENCED');
      assert.equal(reminderOf(done, A).enabled, true); assert.equal(done.runs[A].next.due, d + DAY);
      assert.ok(done.outbox.some(o => o.act === 'complete' && o.id === id));
      assert.equal(done.history[0].outcome, name); assert.equal(done.history[0].stage, faceFor(stageFor(at)) + 1);
      assert.equal(tick(done, d + (at + 60) * 1000).events.length, 0);
      assert.equal(fn(done, id, d + 9e5), done);
    }
});

test('a full-but-mergeable board is not a loss: the state machine only ends on what the board reports (see check_alarm_board)', () => {
  const {s} = ring(); assert.equal(occ(s).status, 'ACTIVE');                                           // nothing but win()/lose() ends it; no tile threshold exists
  assert.equal('taskDone' in R, false); assert.equal('noMoves' in R, false);
});

test('optional check-in is an ALTERNATIVE exit only when that reminder selected it; the 2048 exit remains', () => {
  const plain = ring().s;
  assert.equal(checkin(plain, occ(plain).id, 'qr', occ(plain).due + 10), plain);                       // not selected: nothing happens
  let s = saveReminder(emptyState(), rec({challenge: {extra: 'qr', code: 'abc', nfc: null, steps: 0}, confirmed: {rev: 1, at: 1}}), T0).state;
  s = tick(s, due(s) + 1000).state; const cid = occ(s).id;
  assert.equal(checkin(s, cid, 'nfc', due(s) + 10), s);                                                // wrong kind
  const done = checkin(s, cid, 'qr', occ(s).due + 50);
  assert.equal(occ(done).status, 'COMPLETED'); assert.equal(done.history[0].outcome, 'checkin');
  assert.equal(win(s, cid, occ(s).due + 50).runs[A].occ.status, 'COMPLETED');                          // 2048 still works
});

test('Settings off / remove / disable / time change: rejected before T0+540 s, accepted at 540 s; ordinary management outside an active occurrence is free', () => {
  const {s, d} = ring({label: 'Call Alex'});
  for (const t of [1, 300, 539.999]) {
    const now = d + t * 1000;
    assert.deepEqual([setEnabled(s, A, false, now).error, removeReminder(s, A, now).error, saveReminder(s, {...reminderOf(s, A), time: '15:30'}, now).error], ['locked', 'locked', 'locked'], 'at ' + t);
    assert.equal(offLockLeft(s, now, A) > 0, true);
  }
  assert.equal(setEnabled(s, A, false, d + 539_000).remainingMs, 1000);
  assert.equal(offLockLeft(s, d + 540_000), 0);
  const off = setEnabled(s, A, false, d + 540_000);
  assert.equal(off.ok, true); assert.equal(reminderOf(off.state, A).enabled, false); assert.equal(off.state.runs[A].next, null); assert.equal(occ(off.state).status, 'CANCELLED');
  assert.equal(reminderOf(off.state, A).title, 'Call Alex'); assert.equal(off.state.history[0].outcome, 'off');
  assert.equal(offLockLeft(tick(s, d + 545_000).state, d + 545_000), 0);                               // the lock counts from T0, so late delivery never extends it
  const rm = removeReminder(s, A, d + 540_000); assert.equal(rm.state.reminders.length, 0); assert.ok(rm.state.outbox.some(o => o.k === 'remove')); assert.equal(rm.state.history.length, 1);
  const one = ring({followups: false}); assert.equal(offLockLeft(one.s, one.d + 1000), 0); assert.equal(setEnabled(one.s, A, false, one.d + 1000).ok, true);
  const idle = armed(); assert.equal(setEnabled(idle, A, false, T0).ok, true); assert.equal(saveReminder(idle, {...reminderOf(idle, A), time: '18:00'}, T0).ok, true);
  const t = saveReminder(s, {...reminderOf(s, A), time: '15:30', confirmed: {rev: 2, at: 1}}, d + 540_000);       // past the lock: the new time ends the live one
  assert.equal(t.ok, true); assert.equal(occ(t.state).reason, 'rescheduled'); assert.equal(t.state.runs[A].next.due, Date.UTC(2026, 10, 25, 15, 30)); assert.equal(reminderOf(t.state, A).enabled, true);
  const evs = []; let st = t.state; for (const x of [570, 600, 900]) { const r = tick(st, d + x * 1000); st = r.state; evs.push(...r.events); }
  assert.deepEqual(evs, []);                                                                           // the old chain never rings again
  assert.deepEqual(tick(st, st.runs[A].next.due).events.map(e => e.type), ['start']);
});

test('snooze pauses OUTPUT only: T0, stage, generation, board and the unlock never move', () => {
  const plain = ring().s;
  assert.equal(snooze(plain, occ(plain).id, occ(plain).due + 10_000), plain);                         // snooze length 0 = off: ignored
  let s = saveReminder(emptyState(), rec({snooze: 120, confirmed: {rev: 1, at: 1}}), T0).state;
  s = tick(s, due(s) + 1000).state; const id = occ(s).id, d = occ(s).due;
  const z = snooze(s, id, d + 20_000);
  assert.equal(snoozed(z, id, d + 21_000), true); assert.equal(snoozed(z, id, d + 20_000 + 120_001), false);
  assert.equal(occ(z).due, occ(s).due); assert.equal(z.runs[A].session.stage, s.runs[A].session.stage); assert.equal(z.runs[A].session.gen, s.runs[A].session.gen);
  assert.equal(offLockLeft(z, d + 20_000, A), offLockLeft(s, d + 20_000, A)); assert.equal(attemptId(z, id), attemptId(s, id));
  assert.equal(setEnabled(z, A, false, d + 30_000).error, 'locked');                                   // snoozing is not a way out
  const seen = []; let t = z; for (const x of [300, 480, 540]) { const r = tick(t, d + x * 1000); t = r.state; seen.push(...r.events.map(e => e.stage)); }
  assert.deepEqual(seen, [1, 2, 3]);                                                                   // stages keep their times during a snooze
  assert.ok(z.outbox.some(o => o.act === 'snooze' && o.until === d + 140_000));
});

test('wording: title, bodies for every stage, label rules (empty, whitespace, emoji, long preview, quotes) and no placeholders', () => {
  assert.equal(APP_NAME, "MOM's: 2048 Reminder");
  for (const l of ['Get up', 'Go to the store', 'Call Alex', 'Laundry', 'Leave at 4', '🔥🔥', '“quoted” <b>x</b> & more']) {
    assert.equal(copyFor(0, l), `Reminder: “${l}”.`); assert.equal(copyFor(1, l), `Still waiting: “${l}”.`); assert.equal(copyFor(2, l), `Did you forget about “${l}”?`);
    assert.equal(copyFor(3, l), `Still pending: “${l}”. Finish the game or open Settings to turn this alarm off.`); assert.equal(copyFor(9, l), copyFor(3, l));
  }
  for (const empty of ['', '   ', undefined, null, '\n\t ']) assert.equal(copyFor(0, empty), 'Reminder: “Your reminder”.');
  assert.equal(copyFor(2, '  Leave   at\n4  '), 'Did you forget about “Leave at 4”?');
  const long = 'x'.repeat(150);
  assert.equal(copyFor(0, long), `Reminder: “${long}”.`);
  assert.equal(labelText(long, true), 'x'.repeat(59) + '…'); assert.equal([...labelText('😀'.repeat(100), true)].length, 60);
  for (let n = 0; n < 8; n++) assert.doesNotMatch(copyFor(n, 'a'), /\{label\}|undefined|null/);
  assert.equal(review(draft({label: 'y'.repeat(300)})).draft.title.length, 200);
  assert.match(review(draft()).summary.join('\n'), /Escalation: ON/); assert.match(review(draft({followups: false})).summary.join('\n'), /Escalation: off/);
});

test('app closed at due time: MISSED, never rung late; an unfinished occurrence expires; days closed = one record', () => {
  const s = armed(), d = due(s);
  const r = tick(s, d + 20 * 60_000);
  assert.deepEqual(r.events.map(e => e.type), ['missed']); assert.equal(occ(r.state).status, 'MISSED'); assert.equal(r.state.runs[A].next.due, d + DAY);
  const {s: a} = ring(), e = tick(a, occ(a).due + MISS_MS + 1000);
  assert.equal(occ(e.state).status, 'MISSED'); assert.equal(occ(e.state).reason, 'expired'); assert.equal(e.state.history[0].outcome, 'missed');
  const days = tick(s, d + 3 * DAY + 3600_000);
  assert.equal(occ(days.state).status, 'MISSED'); assert.ok(days.state.runs[A].next.due > d + 3 * DAY);
});

test('a once-alarm turns itself off after it fires; disable cancels a live occurrence and clears the next', () => {
  let {s, d} = ring({recur: 'once'});
  assert.equal(s.runs[A].next, null); assert.equal(reminderOf(s, A).enabled, false);
  ({s, d} = ring()); s = setEnabled(s, A, false, d + 541_000).state;
  assert.equal(occ(s).status, 'CANCELLED'); assert.equal(s.runs[A].next, null); assert.equal(reminderOf(s, A).enabled, false);
});

test('stale notice opens current truth; server terminal state ends a live local one but nothing reactivates', () => {
  let {s, d} = ring();
  const id = occ(s).id;
  s = win(s, id, d + 4000);
  assert.equal(lookup(s, id).status, 'COMPLETED');
  s = tick(s, d + 90_000).state;
  assert.equal(lookup(s, id).status, 'COMPLETED'); assert.equal(lookup(s, 'nope:1'), null);
  const live = ring().s, ended = applyRemote(live, {id: occ(live).id, status: 'CANCELLED', reason: 'disabled'}, occ(live).due + 9000);
  assert.equal(occ(ended).status, 'CANCELLED'); assert.equal(ended.history[0].outcome, 'interrupted');
  assert.equal(applyRemote(s, {id, status: 'ACTIVE'}, d + 100_000), s);
  assert.equal(lookup({...s, runs: {[A]: {...s.runs[A], occ: null}}}, id).status, 'COMPLETED');         // only the history entry is left: still read-only truth
});

test('history keeps every outcome up to the storage cap', () => {
  const {s} = ring(), full = {...s, history: Array.from({length: MAX_HISTORY + 20}, (_, i) => ({occId: 'x' + i, reminderId: A, dueAt: i, endedAt: i, outcome: 'win', stage: 1}))};
  const w = win(full, occ(s).id, occ(s).due + 5);
  assert.equal(w.history.length, MAX_HISTORY); assert.equal(w.history[0].occId, occ(s).id);
  assert.equal(win(s, occ(s).id, occ(s).due + 5).history.length, 1);
});

test('persistence survives blocked storage and bad data', () => {
  const mem = {data: {}, getItem(k) { return this.data[k] ?? null; }, setItem(k, v) { this.data[k] = v; }};
  const s = armed(); assert.ok(save(s, mem)); assert.deepEqual(load(mem), s);
  mem.data[R.KEY] = '{nope'; assert.deepEqual(load(mem), emptyState());
  const blocked = {getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }};
  assert.equal(save(s, blocked), false); assert.deepEqual(load(blocked), emptyState());
});

test('MIGRATION: the live single-schedule v1 state becomes a one-item list, nothing is lost, v1 is left untouched', () => {
  const v1 = {v: 1, schedule: {id: 'abcdefghijkl', revision: 3, enabled: true, tz: 'UTC', armedAt: 99, time: '12:05', recur: 'weekdays', label: 'Laundry', sound: 'train-horn', followups: true, tandem: false},
    occ: {id: 'abcdefghijkl:1', rev: 3, due: T0, status: 'ACTIVE', reason: null, label: 'Laundry', followups: true, tandem: false, attempt: 1, ackedAt: T0 + 5},
    next: {id: 'abcdefghijkl:2', rev: 3, due: T0 + DAY, status: 'PENDING', reason: null, label: 'Laundry', followups: true, tandem: false, attempt: 1, ackedAt: null},
    session: {occId: 'abcdefghijkl:1', state: 'ALERTING', stage: 2, gen: 4},
    history: [{id: 'old:1', status: 'COMPLETED', reason: 'win', due: T0 - 1e6, label: 'x'}], outbox: [{k: 'schedule'}, {k: 'occ', id: 'abcdefghijkl:1', act: 'ack'}]};
  const mem = {data: {'adhd-alarm-state-v1': JSON.stringify(v1)}, getItem(k) { return this.data[k] ?? null; }, setItem(k, v) { this.data[k] = v; }};
  const s = load(mem), r = s.reminders[0];
  assert.equal(s.reminders.length, 1); assert.deepEqual([r.id, r.rev, r.title, r.time, r.escalate, r.enabled], ['abcdefghijkl', 3, 'Laundry', '12:05', true, true]);
  assert.deepEqual(r.recur.days, [1, 2, 3, 4, 5]); assert.equal(r.recur.kind, 'weekly'); assert.deepEqual(r.sound.stage, Array(4).fill('train-horn')); assert.equal(R.isArmed(r), true);
  assert.equal(s.runs[r.id].occ.status, 'ACTIVE'); assert.equal(s.runs[r.id].session.gen, 4); assert.equal(s.runs[r.id].occ.escalate, true);   // a live alarm keeps ringing through the upgrade
  assert.equal(s.runs[r.id].next.due, T0 + DAY);
  assert.deepEqual(s.history.map(h => [h.occId, h.outcome]), [['old:1', 'win']]); assert.deepEqual(s.outbox, [{k: 'schedule', id: 'abcdefghijkl'}, {k: 'occ', id: 'abcdefghijkl:1', act: 'ack'}]);
  assert.equal(mem.data['adhd-alarm-state-v1'], JSON.stringify(v1));                                   // untouched for rollback
  assert.ok(mem.data[R.KEY]); assert.deepEqual(load(mem), s);                                          // the second load reads v2
  assert.deepEqual(tick(s, T0 + 540_000).events.map(e => e.stage), [3]);                               // the migrated live occurrence keeps its timeline
  assert.equal(offLockLeft(s, T0 + 100_000, r.id), 440_000);
  assert.deepEqual(R.load({getItem: () => JSON.stringify({v: 1, schedule: null, occ: null, next: null, session: null, history: [], outbox: []}), setItem() {}}).reminders, []);
});

test('capability card is truthful', () => {
  const base = {origin: 'https://push.example', hasSW: true, hasPush: true, permission: 'default', standalone: true, ios: true, subscribed: false};
  assert.equal(capability({...base, origin: ''}).status, 'Unavailable');
  assert.match(capability({...base, origin: ''}).reason, /server not connected yet/i);
  const tab = capability({...base, hasPush: false, standalone: false});
  assert.equal(tab.status, 'Unavailable'); assert.match(tab.reason, /Home Screen/);
  assert.equal(capability(base).status, 'Permission needed'); assert.equal(capability(base).action, 'request');
  assert.equal(capability({...base, permission: 'denied'}).status, 'Permission needed'); assert.equal(capability({...base, permission: 'denied'}).action, undefined);
  const on = capability({...base, permission: 'granted', subscribed: true});
  assert.equal(on.status, 'Reminders enabled'); assert.match(on.reason, /not an offline wake-up alarm/i);
  assert.equal(capability({...base, permission: 'granted', subscribed: false, error: 'boom'}).status, 'Unavailable');
  for (const c of [tab, on, capability(base)]) { assert.match(c.notes.join(' '), /Android app/); assert.match(c.notes.join(' '), /native iPhone app that is not shipped yet/); }
});

test('app-wide face URLs and stage mapping', () => {
  assert.equal(faceUrl(3), '/apps/alarm/stages/stage4.webp'); assert.equal(faceUrl(99), '/apps/alarm/stages/stage4.webp'); assert.equal(faceUrl(0), '/apps/alarm/stages/stage1.webp');
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(faceFor), [0, 1, 2, 3, 3, 3]);
});

test('a phone time-zone change re-plans a device-zone reminder; a live occurrence is never moved', () => {
  const s = armed({time: '12:05'});                                                                    // device zone UTC
  assert.equal(R.reconcile(s, T0, {deviceZone: 'Asia/Tokyo'}).runs[A].next.due, Date.UTC(2026, 10, 26, 3, 5));   // 12:05 Tokyo = 03:05Z, already past today
  const r = ring().s, still = R.reconcile(r, occ(r).due + 5000, {deviceZone: 'Asia/Tokyo'});
  assert.equal(still.runs[A].occ.due, occ(r).due); assert.equal(still.runs[A].occ.status, 'ACTIVE');
});
