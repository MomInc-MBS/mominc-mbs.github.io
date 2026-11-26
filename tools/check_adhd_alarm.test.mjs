// ADHD client: reminder state machine, escalation timing, capability card. Pure modules, no browser.
process.env.TZ = 'UTC';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../apps/alarm/remind.js';
import {review, arm, setLabel, disable, tick, acknowledge, stop, win, lose, offLockLeft, attemptId, current, lookup, applyRemote,
  emptyState, load, save, nextDue, SOUNDS} from '../apps/alarm/remind.js';
import {stageFor, stageStart, faceFor, faceUrl, topFace, labelText, copyFor, APP_NAME, MISS_MS} from '../apps/alarm/stages.js';
import {capability} from '../apps/alarm/push.js';

const T0 = Date.UTC(2026, 10, 25, 12, 0, 0);
const draft = (o = {}) => ({time: '12:05', recur: 'daily', label: '', sound: 'air-horn', followups: true, tandem: false, ...o});
const armed = (o = {}, now = T0) => arm(emptyState(), review(draft(o)), now);
const dueOf = s => s.next.due;
const ring = (o = {}) => { const s = armed(o), due = dueOf(s); return {s: tick(s, due + 1000).state, due}; };

test('setup: no sound is preselected, only the four intense sounds exist, review is required, edits need a fresh review', () => {
  assert.deepEqual(SOUNDS.map(s => s.name), ['Air Horn', 'Train Horn', 'Industrial Buzzer', 'Crash Alarm']);
  assert.throws(() => review(draft({sound: undefined})), /Choose a sound/);
  assert.throws(() => review(draft({sound: 'gentle-chime'})), /Choose a sound/);
  assert.throws(() => review(draft({time: ''})), /time/);
  assert.throws(() => arm(emptyState(), draft(), T0), /Review the alarm/);                          // a plain draft cannot arm
  assert.throws(() => arm(emptyState(), {draft: draft(), key: 'x', summary: []}, T0), /Review the alarm/);   // a forged review cannot arm
  const rev = review(draft()); rev.draft.time = '06:00';
  assert.throws(() => arm(emptyState(), rev, T0), /Review the alarm/);                              // edited after review: must review again
  const s1 = armed({sound: 'air-horn'});
  assert.equal(s1.schedule.revision, 1);
  const edited = review(draft({sound: 'buzzer'}));
  const s2 = arm(s1, edited, T0 + 1000);
  assert.equal(s2.schedule.revision, 2); assert.equal(s2.schedule.sound, 'buzzer');
  assert.equal(arm(s2, review(draft({sound: 'buzzer'})), T0 + 2000).schedule.revision, 2);          // same config re-confirmed: same revision
  assert.equal(review(draft({followups: false, tandem: true})).draft.tandem, false);               // tandem needs follow-ups
  assert.equal(setLabel(s2, 'pills').schedule.revision, 2);                                         // label-only edit: no new confirmation, no new revision
});

test('arming creates a PENDING occurrence at the next local time', () => {
  const s = armed(); assert.equal(s.next.status, 'PENDING'); assert.equal(s.next.due, Date.UTC(2026, 10, 25, 12, 5));
  assert.equal(nextDue({time: '12:05', recur: 'weekdays'}, Date.UTC(2026, 10, 27, 13)), Date.UTC(2026, 10, 30, 12, 5));   // Fri -> Mon
  assert.equal(tick(s, T0 + 60_000).events.length, 0);
});

test('opening / tapping a notice / opening Settings never stops, pauses or resets the escalation', () => {
  let {s, due} = ring();
  assert.equal(s.occ.status, 'ACTIVE');
  s = acknowledge(s, due + 5000);                                  // app opened / notice tapped / Play 2048
  assert.equal(s.occ.status, 'ACTIVE'); assert.equal(s.session.state, 'ALERTING'); assert.equal(s.occ.ackedAt, due + 5000);
  assert.equal(acknowledge(s, due + 9000), s);                     // a repeat tap changes nothing
  const seen = [];
  for (let t = 6; t <= 700; t++) { const r = tick(s, due + t * 1000); s = r.state; for (const e of r.events) seen.push([t, e.stage]); }
  assert.deepEqual(seen.map(x => x[0]), [300, 480, 540, 570, 600, 630, 660, 690]);   // the opening did not pause or shift anything
  assert.equal(s.occ.status, 'ACTIVE'); assert.equal(lookup(s, s.occ.id).status, 'ACTIVE');
});

test('escalation timing from T0: 0, 300, 480, 540 s, then every 30 s; one alert per boundary, repeats stay on stage 4', () => {
  let {s, due} = ring({label: 'Call Alex'});
  assert.equal(s.session.stage, 0);                                // ring() ticked at +1 s: the start alert
  const seen = [];
  for (let t = 2; t <= 640; t++) { const r = tick(s, due + t * 1000); s = r.state; for (const e of r.events) seen.push([t, e.type, e.stage, faceFor(e.stage), e.text]); }
  assert.deepEqual(seen.map(e => e.slice(0, 4)), [[300, 'stage', 1, 1], [480, 'stage', 2, 2], [540, 'stage', 3, 3], [570, 'stage', 4, 3], [600, 'stage', 5, 3], [630, 'stage', 6, 3]]);
  assert.match(seen[0][4], /^Still waiting: “Call Alex”\.$/); assert.match(seen[3][4], /^Still pending: “Call Alex”\. Finish the game or open Settings/);
  assert.deepEqual([0, 299, 300, 479, 480, 539, 540, 569, 570, 599, 600, 629, 630].map(stageFor), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(stageStart), [0, 300, 480, 540, 570, 600, 630]);
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(faceFor), [0, 1, 2, 3, 3, 3]);
});

test('start event fires exactly at due time', () => {
  const s = armed({label: 'take pills'}), due = dueOf(s);
  assert.equal(tick(s, due - 1).events.length, 0);
  const r = tick(s, due); assert.equal(r.events[0].type, 'start'); assert.match(r.events[0].text, /^Reminder: “take pills”\.$/);
  assert.equal(tick(r.state, due + 1).events.length, 0);           // no second start
});

test('a delayed tick reconciles to the current alert: ONE event, no catch-up burst; a late open starts at the current alert', () => {
  const {s, due} = ring({label: 'Laundry'});
  const r = tick(s, due + 612_000);                                // the page slept through 300/480/540/570/600
  assert.deepEqual(r.events.map(e => e.stage), [5]);
  assert.equal(tick(r.state, due + 613_000).events.length, 0);
  const a = armed({label: 'Laundry'}), late = tick(a, dueOf(a) + 575_000);
  assert.deepEqual(late.events.map(e => [e.type, e.stage]), [['start', 4]]);
});

test('escalation is opt-in: without it there is only the first alert, ever', () => {
  const {s, due} = ring({followups: false});
  const evs = []; for (const t of [40, 301, 481, 541, 600, 1000]) evs.push(...tick(s, due + t * 1000).events);
  assert.equal(evs.length, 0);
});

test('Stop (emergency hold) ends THIS occurrence only: incomplete, never restarts, later recurrences stay, reminder stays on', () => {
  let {s, due} = ring({label: 'x'});
  const gen = s.session.gen, id = s.occ.id;
  assert.ok(current(s, id, gen));
  s = stop(s, due + 20_000);
  assert.equal(s.occ.status, 'CANCELLED'); assert.equal(s.occ.reason, 'stopped'); assert.equal(s.session.state, 'SILENCED'); assert.equal(s.schedule.enabled, true);
  assert.ok(!current(s, id, gen));                                  // audio/timer callbacks captured earlier must not act
  const evs = []; for (const t of [300, 540, 600, 3600]) { const r = tick(s, due + t * 1000); s = r.state; evs.push(...r.events); }
  assert.deepEqual(evs, []);                                        // no restart, no stage events
  assert.equal(s.occ.status, 'CANCELLED'); assert.equal(s.next.status, 'PENDING'); assert.equal(s.next.due, due + 86_400_000);
  assert.ok(s.outbox.some(o => o.k === 'occ' && o.act === 'cancel'));
  assert.equal(win(s, id, due + 30_000), s); assert.equal(lose(s, id, due + 30_000), s);   // a late result cannot revive a stopped occurrence
});

test('a win or a loss on THIS occurrence dismisses it at EVERY stage; the recurrence stays; stale / other / free-play results are ignored', () => {
  for (const [name, fn, reason] of [['win', win, 'win'], ['loss', lose, 'loss']])
    for (const at of [1, 299, 300, 479, 480, 539, 540, 569, 570, 631]) {
      let {s, due} = ring({label: 'Go to the store'});
      s = tick(s, due + at * 1000).state;
      const id = s.occ.id;
      assert.equal(fn(s, null, due + at * 1000), s, name + ' free play');
      assert.equal(fn(s, 'other-reminder:1', due + at * 1000), s, name + ' other occurrence');
      const done = fn(s, id, due + at * 1000);
      assert.equal(done.occ.status, 'COMPLETED', `${name} at ${at}`); assert.equal(done.occ.reason, reason); assert.equal(done.session.state, 'SILENCED');
      assert.equal(done.schedule.enabled, true); assert.equal(done.next.due, due + 86_400_000);        // future recurrences kept
      assert.ok(done.outbox.some(o => o.act === 'complete' && o.id === id));
      assert.equal(tick(done, due + (at + 60) * 1000).events.length, 0);                              // nothing rings afterwards
      assert.equal(fn(done, id, due + 9e5), done);                                                    // a second result does nothing
    }
});

test('no tile requirement: a win without a label, with a label, and a loss all dismiss with no extra step', () => {
  for (const label of ['', 'take pills']) { const {s} = ring({label}); assert.equal(win(s, s.occ.id, s.occ.due + 5000).occ.status, 'COMPLETED'); }
  assert.equal('taskDone' in R, false); assert.equal('noMoves' in R, false);
});

test('Settings "Turn off alarm": rejected before T0+540 s, accepted at 540 s; ordinary management is not locked outside an active occurrence', () => {
  const {s, due} = ring({label: 'Call Alex'});
  for (const t of [1, 300, 539.999]) { assert.equal(disable(s, due + t * 1000), s, 'rejected at ' + t); assert.equal(offLockLeft(s, due + t * 1000) > 0, true); }
  assert.equal(offLockLeft(s, due + 539_000), 1000);
  assert.equal(offLockLeft(s, due + 540_000), 0);
  const off = disable(s, due + 540_000);
  assert.equal(off.schedule.enabled, false); assert.equal(off.next, null); assert.equal(off.occ.status, 'CANCELLED');
  assert.equal(off.schedule.label, 'Call Alex'); assert.equal(off.history[0].label, 'Call Alex');            // text and history are kept
  assert.ok(off.outbox.some(o => o.k === 'schedule'));
  assert.equal(offLockLeft(tick(s, due + 545_000).state, due + 545_000), 0);                                 // the lock counts from T0, so late delivery never extends it
  const one = ring({followups: false}); assert.equal(offLockLeft(one.s, one.due + 1000), 0); assert.equal(disable(one.s, one.due + 1000).schedule.enabled, false);   // not escalating
  const idle = armed(); assert.equal(offLockLeft(idle, T0), 0); assert.equal(disable(idle, T0).schedule.enabled, false);                                    // nothing active
});

test('app-wide face with several reminders: highest unresolved stage wins, ties go to the earliest due, none -> stage 1', () => {
  assert.equal(topFace([]), 0);
  assert.equal(topFace([{face: 0, due: 5}, {face: 2, due: 9}, {face: 1, due: 1}]), 2);
  assert.equal(topFace([{face: 3, due: 9}, {face: 3, due: 1}]), 3);
  assert.equal(faceUrl(3), '/apps/alarm/stages/stage4.webp'); assert.equal(faceUrl(99), '/apps/alarm/stages/stage4.webp'); assert.equal(faceUrl(0), '/apps/alarm/stages/stage1.webp');
});

test('wording: title, bodies for every stage, label rules (empty, whitespace, emoji, long preview, quotes) and no placeholders', () => {
  assert.equal(APP_NAME, "MOM's: 2048 Reminder");
  for (const l of ['Get up', 'Go to the store', 'Call Alex', 'Laundry', 'Leave at 4', '🔥🔥', '“quoted” <b>x</b> & more']) {
    assert.equal(copyFor(0, l), `Reminder: “${l}”.`); assert.equal(copyFor(1, l), `Still waiting: “${l}”.`); assert.equal(copyFor(2, l), `Did you forget about “${l}”?`);
    assert.equal(copyFor(3, l), `Still pending: “${l}”. Finish the game or open Settings to turn this alarm off.`); assert.equal(copyFor(9, l), copyFor(3, l));
  }
  for (const empty of ['', '   ', undefined, null, '\n\t ']) assert.equal(copyFor(0, empty), 'Reminder: “Your reminder”.');
  assert.equal(copyFor(2, '  Leave   at\n4  '), 'Did you forget about “Leave at 4”?');         // whitespace normalised
  const long = 'x'.repeat(150);
  assert.equal(copyFor(0, long), `Reminder: “${long}”.`);                                      // the app keeps the full text
  assert.equal(labelText(long, true), 'x'.repeat(59) + '…'); assert.equal([...labelText('😀'.repeat(100), true)].length, 60);   // preview cut by code point, no broken emoji
  for (let n = 0; n < 8; n++) assert.doesNotMatch(copyFor(n, 'a'), /\{label\}|undefined|null/);
  assert.equal(review(draft({label: 'y'.repeat(300)})).draft.label.length, 200);
});

test('tandem notices are retired; the review states the escalation honestly', () => {
  const rev = review(draft({tandem: true})); assert.equal(rev.draft.tandem, false); assert.doesNotMatch(rev.summary.join('\n'), /Tandem/);
  assert.match(review(draft()).summary.join('\n'), /Escalation: ON/); assert.match(review(draft({followups: false})).summary.join('\n'), /Escalation: off/);
});

test('app closed at due time: MISSED, never rung late; an unfinished occurrence expires', () => {
  const s = armed(), due = dueOf(s);
  const r = tick(s, due + 20 * 60_000);
  assert.deepEqual(r.events.map(e => e.type), ['missed']); assert.equal(r.state.occ.status, 'MISSED'); assert.equal(r.state.next.due, due + 86_400_000);
  const {s: a} = ring(), e = tick(a, a.occ.due + MISS_MS + 1000);
  assert.equal(e.state.occ.status, 'MISSED'); assert.equal(e.state.occ.reason, 'expired');
  const days = tick(s, due + 3 * 86_400_000 + 3600_000);            // closed for three days: one MISSED record, the schedule goes on
  assert.equal(days.state.occ.status, 'MISSED'); assert.ok(days.state.next.due > due + 3 * 86_400_000);
});

test('a once-alarm turns itself off after it fires; disable cancels a live occurrence and clears the next', () => {
  let {s, due} = ring({recur: 'once'});
  assert.equal(s.next, null); assert.equal(s.schedule.enabled, false);
  ({s} = ring()); s = disable(s, due + 541_000);
  assert.equal(s.occ.status, 'CANCELLED'); assert.equal(s.next, null); assert.equal(s.schedule.enabled, false);
});

test('stale notice opens current truth; server terminal state ends a live local one but nothing reactivates', () => {
  let {s, due} = ring();
  const id = s.occ.id;
  s = win(s, id, due + 4000);                                       // completed
  assert.equal(lookup(s, id).status, 'COMPLETED');
  s = tick(s, due + 90_000).state;
  assert.equal(lookup(s, id).status, 'COMPLETED');                  // an old tap still reads COMPLETED
  assert.equal(lookup(s, 'nope:1'), null);
  const live = ring().s, ended = applyRemote(live, {id: live.occ.id, status: 'CANCELLED', reason: 'disabled'}, live.occ.due + 9000);
  assert.equal(ended.occ.status, 'CANCELLED');
  assert.equal(applyRemote(s, {id, status: 'ACTIVE'}, due + 100_000), s);
});

test('persistence survives blocked storage and bad data', () => {
  const mem = {data: {}, getItem(k) { return this.data[k] ?? null; }, setItem(k, v) { this.data[k] = v; }};
  const s = armed(); assert.ok(save(s, mem)); assert.deepEqual(load(mem), s);
  mem.data['adhd-alarm-state-v1'] = '{nope'; assert.deepEqual(load(mem), emptyState());
  const blocked = {getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }};
  assert.equal(save(s, blocked), false); assert.deepEqual(load(blocked), emptyState());
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

test('changing the time during an escalating occurrence is locked like Turn off: rejected at 539 s, accepted at 540 s, then reschedules without a stale chain', () => {
  const {s, due} = ring({label: 'Call Alex'});
  const edit = (st, now, time = '15:30') => arm(st, review(draft({time, label: 'Call Alex'})), now);
  assert.throws(() => edit(s, due + 539_000), /unlocks in 1 s/);
  assert.throws(() => edit(s, due + 1_000), /locked/);
  const same = edit(s, due + 539_000, '12:05'); assert.equal(same.occ.status, 'ACTIVE');                  // not a time change: allowed, occurrence untouched
  const oldId = s.occ.id, gen = s.session.gen;
  const n = edit(s, due + 540_000);
  assert.equal(n.occ.status, 'CANCELLED'); assert.equal(n.occ.reason, 'rescheduled'); assert.equal(n.schedule.enabled, true);
  assert.equal(n.schedule.revision, s.schedule.revision + 1); assert.equal(n.schedule.time, '15:30');
  assert.equal(n.next.due, Date.UTC(2026, 10, 25, 15, 30)); assert.equal(n.next.rev, n.schedule.revision);
  assert.ok(n.outbox.some(o => o.k === 'occ' && o.id === oldId && o.act === 'cancel') && n.outbox.some(o => o.k === 'schedule'));
  assert.ok(!current(n, oldId, gen));
  const evs = []; let st = n; for (const t of [570, 600, 900]) { const r = tick(st, due + t * 1000); st = r.state; evs.push(...r.events); }
  assert.deepEqual(evs, []);                                                                            // the old chain never rings again
  const r = tick(st, n.next.due); assert.deepEqual(r.events.map(e => e.type), ['start']);              // exactly one new chain
  assert.equal(tick(r.state, n.next.due + 1000).events.length, 0);
  const idle = armed(); assert.equal(arm(idle, review(draft({time: '18:00'})), T0).schedule.time, '18:00');   // outside an active occurrence: normal
  const one = ring({followups: false}); assert.equal(arm(one.s, review(draft({time: '18:00', followups: false})), one.due + 1000).schedule.time, '18:00');   // not escalating: no lock
});
