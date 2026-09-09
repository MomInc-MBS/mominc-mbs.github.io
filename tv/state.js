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
  const COACH_KEY = "mbs-coach-profile";         // card.js's own former store: { slug: { answers: {...} } }
  const COACH_BACKUP = "mbs-coach-profile-backup-v1";
  const VERSION = 3;                             // 2.24/C010: v3 adds `events`; a v2 visitor is UPGRADED, never quarantined (see upgrade())
  const SESSION_KEY = "mbs-session";             // the per-tab participation session id, in sessionStorage, never sent anywhere
  const MAX_EVENTS = 500;                        // the event log's hard ceiling - see recordEvent()
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
    events: [],
  });

  // Any id in the manifest's active set gets a channel record, defaulted, without disturbing one
  // that's already there - so a newly-promoted channel (C004) shows up as outstanding, not missing.
  const ensureChannels = (state) => {
    activeIds().forEach(id => { if (!state.channels[id]) state.channels[id] = emptyChannel(); });
    return state;
  };

  /* 3.L1/C018: D.1.3 gives form.status a CLOSED set, and this file is its only writer. A save carrying
     anything else was not written by this build, and nothing downstream re-checks it - formStatus()
     (:194), formsDone() (:212) and earnedItems() (:272) all read it straight back out. So a junk status
     is corruption and quarantines like any other wrong shape. A channel record with NO `form` is not
     corrupt: formStatus() has always defaulted such a record to "draft", and this is a shape check,
     not a completeness check - filling the gap is ensureChannels()'s job, not this function's. */
  const FORM_STATUSES = ["draft", "saved_here", "sending", "received", "failed"];
  const formOk = (c) => !!c && typeof c === "object"
    && (!c.form || (typeof c.form === "object"
                    && (!c.form.status || FORM_STATUSES.includes(c.form.status))));

  const isWellFormed = (obj) =>
    !!obj && typeof obj === "object"
    && obj.v === VERSION
    && obj.channels && typeof obj.channels === "object"
    && Object.keys(obj.channels).every(id => formOk(obj.channels[id]))
    && obj.drafts && typeof obj.drafts === "object"
    && obj.submissions && typeof obj.submissions === "object"
    && obj.facility && typeof obj.facility === "object" && obj.facility.rooms && typeof obj.facility.rooms === "object"
    && Array.isArray(obj.artifacts)
    && Array.isArray(obj.events);

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

  /* 2.24/C010: the v2 -> v3 upgrade. A schema bump that simply quarantined every existing visitor
     would delete what they earned in order to make room for an empty event log, so a v2 body is
     carried forward in place. It is NOT a way past validation: anything that is not a plausible v2
     body comes out the other side unchanged and is quarantined by isWellFormed() exactly as before,
     which is what keeps the "right version, wrong shape" case honest after the bump. */
  function upgrade(obj) {
    if (!obj || typeof obj !== "object" || obj.v !== 2) return obj;
    obj.v = VERSION;
    if (!Array.isArray(obj.events)) obj.events = [];
    return obj;
  }

  // Corruption recovery + normal read path. Unparseable JSON, the wrong version, or the right version
  // in the wrong shape all quarantine the original bytes and hand back a fresh working session - never
  // an exception reaching the page.
  function read() {
    const raw = safeGet(KEY);
    if (raw === null) return migrate();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { quarantine(raw); return persist(ensureChannels(emptyState())); }
    const wasOld = !parsed || parsed.v !== VERSION;
    parsed = upgrade(parsed);
    if (!isWellFormed(parsed)) { quarantine(raw); return persist(ensureChannels(emptyState())); }
    if (wasOld) persist(parsed);   // the upgrade is written back once, not re-derived on every read
    try { localStorage.removeItem(BACKUP_KEY); } catch {}   // the migrated state has now been read back successfully at least once
    return ensureChannels(parsed);
  }

  function write(state) {
    const s = (state && typeof state === "object") ? state : emptyState();
    s.v = VERSION;
    if (!Array.isArray(s.events)) s.events = [];   // the one chokepoint every mutation passes through
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
    if (!s.channels[site].secret.earned) {
      s.channels[site].secret = { earned: true, earnedAt: Date.now() };
      write(s);
      recordEvent("milestone", site, { what: "secret" });   // AFTER the write, never before: recordEvent re-reads the store
    }
    return unlockedActive();
  }

  function getArmedAt() { return read().armedAt; }
  // Story completion is separate from finding an ARG secret or earning a reward.
  function completedPages() {
    const s = read();
    return activeIds().filter(id => s.channels[id]?.page?.complete === true);
  }
  function completePage(site) {
    if (!site || !activeIds().includes(site)) return false;
    const s = read();
    if (s.channels[site]?.page?.complete) return false;
    if (!s.channels[site]) s.channels[site] = emptyChannel();
    s.channels[site].page = { complete: true, completedAt: Date.now() };
    write(s);
    if (!completedPages().includes(site)) return false;
    // Let the finishing action finish painting before opening its sponsor message.
    queueMicrotask(() => window.dispatchEvent(new CustomEvent('mbs:page-complete', { detail: { site } })));
    return true;
  }
  function migratePageCompletions() {
    const s = read();
    if (s.storyVersion === 1) return;
    // Earlier builds only saved the unlock. Preserve that existing progress once;
    // new unlocks must go through completePage at the actual terminal action.
    activeIds().forEach(id => {
      if (s.channels[id]?.secret?.earned) s.channels[id].page = { complete: true, completedAt: s.channels[id].secret.earnedAt, legacy: true };
    });
    s.storyVersion = 1;
    write(s);
  }
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
    recordEvent("participation_form_saved", site);
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
  // Returns whether the write actually landed. Private windows and blocked site data make persist() a
  // no-op, and a card that says "Saved" when nothing was saved is a lie the visitor cannot see - that
  // guarantee came from card.js's own writeJSON and has to survive moving the store here.
  function saveDraft(site, data) {
    const s = read();
    s.drafts[site] = data;
    write(s);
    const landed = JSON.stringify(read().drafts[site]) === JSON.stringify(data);
    // The event 2.24 is actually about: an answer kept is participation and NO game was completed.
    // Recorded only when the write landed - a private window that saved nothing must not leave a
    // log entry claiming it did, which is the same lie saveDraft's return value exists to prevent.
    if (landed) recordEvent("participation_draft_saved", site,
                            { answers: Object.keys((data && data.answers) || data || {}).length });
    return landed;
  }
  function draftFor(site) { const d = read().drafts[site]; return (d && typeof d === "object") ? d : null; }
  function clearDraft(site) { const s = read(); delete s.drafts[site]; write(s); return read().drafts[site] === undefined; }
  function clearDrafts() { const s = read(); s.drafts = {}; write(s); }
  function clearSubmissions() { const s = read(); s.submissions = {}; write(s); }

  /* ---- 2.10: artifacts. The schema has always carried the array; this is the only writer. An entry is
     { id, channel, title, kind, earnedAt }. Keyed by id so a channel that re-awards the same artifact
     on a replay does not stack duplicates in the visitor's file. */
  function addArtifact(entry) {
    if (!entry || !entry.id) return false;
    const s = read();
    if (s.artifacts.some(a => a && a.id === entry.id)) return false;
    s.artifacts.push({
      id: String(entry.id),
      channel: entry.channel || null,
      title: entry.title || String(entry.id),
      kind: entry.kind || "artifact",
      earnedAt: entry.earnedAt || Date.now(),
    });
    write(s);
    recordEvent("artifact_saved", entry.channel || null, { id: String(entry.id) });
    return true;
  }

  /* ---- 2.10: what the "Your files" route renders. Derived here rather than in the page, so the route
     and check_state.py agree by construction. Four independent per-channel states (2.9) each surface
     separately - earning one must not imply the others - plus explicit artifacts and kept answers. */
  function earnedItems() {
    const s = read();
    const out = [];
    const stamp = (o) => (o && o.earnedAt) || null;
    activeIds().forEach(id => {
      const c = s.channels[id];
      if (!c) return;
      if (c.secret && c.secret.earned)      out.push({ channel: id, kind: "secret",      title: "Signal recovered",      earnedAt: stamp(c.secret) });
      if (c.performance && c.performance.earned) out.push({ channel: id, kind: "performance", title: "Performance logged", earnedAt: stamp(c.performance) });
      if (c.reward && c.reward.earned)      out.push({ channel: id, kind: "reward",      title: c.reward.kind || "Reward", earnedAt: stamp(c.reward) });
      const st = c.form && c.form.status;
      if (st && st !== "draft")             out.push({ channel: id, kind: "form",        title: "Form answers", earnedAt: stamp(c.form), status: st });
    });
    s.artifacts.forEach(a => { if (a && a.id) out.push({ channel: a.channel, kind: a.kind || "artifact", title: a.title || a.id, earnedAt: a.earnedAt || null, id: a.id }); });
    // drafts hold card.js's coach-file shape: { title, answers }. A bare answers map is accepted too,
    // so a draft written by anything else still lists rather than silently vanishing.
    Object.keys(s.drafts).forEach(id => {
      const d = s.drafts[id];
      if (!d || typeof d !== "object") return;
      const answers = (d.answers && typeof d.answers === "object") ? d.answers : d;
      const n = Object.keys(answers).length;
      // the channel name is already the group heading above this card, so the title carries the count
      if (n) out.push({ channel: id, kind: "draft", title: n + (n === 1 ? " answer kept" : " answers kept"), earnedAt: null, count: n });
    });
    return out;
  }

  /* ---- card.js used to keep coach answers in its own `mbs-coach-profile` key - a third store beside
     this one, which is how `mbs-state` became a shadow copy in the first place. Adopted into `drafts`
     here. NOT part of migrate(): that runs once, only when `mbs-state` is absent, and a visitor can
     answer a coach question long after this store exists. Idempotent by consuming the old key. */
  function adoptCoachProfile() {
    const raw = safeGet(COACH_KEY);
    if (raw === null) return false;
    let all = null;
    try { all = JSON.parse(raw); } catch {}
    if (!all || typeof all !== "object") {                  // unreadable: keep the bytes, drop the key
      quarantine(raw);
      try { localStorage.removeItem(COACH_KEY); } catch {}
      return false;
    }
    const s = read();
    let changed = false;
    Object.keys(all).forEach(slug => {
      const entry = all[slug];
      const answers = entry && entry.answers;
      if (!answers || typeof answers !== "object" || !Object.keys(answers).length) return;
      if (s.drafts[slug]) return;                           // a draft written since wins; never overwrite newer
      s.drafts[slug] = { title: entry.title || slug, answers };   // card.js's own shape, carried across intact
      changed = true;
    });
    if (changed) write(s);
    try { localStorage.setItem(COACH_BACKUP, raw); localStorage.removeItem(COACH_KEY); } catch {}
    return changed;
  }

  /* ---- 2.24/C010: the participation event log.

     C010 asks for an adapter carrying channel / episode / event / session id. It lives HERE, in the
     store, and not in a new file, because these events ARE earned history - the same argument that
     put artifacts in `mbs-state` and deliberately kept 2.22's display preference OUT of it. That
     costs a schema bump and a migration (v2 -> v3, see upgrade()), which is the honest price.

     Nothing leaves the browser. There is no endpoint, no beacon, no queue to flush - C008's
     draft/saved_here vocabulary exists precisely so a local write never implies a creator received
     anything, and an event log is the easiest place in the codebase to break that promise. */

  // Per TAB. sessionStorage is exactly the lifetime the word "session" means here, and it is already
  // what tv.js uses to remember the set was left on.
  const newId = () => {
    try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch {}
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  };
  const MEM_SESSION = newId();   // the fallback when sessionStorage is blocked: one id for this page's life, never null

  function sessionId() {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) { id = newId(); sessionStorage.setItem(SESSION_KEY, id); }
      return id;
    } catch { return MEM_SESSION; }
  }

  /* The episode: which broadcast week this happened in, labelled by the Wednesday that opened it -
     so the whole week from Wednesday to Tuesday carries one episode id, and the label turns over at
     midnight rather than at the top of the hour the show starts. Same weekly grid as tv.js's schedule
     (C009), read in the SHOW's timezone, because an episode is a property of the broadcast and not of
     where the visitor happens to be sitting: 11am Thursday in Tokyo is Wednesday's episode.

     This is deliberately NOT tv.js's zoned() inverse. That function exists to find the UTC INSTANT
     of a wall-clock hour, which is the part DST makes hard. An episode is a LABEL: format the
     instant into the show's zone and do calendar arithmetic on the parts. No instant is ever
     reconstructed, so there is no offset to get wrong and no second copy of the hard code. */
  const EP_TZ = "America/Los_Angeles", EP_WEEKDAY = 3;   // Wednesday, matching tv.js's SHOW
  const EP_WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const epFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: EP_TZ, weekday: "short", year: "numeric", month: "numeric", day: "numeric",
  });

  function episodeFor(now) {
    const p = epFmt.formatToParts(now || new Date());
    const g = (t) => (p.find(x => x.type === t) || {}).value;
    const back = (EP_WD[g("weekday")] - EP_WEEKDAY + 7) % 7;
    // Date.UTC normalises a day-of-month that has gone negative, so stepping back across the 1st of
    // a month (or of January) needs no special case.
    return new Date(Date.UTC(+g("year"), +g("month") - 1, +g("day") - back)).toISOString().slice(0, 10);
  }

  /* The adapter. One entry: { event, channel, episode, session, at } and an optional `detail`.
     Callers below are the existing shared writers, not the channels - a channel that saves a draft
     records participation because saveDraft() records it, which is why an unconverted channel and a
     module channel are measured the same way and neither had to remember anything. */
  function recordEvent(event, channel, detail) {
    if (!event) return null;
    const s = read();
    const rec = {
      event:   String(event),
      channel: channel || null,
      episode: episodeFor(),
      session: sessionId(),
      at:      Date.now(),
    };
    if (detail && typeof detail === "object") rec.detail = detail;
    s.events.push(rec);
    // ponytail: hard cap, oldest dropped. localStorage is ~5MB and persist() fails SILENTLY when it
    // is full, so an uncapped log would eventually stop the visitor's EARNED state from saving at
    // all - the log would cost them the thing it was measuring. If a full history is ever wanted,
    // that is a different store, not a bigger number.
    if (s.events.length > MAX_EVENTS) s.events.splice(0, s.events.length - MAX_EVENTS);
    write(s);
    return rec;
  }

  // The readback. `filter` is an exact-match map over the record's own fields, so
  // events({ channel: "fuel", event: "start" }) is the whole query language and there is no second one.
  function events(filter) {
    const all = read().events;
    if (!filter || typeof filter !== "object") return all;
    const keys = Object.keys(filter);
    return all.filter(e => e && keys.every(k => e[k] === filter[k]));
  }

  function clearEvents() { const s = read(); s.events = []; write(s); }

  const STORY_CLOCK_KEY = 'mbs-story-started-at-v1', STORY_MS = 60 * 60 * 1000;
  const STORY_KEYS = ['mbs-unlock','mbs-unlock-at','mbs-forms',BACKUP_KEY,
    'mbs-hand-ad-shown-v1','mbs-hand-decisions-v1','mbs-armie-hall-v2',
    'mbs-lilbf-museum','mbs-lilbf-museum-v2','mbs-lilbf-taught-v1',
    'mbs-corgi-school','mbs-corgi-school-v2','mbs-corgi-school-v3'];
  let storyStartedAt = 0, storyTimer;
  function checkStorySession(reload = false) {
    const now = Date.now();
    let started = Number(safeGet(STORY_CLOCK_KEY));
    if (!Number.isFinite(started) || started <= 0 || started > now) started = now;
    const expired = now - started >= STORY_MS;
    const changed = storyStartedAt && storyStartedAt !== started;
    if (expired) {
      let old;try { old = JSON.parse(safeGet(KEY)); } catch {}
      const next = ensureChannels(emptyState());
      // Keep saved answers available for Coach setup, but clear the round's earns.
      if (old?.drafts && typeof old.drafts === 'object') next.drafts = old.drafts;
      if (old?.submissions && typeof old.submissions === 'object') next.submissions = old.submissions;
      next.storyVersion = 1;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        STORY_KEYS.forEach(key => localStorage.removeItem(key));
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
      started = now;
    }
    storyStartedAt = started;
    try { if (safeGet(STORY_CLOCK_KEY) !== String(started)) localStorage.setItem(STORY_CLOCK_KEY, String(started)); } catch {}
    clearTimeout(storyTimer);
    storyTimer = setTimeout(() => checkStorySession(true), Math.max(1, STORY_MS - (now - started)));
    if (reload && (expired || changed)) location.reload();
  }
  // The hour starts when the website round starts. Reloads and clicks do not extend it.
  checkStorySession();
  window.addEventListener('pageshow', () => checkStorySession(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkStorySession(true); });
  window.addEventListener('storage', e => { if (e.key === STORY_CLOCK_KEY) checkStorySession(true); });

  migrate();            // before anything else reads state
  migratePageCompletions();
  adoptCoachProfile();  // and before card.js asks for its draft

  window.MBS_STATE = {
    VERSION, KEY, BACKUP_KEY, QUARANTINE_KEY, read, write, migrate, completion, emptyState, emptyChannel,
    unlockedActive, bankUnlock, completedPages, completePage, getArmedAt, setArmedAt, formStatus, saveForm, formsDone,
    saveDraft, draftFor, clearDraft, clearDrafts, clearSubmissions,
    addArtifact, earnedItems, adoptCoachProfile, COACH_KEY,
    recordEvent, events, clearEvents, episodeFor, sessionId, SESSION_KEY, MAX_EVENTS,
  };
})();
