// Web implementation of the shared settings adapter (CONTRACT.md "Settings adapter"). ui/settings.js talks only to this object.
// It owns persistence, the offline outbox (pendingSync), foreground outputs and capability states; the pure rules stay in remind.js.
import * as R from './remind.js';
import * as P from './push.js';
import {describe, facts0} from './capabilities.js';
import {createOutputs, createOwner} from './outputs.js';
import * as K from './checkin.js';
import {deviceZone} from './recurrence.js';
import {faceFor} from './stages.js';

export const EXPORT_SCHEMA = 'moms-2048-reminder/export', MAX_IMPORT_BYTES = 2_000_000, MAX_IMPORT_REMINDERS = 1000;
const OUTCOMES = ['win', 'loss', 'off', 'emergency', 'missed', 'interrupted', 'checkin'];
const PREFS = 'adhd-alarm-prefs-v1', TOMB = 'adhd-terminal-v1';
const copy = x => JSON.parse(JSON.stringify(x));
const num = v => typeof v === 'number' && Number.isFinite(v);

/** opts: {env, storage, now, bind: {get,set} (share the app's state variable), fetchImpl, push, outputs, owner}. */
export function createWebAdapter(opts = {}) {
  const env = opts.env || globalThis, storage = opts.storage || env.localStorage, now = opts.now || Date.now, push = opts.push || P, w = env.window || env;
  let S = R.load(storage);
  const get = opts.bind?.get || (() => S), set = opts.bind?.set || (v => { S = v; });
  const subs = {change: new Set(), snapshot: new Set(), capability: new Set(), playChallenge: new Set()};
  const emit = (evt, data) => { for (const cb of [...(subs[evt] || [])]) { try { cb(data); } catch { /* a listener must never break the alarm */ } } };
  const f = facts0(); let saveState = 'idle', saveTimer = 0, syncing = false, updateState = {state: 'none'}, disposed = false;
  const zone = () => ({deviceZone: deviceZone()});
  const getFetch = () => opts.fetchImpl || env.fetch || globalThis.fetch;

  const owner = opts.owner || createOwner(env, () => { drive(); emit('snapshot'); });
  const outputs = opts.outputs || createOutputs({env, onFacts: x => { const before = JSON.stringify([f.audio, f.torch, f.wake, f.badge, f.camera]); Object.assign(f, {audio: x.audio, torch: x.torch, wake: x.wake, badge: x.badge}); if (before !== JSON.stringify([f.audio, f.torch, f.wake, f.badge, f.camera])) emit('capability', caps()); }});
  const caps = () => { f.push = {...f.push, origin: push.ADHD_PUSH_ORIGIN, permission: w.Notification?.permission ?? 'denied'}; f.webhooks = get().reminders.filter(r => r.enabled && r.webhook).length; f.outbox = get().outbox.length; f.update = updateState;
    return describe(env, f); };

  // ---- persistence + tombstones + sync -----------------------------------------------------------------------
  const told = new Set();
  const tombstones = st => {                                   // a terminal occurrence is remembered where the service worker can see it, so a late push shows a truthful notice
    for (const run of Object.values(st.runs)) { const o = run.occ; if (o && o.status !== 'ACTIVE' && o.status !== 'PENDING' && !told.has(o.id)) { told.add(o.id);
      env.caches?.open(TOMB).then(c => c.put('/__adhd_terminal/' + encodeURIComponent(o.id), new Response('1'))).catch(() => {}); } }   // ponytail: one tiny entry per occurrence, prune by age when it matters
  };
  const persist = () => { const ok = R.save(get(), storage); f.storageError = !ok; saveState = ok ? 'saved' : 'error'; clearTimeout(saveTimer); saveTimer = setTimeout(() => { if (saveState === 'saved') { saveState = 'idle'; emit('snapshot'); } }, 1500); return ok; };
  async function sync() {
    if (syncing || disposed || !push.ADHD_PUSH_ORIGIN || !get().outbox.length) return;
    syncing = true;
    try {
      const sent = get().outbox, left = await push.sync({...get(), outbox: sent}), done = sent.filter(o => !left.includes(o));
      if (done.length) { set({...get(), outbox: get().outbox.filter(o => !done.includes(o))}); persist(); emit('snapshot'); }
    } catch { /* stays queued */ } finally { syncing = false; }
  }
  /** Replace the state (every mutation goes through here). */
  function commit(next, quiet) {
    set(next); const ok = persist(); tombstones(next); sync(); drive();
    if (!quiet) { emit('change', next); emit('snapshot'); }
    return ok;
  }
  const onOnline = () => sync();
  env.addEventListener?.('online', onOnline);
  if (push.ADHD_PUSH_ORIGIN) push.register?.().then(ok => { f.push.subscribed = !!ok; emit('capability', caps()); }).catch(e => { f.push.error = String(e?.message || e); });

  // ---- outputs: arbiter across reminders, one owner across tabs ---------------------------------------------------
  const visible = () => (env.document?.visibilityState ?? 'visible') === 'visible';
  function drive() {
    if (disposed) return;
    const st = get(), t = now(), cands = [];
    for (const r of st.reminders) {
      const run = st.runs[r.id], o = run?.occ;
      if (o?.status === 'ACTIVE' && run.session?.state !== 'SILENCED') cands.push({occId: o.id, due: o.due, alert: run.session.stage, face: faceFor(run.session.stage), snoozed: R.snoozed(st, o.id, t), title: o.title, reminder: r});
    }
    outputs.sync({visible: visible(), owner: owner.isOwner(), cands});
  }
  const onVis = () => { owner.want(visible()); drive(); };
  env.document?.addEventListener?.('visibilitychange', onVis); owner.want(visible());

  const err = (res) => ({ok: false, error: res.error, ...(res.field ? {field: res.field} : {}), ...(res.remainingMs != null ? {remainingMs: res.remainingMs} : {})});
  function apply(res) {
    if (!res.ok) return err(res);
    const before = get(); if (!commit(res.state, true)) { set(before); R.save(before, storage); emit('snapshot'); return {ok: false, error: 'storage'}; }
    emit('change', res.state); emit('snapshot');
    return {ok: true, reminder: copy(res.reminder || {})};
  }

  const adapter = {
    platform: 'web',
    state: () => get(),
    list: async () => copy(get().reminders),
    save: async r => apply(R.saveReminder(get(), r, now(), zone())),
    remove: async id => { const res = R.removeReminder(get(), id, now()); if (!res.ok) return err(res); return apply({...res, reminder: {id}}); },
    setEnabled: async (id, on) => apply(R.setEnabled(get(), id, !!on, now(), zone())),
    capabilities: async () => caps(),
    async request(id) {
      const after = async () => { const c = caps(); emit('capability', c); return c[id] || {state: 'unsupported', reason: 'unknown-capability'}; };
      if (id === 'notify' || id === 'push') { const r = await push.enable?.() || {}; f.push.subscribed = !!r.subscribed; f.push.error = r.error || ''; }
      else if (id === 'sound') await outputs.unlock();
      else if (id === 'torch' || id === 'qr') { const r = await outputs.probeCamera(); f.camera = r.camera; if (r.torch != null) f.torch = r.torch; }
      else if (id === 'nfc') {
        if (!w.NDEFReader) f.nfc = 'unsupported';
        else try { const ac = new AbortController(); await new w.NDEFReader().scan({signal: ac.signal}); ac.abort(); f.nfc = 'granted'; } catch (e) { f.nfc = /NotAllowed/i.test(e?.name || '') ? 'denied' : 'unknown'; }
      }
      else if (id === 'motion') f.motion = await K.requestMotion(env);
      else if (id === 'storage') { try { f.persisted = await env.navigator.storage.persist(); } catch { f.persisted = false; } }
      else if (id === 'vibrate') { try { env.navigator.vibrate?.(30); } catch {} }
      else if (id === 'update') await adapter.checkUpdate();
      if (id === 'storage' || id === 'sound') f.persisted ??= await env.navigator?.storage?.persisted?.().catch(() => null) ?? null;
      return after();
    },
    audition: async (kind, value) => { if (kind === 'sound') await outputs.unlock(); await outputs.audition(kind, value); },
    stopAudition: async () => outputs.stopAudition(),
    snapshot() {
      const st = get(), s = R.snapshot(st, now()), mm = q => !!w.matchMedia?.(q).matches, p = adapter.getPrefs();
      return {...s, capabilities: caps(), saveState, reducedMotion: p.reducedMotion ?? mm('(prefers-reduced-motion: reduce)'), highContrast: p.highContrast ?? mm('(prefers-contrast: more)'),
        pendingSync: !!push.ADHD_PUSH_ORIGIN && st.outbox.length > 0};
    },
    on(evt, cb) { (subs[evt] ||= new Set()).add(cb); return () => subs[evt].delete(cb); },
    emergencyStop: async occId => { const before = get(), st = R.stop(before, occId, now()); if (st !== before) commit(st); },
    history: async () => copy(get().history),
    async exportData() {                                        // no credentials: no push install secret, no webhook token, no outbox
      const st = get();
      return JSON.stringify({schema: EXPORT_SCHEMA, v: 1, exportedAt: now(), reminders: st.reminders.map(r => ({...r, webhook: r.webhook ? {url: r.webhook.url, token: null} : null})), history: st.history, prefs: adapter.getPrefs()});
    },
    async importData(text) {
      if (typeof text !== 'string' || text.length > MAX_IMPORT_BYTES) return {ok: false, error: 'invalid'};
      let j; try { j = JSON.parse(text); } catch { return {ok: false, error: 'invalid'}; }
      if (j?.schema !== EXPORT_SCHEMA || j.v !== 1 || !Array.isArray(j.reminders) || j.reminders.length > MAX_IMPORT_REMINDERS || (j.history != null && !Array.isArray(j.history))) return {ok: false, error: 'invalid'};
      let st = get();                                           // all-or-nothing: one bad reminder (or a locked one) leaves everything untouched
      for (const r of j.reminders) {
        if (!r || typeof r !== 'object' || Array.isArray(r)) return {ok: false, error: 'invalid'};
        const res = R.saveReminder(st, {...r, webhook: r.webhook ? {url: r.webhook.url, token: null} : null}, now(), {...zone(), trust: true});
        if (!res.ok) return {ok: false, error: res.error, ...(res.field ? {field: res.field} : {})};
        st = res.state;
      }
      const have = new Set(st.history.map(h => h.occId)), add = (j.history || []).filter(h => h && typeof h.occId === 'string' && typeof h.reminderId === 'string' && num(h.dueAt) && num(h.endedAt)
        && OUTCOMES.includes(h.outcome) && Number.isInteger(h.stage) && h.stage >= 1 && h.stage <= 4 && !have.has(h.occId)).map(h => ({occId: h.occId, reminderId: h.reminderId, dueAt: h.dueAt, endedAt: h.endedAt, outcome: h.outcome, stage: h.stage, title: String(h.title ?? '').slice(0, R.MAX_LABEL)}));
      st = {...st, history: [...st.history, ...add].sort((a, b) => b.endedAt - a.endedAt).slice(0, R.MAX_HISTORY)};
      commit(st);
      return {ok: true, count: j.reminders.length};
    },
    async checkUpdate() {
      try {
        const res = await getFetch()('/apps/releases.json', {cache: 'no-cache'}); if (!res.ok) throw Error('status ' + res.status);
        const entry = (await res.json()).apps.find(a => a.id === 'alarm' && a.platform === 'pwa');
        let running = null; try { running = storage.getItem('mbs-app-ver:alarm'); } catch {}
        updateState = !entry?.version ? {state: 'none'} : running && running !== entry.version && updateState.state !== 'ready' ? {state: 'available', version: entry.version} : updateState.state === 'ready' ? updateState : {state: 'none', version: entry.version};
      } catch { updateState = {state: 'error'}; }
      emit('capability', caps()); return {...updateState};
    },
    /** Same handshake as apps/update.mjs (PREPARE_GAME to the root worker: fetch + verify + atomic switch), then ONE reload at a safe moment (no live alarm). */
    async applyUpdate() {
      if (updateState.state !== 'available' && updateState.state !== 'ready') return {...updateState};
      const version = updateState.version;
      try {
        if (updateState.state === 'available') {
          updateState = {state: 'downloading', version}; emit('capability', caps());
          const reg = await env.navigator.serviceWorker.getRegistration('/'), worker = env.navigator.serviceWorker.controller || reg?.active; if (!worker) throw Error('no worker');
          await Promise.race([new Promise((ok, bad) => { const ch = new MessageChannel(); ch.port1.onmessage = ({data}) => data.type === 'ready' ? ok() : data.type === 'error' ? bad(Error(data.message)) : 0; worker.postMessage({type: 'PREPARE_GAME', game: 'app-alarm'}, [ch.port2]); }),
            new Promise((_, bad) => setTimeout(() => bad(Error('timeout')), 5 * 60000))]);
          updateState = {state: 'ready', version};
        }
        const busy = Object.values(get().runs).some(r => r.occ?.status === 'ACTIVE');
        if (!busy && version) { try { storage.setItem('mbs-app-ver:alarm', version); env.sessionStorage?.setItem('mbs-app-reload:alarm', version); } catch {} env.location?.reload?.(); }
      } catch { updateState = {state: 'error'}; }
      emit('capability', caps()); return {...updateState};
    },
    getPrefs() { try { return JSON.parse(storage.getItem(PREFS)) || {}; } catch { return {}; } },
    setPrefs(p) { const next = {...adapter.getPrefs(), ...(typeof p?.reducedMotion === 'boolean' ? {reducedMotion: p.reducedMotion} : {}), ...(typeof p?.highContrast === 'boolean' ? {highContrast: p.highContrast} : {})};
      try { storage.setItem(PREFS, JSON.stringify(next)); } catch {} emit('snapshot'); return next; },
    playChallenge: async occId => emit('playChallenge', {occId: occId || null}),

    // ---- beyond the contract (used by app.mjs and tests) ----
    /** Advance the clock once: persists + syncs + drives outputs when something happened. Returns the events (start/stage/missed) for the UI. */
    tick() { const r = R.tick(get(), now()); if (r.events.length) commit(r.state); else drive(); return r.events; },
    drive, sync, commit, outputs, owner, unlock: () => outputs.unlock(),
    /** Optional check-in proof: accepted only if that occurrence's reminder selected this kind and the proof matches. */
    async checkIn(occId, kind, proof) {
      const st = get(), run = Object.values(st.runs).find(x => x.occ?.id === occId), rem = run && R.reminderOf(st, run.occ.rid);
      if (!rem || run.occ.extra !== kind || !K.verify(kind, rem.challenge, proof)) return false;
      const next = R.checkin(st, occId, kind, now()); if (next === st) return false; commit(next); return true;
    },
    scan(kind, occId, signal) {                                  // foreground scans for the three optional check-ins
      const st = get(), run = Object.values(st.runs).find(x => x.occ?.id === occId), rem = run && R.reminderOf(st, run.occ.rid);
      if (!rem || run.occ.extra !== kind) return Promise.resolve({ok: false, reason: 'not-selected'});
      const fn = {qr: K.scanQr, nfc: K.scanNfc, motion: (e, c, s) => K.countMotion(e, c, s)}[kind]; if (!fn) return Promise.resolve({ok: false, reason: 'unsupported'});
      return fn(env, rem.challenge, signal).then(async r => r.ok && (await adapter.checkIn(occId, kind, r.proof)) ? r : {ok: false, reason: r.reason || 'rejected'});
    },
    needsTap: () => outputs.needTap(),
    dispose() { disposed = true; env.removeEventListener?.('online', onOnline); env.document?.removeEventListener?.('visibilitychange', onVis); owner.close?.(); outputs.destroy(); clearTimeout(saveTimer); },
  };
  return adapter;
}
