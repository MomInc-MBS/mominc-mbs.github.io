// Foreground alarm outputs for the web edition. They run ONLY while the page is visible (a hidden/closed PWA has just push notifications) and only on the
// elected audio-owner tab. One arbiter across reminders: the highest unresolved stage speaks; snoozed reminders are silent (an output pause, nothing more).
// Every browser feature is detected on `env` (default globalThis); a missing one is skipped, never faked. Sound needs an intentional unlock gesture.
import {faceFor} from './stages.js';
import {SOUNDS} from './remind.js';

export const BASE = '/apps/alarm/sounds/', BURST_CAP_MS = 12_000, AUDITION_MS = 4000, TORCH_PULSE_MS = 600;
const clamp = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(+v) ? +v : a));
export const VIBES = {pulse: [200, 100], heartbeat: [100, 100, 100, 500], sos: [100, 100, 100, 100, 100, 300, 300, 100, 300, 100, 300, 300, 100, 100, 100, 100, 100],
  rapid: [70, 50, 70, 50, 70, 50, 70], wave: [100, 100, 200, 100, 300, 100, 200, 100, 100, 300]};
/** {pattern, strength 0-100} -> navigator.vibrate array (on-times scaled by strength), or null when off. */
export function vibratePattern(v) {
  const base = VIBES[v?.pattern]; if (!base) return null;
  const k = clamp(v.strength ?? 100, 0, 100) / 100; if (k === 0) return null;
  return base.map((ms, i) => i % 2 === 0 ? Math.max(20, Math.round(ms * k)) : ms);
}
/** Sound for alert n of a reminder: per-stage pick (or rotation through the distinct picks), burst/continuous, volume and gain ramp (ramp values are percent OF volume). */
export function soundPlan(rem, alertIdx) {
  const s = rem.sound || {}, ids = (s.stage || []).filter(id => SOUNDS.some(x => x.id === id));
  if (!ids.length) return null;                                                // nothing is ever chosen for the user
  const uniq = [...new Set(ids)], id = s.rotate ? uniq[alertIdx % uniq.length] : (s.stage[faceFor(alertIdx)] || ids[0]), vol = clamp(s.volume ?? 80, 0, 100) / 100;
  const r = s.ramp && s.ramp.secs > 0 ? {from: clamp(s.ramp.from, 0, 100) / 100 * vol, to: clamp(s.ramp.to, 0, 100) / 100 * vol, secs: clamp(s.ramp.secs, 0, 120)} : null;
  return {id, file: SOUNDS.find(x => x.id === id).file, loop: s.pattern === 'continuous', gain: vol, ramp: r};
}
/** The one arbiter: highest face among reminders that are not snoozed; ties go to the earliest due. cands = [{occId, face, due, snoozed}] */
export const pick = cands => cands.filter(x => !x.snoozed).reduce((b, x) => !b || x.face > b.face || (x.face === b.face && x.due < b.due) ? x : b, null);

// ---- one audio owner across tabs -------------------------------------------------------------------------
/** Web Locks elect one tab (the visible one that got there first); BroadcastChannel is the fallback; with neither, this tab owns. onChange(bool) fires when ownership changes. */
export function createOwner(env = globalThis, onChange = () => {}) {
  const n = env.navigator || {}, id = Math.random().toString(36).slice(2), name = 'moms-2048-audio-owner';
  let owner = !(n.locks?.request) && !env.BroadcastChannel, release = null, pending = false, bc = null, closed = false;
  const set = v => { if (v !== owner) { owner = v; onChange(v); } };
  if (!n.locks?.request && env.BroadcastChannel) {
    bc = new env.BroadcastChannel(name);
    bc.onmessage = e => { if (e.data?.id !== id && e.data?.type === 'claim') set(false); };
  }
  return {
    isOwner: () => owner,
    /** Call whenever visibility changes: a visible tab tries to own the speaker, a hidden one lets go. */
    want(visible) {
      if (closed) return;
      if (n.locks?.request) {
        if (!visible && release) { release(); release = null; set(false); }
        else if (visible && !release && !pending) {
          pending = true;
          n.locks.request(name, {ifAvailable: true}, lock => lock ? new Promise(res => { release = res; set(true); }) : (pending = false, set(false))).then(() => { pending = false; release = null; set(false); }).catch(() => { pending = false; });
        }
      } else if (bc) { if (visible) { bc.postMessage({type: 'claim', id}); set(true); } else set(false); }
    },
    close() { closed = true; release?.(); bc?.close?.(); },
  };
}

// ---- the controller --------------------------------------------------------------------------------------
export function createOutputs({env = globalThis, base = BASE, fetchImpl, onChange = () => {}, onFacts = () => {}} = {}) {
  const n = env.navigator || {}, w = env.window || env, T = env.timers || globalThis, AC = w.AudioContext || w.webkitAudioContext;
  let ctx = null, gen = 0, voice = null, needTap = false, wake = null, torch = null, torchOk = null, cameraOk = false, destroyed = false, auditionT = 0, lastBadge = -1;
  const buffers = new Map(), facts = {audio: 'locked', wake: false, badge: null};
  const emit = () => { facts.audio = ctx ? (ctx.state === 'running' ? 'running' : ctx.state === 'closed' ? 'error' : 'suspended') : 'locked'; onFacts({...facts, torch: torchOk, needTap}); onChange(); };
  const getFetch = () => fetchImpl || env.fetch || globalThis.fetch;

  /** Call from an intentional gesture (arm, test, tap). Creates/resumes the AudioContext and plays a silent tick so iOS lets later alarms start. */
  async function unlock() {
    if (!AC) return 'unsupported';
    try {
      ctx ||= new AC();
      if (ctx.state !== 'running') await ctx.resume();
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
      if (ctx.state === 'running') needTap = false;
    } catch { facts.audio = 'error'; }
    emit(); return facts.audio;
  }
  const decode = async file => {
    if (buffers.has(file)) return buffers.get(file);
    const res = await getFetch()(base + file + '.mp3'); if (!res.ok) throw Error('sound file ' + res.status);
    const buf = await ctx.decodeAudioData(await res.arrayBuffer()); buffers.set(file, buf); return buf;
  };
  const stopVoice = () => { const v = voice; voice = null; try { v?.stop(); } catch {} };
  async function playSound(plan, kind, token, onEnd) {
    // Web Audio first; if the context cannot run (never unlocked, interrupted) try one HTMLAudio play; if that is refused too the UI is told to ask for a tap.
    if (ctx && ctx.state !== 'running') { try { await ctx.resume(); } catch {} }
    if (token !== gen) return;
    if (ctx && ctx.state === 'running') {
      try {
        const buf = await decode(plan.file); if (token !== gen) return;
        const src = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime;
        src.buffer = buf; src.loop = plan.loop; src.connect(g); g.connect(ctx.destination);
        if (plan.ramp) { g.gain.setValueAtTime(plan.ramp.from, t); g.gain.linearRampToValueAtTime(plan.ramp.to, t + plan.ramp.secs); } else g.gain.setValueAtTime(plan.gain, t);
        let timer = 0; src.onended = () => { T.clearTimeout(timer); if (voice?.src === src) { voice = null; onEnd?.(); } };
        src.start(0);
        if (!plan.loop) timer = T.setTimeout(() => { try { src.stop(); } catch {} }, BURST_CAP_MS);
        voice = {kind, src, stop: () => { T.clearTimeout(timer); src.onended = null; try { src.stop(); } catch {} try { src.disconnect(); } catch {} }};
        needTap = false; emit(); return;
      } catch { /* decode/network failure: fall through to the element */ }
    }
    const A = w.Audio; if (!A) { needTap = true; return emit(); }
    try {
      const a = new A(); a.src = base + plan.file + '.mp3'; a.loop = plan.loop; a.volume = clamp(plan.ramp ? plan.ramp.to : plan.gain, 0, 1);
      const timer = plan.loop ? 0 : T.setTimeout(() => a.pause(), BURST_CAP_MS);
      voice = {kind, stop: () => { T.clearTimeout(timer); a.pause(); }};
      await a.play(); if (token !== gen) { a.pause(); return; } needTap = false; emit();
    } catch { if (token === gen) { voice = null; needTap = true; emit(); } }
  }
  const speak = text => {
    if (!w.speechSynthesis || !w.SpeechSynthesisUtterance) return false;
    try { w.speechSynthesis.cancel(); w.speechSynthesis.speak(new w.SpeechSynthesisUtterance(String(text || 'Your reminder'))); return true; } catch { return false; }
  };
  const vibrate = v => { const p = vibratePattern(v); if (!p || !n.vibrate) return false; try { return n.vibrate(p) !== false; } catch { return false; } };
  async function startTorch(mode) {
    stopTorch();
    if (!cameraOk || !n.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await n.mediaDevices.getUserMedia({video: {facingMode: 'environment'}}), track = stream.getVideoTracks()[0];
      if (!track?.getCapabilities?.().torch) { stream.getTracks().forEach(t => t.stop()); torchOk = false; emit(); return false; }
      torchOk = true; let on = true; const set = v => track.applyConstraints({advanced: [{torch: v}]}).catch(() => {});
      set(true); const timer = mode === 'pulse' ? T.setInterval(() => set(on = !on), TORCH_PULSE_MS) : 0;
      torch = {stop() { T.clearInterval(timer); stream.getTracks().forEach(t => t.stop()); }}; emit(); return true;
    } catch { return false; }
  }
  const stopTorch = () => { const t = torch; torch = null; try { t?.stop(); } catch {} };
  /** Camera grant + real torch capability probe (user action). Foreground only: the stream is released at once. */
  async function probeCamera() {
    if (!n.mediaDevices?.getUserMedia) return {camera: 'unsupported', torch: false};
    try {
      const stream = await n.mediaDevices.getUserMedia({video: {facingMode: 'environment'}}), t = stream.getVideoTracks()[0];
      torchOk = !!t?.getCapabilities?.().torch; cameraOk = true; stream.getTracks().forEach(x => x.stop()); emit(); return {camera: 'granted', torch: torchOk};
    } catch (e) { cameraOk = false; return {camera: /NotAllowed|Permission/i.test(e?.name || '') ? 'denied' : 'error', torch: null}; }
  }
  let wakeBusy = false, wakeRetry = 0;
  async function holdWake(on) {
    if (on && !wake && !wakeBusy && Date.now() >= wakeRetry && n.wakeLock?.request && (env.document?.visibilityState ?? 'visible') === 'visible') {
      wakeBusy = true;
      try { wake = await n.wakeLock.request('screen'); facts.wake = true; wake.addEventListener?.('release', () => { wake = null; facts.wake = false; emit(); }); emit(); } catch { wake = null; wakeRetry = Date.now() + 30_000; } finally { wakeBusy = false; }
    } else if (!on && wake) { const x = wake; wake = null; facts.wake = false; try { await x.release(); } catch {} emit(); }
  }
  async function badge(count) {
    if (count === lastBadge) return; lastBadge = count;
    try { if (count > 0 && n.setAppBadge) { await n.setAppBadge(count); facts.badge = true; } else if (n.clearAppBadge) await n.clearAppBadge(); } catch { facts.badge = false; }
    emit();
  }
  function stopAll() { gen++; stopVoice(); stopTorch(); T.clearTimeout(auditionT); try { w.speechSynthesis?.cancel(); } catch {} try { n.vibrate?.(0); } catch {} }

  let cur = null;                                              // {occId, alert}: the alert whose outputs were already started (an alert is one trigger, never re-fired by a tick)
  /** model = {visible, owner, cands: [{occId, due, alert, face, snoozed, reminder}]}. Idempotent: call every tick. */
  function sync(model) {
    if (destroyed) return null;
    badge(model.cands.length);
    const top = model.visible && model.owner ? pick(model.cands) : null;
    holdWake(!!top && top.reminder.present?.wake !== false);
    if (!top) { if (cur) { cur = null; stopAll(); } return null; }
    if (cur && cur.occId === top.occId && cur.alert === top.alert) return top;
    stopAll(); cur = {occId: top.occId, alert: top.alert};
    const token = gen, r = top.reminder, plan = soundPlan(r, top.alert);
    if (plan) playSound(plan, 'alarm', token);
    if (r.speak === 'title') speak(top.title ?? r.title);
    vibrate(r.vibrate);
    if (r.torch && r.torch !== 'off') startTorch(r.torch);
    return top;
  }
  /** One audition at a time; refused while a real alarm is sounding. kind: sound | vibrate | torch | speak | screen. */
  async function audition(kind, value) {
    if (cur) return;
    stopAll(); const token = gen; T.clearTimeout(auditionT);
    auditionT = T.setTimeout(() => stopAll(), AUDITION_MS);
    if (kind === 'sound') { const plan = soundPlan({sound: {stage: [value?.id, value?.id, value?.id, value?.id], volume: value?.volume ?? 80, pattern: 'burst', ramp: value?.ramp}}, 0); if (plan) await playSound(plan, 'audition', token); }
    else if (kind === 'vibrate') vibrate(typeof value === 'string' ? {pattern: value, strength: 100} : value);
    else if (kind === 'torch') await startTorch(value === 'pulse' ? 'pulse' : 'steady');
    else if (kind === 'speak') speak(value);
    else if (kind === 'screen') onChange('screen-audition');   // purely visual: the settings UI draws it; nothing to start here
  }
  return {unlock, replay: () => { cur = null; }, sync, stop: () => { cur = null; stopAll(); holdWake(false); }, audition, stopAudition: () => { if (!cur) stopAll(); }, probeCamera, speak, vibrate, badge,
    needTap: () => needTap, facts: () => ({...facts, torch: torchOk, needTap, audio: ctx ? (ctx.state === 'running' ? 'running' : 'suspended') : 'locked'}), ctx: () => ctx,
    destroy() { destroyed = true; cur = null; stopAll(); holdWake(false); try { ctx?.close?.(); } catch {} }};
}
