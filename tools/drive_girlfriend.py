"""Drive girlfriend's 3D production line: the half no gate touches.

check_play holds this channel as a PROBED route rather than a playthrough - it forces WebGL off and
asserts the flat page renders, because the channel deliberately calls no unlock at all - and
check_teardown only mounts and unmounts. So nothing in this repo has ever pressed a key or landed a
click inside the room itself, and packet 13 rewired every listener in it: the canvas click and its
raycast, the canvas keydown, the goggles' dismiss button, the stage's pointermove, and a scroll
listener bound to the SHELL's scroll container rather than to anything this channel owns.

A LISTENER THAT SILENTLY NEVER FIRES WOULD PASS EVERY ASSERTION IN THIS REPO AND PHOTOGRAPH
IDENTICALLY. That is the whole reason this file exists (tools/drive_lilboyfriend.py made the same
argument for the museum, and it is the fifth class of defect this programme has had to go looking for).

Two of the five are invisible even to a photograph, because they sit at rest in a still: the belt only
travels while the shell is scrolled, and the camera only leans while a pointer is over the stage. The
channel's own window.__dg probe hook carries a readback for each - beltX and camX - added for exactly
this, alongside the pour/mould/pack drivers that were already there.

WHAT IS DRIVEN THROUGH REAL INPUT, and what is not. Steps 1-5 and 7-8 use a real click, a real key or
a real pointer, because the listener IS the thing under test. The middle of the line (pouring the
remaining four tubes, moulding, packing) is driven through __dg, because getting to the goggles any
other way means six more pixel-hunted clicks and about twenty seconds of animation to reach the one
branch that matters - and the click path has already been proved by then.

WHAT IS NOT COVERED HERE: the ResizeObserver. resize() also runs once directly at mount, so a canvas
with a sane backing-store size proves the function ran, not that the observer is attached. What proves
the observer is tools/shot_girlfriend.py's two widths: the 390 shot must be a CLOSER framing than the
1440 one rather than the same framing cropped.
"""
import functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join("D:\\", "MBS Pages")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok = True


def check(cond, msg):
    global ok
    ok &= bool(cond)
    print("  %s %s" % ("PASS" if cond else "FAIL", msg))


with sync_playwright() as pw:
    b = pw.chromium.launch()
    # a fresh context, because this channel persists its poured tubes to its own key (mbs-dg-line) and
    # a second run in a dirty profile would start with the line half done
    c = b.new_context(viewport={"width": 1280, "height": 900})
    pg = c.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "/play/girlfriend/", wait_until="load")
    pg.wait_for_timeout(5000)

    dg = lambda k: pg.evaluate("() => window.__dg.%s" % k)
    check(pg.evaluate("() => !!(window.__dg && window.__dg.jawsExist)"), "the 3D path was taken")
    check(not pg.evaluate("() => !!document.querySelector('.dg.flat')"),
          "and it is NOT showing the flat fallback")

    # ---- 1. the canvas click and its raycast, which is the listener the whole channel is played through
    # The tube's own DOM label is projected from the tube's world position every frame and anchored at
    # its bottom-centre, so the label gives the tube's screen X exactly. It does not give its Y: the
    # anchor sits `lift` world units above the tube and lift is staggered 0.72/1.38 so six labels do not
    # collide. Rather than convert world units to pixels - which would bake this run's camera distance
    # into the test - walk down from the anchor until the pour actually starts. The card is the only
    # thing under that column, so the first hit is the right one, and a scan that finds nothing is a
    # dead listener, which is the answer this file exists to get.
    lab = pg.locator(".dg-lab.show").first.bounding_box()
    before = dg("poured")
    hit = None
    for dy in range(10, 240, 15):
        pg.mouse.click(lab["x"] + lab["width"] / 2, lab["y"] + lab["height"] + dy)
        pg.wait_for_timeout(120)
        if dg("poured") > before:
            hit = dy
            break
    check(hit is not None, "a real click on a tube pours it (%s)"
          % ("hit %dpx below the label" % hit if hit else "no hit anywhere down the column"))
    pg.wait_for_timeout(2600)          # the pour is a four-stage tween, ~2.3s; let it land

    # ---- 2. the canvas keydown: focus, then Enter on the first keyboard candidate
    pg.evaluate("() => document.querySelector('#dgCanvas').focus()")
    before = dg("poured")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    check(dg("poured") > before, "and Enter on the focused canvas pours the next one (%d -> %d)"
          % (before, dg("poured")))

    # ---- 3. the arrow keys, which move the keyboard focus and say so in the nudge line
    pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(150)
    said = pg.evaluate("() => document.querySelector('#dgNudge').textContent")
    check(said.startswith("Keyboard:"), "and an arrow key moves the keyboard focus (%r)" % said[:44])
    pg.wait_for_timeout(2600)

    # ---- 4. the scroll listener - the one bound to the SHELL's scroll container rather than to
    # anything this channel owns, which is what makes it the likeliest to be left bound to a dead
    # closure and the hardest to notice. SCROLL THE ELEMENT THE CHANNEL READS, not the window: #screen
    # is present on the play route as well as in the television, the document itself does not scroll
    # there (scrollHeight == clientHeight), and a window scroll moves nothing at all. Getting that
    # wrong reported a dead listener on a live one the first time this file ran.
    belt0 = dg("beltX")
    reach = """(to) => { const s = document.getElementById('screen') || document.scrollingElement;
                         s.scrollTop = to === 'end' ? s.scrollHeight : 0;
                         return { top: s.scrollTop, max: s.scrollHeight - s.clientHeight }; }"""
    moved = pg.evaluate(reach, "end")
    check(moved["max"] > 0, "the shell's scroll container has somewhere to go (%d px)" % moved["max"])
    pg.wait_for_timeout(900)           # the belt eases toward its target at 0.08/frame
    belt1 = dg("beltX")
    check(belt1 < belt0 - 0.1, "scrolling pushes the BELT along (beltX %.3f -> %.3f)" % (belt0, belt1))
    pg.evaluate(reach, "home")
    pg.wait_for_timeout(900)
    check(dg("beltX") > belt1, "and scrolling back brings it home (%.3f)" % dg("beltX"))

    # ---- 5. the stage pointermove, which leans the camera. At rest ptrX is 0 and the camera sits at
    # camBaseX, so this is invisible in any screenshot - the reason for the readback.
    stage = pg.locator("#dgStage").bounding_box()
    cam0 = dg("camX")
    pg.mouse.move(stage["x"] + stage["width"] * 0.92, stage["y"] + stage["height"] * 0.5)
    pg.wait_for_timeout(900)           # ptrX eases at 0.06/frame
    cam1 = dg("camX")
    check(cam1 > cam0 + 0.05, "a pointer over the stage leans the camera (camX %.3f -> %.3f)" % (cam0, cam1))

    # ---- 6. to the goggles. The click path is proved; the rest of the line is driven directly rather
    # than pixel-hunted, which is what the probe hook has always been for.
    while dg("poured") < 6:
        pg.evaluate("""() => { for (let i = 0; i < 6; i++) window.__dg.pour(i); }""")
        pg.wait_for_timeout(2600)
    pg.wait_for_function("() => window.__dg.phase === 'mould'", timeout=15000)
    check(dg("lastVariant") is not None, "six tubes in, and the batch has a material (%s)" % dg("lastVariant"))
    pg.evaluate("() => window.__dg.mould()")
    pg.wait_for_function("() => window.__dg.phase === 'pack'", timeout=15000)
    pg.evaluate("() => window.__dg.pack()")
    # ~5.7s of drone: in, lift, out, then the goggles appear and a 3.9s window opens
    pg.wait_for_function("() => window.__dg.phase === 'grab'", timeout=20000)

    # ---- 7. the goggles branch, through the real keydown. At this phase the goggles are the only
    # keyboard candidate: every tube is poured and the blob, unit and box are all invisible.
    pg.evaluate("() => document.querySelector('#dgCanvas').focus()")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    took = dg("phase") == "goggles"
    check(took, "grabbing the goggles before the drone does opens them (phase %r)" % dg("phase"))
    check(pg.evaluate("() => document.querySelector('#dgVis').classList.contains('on')"),
          "and the overlay is on")
    # the goggles are MODE-AWARE and this route is off-air, so they must give nothing away
    body = pg.evaluate("() => document.querySelector('#dgVisBody').textContent")
    check("COME BACK DURING THE STREAM" in body,
          "and off-air they say to come back rather than hinting (%r)" % body[:38])

    # ---- 8. the dismiss button, the one listener not on the canvas
    pg.click("#dgVisX")
    pg.wait_for_timeout(200)
    check(not pg.evaluate("() => document.querySelector('#dgVis').classList.contains('on')"),
          "and 'Take them off' closes it")

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across the drive (%s)" % (clean[:2] or "none"))
    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
