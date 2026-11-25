// ADHD reminder state machine (pure: state in, state out; no DOM, no storage, no clock except the `now` you pass).
// Three things are kept apart on purpose: the 2048 puzzle result, the real-world "Task done" claim, and the alert itself.
// A notice being closed, tapped or opened NEVER completes anything. Free-play wins never reach this module.
import {stageFor, stageStart, TANDEM_FROM, TANDEM_GAP_MS, ENGAGE_MS, MISS_MS, FRICTION_MS, copyFor, companionFor} from './stages.js';

export const SOUNDS = [
  {id: 'air-horn', name: 'Air Horn', blurb: 'Short, repeated horn blasts', file: 'adhd_air_horn'},
  {id: 'train-horn', name: 'Train Horn', blurb: 'Sustained dissonant horn chord with breaks', file: 'adhd_train_horn'},
  {id: 'buzzer', name: 'Industrial Buzzer', blurb: 'Harsh rhythmic buzzer', file: 'adhd_industrial_buzzer'},
  {id: 'crash', name: 'Crash Alarm', blurb: 'Metallic crash, then a repeating harsh pulse', file: 'adhd_crash_alarm'},
];
export const RECURS = ['once', 'daily', 'weekdays'];
export const MAX_LATE_MS = 15 * 60_000;           // app closed at due time: that occurrence is MISSED, not rung late
const CONFIG = ['time', 'recur', 'sound', 'followups', 'tandem'];   // changing any of these needs a fresh review + "Arm this alarm"

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
  const d = {time: draft.time, recur: draft.recur, label: String(draft.label || '').trim().slice(0, 60), sound: draft.sound,
    followups: !!draft.followups, tandem: !!draft.followups && !!draft.tandem};
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time || '')) throw Error('Pick a time.');
  if (!RECURS.includes(d.recur)) throw Error('Pick how often.');
  const sound = SOUNDS.find(s => s.id === d.sound);
  if (!sound) throw Error('Choose a sound. None is chosen for you.');
  const summary = [`Time: ${d.time}`, `Repeats: ${{once: 'once', daily: 'every day', weekdays: 'weekdays'}[d.recur]}`,
    d.label ? `Task: ${d.label}` : 'Task: none (the puzzle is the whole job)',
    `Sound while ADHD is open: ${sound.name}`,
    d.followups ? 'Follow-ups: ON (30 s, 90 s, 3 min, 5 min, then every 5 min until checked off)' : 'Follow-ups: off (one alert only)',
    d.tandem ? 'Tandem notices: ON (a companion notice about 3 s after the main one, from the 3-minute stage)' : 'Tandem notices: off'];
  const r = {draft: d, summary, key: keyOf(d)};
  reviewed.add(r);
  return r;
}
/** Arm (or re-arm) the alarm from a reviewed draft. Throws unless the object came from review() and still matches. */
export function arm(state, rev, now) {
  if (!reviewed.has(rev) || rev.key !== keyOf(rev.draft)) throw Error('Review the alarm and tap "Arm this alarm".');
  const s = copy(state), d = rev.draft, cur = s.schedule, changed = !cur || keyOf(cur) !== rev.key;
  s.schedule = {id: cur?.id || Math.random().toString(36).slice(2, 14).padEnd(12, '0'), revision: (cur?.revision || 0) + (changed ? 1 : 0), enabled: true,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', armedAt: now, ...d};
  s.next = pending(s.schedule, now);                       // a ringing occurrence is not touched by an edit; the next one uses the new settings
  s.outbox = queue(s.outbox, {k: 'schedule'});
  return s;
}
/** Label-only edit: not one of the confirmed settings, so no new confirmation. */
export function setLabel(state, label) {
  const s = copy(state); if (!s.schedule) return s;
  s.schedule.label = String(label || '').trim().slice(0, 60);
  if (s.next) s.next.label = s.schedule.label;
  s.outbox = queue(s.outbox, {k: 'schedule'});
  return s;
}
/** Turn the whole schedule off (this also ends a live occurrence as CANCELLED). */
export function disable(state, now) {
  const s = live(state) ? stop(state, now) : copy(state);
  if (!s.schedule) return s;
  s.schedule.enabled = false; s.next = null;
  s.outbox = queue(s.outbox, {k: 'schedule'});
  return s;
}

const queue = (outbox, item) => [...outbox.filter(o => o.k !== item.k || o.id !== item.id || o.act !== item.act), item];
const pending = (sc, now) => {
  const due = nextDue(sc, now);
  return due === null ? null : {id: `${sc.id}:${due}`, rev: sc.revision, due, status: 'PENDING', reason: null, label: sc.label, followups: sc.followups, tandem: sc.tandem,
    attempt: 1, puzzleDone: false, puzzleAt: null, ackedAt: null};
};

// ---- the occurrence lifecycle -----------------------------------------------------------------------------
function end(s, status, reason, now) {                  // ACTIVE -> COMPLETED | CANCELLED | MISSED; bumps the alert generation
  s.history = [{id: s.occ.id, status, reason, due: s.occ.due, label: s.occ.label}, ...s.history].slice(0, 8);
  s.occ = {...s.occ, status, reason};
  s.session = {...(s.session || {}), occId: s.occ.id, state: 'SILENCED', gen: (s.session?.gen || 0) + 1};
  s.outbox = queue(s.outbox, {k: 'occ', id: s.occ.id, act: status === 'COMPLETED' ? 'complete' : 'cancel'});
  return s;
}

/** Advance time. Returns {state, events}. Events: start | stage | companion | missed. Safe to call every second. */
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
      s.session = {occId: n.id, state: 'ALERTING', stage: 0, companion: -1, pausedUntil: 0, gen: (s.session?.gen || 0) + 1};
      events.push({type: 'start', occId: n.id, stage: 0, text: copyFor(0, n.label)});
    }
  }
  if (live(s) && s.session.state !== 'SILENCED') {
    const o = s.occ, el = (now - o.due) / 1000;
    if (now - o.due > MISS_MS) { end(s, 'MISSED', 'expired', now); events.push({type: 'missed', occId: o.id}); }
    else {
      if (s.session.state === 'ACKNOWLEDGED' && now >= s.session.pausedUntil) s.session.state = 'ALERTING';
      if (s.session.state === 'ALERTING' && o.followups) {
        const st = stageFor(el);
        if (st > s.session.stage) { s.session.stage = st; events.push({type: 'stage', occId: o.id, stage: st, text: copyFor(st, o.label)}); }
        if (o.tandem && s.session.stage >= TANDEM_FROM && s.session.companion !== s.session.stage && el >= stageStart(s.session.stage) + TANDEM_GAP_MS / 1000) {
          s.session.companion = s.session.stage; events.push({type: 'companion', occId: o.id, stage: s.session.stage, text: companionFor()});
        }
      }
    }
  }
  return {state: s, events};
}

/** Opening the app, tapping a notice or pressing "Open challenge": the user is engaged. Pauses follow-ups 60 s. Never completes. */
export function acknowledge(state, now) {
  if (!live(state) || state.session?.state !== 'ALERTING') return state;
  const s = copy(state); s.session.state = 'ACKNOWLEDGED'; s.session.pausedUntil = now + ENGAGE_MS; s.occ.ackedAt = now;
  s.outbox = queue(s.outbox, {k: 'occ', id: s.occ.id, act: 'ack'});
  return s;
}
/** Explicit Stop / cancel: ends this occurrence as CANCELLED (incomplete). It never restarts. Future recurrences stay. */
export function stop(state, now) { return live(state) ? end(copy(state), 'CANCELLED', 'stopped', now) : copy(state); }
/** A real 2048 merge on THIS occurrence's board. With a task label it only completes the puzzle; without one it completes the occurrence. */
export function win(state, occId, now) {
  if (!live(state) || !occId || state.occ.id !== occId) return state;           // free-play / stale / other-occurrence wins are ignored
  const s = copy(state);
  if (s.occ.label) { if (!s.occ.puzzleDone) { s.occ.puzzleDone = true; s.occ.puzzleAt = now; } return s; }
  return end(s, 'COMPLETED', 'puzzle', now);
}
export const taskReady = (state, now) => live(state) && !!state.occ.label && state.occ.puzzleDone && now - state.occ.puzzleAt >= FRICTION_MS;
/** "Task done": a separate claim, available only after the puzzle and a short friction window (interaction friction, not proof). */
export const taskDone = (state, now) => taskReady(state, now) ? end(copy(state), 'COMPLETED', 'task', now) : state;
/** No legal moves: a fresh board for the SAME occurrence. */
export function noMoves(state, occId) {
  if (!live(state) || state.occ.id !== occId) return state;
  const s = copy(state); s.occ.attempt++; return s;
}
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
