// MOM has no voice: every response is a typed subtitle. No audio, no TTS, no network. The registry only DESCRIBES existing handlers (keyed by their data-k); it never replaces or calls them.
import {N, SOUND, VIB, CAP, STATE} from './names.js';

// ---------- pure logic (unit-tested in tools/check_alarm_help.test.mjs) ----------
export const TAGS = [
  "You were going to remember. An ambitious opening strategy.", "Three heads. Somebody here had to keep track.", "Your memory is buffering. I came prepared.",
  "Another task rescued from 'I'll do it in a minute.'", "I'll remember. You continue your research into forgetting.", "Consider me the sticky note with management experience.",
  "We both know you'll forget. That's why I'm here.", "You forgot the thing. Fortunately, you remembered me.", "A reminder for your reminder. Very efficient management.",
  "Your future self would like this in writing.", "I have three heads, and somehow this is still my job.", "Relax. I brought a clock and a deeply reasonable attitude."];

/** Jokes: at most one per cooldown, never one of the last `memory` used. Factual help never passes through here. */
export function createJokeGate({now = Date.now, cooldown = 15000, memory = 5, rng = Math.random} = {}) {
  let last = -Infinity; const recent = [];
  return {take(pool) {
    const t = now(); if (t - last < cooldown) return null;
    const ok = pool.filter(j => !recent.includes(j)); if (!ok.length) return null;
    const j = ok[Math.floor(rng() * ok.length)]; last = t; recent.push(j); if (recent.length > memory) recent.shift(); return j;
  }};
}

/** Sliders/selects explain only on commit (change); everything else on click; text fields never. */
export const kindOf = el => el.matches?.('input[type=range],select') ? 'commit' : el.matches?.('input,textarea') ? null : 'tap';
export const wanted = (type, kind) => kind === 'commit' ? type === 'change' : kind === 'tap' ? type === 'click' : false;

/** One active line, no queue. render(shown, full, typing); talk(bool) drives the silent mouth. */
export function createTyper({render, talk = () => {}, announce = () => {}, instant = () => false, setT = setTimeout, clearT = clearTimeout, cps = 30}) {
  let full = '', n = 0, tm = 0;
  const T = b => { try { talk(b); } catch (e) {} };
  const stop = () => { clearT(tm); tm = 0; };
  const finish = () => { n = full.length; render(full, full, false); T(false); };
  const tick = () => {
    n++; render(full.slice(0, n), full, n < full.length);
    if (n >= full.length) { tm = 0; return T(false); }
    const c = full[n - 1], pause = '.!?'.includes(c) ? 260 : c === ',' ? 120 : 0;
    T(!pause); tm = setT(tick, 1000 / cps + pause);
  };
  return {
    say(text) {
      stop(); full = String(text); n = 0;
      try { announce(full); if (instant()) return finish(); tick(); } catch (e) { stop(); try { render(full, full, false); } catch (x) {} T(false); }   // anything throws: plain full text
    },
    skip() { stop(); if (full) finish(); },
    hide() { stop(); full = ''; n = 0; try { render('', '', false); } catch (e) {} T(false); },
    get full() { return full; },
  };
}

// ---------- registry: key -> {t: factual sentence read from state AFTER the action, j: joke (true = rotating tag, string = specific)} ----------
const on = v => v ? 'on' : 'off';
const dsound = S => S.draft?.sound || {};
const STAGE_TXT = ['starts at the due time', 'starts 5 minutes after the due time', 'starts 8 minutes after the due time', 'starts 9 minutes after the due time, then repeats every 30 seconds'];
const R = {
  'tab:clock': () => ({t: 'Reminders: the list, time and repeat.', j: true}),
  'tab:sound': () => ({t: 'Sound and vibration for each alert stage.', j: true}),
  'tab:screen': () => ({t: 'Screen light and flashlight while it rings.'}),
  'tab:challenge': () => ({t: 'How you finish an alarm: the 2048 board, plus an optional extra.'}),
  'tab:devices': () => ({t: 'Permissions MOM may use. A dashed square means not supported here.'}),
  'tab:history': () => ({t: 'Past alarms and how each one ended.'}),
  'tab:prefs': () => ({t: 'Reduced motion, contrast, backup and updates.'}),
  add: () => ({t: 'New reminder open. Set the time here.', j: 'Your memory has already delegated the job.'}),
  back: () => ({t: 'Back without saving: the draft is discarded.'}),
  pv: () => ({t: 'Silent preview of the selected effects, stage by stage.'}),
  pvnext: () => ({t: 'Next stage in the silent preview.'}),
  pvstop: () => ({t: 'Preview stopped.'}),
  del: () => ({t: 'Delete asks once more. Tap the check to confirm.'}),
  delno: () => ({t: 'Delete cancelled.'}),
  delok: ({S}) => ({t: S.draft ? 'Could not delete.' : 'Reminder deleted.'}),
  'kind:': (c, a) => ({t: `Repeat: ${N[a] || a}. Selected, ready to arm.`}),
  'tz:': (c, a) => ({t: `${a === 'fixed' ? N.tzFixed : N.tzDevice}. Selected, ready to arm.`}),
  skipnext: ({S}) => ({t: `Skip the next one only: ${on(S.draft?.recur?.skipNext)}. Ready to arm.`}),
  'ev-': ({S}) => ({t: `Repeats every ${S.draft?.recur?.every} days. Selected, ready to arm.`}),
  'ev+': ({S}) => ({t: `Repeats every ${S.draft?.recur?.every} days. Selected, ready to arm.`}),
  'st-': ({S}) => ({t: `Walk ${S.draft?.challenge?.steps || 0} steps to finish. Selected, ready to arm.`}),
  'st+': ({S}) => ({t: `Walk ${S.draft?.challenge?.steps || 0} steps to finish. Selected, ready to arm.`}),
  'snd:': ({S}, a) => { const all = (dsound(S).stage || []).every(x => x === a);
    return {t: `${SOUND[a]} selected for ${all ? 'all stages' : 'stage ' + ((S.stageSel | 0) + 1)}. Ready to arm; tap play to hear it.`, j: 'Your future self has been warned.'}; },
  aud: ({S}) => ({t: S.aud === 'sound' ? 'Playing a preview. Tap again to stop.' : 'Preview stopped.'}),
  audv: ({S}) => ({t: S.aud === 'vibrate' ? 'Testing the vibration. Tap again to stop.' : 'Vibration test stopped.'}),
  audt: ({S}) => ({t: S.aud === 'torch' ? 'Testing the flashlight. Tap again to stop.' : 'Flashlight test stopped.'}),
  rotate: ({S}) => ({t: dsound(S).rotate ? 'Shuffle on: each alert plays the next of your chosen sounds in turn.' : 'Shuffle off: each stage plays its own sound.', j: 'Variety for your very consistent forgetfulness.'}),
  'pat:': (c, a) => ({t: a === 'continuous' ? 'Continuous: the sound loops without gaps. Selected, ready to arm.' : 'Bursts: the sound plays in pulses with gaps. Selected, ready to arm.', j: true}),
  vol: ({S}) => ({t: `Alarm volume: ${dsound(S).volume} percent. Selected, ready to arm.`, j: 'Optimism is not a volume setting.'}),
  ramp: ({S}) => { const r = dsound(S).ramp; return {t: r ? `Ramp on: the alarm climbs from ${r.from} to ${r.to} percent of the volume over ${r.secs} seconds.` : 'Ramp off: the alarm plays at the set volume from the start.'}; },
  'rs:': (c, a) => ({t: `Ramp length: ${a} seconds. Ready to arm.`}),
  rf: ({S}) => ({t: `Ramp starts at ${dsound(S).ramp?.from} percent of the volume.`}),
  rt: ({S}) => ({t: `Ramp ends at ${dsound(S).ramp?.to} percent of the volume.`}),
  boost: ({S}) => ({t: `Boost ${on(dsound(S).streamBoost)}: asks to raise the phone's own alarm volume level too, where the app can.`}),
  'vib:': (c, a) => ({t: a === 'off' ? 'Vibration off. Ready to arm.' : `Vibration: ${VIB[a]}. Selected, ready to arm.`}),
  vs: ({S}) => ({t: `Vibration strength: ${S.draft?.vibrate?.strength} percent.`}),
  br: ({S}) => ({t: `Alarm screen brightness: ${S.draft?.screen?.brightness} percent.`}),
  'torch:': (c, a) => ({t: `Flashlight: ${a}. Selected, ready to arm.`}),
  'cap:speak': ({S}) => ({t: S.draft?.speak === 'title' ? "Speak title on: the phone's own voice reads the reminder title aloud when it rings. That is not MOM." : 'Speak title off: the alarm stays silent about the title.'}),
  board: () => ({t: 'Opening the 2048 board for this alarm.'}),
  'extra:': (c, a) => ({t: `Extra challenge: ${a === 'none' ? 'none' : N[a]}. Selected, ready to arm. The 2048 board always counts.`}),
  'snz:': (c, a) => ({t: +a ? `Snooze: ${a / 60} minutes. Ready to arm.` : 'Snooze off. Ready to arm.'}),
  time: ({S}) => ({t: `${S.draft?.time} is the selected time. Ready to arm.`, j: 'A bold alternative to remembering.'}),
  gameDone: () => ({t: 'Finished. A small victory for remembering what you were doing.', plain: true}),
};
const FAM = ['kind:', 'tz:', 'snd:', 'pat:', 'rs:', 'vib:', 'torch:', 'extra:', 'snz:'];
const STAGE_KEY = /^st([0-3])$/;

function saveHelp(S) {
  const d = S.draft;
  if (S.saveUi === 'saved') return {t: 'Saved and armed.', j: 'I have written it down. One of us had to.'};   // only when the real save succeeded
  if (S.saveUi === 'saving') return {t: 'Saving.'};
  if (d && !(S.picked && (d.sound?.stage || []).every(Boolean))) return {t: 'Pick an alarm sound for every stage first. Nothing is saved yet.'};
  if (S.saveUi === 'error') return {t: d && S.locked?.[d.id] > Date.now() ? 'Not saved: turning off is locked until stage 4.' : 'Not saved. Check the marked field.'};
  return null;
}

/** Returns {t, j?, plain?} or null. ctx = {S, el}: S is the live state, el the freshly re-queried control (may be null). */
export function helpFor(key, {S, el}) {
  const ctx = {S, el}, label = el?.getAttribute?.('aria-label'), dis = el?.getAttribute?.('aria-disabled') === 'true';
  if (key === 'time' || key === 'gameDone') return R[key](ctx);
  if (key === 'save') return saveHelp(S);
  if (key.startsWith('tab:') && dis) return {t: 'Open or add a reminder first: sound, screen and challenge edit one reminder.', j: 'You remembered the shortcut, at least.'};
  if (key.startsWith('en:') && el?.classList?.contains('lockbtn') && !el.classList.contains('open')) return {t: 'Turning off is locked until stage 4. The timer shows what is left.', j: 'You remembered the shortcut, at least.'};
  if (key.startsWith('en:') || key === 'enabled') { const v = el?.getAttribute('aria-checked'); return v == null ? null : {t: `Reminder ${v === 'true' ? 'on' : 'off'}.${S.draft ? ' Ready to arm.' : ''}`}; }
  if (key.startsWith('open:')) return {t: 'Editing this reminder. Changes stay a draft until you arm it.'};
  if (key.startsWith('req:') || (key.startsWith('cap:') && key !== 'cap:speak' && el?.getAttribute('role') !== 'switch')) {
    const id = key.slice(4); return {t: `${CAP[id] || id}: ${STATE[S.caps?.[id]?.state || 'available']}.`};
  }
  const sm = STAGE_KEY.exec(key); if (sm) return {t: `Stage ${+sm[1] + 1} ${STAGE_TXT[+sm[1]]}. Now editing its sound.`};
  if (dis && label) return {t: `${label}: not available here.`};
  const f = FAM.find(p => key.startsWith(p));
  const r = R[key] ? R[key](ctx) : f ? R[f](ctx, key.slice(f.length)) : null;
  if (r) return r;
  if (!label) return null;                                          // generic: the control's own accurate name + its current state
  const st = el.getAttribute('aria-checked') ?? el.getAttribute('aria-pressed');
  return {t: st == null ? `${label}.` : `${label}: ${st === 'true' ? 'on' : 'off'}.${S.draft ? ' Ready to arm.' : ''}`};
}

// ---------- DOM attachment ----------
/** S is settings.js's live state; announce() its polite live region; face.talk is guarded (an older face has none). */
export function createHelp({root, rail, S, face, announce, rm}) {
  const view = document.createElement('div');
  view.className = 'ms-sub'; view.setAttribute('data-copy', ''); view.setAttribute('aria-hidden', 'true');
  view.innerHTML = '<span class="ms-sub-l">MOM &gt;</span> <span class="ms-sub-t"></span><span class="ms-sub-c"></span>';
  const txt = view.querySelector('.ms-sub-t');
  root.insertBefore(view, rail);
  const gate = createJokeGate();
  const typer = createTyper({render: s => { txt.textContent = s; }, talk: b => { face?.talk?.(b); }, announce, instant: () => rm()});
  view.addEventListener('click', e => { e.stopPropagation(); typer.skip(); });   // reveal only; nothing underneath fires
  let pend = 0, lastPtr = 0, dead = false;
  const show = r => {
    if (dead || !r) return;
    let line = r.t;
    if (r.j && !r.plain && !S.snap?.occId) { const j = gate.take(r.j === true ? TAGS : [r.j]); if (j) line += ' ' + j; }   // no supplemental jokes while an alarm rings
    typer.say(line);
  };
  const fire = (key, el) => { pend = 0; try { show(helpFor(key, {S, el: root.querySelector(`[data-k="${CSS.escape(key)}"]`) || el})); } catch (e) {} };
  const waitSave = (key, el, n) => { if ((S.saving || S.saveUi === 'saving') && n < 30) pend = setTimeout(() => waitSave(key, el, n + 1), 100); else fire(key, el); };
  const mark = e => { e.__helpEl = e.target.closest?.('[data-k]'); };   // capture phase: resolve the control BEFORE its own handler re-renders it away
  const onEvt = e => {                                                   // bubble phase: runs after the existing handler
    const el = e.__helpEl; if (!el || !wanted(e.type, kindOf(el)) || el.closest('.wh')) return;   // wheels explain on scroll commit
    const key = el.dataset.k; clearTimeout(pend); pend = 0;
    if (key === 'save') queueMicrotask(() => waitSave(key, el, 0));
    else if (/^(en:|cap:|req:|delok$|exp$|imp$|upd$|rm$|hc$)/.test(key)) pend = setTimeout(fire, 150, key, el);   // async handlers: let them finish first
    else queueMicrotask(() => { if (!pend) fire(key, el); });
  };
  for (const ev of ['click', 'change']) { root.addEventListener(ev, mark, true); root.addEventListener(ev, onEvt); }
  const ptr = e => { if (e.target.closest?.('.wh')) lastPtr = Date.now(); };
  for (const ev of ['pointerdown', 'touchstart', 'wheel']) root.addEventListener(ev, ptr, {capture: true, passive: true});
  root.addEventListener('scrollend', e => {                          // time wheel commit; user-driven only (renders re-scroll programmatically)
    if (!e.target.closest?.('.wh') || Date.now() - lastPtr > 3000) return;
    clearTimeout(pend); pend = setTimeout(() => { pend = 0; show(helpFor('time', {S})); }, 250);
  }, true);
  return {say: key => show(helpFor(key, {S, el: null})), destroy() { dead = true; clearTimeout(pend); typer.hide(); view.remove(); }};
}
