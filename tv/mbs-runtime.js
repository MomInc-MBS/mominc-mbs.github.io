/* tv/mbs-runtime.js - the shared runtime: the sweep engine (2.14 / C007) and the pause/resume
   lifecycle (2.13 / C006). Classic script, no import/export: loaded before tv.js in the television and
   before mbs-shim.js on every play route.

   Why this file exists. `sweep()` was written twice, once in tv.js and once in mbs-shim.js, with the
   same defect in both: each call did classList.remove("go"), re-added it, and attached a fresh
   `animationend` listener. Start a second wave before the first finishes and the stale listener is
   still attached, so it fires on the NEW animation's animationend and runs the WRONG completion. Two
   copies of a bug is how the state store became a shadow copy too, so this is one implementation that
   both surfaces call.

   Three guarantees, which are exactly C007's:
     - exactly once per effect id, whatever happens
     - the outcome does not depend on `animationend` arriving (a fallback deadline always completes it)
     - a superseded effect still completes, so a channel is never left with its picture swept away */
(() => {
  const ORANGE_MS = 1200;   // fallback deadline per sweep: comfortably past the CSS animation
  const GLOW_MS = 900;      // how long the MOM Inc bug keeps glowing after the purple sweep

  let seq = 0;
  const current = new Map();   // element -> the id of the effect that currently owns it

  /* One sweep of the band. Completes exactly once: on this element's own animationend, or on the
     deadline, or because a newer effect took the element. */
  function sweep(el, purple, id, then) {
    let settled = false;
    let timer = 0;

    const finish = (superseded) => {
      if (settled) return;                       // the whole point: exactly once
      settled = true;
      clearTimeout(timer);
      el.removeEventListener("animationend", onEnd);
      if (!superseded && current.get(el) === id) el.classList.remove("go", "purple");
      then && then(superseded);
    };

    // target filtering: animationend bubbles, so a child's animation must not end the band's sweep
    const onEnd = (e) => { if (e.target !== el) return; finish(current.get(el) !== id); };

    el.classList.remove("go");
    void el.offsetWidth;                          // restart even mid-sweep
    el.classList.toggle("purple", !!purple);
    el.classList.add("go");
    el.addEventListener("animationend", onEnd);
    timer = setTimeout(() => finish(current.get(el) !== id), ORANGE_MS);
  }

  /* The two-stage wave: orange out, a pause, then restore() in step with the purple sweep back.
     `restore` is guaranteed to run exactly once even if this effect is superseded mid-flight or the
     animations never fire at all, because a channel whose picture never comes back is unplayable. */
  function wave(el, opts, momlogo) {
    opts = opts || {};
    if (!el) { opts.restore && opts.restore(); return 0; }

    const id = ++seq;
    current.set(el, id);

    let restored = false;
    const restoreOnce = () => { if (restored) return; restored = true; opts.restore && opts.restore(); };

    let pauseTimer = 0, glowTimer = 0;
    const owns = () => current.get(el) === id;

    sweep(el, false, id, (superseded) => {
      if (superseded || !owns()) { restoreOnce(); return; }
      pauseTimer = setTimeout(() => {
        if (!owns()) { restoreOnce(); return; }
        momlogo && momlogo.classList.add("glow");
        restoreOnce();
        sweep(el, true, id, () => {
          clearTimeout(glowTimer);
          glowTimer = setTimeout(() => { momlogo && momlogo.classList.remove("glow"); }, GLOW_MS);
          if (owns()) current.delete(el);
          opts.done && opts.done();
        });
      }, opts.after != null ? opts.after : 1000);
    });

    // a caller can abandon a wave (page hide, pause) without leaving the picture gone
    return { id, cancel: () => { clearTimeout(pauseTimer); restoreOnce(); if (owns()) { current.delete(el); el.classList.remove("go", "purple"); } } };
  }

  /* ---- 2.13 / C006: the pause lifecycle.

     Pause is a SET of sources, not a boolean, because several things can suspend the page at once:
     the power switch, the tab going hidden, an overlay opening, game mode. Two sources pausing and one
     resuming must leave it paused, which a boolean gets wrong. `mbs:pause` and `mbs:resume` fire once
     per transition (empty -> non-empty and back), never once per source, so a channel listening for
     them cannot double-start.

     Held input is released on pause: a key held when the tab hides never delivers its keyup, so without
     this a channel resumes believing the key is still down and the player walks into a wall. */
  const sources = new Set();
  const held = new Set();

  const paused = () => sources.size > 0;

  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {}
  }

  function releaseHeld() {
    if (!held.size) return;
    const keys = Array.from(held);
    held.clear();
    keys.forEach(code => {
      try { document.dispatchEvent(new KeyboardEvent("keyup", { code, key: code, bubbles: true })); } catch (e) {}
    });
  }

  function pause(source) {
    const was = paused();
    sources.add(source || "unknown");
    if (!was && paused()) { releaseHeld(); emit("mbs:pause", { source: source || "unknown" }); }
  }

  function resume(source) {
    if (!sources.size) return;
    sources.delete(source || "unknown");
    if (!paused()) emit("mbs:resume", { source: source || "unknown" });
  }

  // a cancellable warm-up: the 900 ms television warm-up was a bare setTimeout, so pausing during it
  // did nothing and the set came on anyway, mid-pause (C006's "guard the 900ms warm-up timer")
  function warmUp(ms, run) {
    let t = setTimeout(() => { t = 0; if (!paused()) run(); }, ms);
    const cancel = () => { if (t) { clearTimeout(t); t = 0; } };
    document.addEventListener("mbs:pause", cancel, { once: true });
    return cancel;
  }

  document.addEventListener("keydown", (e) => { if (e.code) held.add(e.code); }, true);
  document.addEventListener("keyup", (e) => { if (e.code) held.delete(e.code); }, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause("visibility"); else resume("visibility");
  });

  window.MBS_RT = {
    wave, ORANGE_MS, GLOW_MS,
    pause, resume, warmUp,
    isPaused: paused,
    pauseSources: () => Array.from(sources),
  };
})();
