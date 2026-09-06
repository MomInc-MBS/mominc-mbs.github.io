# -*- coding: utf-8 -*-
"""The shared-runtime gate (PLAN-r9 Stage 2 packet 5, micro-steps 2.13 and 2.14).

Covers tv/mbs-runtime.js:
  2.14 / C007  MBS.wave() completes exactly once per effect id, filters animationend by target,
               completes on a fallback deadline when animationend never arrives, and never leaves a
               channel's picture swept away when a newer wave supersedes it.
  2.13 / C006  mbs:pause / mbs:resume fire once per transition rather than once per source, held keys
               are released on pause, and the 900 ms warm-up is cancellable.

The two defects this exists to catch were both real: sweep() was duplicated in tv.js and mbs-shim.js
and accumulated animationend listeners across overlapping waves, and the warm-up was a bare setTimeout
that no pause could stop.

Run:  python tools/check_runtime.py     (serves the repo itself; nothing else need be running)
"""
import functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok, notes = True, []


def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(200)

    check(pg.evaluate("() => !!window.MBS_RT"), "window.MBS_RT exists on /tv/")
    check(pg.evaluate("() => typeof window.MBS_RT.wave === 'function'"), "MBS_RT.wave is the shared engine")

    print("== 2.14 the sweep completes exactly once per effect id")

    # Two overlapping waves, the second arriving while the first is in its pause. The old code kept ONE
    # shared restoreTimer and cleared it on every call, so the superseded wave's restore() was silently
    # dropped and that channel's picture never came back. Each caller must still complete exactly once.
    # (Verified against the pre-2.14 implementation: it returns a=0 here.)
    counts = pg.evaluate("""async () => {
        let a = 0, bb = 0;
        window.MBS.wave({ after: 600, restore: () => a++ });
        await new Promise(r => setTimeout(r, 900));   // past the first sweep, inside its pause
        window.MBS.wave({ after: 600, restore: () => bb++ });
        await new Promise(r => setTimeout(r, 3400));
        return { a, b: bb };
    }""")
    check(counts["a"] == 1 and counts["b"] == 1,
          "a superseded wave still completes exactly once, and so does the one that replaced it "
          "(a=%(a)d b=%(b)d)" % counts)

    # a child's animationend bubbles to the band; it must not be mistaken for the band finishing
    filtered = pg.evaluate("""async () => {
        const el = document.getElementById("wave");
        let n = 0;
        window.MBS.wave({ after: 10, restore: () => n++ });
        const kid = document.createElement("span");
        el.appendChild(kid);
        kid.dispatchEvent(new AnimationEvent("animationend", { bubbles: true, animationName: "x" }));
        const early = n;
        await new Promise(r => setTimeout(r, 2600));
        kid.remove();
        return { early, final: n };
    }""")
    check(filtered["early"] == 0,
          "a child's bubbled animationend does not complete the band's sweep (target filtering)")
    check(filtered["final"] == 1, "the wave still completes exactly once afterwards")

    # animationend suppressed entirely: the fallback deadline must still complete the effect.
    # BOTH animations have to go. .wave.go runs mbswavefade on the element and .wave.go::before runs
    # mbswave on the pseudo-element, and the pseudo-element's animationend reports the host as its
    # target - so suppressing only the first leaves the second still completing the sweep, which is
    # exactly how an earlier version of this check passed against code that had no deadline at all.
    pg.add_style_tag(content="#wave, #wave.go, #wave.go::before, #wave::before "
                             "{ animation: none !important; transition: none !important; }")
    deadline = pg.evaluate("""async () => {
        let n = 0;
        const t0 = performance.now();
        window.MBS.wave({ after: 10, restore: () => n++ });
        await new Promise(r => setTimeout(r, 3200));
        return { n, ms: Math.round(performance.now() - t0) };
    }""")
    check(deadline["n"] == 1,
          "a suppressed animationend still completes by the fallback deadline (n=%(n)d, %(ms)dms)" % deadline)

    print("== 2.13 pause is a set of sources, not a boolean")

    pg.reload(wait_until="load")
    pg.wait_for_timeout(200)

    transitions = pg.evaluate("""() => {
        let p = 0, r = 0;
        document.addEventListener("mbs:pause", () => p++);
        document.addEventListener("mbs:resume", () => r++);
        window.MBS_RT.pause("overlay");
        window.MBS_RT.pause("visibility");     // second source: must NOT fire a second mbs:pause
        const midway = { p, r, paused: window.MBS_RT.isPaused() };
        window.MBS_RT.resume("overlay");       // one of two released: still paused, no mbs:resume yet
        const partial = { p, r, paused: window.MBS_RT.isPaused() };
        window.MBS_RT.resume("visibility");    // last one released: now it resumes, once
        return { midway, partial, final: { p, r, paused: window.MBS_RT.isPaused() } };
    }""")
    check(transitions["midway"]["p"] == 1, "two pause sources fire mbs:pause once, not twice")
    check(transitions["partial"]["paused"] is True and transitions["partial"]["r"] == 0,
          "releasing one of two sources leaves it paused and fires no mbs:resume")
    check(transitions["final"]["paused"] is False and transitions["final"]["r"] == 1,
          "releasing the last source resumes exactly once")

    # a key held when the page pauses never delivers its keyup, so the runtime has to release it
    released = pg.evaluate("""() => {
        const seen = [];
        document.addEventListener("keyup", e => seen.push(e.code));
        document.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }));
        window.MBS_RT.pause("test");
        window.MBS_RT.resume("test");
        return seen;
    }""")
    check("ArrowLeft" in released, "a key held at pause is released with a synthetic keyup (%r)" % (released,))

    print("== 2.13 the 900ms warm-up is cancellable")

    warm = pg.evaluate("""async () => {
        const tv = document.getElementById("tv");
        tv.dataset.state = "off";
        document.getElementById("power").click();      // begins the 900ms warm-up
        const during = tv.dataset.state;
        window.MBS_RT.pause("test");                   // pause mid-warm-up
        await new Promise(r => setTimeout(r, 1400));   // well past 900ms
        return { during, after: tv.dataset.state };
    }""")
    check(warm["during"] == "warming", "power begins a warm-up (state=%r)" % warm["during"])
    check(warm["after"] != "on",
          "pausing during the warm-up cancels it: the set does not come on mid-pause (state=%r)" % warm["after"])

    check(not [e for e in errs if "favicon" not in e], "no console errors across the run")
    b.close()

for n in notes:
    print("  " + n)
print("\n%d passed, %d failed" % (len([n for n in notes if n.startswith("PASS")]),
                                  len([n for n in notes if n.startswith("FAIL")])))
raise SystemExit(0 if ok else 1)
