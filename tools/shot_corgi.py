"""Photograph CH 6 (corgi) in the television and on its play route, at 1440 and 390.

WHY A SCRIPT AND NOT A GATE, unchanged from shot_fuel.py, shot_lilboyfriend.py and shot_girlfriend.py:
a lost or never-created WebGL context is invisible to every tally in this repo. The scene simply is not
there, no exception is thrown, and a green gate says nothing about it. Five of the defects found in this
programme were found by looking at the output while a gate was green.

  python tools/shot_corgi.py --tag before
  python tools/shot_corgi.py --tag after

WHAT TO LOOK AT. This is a first-person hunt at DOG HEIGHT (eye 0.38 units), so the shot is a corridor
seen from just above the floor: cheerful primary-colour school walls with a yellow rail and a blue
skirting, a checked floor running away, ceiling lights down the middle, and the HUD over it - CORTISOL
meter across the top, PAGES tally, a timecode, FLASHLIGHT and SPRINT buttons with their own fill bars,
and the joystick ring. The whole thing sits under a VHS treatment (grain, scanlines, an olive cast and
a vignette), which is the channel's signature and must survive the conversion. If the shot is BLACK the
renderer came up and drew nothing; if it is a column of room BUTTONS the fallback room-picker ran and
the WebGL path was never taken. Both are silent failures no assertion in this repo would notice.

MODE CHANGES WHAT IS PHOTOGRAPHED, and it is not a bug. Off-air (the default on both routes here) this
is THE OFFICE: brighter hemisphere and corridor lights, a "CCTV 04" corner instead of "REC", pale
office palettes, and a suited figure who talks instead of killing. Live is the school. Both runs below
are off-air, so before and after are comparable to each other, which is all this script is for.

THE VIEWPORT IS MEASURED, NOT CALC'D (see fitViewport and the .cc-viewport CSS comment): it is sized in
JS against .glass's own height. In the television that means a real measurement; on a play route there
is no .glass at all and the stage keeps its CSS height. So the two routes are EXPECTED to differ in
viewport height, and what must match is before-vs-after on the SAME route, never tv-vs-play.

THE STATE IS PERSISTED under mbs-corgi-school-v2, partitioned by mode, so a second run in the same
profile can resume mid-level. A NEW CONTEXT PER VIEWPORT gives a clean profile as well as a clean
width - page.set_viewport_size fails in this chromium and a CDP metrics override does not survive a
navigation, so a new context was already the only way to change width.

Shots land in tools/shots/, which is gitignored - they regenerate, they are never committed.
"""
import argparse, functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "tools", "shots")

ap = argparse.ArgumentParser()
ap.add_argument("--tag", default="now", help="prefix for the filenames, e.g. before / after")
args = ap.parse_args()


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

VIEWS = [("1440", {"width": 1440, "height": 900}), ("390", {"width": 390, "height": 844})]
os.makedirs(OUT, exist_ok=True)

# What the picture is of, in numbers, so the two runs can be compared without eyeballing pixels.
# `fallback` is the channel's own statement that it did NOT take the 3D path; `desks` and `level` come
# off its probe hook and are the scene's statement that a level actually got built.
STATE = """() => ({
    fallback: !!(document.querySelector('#ccFallback') && !document.querySelector('#ccFallback').hidden),
    scripts: document.querySelectorAll('#channel script').length,
    mounted: !!(window.MBS_CH && window.MBS_CH.current()),
    mode: (document.querySelector('#cc') || {}).dataset ? document.querySelector('#cc').dataset.mode : 'none',
    view: (document.querySelector('#cc') || {}).dataset ? document.querySelector('#cc').dataset.view : 'none',
    canvas: (() => { const c = document.querySelector('#ccCanvas');
                     return c ? c.width + 'x' + c.height : 'none'; })(),
    viewport: (() => { const v = document.querySelector('#ccViewport');
                       return v ? Math.round(v.clientWidth) + 'x' + Math.round(v.clientHeight) : 'none'; })(),
    tally: (document.querySelector('#ccTally') || {}).textContent || 'none',
    desks: (() => { try { return window.__corgi.desks; } catch (e) { return -1; } })(),
    level: (() => { try { return window.__corgi.level; } catch (e) { return -1; } })() })"""


def shot(page, name):
    p = os.path.join(OUT, "%s-%s.png" % (args.tag, name))
    page.screenshot(path=p)
    print("  wrote", os.path.relpath(p, ROOT))


with sync_playwright() as pw:
    b = pw.chromium.launch()
    for label, vp in VIEWS:
        # the television. The set REMEMBERS being on (mbs-state persists across pages in one browser
        # context), so a fresh context per viewport also means the power state is known, not inherited.
        c = b.new_context(viewport=vp)
        pg = c.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/tv/?ch=corgi", wait_until="load")
        pg.wait_for_timeout(1200)
        try:
            if pg.evaluate("() => !document.querySelector('.tv.on')"):
                pg.click(".power")
        except Exception:
            pass
        # every texture here is canvas-generated rather than loaded, but there are a lot of them (a
        # corridor's worth of wall clones, three area grains, newsprint for the monster, one prop map
        # per desk) and the whole level is built before the first frame
        pg.wait_for_timeout(5000)
        print("tv %s: %s" % (label, pg.evaluate(STATE)))
        shot(pg, "tv-corgi-%s" % label)
        c.close()

        # the play route, which takes the isolation pass through beforeMount.
        c = b.new_context(viewport=vp)
        pg = c.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/play/corgi/", wait_until="load")
        pg.wait_for_timeout(5500)
        pstate = pg.evaluate(STATE)
        pstate["hidden"] = pg.evaluate("() => document.querySelectorAll('.mbs-off').length")
        print("play %s: %s" % (label, pstate))
        shot(pg, "play-corgi-%s" % label)
        c.close()

        if errs:
            print("  uncaught page errors:", errs[:4])
    b.close()
