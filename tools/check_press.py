# -*- coding: utf-8 -*-
"""The press-and-zoom gate (PLAN-r9 Stage 2 packet 7, micro-step 2.16 / C002).

Two changes, one gate, because they are the same bug seen twice: the shell was moving the picture
out from under the pointer.

  the press-scale     #screen scales on pointerdown as set dressing for the GLASS. Under a live
                      canvas, an embedded game or a control, that scale moves the target the finger
                      is already on -- a drag lands off, a button pushes itself away. The exclusion
                      is asserted by BEHAVIOUR (does #screen's transform change?), not by reading
                      the selector string back, because a selector that matches nothing would pass
                      a source check and fail a visitor.

  the retired zoom    .channel carried zoom:1.15, which put getBoundingClientRect() and clientX in
                      VISUAL px while clientWidth stayed LAYOUT px. Five files carried a /1.15 to
                      undo it and one of them got it wrong. Both halves are asserted: the zoom is
                      gone from the source, AND the pointer now lands on what it is over at three
                      viewports, AND the fitted canvas stages still fill their glass.

  THE ACCEPTANCE IS NOT `grep -c '1.15' == 0`, which is what PLAN-r9 row 2.16 says. Verified at
  403158d: 28 occurrences exist under tv/ and most are unrelated -- line-height:1.15,
  font-size:1.15em, and three.js constants (CylinderGeometry(..., 1.15, ...), PointLight(...,
  1.15, ...), UNIT_H = 1.15). Building to that acceptance would delete working geometry. The honest
  target set is the zoom declaration and the divisions that compensated it, and that is what is
  checked below, named file by file.

Run:  python tools/check_press.py     (serves the repo itself; nothing else need be running)
"""
import functools, io, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
GAME_CH = "corgi"          # a real canvas game: the press must not move it, and it must still fit


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


def read(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as fh:
        return fh.read()


# ---------------------------------------------------------------- the source half
print("== the zoom is gone from the two stylesheets that declared it")
for css in ("tv/tv.css", "tv/play.css"):
    # comments stripped first: both files now DOCUMENT the retirement, and a gate that fails on the
    # sentence explaining why the zoom is gone is a gate that gets deleted rather than obeyed.
    src = re.sub(r"/\*.*?\*/", "", read(css), flags=re.S)
    check("zoom:1.15" not in src.replace(" ", ""), "%s declares no zoom:1.15" % css)
    check(re.search(r"\.channel\s*\{[^}]*\bzoom\b", src) is None,
          "%s's .channel rule carries no zoom at all" % css)

print("== and every division that existed only to undo it")
# named individually: a blanket grep for "1.15" also hits line-height, font-size and three.js
# geometry, and a gate that fails on those teaches people to ignore it.
COMPENSATED = ["tv/channels/corgi.html", "tv/channels/goon.html",
               "tv/channels/lilboyfriend.html", "tv/channels/sag.html",
               "tv/channels/girlfriend.html", "tv/channels/fuel.html"]
for f in COMPENSATED:
    src = read(f)
    hits = re.findall(r"/\s*1\.15", src)
    check(not hits, "%s has no /1.15 compensation (%d found)" % (f, len(hits)))

# the ratio in sag's leg-drop must stay MEASURED. A future session "simplifying" it to a literal 1
# would be correct today and silently wrong the moment any ancestor scale returns.
check("sr.width / stageWrap.offsetWidth" in read("tv/channels/sag.html"),
      "sag's leg-drop ratio is still measured, not hard-coded to 1")

print("== the press-scale names the interactive descendants it steps aside for")
tvjs = read("tv/tv.js")
check("NO_PRESS" in tvjs, "tv.js defines the exclusion set")
for sel in ("canvas", "iframe", "button", "input", "select", "textarea"):
    check(re.search(r"NO_PRESS\s*=\s*\"[^\"]*\b%s\b" % sel, tvjs),
          "the exclusion set covers <%s>" % sel)

# ---------------------------------------------------------------- the behaviour half
DENY_FULLSCREEN = """
  Element.prototype.requestFullscreen = function () {
    return Promise.reject(new TypeError("denied for the gate"));
  };
"""


def power_on(pg):
    """Make sure the set is on, without toggling it off.

    The on/off state is banked in mbs-state and the gate reuses one browser context, so by the
    second page the set is ALREADY on and a blind .power click turns it off. The off-state overlay
    then sits over the glass as a sibling of #screen, and every probe below silently measures that
    instead of the channel. This cost one debugging round; it is a helper so it cannot cost another.
    """
    for _ in range(3):
        if pg.evaluate("!!document.querySelector('.tv') && document.querySelector('.tv').dataset.state === 'on'"):
            return True
        try:
            pg.click(".power", timeout=2000)
        except Exception:
            return False
        pg.wait_for_timeout(2600)
    return pg.evaluate("document.querySelector('.tv').dataset.state === 'on'")


def press_moves_screen(pg, sel):
    """Hold the pointer down on `sel` and report whether #screen's transform changed.

    The scale is driven by requestAnimationFrame, so the wait is real time, not a tick. Reads the
    inline style rather than a computed matrix: the handler sets .style.transform directly, and an
    empty string is the unambiguous "no press applied" that a computed 'none' vs 'matrix(1,...)'
    is not.
    """
    box = pg.locator(sel).first.bounding_box()
    if not box:
        return None
    pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    pg.mouse.down()
    pg.wait_for_timeout(420)
    moved = pg.evaluate("!!document.getElementById('screen').style.transform")
    pg.mouse.up()
    pg.wait_for_timeout(120)
    return moved


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script(DENY_FULLSCREEN)
    pg.goto("%s/tv/?ch=%s" % (BASE, GAME_CH), wait_until="load")
    pg.wait_for_timeout(1200)
    check(power_on(pg), "the set is on, so the press is measured against a live picture")
    pg.wait_for_timeout(2500)

    print("== and never on what is playing on it")
    check(press_moves_screen(pg, "#ccViewport canvas") is False,
          "pressing the game canvas does not move the picture")
    btn = "#gameBtn" if pg.locator("#gameBtn").count() else "button"
    check(press_moves_screen(pg, btn) is False,
          "pressing a control does not move the picture out from under it")

    print("== the pointer lands on what it is over, at three viewports")
    cdp = pg.context.new_cdp_session(pg)
    for w, h, name in ((1440, 900, "desktop"), (1024, 768, "tablet"), (390, 844, "phone")):
        cdp.send("Emulation.setDeviceMetricsOverride",
                 {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": False})
        pg.wait_for_timeout(900)
        # elementFromPoint takes VISUAL px; a bounding rect is VISUAL px. Under the old zoom these
        # agreed too -- what did NOT agree was clientWidth, which is why this also samples an
        # offsetWidth-vs-rect ratio: 1.00 is the proof the two spaces are one again.
        hit = pg.evaluate("""() => {
            const c = document.querySelector('#ccViewport canvas') ||
                      document.querySelector('#ccViewport');
            if (!c) return null;
            const r = c.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return null;
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return { on: !!(el && (el === c || c.contains(el) || el.contains(c))),
                     ratio: r.width / (c.offsetWidth || r.width) };
        }""")
        check(hit and hit["on"],
              "%-7s the point at the stage's centre hits the stage" % name)
        check(hit and abs(hit["ratio"] - 1.0) < 0.02,
              "%-7s rect px and layout px are the same space (ratio %.3f)"
              % (name, (hit or {}).get("ratio", 0)))

    print("== the canvas game still fills its stage")
    cdp.send("Emulation.setDeviceMetricsOverride",
             {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})
    pg.wait_for_timeout(1200)
    fit = pg.evaluate("""() => {
        const v = document.getElementById('ccViewport');
        const g = document.querySelector('.glass');
        if (!v || !g) return null;
        const vr = v.getBoundingClientRect(), gr = g.getBoundingClientRect();
        const cv = v.querySelector('canvas');
        return { frac: vr.height / gr.height,
                 canvasFrac: cv ? cv.getBoundingClientRect().height / vr.height : 0 };
    }""")
    check(fit and fit["frac"] >= 0.90,
          "the stage fills the glass (%.3f >= 0.90) -- no dead black band"
          % (fit or {}).get("frac", 0))
    check(fit and fit["canvasFrac"] >= 0.90,
          "and the renderer fills the stage (%.3f >= 0.90)" % (fit or {}).get("canvasFrac", 0))

    print("== but the press still happens on glass that is only glass")
    # measured on the network hub, not on the game: corgi's canvas fills its glass, so a press at the
    # centre of #screen there lands on the excluded canvas and would "prove" the effect was deleted
    # when it is merely stepping aside correctly. The hub has no canvas and no game frame.
    pg.goto("%s/tv/?ch=mominc" % BASE, wait_until="load")
    pg.wait_for_timeout(1200)
    check(power_on(pg), "the hub's set is on too")
    pg.wait_for_timeout(1500)
    # and not at the centre of #screen either: the hub puts the coach's dialogue there, which is a
    # control and is correctly excluded. The point is FOUND rather than assumed -- scan the glass for
    # one whose top element is not in the exclusion set, then press exactly there. Assuming a bare
    # point is how this assertion failed twice while the code under it was right both times.
    spot = pg.evaluate("""(sel) => {
        const s = document.getElementById('screen'); if (!s) return null;
        const r = s.getBoundingClientRect();
        for (let fy = 0.12; fy <= 0.92; fy += 0.08) {
          for (let fx = 0.06; fx <= 0.94; fx += 0.06) {
            const x = r.left + r.width * fx, y = r.top + r.height * fy;
            const el = document.elementFromPoint(x, y);
            if (el && s.contains(el) && !el.closest(sel)) return { x, y };
          }
        }
        return null;
    }""", "canvas,iframe,video,button,input,select,textarea,a,label,[role=button],[data-nopress]")
    check(spot is not None, "the hub's glass has a point that is only glass, to press on")
    if spot:
        pg.mouse.move(spot["x"], spot["y"])
        pg.mouse.down()
        pg.wait_for_timeout(420)
        pressed = pg.evaluate("!!document.getElementById('screen').style.transform")
        pg.mouse.up()
        pg.wait_for_timeout(120)
        check(pressed, "pressing plain glass still scales the picture (the effect was not deleted)")

    # A screenshot nobody opens is not a check. It is written so the size change the retirement
    # causes is a picture Ian can rule on, and it is deliberately not asserted.
    try:
        os.makedirs(os.path.join(ROOT, "tools", "shots"), exist_ok=True)
        pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "press-after-corgi-desktop.png"))
    except OSError as e:
        notes.append("note  screenshot not written (%s); close it and re-run" % e.strerror)

    b.close()

print()
for n in notes:
    print(" ", n)
asserted = [n for n in notes if n.startswith(("PASS", "FAIL"))]
print("\n%s  %d/%d" % ("ALL PASS" if ok else "FAILURES",
                       sum(1 for n in asserted if n.startswith("PASS")), len(asserted)))
raise SystemExit(0 if ok else 1)
