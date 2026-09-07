"""Photograph CH 9 (girlfriend) in the television and on its play route, at 1440 and 390.

WHY A SCRIPT AND NOT A GATE, unchanged from tools/shot_fuel.py and tools/shot_lilboyfriend.py and
worth repeating: a lost or never-created WebGL context is invisible to every tally in this repo. The
scene simply is not there, no exception is thrown, and a green gate says nothing about it. Four of the
defects found in this programme were found by looking at the output while a gate was green. So a WebGL
conversion is photographed on both paths and both widths, before and after, and the pictures compared.

Run it once with the packet applied and once with it stashed, into different --tag directories.

  python tools/shot_girlfriend.py --tag before
  python tools/shot_girlfriend.py --tag after

WHAT TO LOOK AT, because this channel photographs differently from the other two. The camera NEVER
moves here: what it sees is one fixed room - the back wall hung with five MOM Inc posters, a conveyor
running the full width in front of it, six labelled paper tube cards standing on the belt to the left
of a glass beaker, and Dr Girlfriend herself as one large flat photograph behind the line. Six DOM
labels float over the tubes, staggered high/low so they do not collide. If the shot is BLACK the
renderer came up and drew nothing; if it is the flat page (a heading and a numbered list of the five
stages) the WebGL path was never taken at all. Both are silent failures that no assertion in this repo
would notice, and both are obvious here.

THE FRAMING SPLITS BY SHAPE, which is why both widths matter and not just as a crop check: resize()
reads w/h and moves the camera in on a narrow viewport (z 11.4 -> 8.0, look 2.7 -> 3.2) so she fills a
phone rather than the line being cropped to one tube. The 390 shot should be a CLOSER framing, not the
1440 shot with the sides cut off. A 390 that is merely cropped means resize() did not run - which is
what a ResizeObserver registered through ctx but never observed would look like.

THE STATE IS PERSISTED: this channel saves the poured tubes to its own key (mbs-dg-line), so a second
run in the same browser profile does not start with six full tubes. A NEW CONTEXT PER VIEWPORT gives a
clean profile as well as a clean viewport - page.set_viewport_size fails in this chromium and a CDP
Emulation.setDeviceMetricsOverride does not survive a navigation, so a new context was already the only
way to change width.

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
# `flat` is the channel's own statement that it did NOT take the 3D path, and a canvas with a real
# backing-store size is the renderer's statement that it sized itself to the stage rather than nothing.
# `labels` counts the projected DOM labels, which is the half of this channel that is not on the canvas
# at all: seven of them exist (six tubes and the reveal card) and the six tube labels should be shown.
STATE = """() => ({
    flat: !!document.querySelector('.dg.flat'),
    scripts: document.querySelectorAll('#channel script').length,
    mounted: !!(window.MBS_CH && window.MBS_CH.current()),
    canvas: (() => { const c = document.querySelector('#dgCanvas');
                     return c ? c.width + 'x' + c.height : 'none'; })(),
    stage: (() => { const s = document.querySelector('#dgStage');
                    return s ? Math.round(s.clientWidth) + 'x' + Math.round(s.clientHeight) : 'none'; })(),
    labels: document.querySelectorAll('.dg-lab').length,
    shown: document.querySelectorAll('.dg-lab.show').length,
    phase: (() => { try { return window.__dg.phase; } catch (e) { return 'n/a'; } })(),
    poured: (() => { try { return window.__dg.poured; } catch (e) { return -1; } })() })"""


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
        pg.goto(BASE + "/tv/?ch=girlfriend", wait_until="load")
        pg.wait_for_timeout(1200)
        try:
            if pg.evaluate("() => !document.querySelector('.tv.on')"):
                pg.click(".power")
        except Exception:
            pass
        # her photograph, the poster sticker and six MYR5 stills are all loaded rather than generated,
        # and the room is not worth photographing until they land
        pg.wait_for_timeout(5000)
        print("tv %s: %s" % (label, pg.evaluate(STATE)))
        shot(pg, "tv-girlfriend-%s" % label)
        c.close()

        # the play route, which takes the isolation pass through beforeMount. roots is ["#dgTrack",
        # ".dg-flat"] (tv/registry.json), so the line should be the whole page with nothing around it.
        c = b.new_context(viewport=vp)
        pg = c.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/play/girlfriend/", wait_until="load")
        pg.wait_for_timeout(5500)
        pstate = pg.evaluate(STATE)
        pstate["hidden"] = pg.evaluate("() => document.querySelectorAll('.mbs-off').length")
        print("play %s: %s" % (label, pstate))
        shot(pg, "play-girlfriend-%s" % label)
        c.close()

        if errs:
            print("  uncaught page errors:", errs[:4])
    b.close()
