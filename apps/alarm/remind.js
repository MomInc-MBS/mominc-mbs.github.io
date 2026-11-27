// MOM's: 2048 Reminder state machine, MANY reminders (pure: state in, state out; no DOM, no storage, no clock except the `now` you pass).
// Every reminder has its own next / occurrence / session / generation. An occurrence ends only by: a genuine 2048 win or loss on ITS board, the held
// emergency stop, Settings off/remove/disable (locked until T0+540 s), an optional check-in the reminder chose, or expiry.
// A notice being closed, tapped or opened, the app being opened, or a game being started/restarted/abandoned NEVER stops it. Free-play never reaches this module.
import {stageFor, faceFor, OFF_LOCK_MS, MISS_MS, MAX_LABEL, copyFor} from './stages.js';
import {advance, recurFromLegacy, defaultRecur, recurError, isTime, validZone, deviceZone} from './recurrence.js';
import {judge} from './games/rules.js';
export {MAX_LABEL};

export const SOUNDS = [
  {id: 'air-horn', name: 'Air Horn', blurb: 'Short, repeated horn blasts', file: 'adhd_air_horn'},
  {id: 'train-horn', name: 'Train Horn', blurb: 'Sustained dissonant horn chord with breaks', file: 'adhd_train_horn'},
  {id: 'buzzer', name: 'Industrial Buzzer', blurb: 'Harsh rhythmic buzzer', file: 'adhd_industrial_buzzer'},
  {id: 'crash', name: 'Crash Alarm', blurb: 'Metallic crash, then a repeating harsh pulse', file: 'adhd_crash_alarm'},
];
export const RECURS = ['once', 'daily', 'weekdays'];       // the simple setup form; the full recurrence kinds live in recurrence.js
export const EXTRAS = ['qr', 'nfc', 'motion'];             // check-ins this build can verify; math/pattern belong to the visual lane's UI
export const MAX_LATE_MS = 15 * 60_000;                    // app closed at due time: that occurrence is MISSED, not rung late
export const MAX_HISTORY = 500;                            // storage sanity only
const EXEMPT = ['rev', 'confirmed', 'enabled', 'title'];   // not part of what the user confirms; recur.skip / skipNext are exempt too

export const emptyState = () => ({v: 2, reminders: [], runs: {}, history: [], outbox: []});
const copy = s => JSON.parse(JSON.stringify(s));
const runOf = (s, id) => s.runs[id] || (s.runs[id] = {next: null, occ: null, session: null});
const live = (s, id) => s.runs[id]?.occ?.status === 'ACTIVE';
const liveRuns = s => s.reminders.filter(r => live(s, r.id)).map(r => s.runs[r.id]);
const findRun = (s, occId) => Object.values(s.runs).find(r => r.occ?.id === occId);
export const reminderOf = (s, id) => s.reminders.find(r => r.id === id) || null;

// ---- the reminder record -----------------------------------------------------------------------------------
const newId = () => 'r_' + Math.random().toString(36).slice(2, 12).padEnd(10, '0');
/** A fresh draft: no sound is chosen for the user, so it cannot be confirmed until one is picked. */
export const blank = () => ({id: newId(), rev: 0, enabled: true, title: '', time: '', recur: defaultRecur(), tz: {mode: 'device', zone: deviceZone()}, escalate: true,
  sound: {stage: [null, null, null, null], rotate: false, pattern: 'burst', volume: 80, ramp: {from: 40, to: 100, secs: 20}, streamBoost: false}, speak: 'off',
  vibrate: {pattern: 'pulse', strength: 100}, torch: 'off', screen: {brightness: 100, border: true, pulse: false}, present: {fullScreen: true, lockScreen: true, wake: true, overlay: false},
  snooze: 0, challenge: {extra: null, code: null, nfc: null, steps: 0}, webhook: null, confirmed: null});
/** Fill defaults without dropping unknown fields (forward compatibility). */
export function normalize(r) {
  const b = blank(), o = {...b, ...r};
  for (const k of ['recur', 'tz', 'sound', 'vibrate', 'screen', 'present', 'challenge']) o[k] = {...b[k], ...(r?.[k] || {})};
  o.title = String(r?.title ?? '').trim().slice(0, MAX_LABEL);
  o.rev = Math.max(0, r?.rev | 0); o.enabled = r?.enabled !== false; o.escalate = r?.escalate !== false;
  return o;
}
export const soundPicked = r => Array.isArray(r.sound?.stage) && r.sound.stage.length === 4 && r.sound.stage.every(id => SOUNDS.some(s => s.id === id));
export const isArmed = r => !!r.enabled && r.confirmed?.rev === r.rev && r.rev > 0;
const bad = (field, extra) => ({ok: false, error: 'invalid', field, ...extra});
/** Structural validation of a reminder record. Returns null or {ok:false, error:'invalid', field}. */
export function check(r) {
  if (typeof r.id !== 'string' || !/^[A-Za-z0-9_-]{4,40}$/.test(r.id)) return bad('id');
  if (!isTime(r.time)) return bad('time');
  const re = recurError(r.recur); if (re) return bad(re);
  if (!['device', 'fixed'].includes(r.tz.mode) || (r.tz.mode === 'fixed' && !validZone(r.tz.zone))) return bad('tz');
  if (r.sound.stage.some(id => id != null && !SOUNDS.some(s => s.id === id))) return bad('sound');
  if (!(r.sound.volume >= 0 && r.sound.volume <= 100)) return bad('sound.volume');
  if (!(r.snooze >= 0 && r.snooze <= 3600)) return bad('snooze');
  if (!['off', 'title'].includes(r.speak)) return bad('speak');
  if (r.challenge.extra != null && !EXTRAS.includes(r.challenge.extra) && !['math', 'pattern'].includes(r.challenge.extra)) return bad('challenge');
  if (r.webhook != null && !(typeof r.webhook.url === 'string' && /^https:\/\/[^\s]{1,500}$/.test(r.webhook.url))) return bad('webhook');
  return null;
}
const cfgKey = r => { const o = {...r, recur: {...r.recur, skip: undefined, skipNext: undefined}}; for (const k of EXEMPT) delete o[k]; return JSON.stringify(o); };

// ---- pending occurrence ------------------------------------------------------------------------------------
const zoneNow = opts => opts?.deviceZone || deviceZone();
function plan(s, r, now, opts) {                          // (re)compute the pending occurrence; consumes recur.skipNext into the stored record
  const run = runOf(s, r.id);
  if (!isArmed(r)) return void (run.next = null);
  const x = advance(r, now, {deviceZone: zoneNow(opts)});
  if (x.reminder !== r) r.recur = x.reminder.recur;
  run.next = x.due === null ? null : {id: `${r.id}:${x.due}`, rid: r.id, rev: r.rev, due: x.due, status: 'PENDING', reason: null, title: r.title, escalate: r.escalate,
    snooze: r.snooze | 0, extra: r.challenge.extra || null, zone: zoneNow(opts), attempt: 1, ackedAt: null};
}
const queue = (outbox, item) => [...outbox.filter(o => o.k !== item.k || o.id !== item.id || o.act !== item.act), item];
const OUTCOME = {win: 'win', loss: 'loss', stopped: 'emergency', off: 'off', rescheduled: 'off', removed: 'off', checkin: 'checkin', expired: 'missed', superseded: 'missed', 'app-closed': 'missed'};
const outcomeOf = reason => OUTCOME[reason] || (String(reason).startsWith('server:') ? 'interrupted' : 'missed');
const STATUS = {win: 'COMPLETED', loss: 'COMPLETED', checkin: 'COMPLETED', emergency: 'CANCELLED', off: 'CANCELLED', interrupted: 'CANCELLED', missed: 'MISSED'};

// ---- migration from the single-schedule v1 state -----------------------------------------------------------
export function migrateV1(j) {
  const s = emptyState(), sc = j.schedule;
  if (sc) {
    const sound = SOUNDS.some(x => x.id === sc.sound) ? sc.sound : null;
    const r = normalize({id: sc.id, rev: sc.revision || 1, enabled: sc.enabled !== false, title: sc.label || '', time: sc.time, recur: {...defaultRecur(), ...recurFromLegacy(sc.recur)},
      tz: {mode: 'device', zone: validZone(sc.tz) ? sc.tz : deviceZone()}, escalate: !!sc.followups, sound: {...blank().sound, stage: [sound, sound, sound, sound]},
      confirmed: {rev: sc.revision || 1, at: sc.armedAt || 0}, tandem: !!sc.tandem});
    s.reminders.push(r);
    const run = runOf(s, r.id);
    const up = o => o && {...o, rid: r.id, title: o.label ?? '', escalate: !!o.followups, snooze: 0, extra: null};
    run.next = up(j.next); run.occ = up(j.occ); run.session = j.session ? {...j.session} : null;
  }
  s.history = (j.history || []).map(h => ({occId: h.id, reminderId: sc?.id || '', dueAt: h.due, endedAt: h.due, outcome: outcomeOf(h.reason), stage: 1, title: h.label || ''}));
  s.outbox = (j.outbox || []).map(o => o.k === 'schedule' ? {...o, id: sc?.id} : o).filter(o => o.id);
  return s;
}

// ---- save / confirm / lock -------------------------------------------------------------------------------
/** Milliseconds until Settings off / remove / time change is allowed for ONE reminder (or the longest across all when id is omitted). Counts from the due time, so late delivery never extends it. */
export function offLockLeft(state, now, id) {
  const one = r => { const o = r?.occ; return o?.status === 'ACTIVE' && o.escalate ? Math.max(0, o.due + OFF_LOCK_MS - now) : 0; };
  return id ? one(state.runs[id]) : Math.max(0, ...Object.values(state.runs).map(one));
}
const locked = (state, id, now) => ({ok: false, error: 'locked', remainingMs: offLockLeft(state, now, id)});

/** Save a reminder. Returns {ok, state, reminder} or {ok:false, error:'invalid'|'locked', field?, remainingMs?}. The caller's `confirmed` is honoured only when it names the NEW revision. */
export function saveReminder(state, input, now, opts = {}) {
  const r = normalize(input), err = check(r); if (err) return err;
  const old = reminderOf(state, r.id), timeChanged = !!old && (old.time !== r.time || JSON.stringify(old.tz) !== JSON.stringify(r.tz));
  if (old && offLockLeft(state, now, r.id) > 0 && (timeChanged || (old.enabled && !r.enabled))) return locked(state, r.id, now);   // same lock as Turn off
  const changed = !old || cfgKey(old) !== cfgKey(r);
  const rev = old ? old.rev + (changed ? 1 : 0) : 1;
  const keep = old && !changed && old.confirmed?.rev === old.rev;
  const claimed = r.confirmed?.rev, callerRev = input.rev | 0;   // the settings UI sends rev: old+1 with confirmed.rev: old+1: honoured as ONE bump even when nothing changed (then rev stays, no double bump)
  const ok = soundPicked(r) && (keep || claimed === rev || (claimed === callerRev && callerRev === (old ? old.rev : 0) + 1) || (opts.trust && r.confirmed?.at > 0));   // opts.trust: an import of this app's own export keeps its confirmations
  const s = copy(state); r.rev = rev; r.confirmed = ok ? {rev, at: keep ? old.confirmed.at : r.confirmed?.at || now} : null;
  const i = s.reminders.findIndex(x => x.id === r.id);
  if (i < 0) s.reminders.push(r); else s.reminders[i] = r;
  if (timeChanged && live(s, r.id)) end(s, r.id, 'CANCELLED', 'rescheduled', now);      // past the lock: a new time ends the current occurrence; the reminder stays on
  plan(s, r, now, opts);
  s.outbox = queue(s.outbox, {k: 'schedule', id: r.id});
  return {ok: true, state: s, reminder: r};
}
/** setEnabled / disable. Rejected (error object) while locked. */
export function setEnabled(state, id, on, now, opts) {
  const r = reminderOf(state, id); if (!r) return {ok: false, error: 'invalid', field: 'id'};
  if (!on && offLockLeft(state, now, id) > 0) return locked(state, id, now);
  if (r.enabled === on) return {ok: true, state, reminder: r};
  const s = copy(state), x = reminderOf(s, id); x.enabled = on;
  if (!on && live(s, id)) end(s, id, 'CANCELLED', 'off', now);
  plan(s, x, now, opts);
  s.outbox = queue(s.outbox, {k: 'schedule', id});
  return {ok: true, state: s, reminder: x};
}
/** Remove a reminder (history stays). Locked like Turn off. */
export function removeReminder(state, id, now) {
  if (!reminderOf(state, id)) return {ok: true, state};
  if (offLockLeft(state, now, id) > 0) return locked(state, id, now);
  const s = copy(state);
  if (live(s, id)) end(s, id, 'CANCELLED', 'removed', now);
  s.reminders = s.reminders.filter(r => r.id !== id); delete s.runs[id];
  s.outbox = queue(s.outbox.filter(o => !(o.k === 'schedule' && o.id === id)), {k: 'remove', id});
  return {ok: true, state: s};
}
/** Recompute pending occurrences (after load, import, or a phone time-zone change). Never touches a live occurrence. */
export function reconcile(state, now, opts) {
  const s = copy(state);
  for (const r of s.reminders) {
    const run = runOf(s, r.id), z = zoneNow(opts);
    if (r.tz.mode === 'device' && r.tz.zone !== z) { r.tz = {...r.tz, zone: z}; s.outbox = queue(s.outbox, {k: 'schedule', id: r.id}); }   // the server follows the phone's last reported zone
    if (isArmed(r) && (!run.next || (r.tz.mode === 'device' && run.next.zone !== z))) plan(s, r, now, opts);
  }
  for (const id of Object.keys(s.runs)) if (!reminderOf(s, id)) delete s.runs[id];
  return s;
}

// ---- setup flow used by the current UI: draft -> review -> arm -----------------------------------------------------
const reviewed = new WeakSet();                           // only review() mints an armable object, so arm() cannot be reached without the review step
export function reminderFromDraft(draft, base) {
  const b = base ? normalize(base) : blank(), sound = draft.sound;
  // 'keep' = leave a recurrence this simple form cannot show (weekly days, interval, dates); an unchanged first sound keeps every per-stage pick, volume and ramp
  return normalize({...b, title: draft.label ?? draft.title ?? b.title, time: draft.time, recur: draft.recur === 'keep' ? b.recur : {...b.recur, ...recurFromLegacy(draft.recur)},
    escalate: draft.followups ?? draft.escalate, sound: base && sound === base.sound?.stage?.[0] ? b.sound : {...b.sound, stage: [sound, sound, sound, sound]}});
}
export function review(draft, base) {
  const r = reminderFromDraft(draft, base);
  if (!isTime(r.time)) throw Error('Pick a time.');
  if (![...RECURS, 'keep'].includes(draft.recur)) throw Error('Pick how often.');
  const sound = SOUNDS.find(s => s.id === draft.sound);
  if (!sound) throw Error('Choose a sound. None is chosen for you.');
  const summary = [`Time: ${r.time}`, `Repeats: ${{once: 'once', daily: 'every day', weekdays: 'weekdays'}[draft.recur] || 'your custom schedule'}`,
    r.title ? `Reminder text: ${r.title}` : 'Reminder text: none (it will say "Your reminder")',
    `Sound while the app is open: ${sound.name}`,
    r.escalate ? 'Escalation: ON (first alert at the due time, then 5 min, 3 min, 1 min, then every 30 s. It stops when you finish a 2048 game, win or lose, or hold Emergency stop. Turning the alarm off or changing its time in Settings unlocks 9 minutes after the due time.)'
      : 'Escalation: off (one alert only)'];
  const rv = {draft: r, summary, key: cfgKey(r) + '|' + r.title};
  reviewed.add(rv);
  return rv;
}
/** Arm (or re-arm) a reminder from a reviewed draft. Throws unless the object came from review() and still matches. Returns the new state. */
export function arm(state, rev, now, opts) {
  if (!reviewed.has(rev) || rev.key !== cfgKey(rev.draft) + '|' + rev.draft.title) throw Error('Review the alarm and tap "Arm this alarm".');
  const old = reminderOf(state, rev.draft.id), want = old ? old.rev + (cfgKey(old) !== cfgKey(rev.draft) ? 1 : 0) : 1;
  const res = saveReminder(state, {...rev.draft, enabled: true, confirmed: {rev: want, at: now}}, now, opts);
  if (res.error === 'locked') throw Error('Changing the time is locked while this alarm is escalating. It unlocks in ' + Math.ceil(res.remainingMs / 1000) + ' s.');
  if (!res.ok) throw Error('Check the ' + res.field + '.');
  return res.state;
}

// ---- the occurrence lifecycle -----------------------------------------------------------------------------
function end(s, id, status, reason, now) {                // ACTIVE -> COMPLETED | CANCELLED | MISSED; bumps that reminder's alert generation
  const run = s.runs[id], o = run.occ, outcome = outcomeOf(reason);
  s.history = [{occId: o.id, reminderId: id, dueAt: o.due, endedAt: now, outcome, stage: faceFor(run.session?.stage) + 1, title: o.title}, ...s.history].slice(0, MAX_HISTORY);
  run.occ = {...o, status, reason, outcome};
  run.session = {...(run.session || {}), occId: o.id, state: 'SILENCED', gen: (run.session?.gen || 0) + 1};
  s.outbox = queue(s.outbox, {k: 'occ', id: o.id, act: status === 'COMPLETED' ? 'complete' : 'cancel'});
  return s;
}

/** Advance time. Returns {state, events}. Events: start | stage | missed, each with reminderId (a stage event is one alert: stage 4 repeats every 30 s). Safe to call every second. */
export function tick(state, now) {
  const s = copy(state), events = [];
  for (const rem of s.reminders) {
    const id = rem.id, run = runOf(s, id);
    for (let guard = 0; run.next && now >= run.next.due && guard < 10; guard++) {      // an occurrence's time has come (a loop, in case the app was closed for days)
      if (live(s, id)) { const o = run.occ.id; end(s, id, 'MISSED', 'superseded', now); events.push({type: 'missed', occId: o, reminderId: id}); }
      const n = run.next;
      if (rem.recur.kind === 'once') { rem.enabled = false; run.next = null; } else plan(s, rem, n.due, {deviceZone: n.zone});
      if (now - n.due > MAX_LATE_MS) {                                                  // the app was closed at due time: recorded, never rung late
        run.occ = {...n, status: 'MISSED', reason: 'app-closed', outcome: 'missed'};
        s.history = [{occId: n.id, reminderId: id, dueAt: n.due, endedAt: now, outcome: 'missed', stage: 1, title: n.title}, ...s.history].slice(0, MAX_HISTORY);
        events.push({type: 'missed', occId: n.id, reminderId: id});
      } else {
        run.occ = {...n, status: 'ACTIVE'};
        const st = n.escalate ? stageFor((now - n.due) / 1000) : 0;                      // opened late: start straight at the current alert (one alert, no catch-up)
        run.session = {occId: n.id, state: 'ALERTING', stage: st, gen: (run.session?.gen || 0) + 1, snoozeUntil: 0};
        events.push({type: 'start', occId: n.id, reminderId: id, stage: st, text: copyFor(st, n.title)});
      }
    }
    if (live(s, id) && run.session.state !== 'SILENCED') {
      const o = run.occ, el = (now - o.due) / 1000;
      if (now - o.due > MISS_MS) { end(s, id, 'MISSED', 'expired', now); events.push({type: 'missed', occId: o.id, reminderId: id}); }
      else if (o.escalate) {                            // opt-in escalation. One event per tick at most: after a delay we reconcile to the CURRENT alert, no burst.
        const st = stageFor(el);
        if (st > run.session.stage) { run.session.stage = st; events.push({type: 'stage', occId: o.id, reminderId: id, stage: st, text: copyFor(st, o.title)}); }
      }
    }
  }
  return {state: s, events};
}

/** Opening the app, tapping a notice or pressing "Open challenge": recorded, nothing else. */
export function acknowledge(state, occId, now) {
  const run = findRun(state, occId);
  if (!run || run.occ.status !== 'ACTIVE' || run.occ.ackedAt) return state;
  const s = copy(state), o = findRun(s, occId).occ; o.ackedAt = now;
  s.outbox = queue(s.outbox, {k: 'occ', id: o.id, act: 'ack'});
  return s;
}
const finish = (state, occId, status, reason, now) => {
  const run = occId && findRun(state, occId);
  return run && run.occ.status === 'ACTIVE' ? end(copy(state), run.occ.rid, status, reason, now) : state;
};
/** Emergency stop (the UI asks for a ~3 s hold): ends this occurrence only. It never restarts and never disables the reminder. */
export const stop = (state, occId, now) => finish(state, occId, 'CANCELLED', 'stopped', now);
/** A real 2048 win on THIS occurrence's board dismisses it (no tile requirement is ever imposed). Stale / other-occurrence results are ignored. */
export const win = (state, occId, now) => finish(state, occId, 'COMPLETED', 'win', now);
/** A genuine loss (full board and no legal move; see board.js) on THIS occurrence's board dismisses it the same way. */
export const lose = (state, occId, now) => finish(state, occId, 'COMPLETED', 'loss', now);
/** An extra game's terminal result. Accepted ONLY for the active occurrence's current attempt (roundId = `<attemptId>:<n>`), and only when judge() re-derives the claimed
 * outcome from finalState. Same win/lose transition as 2048, so stage, escalation and sound behave identically. Anything else returns `state` itself (compare !==). */
export function finishGame(state, occId, r, now) {
  const att = attemptId(state, occId);
  if (!att || typeof r?.roundId !== 'string' || !r.roundId.startsWith(att + ':')) return state;
  const v = judge(r.gameId, r.rulesVersion, r.finalState);
  return v && v === r.outcome ? (v === 'won' ? win : lose)(state, occId, now) : state;
}
/** An alternative exit: accepted only if this occurrence's reminder selected that check-in. The 2048 win/loss and emergency stop always remain. */
export function checkin(state, occId, kind, now) { const run = findRun(state, occId); return run?.occ.status === 'ACTIVE' && run.occ.extra === kind ? finish(state, occId, 'COMPLETED', 'checkin', now) : state; }

/** Snooze = an OUTPUT pause only: T0, stage, board, generation and the unlock never move. Ignored unless the reminder selected a snooze length. */
export function snooze(state, occId, now) {
  const run = findRun(state, occId);
  if (!run || run.occ.status !== 'ACTIVE' || !(run.occ.snooze > 0)) return state;
  const s = copy(state), r = findRun(s, occId), until = now + run.occ.snooze * 1000; r.session.snoozeUntil = until;
  s.outbox = queue(s.outbox, {k: 'occ', id: occId, act: 'snooze', until});
  return s;
}
export const snoozed = (state, occId, now) => { const run = findRun(state, occId); return !!run && run.occ.status === 'ACTIVE' && (run.session?.snoozeUntil || 0) > now; };

export const attemptId = (state, occId) => { const run = findRun(state, occId); return run?.occ.status === 'ACTIVE' ? `${occId}:${run.occ.attempt}` : null; };
/** Is a captured alert (occurrence + generation) still the live one? Timers and audio callbacks must check this before acting. */
export const current = (state, occId, gen) => { const run = findRun(state, occId); return run?.occ.status === 'ACTIVE' && run.session?.gen === gen && run.session.state !== 'SILENCED'; };

/** What a tapped/old notice should show: the CURRENT truth about that occurrence. */
export function lookup(state, occId) {
  const run = findRun(state, occId);
  if (run) return {...run.occ, source: 'current'};
  for (const r of Object.values(state.runs)) if (r.next?.id === occId) return {...r.next, source: 'current'};
  const h = state.history.find(x => x.occId === occId);
  return h ? {id: h.occId, status: STATUS[h.outcome] || 'CANCELLED', reason: h.outcome, due: h.dueAt, title: h.title, source: 'history'} : null;
}
/** Merge what the server says about an occurrence. A server terminal state ends a live local one; nothing reactivates. */
export function applyRemote(state, remote, now) {
  const run = remote && findRun(state, remote.id);
  if (!run || run.occ.status !== 'ACTIVE' || remote.status === 'ACTIVE' || remote.status === 'PENDING') return state;
  return end(copy(state), run.occ.rid, remote.status, 'server:' + (remote.reason || remote.status.toLowerCase()), now);
}
export const pendingSync = state => state.outbox.length > 0;

// ---- global presentation: highest unresolved stage, ties earliest due ---------------------------------------
/** Live occurrences, best first: highest face, then earliest due. */
export function ranked(state) {
  return liveRuns(state).filter(r => r.session?.state !== 'SILENCED').map(r => ({occId: r.occ.id, reminderId: r.occ.rid, due: r.occ.due, alert: r.session.stage, face: faceFor(r.session.stage), stage: faceFor(r.session.stage) + 1}))
    .sort((a, b) => b.face - a.face || a.due - b.due);
}
const FACE = [['happy', 0.5], ['upset', 0.7], ['furious', 0.7], ['furious', 1]];
/** Read-only snapshot for the face/icon/controls (contract). capabilities, saveState, prefs and pendingSync are filled in by the adapter. */
export function snapshot(state, now) {
  const top = ranked(state)[0] || null, locks = liveRuns(state).filter(r => r.occ.escalate && r.occ.due + OFF_LOCK_MS > now).map(r => r.occ.due + OFF_LOCK_MS);
  const nexts = state.reminders.filter(isArmed).map(r => state.runs[r.id]?.next?.due).filter(Boolean);
  const [emotion, intensity] = top ? FACE[top.face] : ['happy', 0.3];
  return {occId: top?.occId ?? null, reminderId: top?.reminderId ?? null, dueAt: top?.due ?? null, rev: top ? findRun(state, top.occId).occ.rev : 0, stage: top?.stage ?? null, emotion, intensity, iconId: 'stage' + (top?.stage ?? 1),
    offAllowed: locks.length === 0, unlockAt: locks.length ? Math.min(...locks) : null, nextDue: nexts.length ? Math.min(...nexts) : null,
    capabilities: {}, saveState: 'idle', reducedMotion: false, highContrast: false, pendingSync: pendingSync(state)};
}

// ---- persistence (try/catch everywhere: storage can be blocked or full) ---------------------------------------
export const KEY = 'adhd-alarm-state-v2', KEY_V1 = 'adhd-alarm-state-v1';
const valid = j => j?.v === 2 && Array.isArray(j.reminders) && j.runs && typeof j.runs === 'object' && Array.isArray(j.history) && Array.isArray(j.outbox);
/** Load v2; if there is none, migrate the live v1 single schedule into the list (v1 is left untouched so a rollback still finds it). */
export function load(storage = globalThis.localStorage) {
  try { const j = JSON.parse(storage.getItem(KEY)); if (valid(j)) return j; } catch {}
  try { const j = JSON.parse(storage.getItem(KEY_V1)); if (j?.v === 1 && Array.isArray(j.history) && Array.isArray(j.outbox)) { const s = migrateV1(j); save(s, storage); return s; } } catch {}
  return emptyState();
}
export function save(state, storage = globalThis.localStorage) { try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; } }
