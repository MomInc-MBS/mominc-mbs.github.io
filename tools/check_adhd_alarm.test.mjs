// ADHD client: reminder state machine, escalation timing, capability card. Pure modules, no browser.
process.env.TZ = 'UTC';
import test from 'node:test';
import assert from 'node:assert/strict';
import {review, arm, setLabel, disable, tick, acknowledge, stop, win, taskDone, taskReady, noMoves, attemptId, current, lookup, applyRemote,
  emptyState, load, save, nextDue, SOUNDS} from '../apps/alarm/remind.js';
import {stageFor, stageStart, STAGE_AT, FRICTION_MS, MISS_MS} from '../apps/alarm/stages.js';
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
  assert.match(review(draft({tandem: true})).summary.join('\n'), /Tandem notices: ON/);
  assert.equal(review(draft({followups: false, tandem: true})).draft.tandem, false);               // tandem needs follow-ups
  assert.equal(setLabel(s2, 'pills').schedule.revision, 2);                                         // label-only edit: no new confirmation, no new revision
});

test('arming creates a PENDING occurrence at the next local time', () => {
  const s = armed(); assert.equal(s.next.status, 'PENDING'); assert.equal(s.next.due, Date.UTC(2026, 10, 25, 12, 5));
  assert.equal(nextDue({time: '12:05', recur: 'weekdays'}, Date.UTC(2026, 10, 27, 13)), Date.UTC(2026, 10, 30, 12, 5));   // Fri -> Mon
  assert.equal(tick(s, T0 + 60_000).events.length, 0);
});

test('closing / opening / tapping a notice never completes the occurrence', () => {
  let {s, due} = ring();
  assert.equal(s.occ.status, 'ACTIVE');
  s = acknowledge(s, due + 5000);                                  // app opened / notice tapped
  assert.equal(s.occ.status, 'ACTIVE'); assert.equal(s.session.state, 'ACKNOWLEDGED');
  for (const t of [10, 40, 70, 200, 400]) s = tick(s, due + t * 1000).state;
  assert.equal(s.occ.status, 'ACTIVE');                            // nothing but a win / Task done / Stop changes it
  assert.equal(lookup(s, s.occ.id).status, 'ACTIVE');
});

test('escalation: start at 0, stages at 30/90/180/300 s then every 5 min; one event per stage', () => {
  let {s, due} = ring();
  const seen = [];
  for (let t = 2; t <= 1300; t++) { const r = tick(s, due + t * 1000); s = r.state; for (const e of r.events) seen.push([t, e.type, e.stage]); }
  assert.deepEqual(seen, [[30, 'stage', 1], [90, 'stage', 2], [180, 'stage', 3], [300, 'stage', 4], [600, 'stage', 5], [900, 'stage', 6], [1200, 'stage', 7]]);
  assert.deepEqual([0, 29, 30, 89, 90, 179, 180, 299, 300].map(stageFor), [0, 0, 1, 1, 2, 2, 3, 3, 4]);
  assert.deepEqual(STAGE_AT.map((_, i) => stageStart(i)), STAGE_AT);
});

test('start event fires exactly at due time with the satirical copy', () => {
  const s = armed({label: 'take pills'}), due = dueOf(s);
  assert.equal(tick(s, due - 1).events.length, 0);
  const r = tick(s, due); assert.equal(r.events[0].type, 'start'); assert.match(r.events[0].text, /take pills/);
  assert.equal(tick(r.state, due + 1).events.length, 0);           // no second start
});

test('follow-ups off: only the first alert, ever', () => {
  let {s, due} = ring({followups: false});
  const evs = []; for (const t of [40, 100, 200, 400, 1000]) evs.push(...tick(s, due + t * 1000).events);
  assert.equal(evs.length, 0);
});

test('tandem companion: from the 180 s stage, once per stage, about 3 s after the main message', () => {
  let {s, due} = ring({tandem: true});
  const seen = [];
  for (let t = 2; t <= 700; t++) { const r = tick(s, due + t * 1000); s = r.state; for (const e of r.events) seen.push([t, e.type, e.stage]); }
  assert.deepEqual(seen.filter(e => e[1] === 'companion'), [[183, 'companion', 3], [303, 'companion', 4], [603, 'companion', 5]]);
});

test('acknowledging pauses follow-ups for 60 s, then they resume', () => {
  let {s, due} = ring();
  s = tick(s, due + 25_000).state; s = acknowledge(s, due + 25_000);
  assert.equal(tick(s, due + 50_000).events.length, 0);            // stage 1 (30 s) is due but paused until 85 s
  const r = tick(s, due + 86_000); assert.deepEqual(r.events.map(e => e.stage), [1]); assert.equal(r.state.session.state, 'ALERTING');
});

test('Stop / cancel is incomplete and never restarts; later recurrences stay', () => {
  let {s, due} = ring({label: 'x'});
  const gen = s.session.gen, id = s.occ.id;
  assert.ok(current(s, id, gen));
  s = stop(s, due + 20_000);
  assert.equal(s.occ.status, 'CANCELLED'); assert.equal(s.occ.reason, 'stopped'); assert.equal(s.session.state, 'SILENCED');
  assert.ok(!current(s, id, gen));                                  // audio/timer callbacks captured earlier must not act
  const evs = []; for (const t of [30, 90, 200, 400, 900, 3600]) { const r = tick(s, due + t * 1000); s = r.state; evs.push(...r.events); }
  assert.deepEqual(evs, []);                                        // no restart, no stage events
  assert.equal(s.occ.status, 'CANCELLED'); assert.equal(s.next.status, 'PENDING'); assert.equal(s.next.due, due + 86_400_000);
  assert.ok(s.outbox.some(o => o.k === 'occ' && o.act === 'cancel'));
  assert.equal(win(s, id, due + 30_000), s);                        // a late win cannot revive or complete a stopped occurrence
  assert.equal(taskDone(s, due + 99_999), s);
});

test('free-play and stale wins never complete an alarm; a win on the live occurrence without a task completes it', () => {
  const {s, due} = ring();
  assert.equal(win(s, null, due + 5000), s);                        // free play passes no occurrence id
  assert.equal(win(s, 'some-other-occurrence', due + 5000), s);
  const done = win(s, s.occ.id, due + 5000);
  assert.equal(done.occ.status, 'COMPLETED'); assert.equal(done.occ.reason, 'puzzle'); assert.equal(done.session.state, 'SILENCED');
  assert.equal(win(done, s.occ.id, due + 6000), done);              // already finished: a second win does nothing
  assert.equal(tick(done, due + 400_000).events.length, 0);         // completed: no follow-ups
});

test('task label: the puzzle win is not the task; Task done needs a separate tap after the friction window', () => {
  const {s, due} = ring({label: 'take pills'});
  const w = win(s, s.occ.id, due + 10_000);
  assert.equal(w.occ.status, 'ACTIVE'); assert.equal(w.occ.puzzleDone, true);
  assert.ok(!taskReady(w, due + 10_000 + FRICTION_MS - 1));
  assert.equal(taskDone(w, due + 10_000 + 1000), w);                // too early: unchanged
  assert.equal(taskDone(s, due + 99_000), s);                       // no puzzle yet: unchanged
  const t = taskDone(w, due + 10_000 + FRICTION_MS);
  assert.equal(t.occ.status, 'COMPLETED'); assert.equal(t.occ.reason, 'task');
});

test('no legal moves: a new board attempt on the same occurrence', () => {
  const {s} = ring(), a1 = attemptId(s), n = noMoves(s, s.occ.id);
  assert.equal(n.occ.id, s.occ.id); assert.equal(n.occ.status, 'ACTIVE'); assert.notEqual(attemptId(n), a1); assert.equal(noMoves(s, 'other'), s);
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
  ({s} = ring()); s = disable(s, due + 5000);
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
