/* The landing card's behaviour. One file, because these are all the same job: make the card an honest
   handoff rather than a launch button. Everything here degrades to nothing if it fails - the CTA is a
   real <a href> and the profile is a real <form>, so a card with no JavaScript still plays the game.

   Nothing in this file sends anything anywhere. Profile answers are written to this browser's own
   localStorage and to nothing else, which is exactly what the copy beside them promises. */
(() => {
  const body = document.body;
  const D = body.dataset;
  const PROFILE_KEY = "mbs-coach-profile";      // one object, keyed by channel slug. The ONLY key this
                                                // file writes, because it is the only one disclosed.

  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; }
  };
  // returns whether the write actually happened: private windows and blocked site data throw here,
  // and a card that says "Saved" when nothing was saved is a lie the visitor cannot see
  const writeJSON = (k, v) => {
    const want = JSON.stringify(v);
    try { localStorage.setItem(k, want); return localStorage.getItem(k) === want; }
    catch { return false; }
  };

  /* ---- the CTA. `[data-play]` anchors carry a real href to the play route and no target, so a click
     navigates this tab there directly - no new tab, nothing to open or fall back from. The onward-channel
     block below is shown up front instead of after a launch this same-tab nav can no longer observe. */

  /* ---- saved progress, and only where the game genuinely saves. The key comes from the registry and
     is the key the game itself writes; three channels save nothing and declare no key, so their cards
     make no claim. */
  (() => {
    const key = D.progressKey, label = D.continueCta;
    if (!key || !label) return;
    // structured state, not merely a non-empty key: all five of these games write a JSON object, so a
    // stale or corrupt value must not offer a resume the game cannot honour
    let has = false;
    try {
      const raw = localStorage.getItem(key);
      const val = raw && JSON.parse(raw);
      has = !!val && typeof val === "object" && Object.keys(val).length > 0;
    } catch { has = false; }
    if (!has) return;
    const resume = document.getElementById("resume"), cta = document.getElementById("play");
    if (resume) resume.hidden = false;
    if (cta) cta.textContent = label;
  })();

  /* ---- the profile. Draft answers live in this browser and nowhere else. */
  const form = document.getElementById("profileForm");
  const saidEl = document.getElementById("profileSaved");
  const say = (msg) => { if (saidEl) { saidEl.textContent = msg; saidEl.hidden = false; } };

  const fields = () => Array.from(form ? form.querySelectorAll("textarea") : []);

  function loadDraft() {
    const all = readJSON(PROFILE_KEY, {});
    const mine = all[D.slug];
    if (!mine || !mine.answers) return;
    fields().forEach(t => { if (mine.answers[t.name]) t.value = mine.answers[t.name]; });
  }

  function saveDraft(e) {
    e.preventDefault();
    const answers = {};
    fields().forEach(t => { const v = t.value.trim(); if (v) answers[t.name] = v; });
    const all = readJSON(PROFILE_KEY, {});
    if (!Object.keys(answers).length) {         // an empty save is a delete, not an empty record
      delete all[D.slug];
      say(writeJSON(PROFILE_KEY, all)
          ? "Nothing to save, so nothing was kept."
          : "This browser is not letting the page change stored data.");
      return paintFile();
    }
    all[D.slug] = { title: document.title.split(" | ")[0], answers };
    say(writeJSON(PROFILE_KEY, all)
        ? "Saved on this device. Nothing was sent."
        : "This browser is not letting the page store anything, so nothing was saved.");
    paintFile();
  }

  function deleteMine() {
    const all = readJSON(PROFILE_KEY, {});
    delete all[D.slug];
    const wrote = writeJSON(PROFILE_KEY, all);
    fields().forEach(t => { t.value = ""; });
    say(wrote ? "Deleted from this device."
              : "This browser is not letting the page change stored data, so nothing was deleted.");
    paintFile();
  }

  /* factual state only: how many slices are saved and which. No streak, no nudge, no "you are 60% of
     the way to your coach" - the count is information, not pressure. */
  function paintFile() {
    const wrap = document.getElementById("profileFile");
    const countEl = document.getElementById("profileCount");
    const list = document.getElementById("profileList");
    if (!wrap || !countEl || !list) return;
    const all = readJSON(PROFILE_KEY, {});
    const slugs = Object.keys(all);
    if (!slugs.length) { wrap.hidden = true; return; }
    // six channels carry a coach-file slice; sag and armie are coming soon and have no form to fill
    countEl.textContent = "Your coach file: " + slugs.length + " of 6 channel slices saved.";
    list.textContent = "";
    slugs.forEach(sl => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = (all[sl] && all[sl].title) || sl;
      const del = document.createElement("button");
      del.type = "button"; del.className = "linkish";
      del.textContent = "Delete this channel's answers";
      del.addEventListener("click", () => {
        const now = readJSON(PROFILE_KEY, {});
        delete now[sl];
        if (!writeJSON(PROFILE_KEY, now)) {
          say("This browser is not letting the page change stored data.");
          return;
        }
        if (sl === D.slug) fields().forEach(t => { t.value = ""; });
        paintFile();
      });
      li.append(name, del);
      list.appendChild(li);
    });
    wrap.hidden = false;
  }

  if (form) {
    loadDraft();
    form.addEventListener("submit", saveDraft);
    const del = document.getElementById("profileDelete");
    if (del) del.addEventListener("click", deleteMine);
  }
  paintFile();

  /* ---- sharing: the device's own sheet where there is one, the clipboard where there is not. */
  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = D.shareUrl || location.href;
      const said = document.getElementById("shareSaid");
      try {
        if (navigator.share) { await navigator.share({ title: document.title, url }); return; }
        await navigator.clipboard.writeText(url);
        if (said) said.hidden = false;
      } catch { /* dismissed, or no clipboard permission: say nothing rather than something false */ }
    });
  }

  /* ---- the reminder. The button only exists when the registry carries a confirmed start time, so
     this never invents a date; it writes one real calendar event and nothing else. */
  const remind = document.getElementById("remindBtn");
  if (remind && D.liveAt) {
    remind.addEventListener("click", () => {
      const start = new Date(D.liveAt);
      if (isNaN(start)) return;
      const stamp = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MBS//mission//EN", "BEGIN:VEVENT",
        "UID:" + Date.now() + "@mominc-mbs",
        "DTSTAMP:" + stamp(new Date()), "DTSTART:" + stamp(start), "DTEND:" + stamp(end),
        "SUMMARY:MBS live mission",
        "DESCRIPTION:The code is revealed during the live broadcast." + (D.liveUrl ? " " + D.liveUrl : ""),
        D.liveUrl ? "URL:" + D.liveUrl : "", "END:VEVENT", "END:VCALENDAR"
      ].filter(Boolean).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "mbs-live-mission.ics";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
})();
