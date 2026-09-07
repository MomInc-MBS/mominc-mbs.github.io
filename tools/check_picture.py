# -*- coding: utf-8 -*-
"""The picture gate (PLAN-r9 Stage 2, micro-step 2.22 / C003).

2.22's acceptance is "Control present; the setting survives reload." Both halves are cheap to fake:
a button that exists but drives nothing passes "present", and a default that happens to match the
stored value passes "survives reload" without ever reading storage. So this gate never asserts a
constant it could have read off the stylesheet - it asserts the RELATION:

  * the two knobs really drive the two layers (move --scanline-opacity/--glass-distortion by hand and
    the phosphor and the glare follow), so the control is wired to the picture rather than to a class
    somebody else has to honour;
  * BOTH settings survive a reload, clear AND crt, which is the half a default can't fake: if the
    stored value were being ignored, one of the two directions would come back wrong;
  * the untouched set still renders at opacity 1, i.e. adding the control changed nothing for a
    visitor who never presses it.

Run:  python tools/check_picture.py     (serves the repo itself; nothing else need be running)
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


OPACITY = """() => ({
    attr:  document.getElementById('tv').dataset.picture || '',
    scan:  +getComputedStyle(document.querySelector('.phosphor')).opacity,
    glare: +getComputedStyle(document.querySelector('.glare')).opacity,
    pressed: document.getElementById('pictureBtn').getAttribute('aria-pressed'),
    legend:  document.getElementById('pictureLegend').textContent.trim(),
    label:   document.getElementById('pictureBtn').getAttribute('aria-label') || '',
})"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context()
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(200)

    print("== the control is present and reachable")
    btn = pg.locator("#pictureBtn")
    check(btn.count() == 1, "#pictureBtn exists exactly once")
    check(btn.is_visible(), "the picture key is visible on the panel (not a hidden drawer)")
    check(pg.locator("#pictureKey").count() == 1, "#pictureKey wraps it, so game mode can hide it")

    base = pg.evaluate(OPACITY)
    check(base["attr"] == "", "a fresh visitor gets no data-picture at all")
    check(base["scan"] == 1 and base["glare"] == 1,
          "the untouched set is unchanged: phosphor and glare both at opacity 1 (got %s / %s)"
          % (base["scan"], base["glare"]))
    check(base["pressed"] == "false", "aria-pressed starts false")
    check(base["label"] != "", "the key carries an aria-label")

    print("== the two knobs actually drive the two layers")
    # Not "does the class exist" - move each variable by hand and watch the layer follow. This is what
    # separates a wired control from a button that toggles an attribute nothing reads.
    wired = pg.evaluate("""() => {
        const tv = document.getElementById('tv');
        const ph = document.querySelector('.phosphor'), gl = document.querySelector('.glare');
        tv.style.setProperty('--scanline-opacity', '0.4');
        tv.style.setProperty('--glass-distortion', '0.2');
        const a = { scan: +getComputedStyle(ph).opacity, glare: +getComputedStyle(gl).opacity };
        tv.style.removeProperty('--scanline-opacity');
        tv.style.removeProperty('--glass-distortion');
        const b = { scan: +getComputedStyle(ph).opacity, glare: +getComputedStyle(gl).opacity };
        return { a, b };
    }""")
    check(abs(wired["a"]["scan"] - 0.4) < 0.01, "--scanline-opacity drives .phosphor (got %s)" % wired["a"]["scan"])
    check(abs(wired["a"]["glare"] - 0.2) < 0.01, "--glass-distortion drives .glare (got %s)" % wired["a"]["glare"])
    check(wired["b"]["scan"] == 1 and wired["b"]["glare"] == 1, "removing the overrides restores the default")

    print("== pressing the key clears the picture")
    btn.click()
    clear = pg.evaluate(OPACITY)
    check(clear["attr"] == "clear", 'the key sets data-picture="clear"')
    check(clear["scan"] < base["scan"], "scanlines are lighter than they were (%s < %s)" % (clear["scan"], base["scan"]))
    check(clear["glare"] < base["glare"], "glare is lighter than it was (%s < %s)" % (clear["glare"], base["glare"]))
    check(clear["scan"] > 0 and clear["glare"] > 0, "both are a trace, not off - a blank tube reads as broken")
    check(clear["pressed"] == "true", "aria-pressed follows the state")
    check(clear["legend"] != base["legend"], "the legend names the next action, as GAME/EXIT does")

    print("== the setting survives a reload - in BOTH directions")
    pg.reload(wait_until="load"); pg.wait_for_timeout(200)
    after = pg.evaluate(OPACITY)
    check(after["attr"] == "clear", "clear survives the reload")
    check(abs(after["scan"] - clear["scan"]) < 0.001 and abs(after["glare"] - clear["glare"]) < 0.001,
          "the picture comes back at the same values it was left at")
    check(after["pressed"] == "true", "the key repaints itself pressed on load, not just the CSS")

    # the direction a default can't fake: switch back, reload, and it must be CRT again rather than the
    # stored "clear" reappearing (write ignored) or a stale attribute persisting (read ignored).
    pg.locator("#pictureBtn").click()
    back = pg.evaluate(OPACITY)
    check(back["attr"] == "" and back["scan"] == 1, "pressing again restores the CRT picture")
    pg.reload(wait_until="load"); pg.wait_for_timeout(200)
    back2 = pg.evaluate(OPACITY)
    check(back2["attr"] == "" and back2["scan"] == 1 and back2["pressed"] == "false",
          "crt survives the reload too (got attr=%r scan=%s)" % (back2["attr"], back2["scan"]))

    print("== a fresh visitor is unaffected by someone else's stored choice")
    ctx2 = b.new_context()
    pg2 = ctx2.new_page()
    pg2.goto(BASE + "/tv/", wait_until="load"); pg2.wait_for_timeout(150)
    fresh = pg2.evaluate(OPACITY)
    check(fresh["attr"] == "" and fresh["scan"] == 1, "a new browser context starts on the CRT picture")
    ctx2.close()

    print("== game mode")
    # F.1/S1 already strips the phosphor and the glare in game mode, so the key would control nothing.
    hidden = pg.evaluate("""() => {
        const tv = document.getElementById('tv');
        tv.dataset.mode = 'game';
        const d = getComputedStyle(document.getElementById('pictureKey')).display;
        delete tv.dataset.mode;
        return { d, back: getComputedStyle(document.getElementById('pictureKey')).display };
    }""")
    check(hidden["d"] == "none", "the picture key is hidden in game mode (got %r)" % hidden["d"])
    check(hidden["back"] != "none", "and comes back when game mode ends")

    check(not errs, "no console errors (%s)" % (errs[:3] or "none"))
    b.close()

print()
for n in notes:
    print(n)
p = sum(1 for n in notes if n.startswith("PASS"))
print("\n%s  %d/%d" % ("PASS" if ok else "FAIL", p, len(notes)))
raise SystemExit(0 if ok else 1)
