// MOM's: 2048 Reminder state machine (pure: state in, state out; no DOM, no storage, no clock except the `now` you pass).
// An occurrence ends only by: a genuine 2048 win or loss on ITS board, the held emergency stop, Settings "Turn off alarm" (locked until T0+540 s), or expiry.
// A notice being closed, tapped or opened, the app being opened, or a game being started/restarted/abandoned NEVER stops it. Free-play never reaches this module.
import {stageFor, OFF_LOCK_MS, MISS_MS, MAX_LABEL, copyFor} from './stages.js';
export {MAX_LABEL};

export const SOUNDS = [
  {id: 'air-horn', name: 'Air Horn', blurb: 'Short, repeated horn blasts', file: 'adhd_air_horn'},
  {id: 'train-horn', name: 'Train Horn', blurb: 'Sustained dissonant horn chord with breaks', file: 'adhd_train_horn'},
  {id: 'buzzer', name: 'Industrial Buzzer', blurb: 'Harsh rhythmic buzzer', file: 'adhd_industrial_buzzer'},
  {id: 'crash', name: 'Crash Alarm', blurb: 'Metallic crash, then a repeating harsh pulse', file: 'adhd_crash_alarm'},
];
export const RECURS = ['once', 'daily', 'weekdays'];
export const MAX_LATE_MS = 15 * 60_000;           // app closed at due time: that occurrence is MISSED, not rung late
const CONFIG = ['time', 'recur', 'sound', 'followups', 'tandem'];   // tandem is retired (always false) but kept so stored schedules keep their key   // changing any of these needs a fresh review + "Arm this alarm"

// occ = the current occurrence (ACTIVE, or the one that just ended); next = the upcoming PENDING one; history = recent outcomes.
export const emptyState = () => ({v: 1, schedule: null, occ: null, next: null, session: null, history: [], outbox: []});
const copy = s => JSON.parse(JSON.stringify(s));
const live = s => s.occ?.status === 'ACTIVE';

// ---- time -------------------------------------------------------------------------------------------------
/** Next local wall-clock `time` strictly after `after` that the recurrence allows (device time zone). */
export function nextDue(schedule, after) {
  const [h, m] = schedule.time.split(':').map(Number), a = new Date(after);
  for (let d = 0; d < 9; d++) {
    const t = new Date(a.getFullYear(), a.getMonth(), a.getDate() + d, h, m, 0, 0);
    if (schedule.recur === 'weekdays' && (t.getDay() === 0 || t.getDay() === 6)) continue;
    if (t.getTime() > after) return t.getTime();
  }
  return null;
}

// ---- setup: draft -> review -> arm ------------------------------------------------------------------------
const reviewed = new WeakSet();                    // only review() can mint an armable object, so arm() cannot be reached without the review step
const keyOf = d => JSON.stringify(CONFIG.map(k => d[k]));
export function review(draft) {
  const d = {time: draft.time, recur: draft.recur, label: String(draft.label || '').trim().slice(0, MAX_LABEL), sound: draft.sound,
    followups: !!draft.followups, tandem: false};
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time || '')) throw Error('Pick a time.');
  if (!RECURS.includes(d.recur)) throw Error('Pick how often.');
  const sound = SOUNDS.find(s => s.id === d.sound);
  if (!sound) throw Error('Choose a sound. None is chosen for you.');
  const summary = [`Time: ${d.time}`, `Repeats: ${{once: 'once', daily: 'every day', weekdays: 'weekdays'}[d.recur]}`,
    d.label ? `Reminder text: ${d.label}` : 'Reminder text: none (it will say "Your reminder")',
    `Sound while the app is open: ${sound.name}`,
    d.followups ? 'Escalation: ON (first alert at the due time, then 5 min, 3 min, 1 min, then every 30 s. It stops when you finish a 2048 game, win or lose, or hold Emergency stop. Turning the alarm off or changing its time in Settings unlocks 9 minutes after the due time.)'
      : 'Escalation: off (one alert only)'];
  const r = {draft: d, summary, key: keyOf(d)};
  reviewed.add(r);
  return r;
}
/** Arm (or re-arm) the alarm from a reviewed draft. Throws unless the object came from review() and still matches. */
export function arm(state, rev, now) {
  if (!reviewed.has(rev) || rev.key !== keyOf(rev.draft)) throw Error('Review the alarm and tap "Arm this alarm".');
  const timeChange = !!state.schedule && state.schedule.time !== rev.draft.time;
  if (timeChange && offLockLeft(state, now) > 0) throw Error('Changing the time is locked while this alarm is escalating. It unlocks in ' + Math.ceil(offLockLeft(state, now) / 1000) + ' s.');   // same lock as Turn off
  const s = copy(state), d = rev.draft, cur = s.schedule, changed = !cur || keyOf(cur) !== rev.key;
  if (timeChange && live(s)) end(s, 'CANCELLED', 'rescheduled', now);          // from T0+540 s a new time ends the current occurrence; the reminder stays enabled
  s.schedule = {id: cur?.id || Math.random().toString(36).slice(2, 14).padEnd(12, '0'), revision: (cur?.revision || 0) + (changed ? 1 : 0), enabled: true,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', armedAt: now, ...d};
  s.next = pending(s.schedule, now);                       // other edits never touch a ringing occurrence; the next one uses the new settings
  s.outbox = queue(s.outbox, {k: 'schedule'});
  return s;
}
/** Label-only edit: not one of the confirmed settings, so no new confirmation. */
export function setLabel(state, label) {
  const s = copy(state); if (!s.schedule) return s;
  s.schedule.label = String(label || '').trim().slice(0, MAX_LABEL);
  if (s.next) s.next.label = s.schedule.label;
  s.outbox = queue(s.outbox, {k: 'schedule'});
  return s;
}
/** Milliseconds until Settings "Turn off alarm" is allowed: an escalating occurrence is locked until T0 + 540 s (by due time, so late delivery never extends it). */
export const offLockLeft = (state, now) => live(state) && state.occ.followups ? Math.max(0, state.occ.due + OFF_LOCK_MS - now) : 0;
/** Turn the whole schedule off (this also ends a live occurrence as CANCELLED). Rejected (state returned unchanged) while locked: guard lives here, not in the UI. */
export function disable(state, now) {
  if (offLockLeft(state, now) > 0) return state;
  const s = live(state) ? stop(state, now) : copy(state);
  if (!s.schedule) return s;
  s.schedule.enabled = false; s.next = null;
  s.outbox = queue(s.outbox, {k: 'schedule'});
  return s;
}

const queue = (outbox, item) => [...outbox.filter(o => o.k !== item.k || o.id !== item.id || o.act !== item.act), item];
const pending = (sc, now) => {
  const due = nextDue(sc, now);
  return due === null ? null : {id: `${sc.id}:${due}`, rev: sc.revision, due, status: 'PENDING', reason: null, label: sc.label, followups: sc.followups, tandem: false,
    attempt: 1, ackedAt: null};
};

// ---- the occurrence lifecycle -----------------------------------------------------------------------------
function end(s, status, reason, now) {                  // ACTIVE -> COMPLETED | CANCELLED | MISSED; bumps the alert generation
  s.history = [{id: s.occ.id, status, reason, due: s.occ.due, label: s.occ.label}, ...s.history].slice(0, 8);
  s.occ = {...s.occ, status, reason};
  s.session = {...(s.session || {}), occId: s.occ.id, state: 'SILENCED', gen: (s.session?.gen || 0) + 1};
  s.outbox = queue(s.outbox, {k: 'occ', id: s.occ.id, act: status === 'COMPLETED' ? 'complete' : 'cancel'});
  return s;
}

/** Advance time. Returns {state, events}. Events: start | stage | missed (a stage event is one alert: stage 4 repeats every 30 s). Safe to call every second. */
export function tick(state, now) {
  const s = copy(state), events = [];
  for (let guard = 0; s.next && now >= s.next.due && guard < 10; guard++) {      // an occurrence's time has come (a loop, in case the app was closed for days)
    if (live(s)) { const id = s.occ.id; end(s, 'MISSED', 'superseded', now); events.push({type: 'missed', occId: id}); }
    const n = s.next, sc = s.schedule;
    if (sc.recur === 'once') { sc.enabled = false; s.next = null; } else s.next = pending(sc, n.due);
    if (now - n.due > MAX_LATE_MS) {                                                // the app was closed at due time: recorded, never rung late
      s.occ = {...n, status: 'MISSED', reason: 'app-closed'};
      s.history = [{id: n.id, status: 'MISSED', reason: 'app-closed', due: n.due, label: n.label}, ...s.history].slice(0, 8);
      events.push({type: 'missed', occId: n.id});
    } else {
      s.occ = {...n, status: 'ACTIVE'};
      const st = n.followups ? stageFor((now - n.due) / 1000) : 0;                 // opened late: start straight at the current alert (one alert, no catch-up)
      s.session = {occId: n.id, state: 'ALERTING', stage: st, gen: (s.session?.gen || 0) + 1};
      events.push({type: 'start', occId: n.id, stage: st, text: copyFor(st, n.label)});
    }
  }
  if (live(s) && s.session.state !== 'SILENCED') {
    const o = s.occ, el = (now - o.due) / 1000;
    if (now - o.due > MISS_MS) { end(s, 'MISSED', 'expired', now); events.push({type: 'missed', occId: o.id}); }
    else {
      if (o.followups) {                                // opt-in escalation. One event per tick at most: after a delay we reconcile to the CURRENT alert, no burst.
        const st = stageFor(el);
        if (st > s.session.stage) { s.session.stage = st; events.push({type: 'stage', occId: o.id, stage: st, text: copyFor(st, o.label)}); }
      }
    }
  }
  return {state: s, events};
}

/** Opening the app, tapping a notice or pressing "Open challenge": recorded, nothing else. It never pauses, resets or ends the escalation. */
export function acknowledge(state, now) {
  if (!live(state) || state.occ.ackedAt) return state;
  const s = copy(state); s.occ.ackedAt = now;
  s.outbox = queue(s.outbox, {k: 'occ', id: s.occ.id, act: 'ack'});
  return s;
}
/** Emergency stop (the UI asks for a ~3 s hold): ends this occurrence as CANCELLED. It never restarts and never disables the reminder. */
export function stop(state, now) { return live(state) ? end(copy(state), 'CANCELLED', 'stopped', now) : copy(state); }
/** A real 2048 win on THIS occurrence's board dismisses it (no tile requirement is ever imposed). Stale / other-occurrence results are ignored. */
export function win(state, occId, now) { return live(state) && occId && state.occ.id === occId ? end(copy(state), 'COMPLETED', 'win', now) : state; }
/** A genuine loss (full board and no legal move; see board.js) on THIS occurrence's board dismisses it the same way. */
export function lose(state, occId, now) { return live(state) && occId && state.occ.id === occId ? end(copy(state), 'COMPLETED', 'loss', now) : state; }
export const attemptId = state => live(state) ? `${state.occ.id}:${state.occ.attempt}` : null;
/** Is a captured alert (occurrence + generation) still the live one? Timers and audio callbacks must check this before acting. */
export const current = (state, occId, gen) => live(state) && state.occ.id === occId && state.session?.gen === gen && state.session.state !== 'SILENCED';

/** What a tapped/old notice should show: the CURRENT truth about that occurrence. */
export function lookup(state, occId) {
  if (state.occ?.id === occId) return {...state.occ, source: 'current'};
  if (state.next?.id === occId) return {...state.next, source: 'current'};
  const h = state.history.find(x => x.id === occId);
  return h ? {...h, source: 'history'} : null;
}
/** Merge what the server says about an occurrence (read on notice open). A server terminal state ends a live local one; nothing reactivates. */
export function applyRemote(state, remote, now) {
  if (!remote || !live(state) || state.occ.id !== remote.id || remote.status === 'ACTIVE' || remote.status === 'PENDING') return state;
  return end(copy(state), remote.status, 'server:' + (remote.reason || remote.status.toLowerCase()), now);
}
export const pendingSync = state => state.outbox.length;

// ---- persistence (try/catch everywhere: storage can be blocked or full) ---------------------------------------
const KEY = 'adhd-alarm-state-v1';
export function load(storage = globalThis.localStorage) {
  try { const j = JSON.parse(storage.getItem(KEY)); if (j?.v === 1 && Array.isArray(j.history) && Array.isArray(j.outbox)) return j; } catch {}
  return emptyState();
}
export function save(state, storage = globalThis.localStorage) { try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; } }
