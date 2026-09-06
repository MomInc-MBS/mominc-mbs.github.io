/* MBS standalone shim: everything tv.js hands a channel, provided outside the television.
   A channel fragment is loaded verbatim into a standalone play route and must not be edited, so this
   file has to satisfy the exact surface tv.js exposes: MBS.meter, MBS.wave, MBS.unlock, MBS.form,
   MBS.MAIL, MBS.formsDone, MBS.armReady, MBS.armHere, MBS.armedLeft, and the mbs:arm / mbs:disarm events.
   Same origin as /tv/, so localStorage progress is genuinely shared with the hub, not a second copy. */
(() => {
  const LIFECYCLE_VERSION = 1;
  // sag and armie are coming_soon (tv/registry.json) and ship no play route, so neither calls MBS.unlock or
  // MBS.form any more - the reachable set is the four games that still do. Kept identical to tv.js's lists.
  const ACTIVE_UNLOCK = ["lilboyfriend", "djscratch", "corgi", "fuel"];
  const NODES = ACTIVE_UNLOCK.length, ARMED_MS = 30000;
  const FORM_SITES = ["lilboyfriend", "djscratch", "corgi", "fuel"];

  const M = (window.MBS = window.MBS || {});
  M.MAIL = "ianmyersrocks97@gmail.com";
  M.standalone = true;

  /* Mode is two different things and they must never be confused.
     TONE: public is the lighter, official-looking version; live is the darker, moodier one the broadcast
     shows. A game reads MBS.mode (and the html.mbs-live class) to decide which content and mood to build.
     ELIGIBILITY: whether a run can win anything is decided entirely by the server against a mission,
     a session and a deadline. Nothing below grants it, so letting a query string set the tone is safe.
     A URL can change what the game looks like. A URL can never change what it is worth. */
  const slug = document.documentElement.dataset.game || "";
  const asked = new URLSearchParams(location.search).get("mode");
  const mode = (document.documentElement.dataset.mode === "live" || asked === "live") ? "live" : "public";
  document.documentElement.dataset.mode = mode;
  document.documentElement.classList.toggle("mbs-live", mode === "live");
  M.mode = mode;
  M.isLive = mode === "live";

  const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch { return JSON.parse(d); } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---- lifecycle (plan item 9). The games predate this contract, so the adapter derives the events
     from what they already do rather than asking any game to emit them. */
  let started = false, completed = false;
  const emit = (type, detail) => {
    const ev = { v: LIFECYCLE_VERSION, type, game: slug, mode, t: Date.now(), detail: detail || null };
    document.dispatchEvent(new CustomEvent("mbs:lifecycle", { detail: ev }));
    try { chan && chan.postMessage(ev); } catch {}        // progressive enhancement only, never authority
    if (mode === "live") report(ev);
    return ev;
  };
  let chan = null;
  try { chan = new BroadcastChannel("mbs-lifecycle"); } catch {}
  let ready = false;
  const readyOnce = (detail) => { if (!ready) { ready = true; emit("GAME_READY", detail); } };
  M.lifecycle = { version: LIFECYCLE_VERSION, emit, ready: readyOnce, get started() { return started; }, get completed() { return completed; } };

  /* ---- live mode talks to the server, which is the only authority for access, time and eligibility.
     A failed report is never treated as a completion; the server decides, and says so on its own endpoint. */
  const API = document.documentElement.dataset.api || "";
  function report(ev) {
    if (!API) return;
    try {
      fetch(API + "/lifecycle", {
        method: "POST", credentials: "include", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ev)
      }).catch(() => {});
    } catch {}
  }

  const markStart = () => { if (!started) { started = true; emit("GAME_START"); } };
  const host = document.getElementById("channel");   // exists at shim time in the shell markup; content
  if (host) ["pointerdown", "keydown"].forEach(e => host.addEventListener(e, markStart, { once: true, passive: true }));   // inserted later still bubbles to it. Never window - the exit/meter/boot controls must not start a run.

  /* Goon's game is a same-origin <iframe> (goon.html:95). Events inside a document never bubble out to
     the parent, so a listener on #channel can no more see them than the old window listener could:
     without this, goon can never emit GAME_START at all. Called by mount.js after the fragment lands.
     Guarded because a cross-origin frame throws on contentDocument and is simply skipped. */
  M.bindFrames = () => {
    if (!host) return;
    host.querySelectorAll("iframe").forEach(f => {
      const attach = () => {
        let d; try { d = f.contentDocument; } catch { return; }
        if (!d) return;
        ["pointerdown", "keydown"].forEach(e => d.addEventListener(e, markStart, { once: true, passive: true }));
      };
      attach();                            // already loaded
      f.addEventListener("load", attach);  // or not yet: goon's iframe is loading="lazy"
    });
  };

  /* ---- the stress gauge. The television has one; a standalone route paints its own thin bar. */
  M.meter = (pct, label) => {
    const v = Math.max(0, Math.min(100, pct || 0));
    const bar = document.getElementById("mbsMeter");
    if (bar) { bar.style.setProperty("--meter", v); bar.dataset.label = label || ""; bar.hidden = false; }
    emit("GAME_PROGRESS", { pct: v, label: label || null });
  };

  /* ---- the orange-then-purple sweep. Same two-stage timing and the same restore() contract as tv.js,
     so a channel's picture goes back in step exactly as it does inside the television. */
  M.wave = (opts = {}) => {
    const w = document.getElementById("mbsWave");
    if (!w) { opts.restore && opts.restore(); return; }
    const sweep = (purple, then) => {
      w.classList.remove("go"); void w.offsetWidth;
      w.classList.toggle("purple", purple);
      w.classList.add("go");
      w.addEventListener("animationend", () => { w.classList.remove("go", "purple"); then && then(); }, { once: true });
    };
    sweep(false, () => setTimeout(() => {
      opts.restore && opts.restore();
      sweep(true, null);
    }, opts.after ?? 1000));
  };

  /* ---- the unlock nodes, shared with the hub through the same localStorage key. Filtered against
     ACTIVE_UNLOCK and rewritten on every read, so a stale sag/armie entry from before either channel went
     coming_soon self-heals instead of permanently over- or under-counting a returning visitor's progress. */
  const readUnlock = () => {
    const raw = readJSON("mbs-unlock", "[]");
    const active = raw.filter(x => ACTIVE_UNLOCK.includes(x));
    if (active.length !== raw.length) writeJSON("mbs-unlock", active);
    return active;
  };
  M.unlock = (site) => {
    if (!site) return;
    const done = readUnlock();
    if (!done.includes(site)) { done.push(site); writeJSON("mbs-unlock", done); }
    if (!completed) { completed = true; emit("GAME_COMPLETE", { site, nodes: done.length, need: NODES }); }
    if (M.armedLeft() > 0) document.dispatchEvent(new CustomEvent("mbs:arm"));
    paint();
  };
  M.armReady = () => readUnlock().length >= NODES;
  M.armHere = () => {
    if (!M.armReady()) return 0;
    writeJSON("mbs-unlock-at", Date.now());
    paint(); document.dispatchEvent(new CustomEvent("mbs:arm"));
    return M.armedLeft();
  };
  M.armedLeft = () => {
    const at = readJSON("mbs-unlock-at", "0");
    return M.armReady() && at ? Math.max(0, ARMED_MS - (Date.now() - at)) : 0;
  };
  let armedTimer = 0;
  function paint() {
    clearTimeout(armedTimer);
    const left = M.armedLeft();
    if (left > 0) armedTimer = setTimeout(() => {
      M.wave({ after: 0 });
      document.dispatchEvent(new CustomEvent("mbs:disarm"));
    }, left);
  }

  /* ---- the forms gate. Banked the same way the television banks it; the offer bar belongs to the hub. */
  M.form = (site, data) => {
    if (!site || FORM_SITES.indexOf(site) < 0) return;
    const f = readJSON("mbs-forms", "{}");
    f[site] = data || true; writeJSON("mbs-forms", f);
    emit("GAME_PROGRESS", { form: site });
  };
  M.formsDone = () => {
    const f = readJSON("mbs-forms", "{}");
    return { done: FORM_SITES.filter(x => f[x]).length, need: FORM_SITES.length };
  };
  M.rearmTest = () => {};                                  // localhost-only hook on the shell; no standalone equivalent

  addEventListener("pagehide", () => { if (started && !completed) emit("GAME_EXIT"); });
  addEventListener("error", e => emit("GAME_ERROR", { message: String(e.message || e.type).slice(0, 200) }));
  paint();
})();
