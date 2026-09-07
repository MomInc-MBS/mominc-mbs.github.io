"""Photograph CH 2 (lilboyfriend) in the television and on its play route, at 1440 and 390.

WHY A SCRIPT AND NOT A GATE, unchanged from tools/shot_fuel.py and worth repeating: a lost or
never-created WebGL context is invisible to every tally in this repo. The scene simply is not there,
no exception is thrown, and a green gate says nothing about it. Four of the defects found in this
programme were found by looking at the output while a gate was green. So a WebGL conversion is
photographed on both paths and both widths, before and after, and the pictures are compared.

Run it once with the packet applied and once with it stashed, into different --tag directories.

  python tools/shot_lilboyfriend.py --tag before
  python tools/shot_lilboyfriend.py --tag after

WHAT TO LOOK AT, because this channel photographs differently from fuel. The museum is a first-person
hall: what the camera sees on arrival is the entrance end, the title plaque on one wall, the guest
book lectern on the other, and the hall running away into fog with a warm beacon at the far door. If
the shot is BLACK the renderer came up and drew nothing; if it is the flat gallery (a column of cards)
the WebGL path was never taken at all. Both are silent failures that no assertion in this repo would
notice, and both are obvious here.

THE STATE IS PERSISTED, which matters more here than it did for fuel: the museum saves its phase and
path position to localStorage (mbs-lilbf-museum-v2), so a second run in the same browser profile does
not start at the entrance. A NEW CONTEXT PER VIEWPORT gives a clean profile as well as a clean
viewport - page.set_viewport_size fails in this chromium and a CDP Emulation.setDeviceMetricsOverride
does not survive a navigation, so a new context was already the only way to change width.

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

# What the picture is of, in numbers, so the two runs can be compared without eyeballing pixel counts.
# .webgl is the channel's own statement that it took the 3D path; a canvas with a real backing-store
# size is the renderer's statement that it sized itself to the stage rather than to nothing.
STATE = """() => ({
    webgl: !!document.querySelector('#lb.webgl'),
    flat: !!document.querySelector('#lbFlat'),
    scripts: document.querySelectorAll('#channel script').length,
    mounted: !!(window.MBS_CH && window.MBS_CH.current()),
    canvas: (() => { const c = document.querySelector('#lbCanvas');
                     return c ? c.width + 'x' + c.height : 'none'; })(),
    stage: (() => { const s = document.querySelector('#lbStage');
                    return s ? Math.round(s.clientWidth) + 'x' + Math.round(s.clientHeight) : 'none'; })(),
    phase: (() => { try { return window.__lbState().phase; } catch (e) { return 'n/a'; } })() })"""


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
        pg.goto(BASE + "/tv/?ch=lilboyfriend", wait_until="load")
        pg.wait_for_timeout(1200)
        try:
            if pg.evaluate("() => !document.querySelector('.tv.on')"):
                pg.click(".power")
        except Exception:
            pass
        # twelve photographs (six exhibits, cozy and horror) are preloaded before the first frame, so
        # this waits longer than fuel's does: the hall is genuinely not drawn until they land
        pg.wait_for_timeout(6000)
        print("tv %s: %s" % (label, pg.evaluate(STATE)))
        shot(pg, "tv-lilboyfriend-%s" % label)
        c.close()

        # the play route, which takes the isolation pass through beforeMount. roots is ["#lbStage"]
        # (tv/registry.json), so the museum should be the whole page and the infomercial below it gone.
        c = b.new_context(viewport=vp)
        pg = c.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/play/lilboyfriend/", wait_until="load")
        pg.wait_for_timeout(6500)
        pstate = pg.evaluate(STATE)
        pstate["hidden"] = pg.evaluate("() => document.querySelectorAll('.mbs-off').length")
        print("play %s: %s" % (label, pstate))
        shot(pg, "play-lilboyfriend-%s" % label)
        c.close()

        if errs:
            print("  uncaught page errors:", errs[:4])
    b.close()
