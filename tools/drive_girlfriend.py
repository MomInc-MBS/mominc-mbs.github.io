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
import functools, json, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join("D:\\", "MBS Pages")

# copied verbatim from check_play.py:72 rather than reinvented: refusing WebGL by returning null from
# getContext for /webgl/i is how every gate in this repo reaches a channel's flat path, and a second,
# subtly different probe here would be testing a fallback nothing else measures.
NO_WEBGL = """(() => { const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()"""


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
    pg.wait_for_timeout(3200)          # the sixth pour's tween chain still has to put the goo on the belt
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
    c.close()

    # ================================================================================================
    # 3.3 packet 2. Everything below was added with C072/C073/C074 and drives what those changed.
    # ================================================================================================

    def fresh(no_webgl=False, seed=None, query=""):
        """A context per case. This channel persists to its own key and every case below is ABOUT
        that key, so a shared context would carry one case's save file into the next one's premise."""
        cc = b.new_context(viewport={"width": 1280, "height": 900})
        if no_webgl:
            cc.add_init_script(NO_WEBGL)
        if seed is not None:
            # written from an init script rather than after goto: the channel reads the key during mount,
            # so a value set afterwards would only be seen by a reload we did not ask for. Guarded on
            # emptiness because an init script runs on EVERY navigation - an unguarded one would put the
            # seed back over the channel's own save on the reloads below, which are the point.
            cc.add_init_script("try { if (!localStorage.getItem('mbs-dg-line')) "
                               "localStorage.setItem('mbs-dg-line', %s); } catch (e) {}"
                               % json.dumps(seed))
        p = cc.new_page()
        p.goto(BASE + "/play/girlfriend/" + query, wait_until="load")
        return cc, p

    # ---- 9. C072: the reachable dead end. The saved file used to be `{poured:[...]}` and nothing else,
    # and phase only advanced to "mould" inside the SIXTH pour's animation callback - ~2.3s after that
    # save was written. Reload in that window and every tube came back poured (so no tube would pour)
    # while phase was still "pour" (so the mould refused). This is that exact file, and the assertion is
    # that the line now comes back with somewhere to go.
    print("\n  -- C072: a complete line restores to a phase that can be acted on")
    c9, p9 = fresh(seed='{"poured":[0,1,2,3,4,5]}')
    p9.wait_for_timeout(5000)
    ph = p9.evaluate("() => window.__dg.phase")
    check(ph == "mould", "a v1 save with all six poured restores to 'mould', not the dead end (%r)" % ph)
    check(p9.evaluate("() => window.__dg.lastVariant") is not None,
          "and it has a material to reveal (%s)" % p9.evaluate("() => window.__dg.lastVariant"))
    p9.wait_for_timeout(900)
    p9.evaluate("() => window.__dg.mould()")
    p9.wait_for_function("() => window.__dg.phase === 'pack'", timeout=15000)
    check(True, "and moulding it from there works - the next action is real, not just a label")

    # the same file with the phase written in: v2 saves it, and it has to survive the trip
    p9.reload(wait_until="load")
    p9.wait_for_timeout(5000)
    ph = p9.evaluate("() => window.__dg.phase")
    check(ph == "pack", "reloading after FORMING comes back at 'pack' with the unit out (%r)" % ph)
    p9.evaluate("() => window.__dg.pack()")
    p9.wait_for_function("() => window.__dg.phase === 'grab'", timeout=25000)
    saved = p9.evaluate("() => JSON.parse(localStorage.getItem('mbs-dg-line'))")
    check(saved.get("phase") == "grab" and saved.get("v") == 2,
          "reloading after BOXING has a phase to come back to (%r)" % saved)
    c9.close()

    # ---- 10. C073: the same sequence with no WebGL at all. Until this packet the flat page was prose
    # and an ordered list: no buttons, no save, no restore, no goggles - because the state machine lived
    # inside the three.js import, which is reached only after the glOK return, and the goggles overlay is
    # markup inside .dg-track, which .dg.flat hides outright.
    print("\n  -- C073: the flat station runs the line without WebGL")
    c10, p10 = fresh(no_webgl=True)
    p10.wait_for_timeout(1500)
    check(p10.evaluate("() => !!document.querySelector('.dg.flat')"), "WebGL refused, so the flat page is up")
    check(p10.evaluate("() => !!(window.__dg && window.__dg.flat)"), "and the flat station published its probe")
    nbtn = p10.locator("#dgFlatTubes button").count()
    check(nbtn == 6, "six tube buttons, built from the same TUBES array the room uses (%d)" % nbtn)
    # poured deliberately OUT of scene order. v1 saved `tubes.filter(poured).map(idx)` - a set in scene
    # order - so a restored batch replayed the mix in the wrong sequence and could reveal a different
    # material than the one that was earned. The LAST index decides the material, so order is the fix.
    ORDER = [3, 1, 5, 0, 4, 2]
    for i in ORDER:
        p10.locator("#dgFlatTubes button").nth(i).click()
    ph = p10.evaluate("() => window.__dg.phase")
    check(ph == "mould", "six real clicks pour the line and it advances (%r)" % ph)
    check(p10.evaluate("() => window.__dg.order") == ORDER,
          "and the save carries the POUR order, not scene order (%r)" % p10.evaluate("() => window.__dg.order"))
    check(p10.evaluate("() => window.__dg.lastVariant") == "newsprint",
          "so the material is the last tube's, not the last index's (%s)" % p10.evaluate("() => window.__dg.lastVariant"))
    p10.click("#dgFlatMould")
    check(p10.evaluate("() => window.__dg.phase") == "pack", "the mould button forms the unit")
    revealed = p10.evaluate("() => document.querySelector('#dgFlatUnit').textContent")
    check("MYR5" in revealed and "INTERIM" in revealed,
          "and the batch's material is revealed with its interim number (%r)" % revealed[:34])
    p10.click("#dgFlatPack")
    check(p10.evaluate("() => window.__dg.phase") == "grab", "the box button ships it")
    p10.click("#dgFlatGog")
    check(p10.evaluate("() => window.__dg.phase") == "goggles", "and the goggles can be picked up")
    # the overlay is markup inside the hidden .dg-track: if it was not reparented it renders at 0x0
    box = p10.locator("#dgVis").bounding_box()
    check(bool(box) and box["height"] > 200,
          "the goggles overlay is actually ON SCREEN, not inside the hidden track (%s)"
          % (("%.0fx%.0f" % (box["width"], box["height"])) if box else "no box"))
    p10.click("#dgVisX")
    check(not p10.evaluate("() => document.querySelector('#dgVis').classList.contains('on')"),
          "and 'Take them off' closes it here too")
    # the save file is the same file, written by the same machine
    p10.reload(wait_until="load")
    p10.wait_for_timeout(1500)
    check(p10.evaluate("() => window.__dg.phase") == "goggles",
          "the flat station restores from the same key the room writes")
    c10.close()

    # ---- 11. C074: the hints, READ BACK OFF THE RENDERED OVERLAY rather than out of girlfriend.js, and
    # cross-checked against the network manifest the page itself is holding. That is the packet-1 rule:
    # a record and what the visitor is shown drifting apart is the failure, so the source is not the
    # witness. Flat route, because it needs no CDN and reaches the same dressGoggles().
    print("\n  -- C074: every hint refers to something in this build")
    c11, p11 = fresh(no_webgl=True, query="?mode=live")
    p11.wait_for_timeout(1500)
    check(p11.evaluate("() => !!(window.MBS && window.MBS.isLive)"), "on-air, so the goggles say something")
    rows = p11.evaluate("""() => [...document.querySelectorAll('#dgVisBody li')].map(li => ({
        ch: li.querySelector('b').textContent,
        hint: li.querySelector('span').childNodes[0].textContent,
        checked: (li.querySelector('span u') || {}).textContent || "" }))""")
    check(len(rows) == 7, "seven channels are named in the overlay (%d)" % len(rows))
    check(all(r["checked"].strip() for r in rows),
          "and every one prints what it was checked against, on screen")
    ver = p11.evaluate("() => (document.querySelector('#dgVisVer') || {}).textContent || ''")
    check("dg-hints-1.0" in ver and "2026-09-07" in ver,
          "the list carries its own version and snapshot (%r)" % ver[:40])

    # the three retired claims, by their own words. Each described a mechanic this build does not have.
    body = p11.evaluate("() => document.querySelector('#dgVisBody').textContent")
    for stale in ["eighth is dinner", "Nothing to solve here yet", "on the third",
                  "further down you go"]:
        check(stale not in body, "the stale claim %r is gone from the overlay" % stale)

    # on-air status is NOT stored in the record: it is read from the manifest, so a promotion corrects
    # its own line. Cross-check every rendered row against what the page's own manifest says.
    manifest = p11.evaluate("""() => Object.fromEntries(
        (window.MBS_CHANNELS.channels || []).map(c => [c.id, !c.comingSoon]))""")
    ids = {"DJ Scratch": "djscratch", "Sag Sniffer": "sag", "Lil Boyfriend": "lilboyfriend",
           "Coach Armie": "armie", "MBS Fuel": "fuel", "Cortisol Corgi": "corgi",
           "MOM Inc": "mominc"}
    drift = []
    for r in rows:
        on_air = manifest.get(ids.get(r["ch"], ""), None)
        says_off = "Not on air yet" in r["hint"]
        if on_air is None or says_off == on_air:
            drift.append((r["ch"], on_air, says_off))
    check(not drift, "every row's on-air line matches the manifest the page is holding (%s)" % (drift or "no drift"))
    check(sum(1 for r in rows if "Not on air yet" in r["hint"]) == 2,
          "sag and armie are the two coming_soon channels and both say so")
    c11.close()
    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
