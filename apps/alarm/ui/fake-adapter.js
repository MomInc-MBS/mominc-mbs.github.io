// In-memory fake of the contract settings adapter, so the wordless settings run without lane W / Android.
// createFakeAdapter({stage, locked, rm, hc, now, delay}) -> adapter. Every call is logged in adapter.calls (tests read it).
import {STAGE_AT, REPEAT_S} from '../stages.js';
import {baseForStage} from './mom-face.js';
import {nextDue, deviceZone} from './time.js';

const H = 3600_000, M = 60_000;
const clone = o => o === undefined ? o : JSON.parse(JSON.stringify(o));
const rec = (id, title, time, recur, extra = {}) => ({id, rev: 2, enabled: true, title, time,
  recur: {kind: 'daily', days: [], date: null, dates: [], every: 1, start: null, skip: [], skipNext: false, ...recur},
  tz: {mode: 'device', zone: deviceZone()}, escalate: true,
  sound: {stage: ['air-horn', 'air-horn', 'train-horn', 'crash'], rotate: false, pattern: 'burst', volume: 80, ramp: {from: 40, to: 100, secs: 20}, streamBoost: false},
  speak: 'off', vibrate: {pattern: 'pulse', strength: 100}, torch: 'off', screen: {brightness: 100, border: true, pulse: false},
  present: {fullScreen: true, lockScreen: true, wake: true, overlay: false}, snooze: 0, challenge: {extra: null, code: null, nfc: null, steps: 0},
  webhook: null, confirmed: {rev: 2, at: 0}, ...extra});

export function createFakeAdapter(o = {}) {
  const now = o.now || (() => Date.now()), delay = o.delay ?? 220, calls = [], subs = {change: new Set(), snapshot: new Set(), capability: new Set()};
  const wait = (v, ms = delay) => new Promise(r => setTimeout(() => r(clone(v)), ms));
  const log = (name, ...args) => calls.push({name, args: clone(args), at: now()});
  const emit = (evt, v) => subs[evt]?.forEach(cb => { try { cb(v); } catch (e) {} });
  const t = now();
  let list = [
    rec('r_laundry', 'Laundry', '07:30', {kind: 'weekly', days: [1, 3, 5]}),
    rec('r_pills', 'Pills', '21:00', {kind: 'daily'}, {vibrate: {pattern: 'heartbeat', strength: 70}, torch: 'pulse', challenge: {extra: 'math', code: null, nfc: null, steps: 0}}),
    rec('r_call', 'Call Alex', '12:00', {kind: 'once', date: null}, {enabled: false, rev: 3, confirmed: {rev: 2, at: 0}, sound: {stage: ['buzzer', 'buzzer', 'buzzer', 'buzzer'], rotate: true, pattern: 'continuous', volume: 60, ramp: null, streamBoost: false}}),
  ];
  const caps = {notify: 'active', push: 'permission', exactAlarm: 'unsupported', fullScreen: 'foreground', lockScreen: 'unsupported', dnd: 'permission', overlay: 'unsupported',
    torch: 'available', vibrate: 'active', sound: 'active', speak: 'available', wakeLock: 'foreground', badge: 'available', qr: 'permission', nfc: 'unsupported', motion: 'permission',
    widget: 'unsupported', tile: 'unsupported', watch: 'disconnected', bluetooth: 'disconnected', webhook: 'error', update: 'available', storage: 'active'};
  const capMap = () => Object.fromEntries(Object.entries(caps).map(([k, s]) => [k, {state: s, reason: s === 'unsupported' ? 'no-api' : s === 'error' ? 'http-500' : s}]));
  const prefs = {reducedMotion: !!o.rm, highContrast: !!o.hc};
  // ?stage=N: an active occurrence on the first reminder, N stages in; ?locked=1: stage 2 (always locked).
  const stage = o.locked && !o.stage ? 2 : o.stage ? Math.min(4, Math.max(1, o.stage | 0)) : null;
  let occ = stage ? {occId: 'o_demo', reminderId: list[0].id, dueAt: t - (STAGE_AT[stage - 1] + 30) * 1000} : null;
  let saveState = 'idle', rev = 1, update = {state: 'available', version: '0.4.1'};
  const history = [
    {occId: 'o1', reminderId: 'r_pills', dueAt: t - 26 * H, endedAt: t - 26 * H + 4 * M, outcome: 'win', stage: 1},
    {occId: 'o2', reminderId: 'r_laundry', dueAt: t - 50 * H, endedAt: t - 50 * H + 11 * M, outcome: 'loss', stage: 4},
    {occId: 'o3', reminderId: 'r_pills', dueAt: t - 74 * H, endedAt: t - 74 * H + 9.5 * M, outcome: 'off', stage: 4},
    {occId: 'o4', reminderId: 'r_call', dueAt: t - 98 * H, endedAt: t - 98 * H + 2 * M, outcome: 'emergency', stage: 1},
    {occId: 'o5', reminderId: 'r_laundry', dueAt: t - 122 * H, endedAt: t - 119 * H, outcome: 'missed', stage: 4},
    {occId: 'o6', reminderId: 'r_pills', dueAt: t - 146 * H, endedAt: t - 146 * H + 6 * M, outcome: 'checkin', stage: 2},
  ];
  const stageNow = () => { if (!occ) return null; const s = (now() - occ.dueAt) / 1000; return s >= STAGE_AT[3] ? 4 : s >= STAGE_AT[2] ? 3 : s >= STAGE_AT[1] ? 2 : 1; };
  const unlockAt = () => occ ? occ.dueAt + STAGE_AT[3] * 1000 : null;
  const locked = id => occ && occ.reminderId === id && now() < unlockAt();
  const snapshot = () => {
    const s = stageNow(), [emotion, intensity] = baseForStage(s);
    const next = list.filter(r => r.enabled && r.confirmed?.rev === r.rev).map(r => nextDue(r, now()).due).filter(Boolean).sort((a, b) => a - b)[0] ?? null;
    return {occId: occ?.occId ?? null, reminderId: occ?.reminderId ?? null, rev, stage: s, emotion, intensity, iconId: 'stage' + (s || 1), offAllowed: !occ || now() >= unlockAt(),
      unlockAt: unlockAt(), nextDue: next, dueAt: occ?.dueAt ?? null, capabilities: capMap(), saveState, reducedMotion: prefs.reducedMotion, highContrast: prefs.highContrast, pendingSync: !!o.pendingSync};
  };
  let lastStage = stageNow();
  const tick = setInterval(() => { const s = stageNow(); if (s !== lastStage) { lastStage = s; rev++; emit('snapshot', snapshot()); } }, 1000);
  const bump = () => { rev++; emit('snapshot', snapshot()); };
  const lockErr = () => ({ok: false, error: 'locked', remainingMs: unlockAt() - now()});

  return {
    platform: 'web', calls,
    list: () => { log('list'); return wait(list, 60); },
    async save(r) {
      log('save', r); saveState = 'saving'; bump(); await wait(0);
      const old = list.find(x => x.id === r.id);
      const bad = !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time || '') ? 'time' : (r.title || '').length > 200 ? 'title'
        : r.recur?.kind === 'weekly' && !(r.recur.days || []).length ? 'days' : r.recur?.kind === 'dates' && !(r.recur.dates || []).length ? 'dates'
        : r.webhook?.url && !/^https:\/\//.test(r.webhook.url) ? 'webhook' : !r.sound?.stage?.every(Boolean) ? 'sound' : null;
      let res;
      if (bad) res = {ok: false, error: 'invalid', field: bad};
      else if (old && locked(old.id) && (r.enabled === false || r.time !== old.time)) res = lockErr();
      else if (o.failSave) res = {ok: false, error: 'storage'};
      else {
        const saved = {...clone(r), id: r.id || 'r_' + Math.random().toString(36).slice(2, 8)};
        list = old ? list.map(x => x.id === old.id ? saved : x) : [...list, saved];
        res = {ok: true, reminder: clone(saved)};
        emit('change', clone(list));
      }
      saveState = res.ok ? 'saved' : 'error'; bump(); return res;
    },
    async remove(id) { log('remove', id); await wait(0); if (locked(id)) return lockErr(); list = list.filter(x => x.id !== id); emit('change', clone(list)); bump(); return {ok: true}; },
    async setEnabled(id, on) {
      log('setEnabled', id, on); await wait(0);
      if (!on && locked(id)) return lockErr();
      list = list.map(x => x.id === id ? {...x, enabled: !!on} : x); if (!on && occ?.reminderId === id) { history.unshift({...occ, endedAt: now(), outcome: 'off', stage: stageNow()}); occ = null; }
      emit('change', clone(list)); bump(); return {ok: true, reminder: clone(list.find(x => x.id === id))};
    },
    capabilities: () => { log('capabilities'); return wait(capMap(), 40); },
    async request(capId) {
      log('request', capId); await wait(0, 300);
      if (caps[capId] === 'permission') caps[capId] = capId === 'qr' ? 'permission' : 'active';   // qr: user refuses in the fake
      else if (caps[capId] === 'disconnected') caps[capId] = 'active';
      const v = capMap()[capId]; emit('capability', {[capId]: v}); return v;
    },
    audition: (kind, value) => { log('audition', kind, value); return wait(undefined, 30); },
    stopAudition: () => { log('stopAudition'); },
    snapshot,
    on(evt, cb) { subs[evt]?.add(cb); return () => subs[evt]?.delete(cb); },
    emergencyStop(occId) { log('emergencyStop', occId); if (occ && occ.occId === occId) { history.unshift({...occ, endedAt: now(), outcome: 'emergency', stage: stageNow()}); occ = null; lastStage = null; bump(); } return Promise.resolve({ok: true}); },
    history: () => { log('history'); return wait(history, 60); },
    exportData: () => { log('exportData'); return wait(JSON.stringify({v: 1, reminders: list}), 400).then(s => s); },
    async importData(text) {
      log('importData', String(text).length); await wait(0, 400);
      try { const d = JSON.parse(text), arr = Array.isArray(d) ? d : d.reminders; if (!Array.isArray(arr)) throw 0; list = [...list, ...arr.map(r => ({...r, id: 'r_' + Math.random().toString(36).slice(2, 8)}))]; emit('change', clone(list)); return {ok: true, count: arr.length}; }
      catch { return {ok: false, error: 'invalid'}; }
    },
    checkUpdate: () => { log('checkUpdate'); return wait(update, 300); },
    async applyUpdate() { log('applyUpdate'); update = {state: 'downloading', version: update.version}; await wait(0, 1200); update = {state: 'ready', version: update.version}; return clone(update); },
    getPrefs: () => clone(prefs),
    setPrefs(p) { log('setPrefs', p); Object.assign(prefs, p); bump(); return Promise.resolve(clone(prefs)); },
    playChallenge(occId) { log('playChallenge', occId); },
    destroy() { clearInterval(tick); },
  };
}
