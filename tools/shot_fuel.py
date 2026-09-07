"""Photograph CH 7 (fuel) in the television and on its play route, at 1440 and 390.

WHY A SCRIPT AND NOT A GATE. Packet 11 converts a WebGL channel, and a lost or never-created WebGL
context is invisible to every tally in this repo: the scene simply is not there, no exception is
thrown, and a green gate says nothing about it. Four of the defects found in this programme were
found by looking at the output rather than at the assertions. So the conversion has to be
photographed on both paths and both widths, before and after, and the pictures compared.

Run it once with the packet applied and once with it stashed, into different --tag directories.

  python tools/shot_fuel.py --tag after
  python tools/shot_fuel.py --tag before

A NEW CONTEXT PER VIEWPORT, never page.set_viewport_size: that call fails in this chromium, and a CDP
Emulation.setDeviceMetricsOverride does not survive a navigation. Written down in the handoff, learned
the hard way, not re-derived here.

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
        pg.goto(BASE + "/tv/?ch=fuel", wait_until="load")
        pg.wait_for_timeout(1200)
        # power on if the set is off, then let the tub build and turn a little
        try:
            if pg.evaluate("() => !document.querySelector('.tv.on')"):
                pg.click(".power")
        except Exception:
            pass
        pg.wait_for_timeout(4000)
        state = pg.evaluate("""() => ({
            has3d: !!document.querySelector('#fu.has3d'),
            scripts: document.querySelectorAll('#channel script').length,
            mounted: !!(window.MBS_CH && window.MBS_CH.current()),
            canvas: (() => { const c = document.querySelector('#fuCanvas');
                             return c ? c.width + 'x' + c.height : 'none'; })() })""")
        print("tv %s: %s" % (label, state))
        shot(pg, "tv-fuel-%s" % label)
        c.close()

        # the play route, which takes the isolation pass through beforeMount
        c = b.new_context(viewport=vp)
        pg = c.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/play/fuel/", wait_until="load")
        pg.wait_for_timeout(4500)
        pstate = pg.evaluate("""() => ({
            has3d: !!document.querySelector('#fu.has3d'),
            scripts: document.querySelectorAll('#channel script').length,
            hidden: document.querySelectorAll('.mbs-off').length,
            canvas: (() => { const c = document.querySelector('#fuCanvas');
                             return c ? c.width + 'x' + c.height : 'none'; })() })""")
        print("play %s: %s" % (label, pstate))
        shot(pg, "play-fuel-%s" % label)
        c.close()

        if errs:
            print("  uncaught page errors:", errs[:4])
    b.close()
