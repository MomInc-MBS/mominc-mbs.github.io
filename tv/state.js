/* tv/state.js - the versioned state store (PLAN-r8 D.1.2). Classic script, no import/export: loaded
   after mbs-channels.js (needs window.MBS_CHANNELS.active) and before anything that reads state.

   Runs its migration and its corruption recovery immediately, synchronously, at script-load time -
   nothing else has to remember to call it first.

   One key (`mbs-state`) replaces mbs-unlock, mbs-forms and mbs-unlock-at. As of 2.8b, this file's own
   shared accessors (unlockedActive/bankUnlock/getArmedAt/setArmedAt/formStatus/saveForm/formsDone) are
   the ONLY way tv.js and mbs-shim.js touch that state - the three legacy keys are read only once more,
   by this file's own migrate()/deriveFromLegacy() below, for a returning visitor's old data. */
(() => {
  const KEY = "mbs-state";
  const BACKUP_KEY = "mbs-state-backup-v1";     // the pre-migration legacy snapshot, kept until read() proves the new key readable
  const QUARANTINE_KEY = "mbs-state-quarantine"; // exact original bytes of whatever failed to parse/validate
  const VERSION = 2;
  const ARMED_MS = 30000;                        // must match tv.js/mbs-shim.js's own ARMED_MS

  const activeIds = () => {
    try { return (window.MBS_CHANNELS && window.MBS_CHANNELS.active) || []; } catch { return []; }
  };

  const emptyChannel = () => ({
    form:        { status: "draft", earnedAt: null },
    secret:      { earned: false, earnedAt: null },
    performance: { earned: false, earnedAt: null },
    reward:      { earned: false, earnedAt: null, kind: null },
  });

  const emptyState = () => ({
    v: VERSION,
    armedAt: null,
    channels: {},
    drafts: {},
    submissions: {},
    facility: { rooms: {} },
    artifacts: [],
  });

  // Any id in the manifest's active set gets a channel record, defaulted, without disturbing one
  // that's already there - so a newly-promoted channel (C004) shows up as outstanding, not missing.
  const ensureChannels = (state) => {
    activeIds().forEach(id => { if (!state.channels[id]) state.channels[id] = emptyChannel(); });
    return state;
  };

  const isWellFormed = (obj) =>
    !!obj && typeof obj === "object"
    && obj.v === VERSION
    && obj.channels && typeof obj.channels === "object"
    && obj.drafts && typeof obj.drafts === "object"
    && obj.submissions && typeof obj.submissions === "object"
    && obj.facility && typeof obj.facility === "object" && obj.facility.rooms && typeof obj.facility.rooms === "object"
    && Array.isArray(obj.artifacts);

  const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const quarantine = (raw) => { try { localStorage.setItem(QUARANTINE_KEY, raw); } catch {} };
  const persist = (state) => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} return state; };

  /* ---- migration (D.1.2, corrected): mbs-unlock -> channels[id].secret; mbs-forms -> submissions,
     never drafts (Codex r5 finding 6); mbs-unlock-at -> the top-level armedAt scalar, not a per-channel
     map, because it never was one. */
  function deriveFromLegacy(unlockRaw, formsRaw, unlockAtRaw) {
    const state = emptyState();
    const active = activeIds();

    let unlockIds = [];
    try { const p = JSON.parse(unlockRaw || "[]"); if (Array.isArray(p)) unlockIds = p; } catch {}
    unlockIds.filter(id => active.includes(id)).forEach(id => {
      if (!state.channels[id]) state.channels[id] = emptyChannel();
      state.channels[id].secret = { earned: true, earnedAt: null };   // no legacy per-channel earn time exists; null means "earned before this was recorded", not un-earned
    });

    let forms = {};
    try { const p = JSON.parse(formsRaw || "{}"); if (p && typeof p === "object") forms = p; } catch {}
    Object.keys(forms).forEach(id => {
      const val = forms[id];
      state.submissions[id] = (val && typeof val === "object") ? val : null;   // literal `true` -> a submissions entry with no payload
      if (!state.channels[id]) state.channels[id] = emptyChannel();
      state.channels[id].form = { status: "saved_here", earnedAt: null };
    });

    // mbs-unlock-at present with an empty mbs-unlock cannot have been legitimately armed - quarantine
    // it rather than trust it, and drop it from the migrated state (the rest of the migration stands).
    let at = 0;
    try { at = +unlockAtRaw || 0; } catch {}
    if (at) {
      if (unlockIds.length === 0) {
        quarantine(JSON.stringify({ "mbs-unlock": unlockRaw, "mbs-forms": formsRaw, "mbs-unlock-at": unlockAtRaw }));
      } else if (Date.now() - at < ARMED_MS) {
        state.armedAt = at;              // still inside the 30s window - restore it
      }                                   // else: window already expired, discarded rather than restored as live
    }

    return ensureChannels(state);
  }

  // Runs the migration exactly once: if `mbs-state` already exists (from a prior migration, or from
  // any write() since), this is a no-op - the second call in the idempotency check touches nothing.
  function migrate() {
    if (safeGet(KEY) !== null) return read();
    const unlockRaw = safeGet("mbs-unlock"), formsRaw = safeGet("mbs-forms"), unlockAtRaw = safeGet("mbs-unlock-at");
    const hasLegacy = unlockRaw !== null || formsRaw !== null || unlockAtRaw !== null;
    const state = hasLegacy ? deriveFromLegacy(unlockRaw, formsRaw, unlockAtRaw) : ensureChannels(emptyState());
    if (hasLegacy) {
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({ "mbs-unlock": unlockRaw, "mbs-forms": formsRaw, "mbs-unlock-at": unlockAtRaw }));
      } catch {}
    }
    return persist(state);
  }

  // Corruption recovery + normal read path. Unparseable JSON, the wrong version, or the right version
  // in the wrong shape all quarantine the original bytes and hand back a fresh working session - never
  // an exception reaching the page.
  function read() {
    const raw = safeGet(KEY);
    if (raw === null) return migrate();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { quarantine(raw); return persist(ensureChannels(emptyState())); }
    if (!isWellFormed(parsed)) { quarantine(raw); return persist(ensureChannels(emptyState())); }
    try { localStorage.removeItem(BACKUP_KEY); } catch {}   // the migrated state has now been read back successfully at least once
    return ensureChannels(parsed);
  }

  function write(state) {
    const s = (state && typeof state === "object") ? state : emptyState();
    s.v = VERSION;
    ensureChannels(s);
    return persist(s);
  }

  // C004: completion is every active id's secret earned, not a counter - a stale non-active entry
  // (sag, armie) was never in `channels` to begin with, so it cannot contribute either way.
  function completion(state) {
    const s = state || read();
    const ids = activeIds();
    const done = ids.filter(id => !!(s.channels[id] && s.channels[id].secret && s.channels[id].secret.earned));
    return { done: done.length, need: ids.length, complete: ids.length > 0 && done.length === ids.length };
  }

  /* ---- 2.8b: the shared accessors. tv.js and mbs-shim.js had these as functionally identical
     duplicated localStorage readers/writers (readUnlock's filter-and-self-heal, the unlock write,
     armedAt read/write, the forms read/write) - one implementation here, both files call it, instead
     of two parallel copies that can drift (which is exactly how mbs-state ended up a shadow copy). */

  // the "done" list: active ids whose secret is earned. Filtered against activeIds() the same way the
  // old readUnlock() filtered its raw array, so a stale sag/armie entry never counts (self-heals).
  function unlockedActive() {
    const s = read();
    return activeIds().filter(id => s.channels[id] && s.channels[id].secret && s.channels[id].secret.earned);
  }

  // banks the ARG node. Idempotent (earnedAt is stamped once, on first earn); does not gate on the
  // active set at write time, same as the old unlock(site) - a non-active id just self-heals on read.
  function bankUnlock(site) {
    if (!site) return unlockedActive();
    const s = read();
    if (!s.channels[site]) s.channels[site] = emptyChannel();
    if (!s.channels[site].secret.earned) { s.channels[site].secret = { earned: true, earnedAt: Date.now() }; write(s); }
    return unlockedActive();
  }

  function getArmedAt() { return read().armedAt; }
  function setArmedAt(ts) { const s = read(); s.armedAt = ts; write(s); }

  function formStatus(site) {
    const s = read();
    return (s.channels[site] && s.channels[site].form && s.channels[site].form.status) || "draft";
  }

  // 2.12 truthful receipts: this build has no server, so a local submit can only ever reach
  // saved_here - never sending/received/failed, which all require an actual server round-trip.
  function saveForm(site, data) {
    const s = read();
    if (!s.channels[site]) s.channels[site] = emptyChannel();
    s.channels[site].form = { status: "saved_here", earnedAt: Date.now() };
    s.submissions[site] = (data && typeof data === "object") ? data : null;   // legacy true-as-"no payload" rule, kept for new writes too
    write(s);
  }

  // sites: the caller's FORM_SITES list (tv.js/mbs-shim.js already own that list from the manifest).
  function formsDone(sites) {
    const s = read();
    const done = sites.filter(id => {
      const st = s.channels[id] && s.channels[id].form && s.channels[id].form.status;
      return st === "saved_here" || st === "sending" || st === "received";
    });
    return { done: done.length, need: sites.length };
  }

  // 2.11: drafts and submissions are separate collections. Clearing one must never touch the other -
  // tested both directions in check_state.py.
  function saveDraft(site, data) { const s = read(); s.drafts[site] = data; write(s); }
  function clearDrafts() { const s = read(); s.drafts = {}; write(s); }
  function clearSubmissions() { const s = read(); s.submissions = {}; write(s); }

  migrate();   // before anything else reads state

  window.MBS_STATE = {
    VERSION, KEY, BACKUP_KEY, QUARANTINE_KEY, read, write, migrate, completion, emptyState, emptyChannel,
    unlockedActive, bankUnlock, getArmedAt, setArmedAt, formStatus, saveForm, formsDone,
    saveDraft, clearDrafts, clearSubmissions,
  };
})();
