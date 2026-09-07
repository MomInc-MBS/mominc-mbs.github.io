"""Drive lilboyfriend's 3D museum: the half no gate touches.

check_play drives the FLAT gallery (it forces WebGL off) and check_teardown only mounts and unmounts,
so before packet 12 nothing in this repo had ever pressed a key inside the museum itself.
Packet 12 rewired every listener in the 3D path - three on window, four on the WALK/BACK buttons, three
on the look zone, the guest book and the door - and a listener that silently never fires would
pass every assertion in the repo and photograph identically. So: hold W, see the walk advance; look at
the lectern, see the guest book open; press Escape/E, see the zoom respond.

2.20/E.8 replaced the guest book's three free-text asks (city, country, household income) with the
assessment engine mounted from JSON, so the drive below answers radio groups instead of typing, and
asserts what the new contract promises on the REAL channel rather than in the engine's own harness:
the privacy statement above the first question, no free-text field left to type an exact city or an
exact income into, and the result readable without an email or a phone.
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
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    pg.wait_for_timeout(6000)

    state = lambda: pg.evaluate("() => window.__lbState()")
    check(pg.evaluate("() => !!document.querySelector('#lb.webgl')"), "the 3D path was taken")
    t0 = state()["t"]

    # ---- the keyboard walk: three window listeners, the ones most likely to be silently unbound
    pg.keyboard.down("w")
    pg.wait_for_timeout(1500)
    pg.keyboard.up("w")
    pg.wait_for_timeout(200)
    t1 = state()["t"]
    check(t1 > t0, "holding W walks forward (t %.4f -> %.4f)" % (t0, t1))

    pg.keyboard.down("s")
    pg.wait_for_timeout(900)
    pg.keyboard.up("s")
    pg.wait_for_timeout(200)
    t2 = state()["t"]
    check(t2 < t1, "holding S walks back (t %.4f -> %.4f)" % (t1, t2))

    # ---- the WALK button: pointerdown/pointerup on a channel element
    box = pg.locator("#lbWalk").bounding_box()
    pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    pg.mouse.down()
    pg.wait_for_timeout(1200)
    pg.mouse.up()
    pg.wait_for_timeout(200)
    t3 = state()["t"]
    check(t3 > t2, "holding the WALK button walks forward too (t %.4f -> %.4f)" % (t2, t3))

    # ---- the hint dismiss, which is the ctx.timeout plus the look zone's pointermove
    check(pg.evaluate("() => document.querySelector('#lbHint').classList.contains('hide')"),
          "the hint was dismissed (the look zone's pointermove and/or the 7s timer fired)")

    # ---- the guest book: level-triggered by proximity from inside the frame loop
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('mbs-lilbf-museum-v2') || '{}');
                           s.t = 0.03; s.signed = false; localStorage.setItem('mbs-lilbf-museum-v2', JSON.stringify(s)); }""")
    pg.reload(wait_until="load")
    pg.wait_for_timeout(6000)
    # Look at the lectern. The guest book sits at side -1 (negative x), and this channel's own comment
    # spells the sign convention out: forward is (-sin(yaw), -cos(yaw)), so a POSITIVE yaw faces -x, and
    # targetYaw = (nx - 0.5) * PI means the pointer has to go to the RIGHT of the look zone's centre to
    # turn toward it. Getting this backwards is exactly the mirrored-direction mistake the comment
    # records being made once already with a raycast.
    cv = pg.locator("#lookZone").bounding_box()
    pg.mouse.move(cv["x"] + cv["width"] * 0.82, cv["y"] + cv["height"] * 0.5)
    pg.wait_for_timeout(900)
    opened = pg.evaluate("() => document.querySelector('#bookPanel').classList.contains('show')")
    check(opened, "walking up to the lectern and looking at it opens the guest book")

    if opened:
        # 2.20/E.8: the lectern is the six-question assessment now, mounted from
        # tv/data/assessments/lilboyfriend.json by tv/questionnaire.js. It arrives by dynamic import
        # plus a fetch, so it is not in the DOM on the frame the panel opens.
        pg.wait_for_selector("#bookMount form.q input[type=radio]", timeout=5000)

        # the acceptance clause that is about THIS channel rather than the engine: the privacy
        # statement is on screen, and it is above the first question, in the real mounted panel.
        check(pg.evaluate("""() => {
                  const p = document.querySelector('#bookMount [data-privacy]');
                  const q1 = document.querySelector('#bookMount .q-item');
                  if (!p || !q1 || !p.textContent.trim()) return false;
                  if (!p.getClientRects().length) return false;
                  return !!(p.compareDocumentPosition(q1) & Node.DOCUMENT_POSITION_FOLLOWING);
              }"""),
              "the privacy statement is visible above the first question")

        # the asks E.8 removed: no free-text input of any kind survives in the guest book, which is
        # what makes an exact city or an exact income unaskable rather than merely not asked today.
        check(pg.evaluate("""() => Array.from(document.querySelectorAll('#bookMount input'))
                  .every(i => i.type === 'radio')"""),
              "every field is a radio - no free-text city, country or income input remains")

        # answer the four required groups (region and the Wednesday vote are optional by the data)
        for name in ("housing", "burden", "sharing", "space"):
            pg.locator("#bookMount input[name=%s]" % name).first.check()
        pg.click("#bookMount button[type=submit]")
        pg.wait_for_timeout(600)

        check(pg.evaluate("() => document.querySelector('#bookPanel').classList.contains('show')"),
              "the panel STAYS open on submit, so the result is readable without an email or a phone")
        check(pg.evaluate("""() => { const o = document.querySelector('#bookMount .q-out');
                  return !!o && !o.hidden && o.querySelectorAll('.q-outcome').length >= 3; }"""),
              "and the outcomes rendered in place")
        check(pg.evaluate("""() => { try { return !!JSON.parse(
                  localStorage.getItem('mbs-lilbf-museum-v2')).signed; } catch (e) { return false; } }"""),
              "and the signature is recorded in the shared store")
        check(pg.evaluate("""() => { try { const a = JSON.parse(localStorage.getItem('mbs-state'))
                      .submissions.lilboyfriend;
                  return !!a && !!a.housing && !!a.burden && a.city === undefined && a.income === undefined;
                } catch (e) { return false; } }"""),
              "and MBS.form carried the ASSESSMENT answers, with no city or income key in the payload")

        pg.click("#bookSkip")
        pg.wait_for_timeout(300)
        check(not pg.evaluate("() => document.querySelector('#bookPanel').classList.contains('show')"),
              "and 'walk on' is what dismisses it")

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across the drive (%s)" % (clean[:2] or "none"))

    # ---- 2.20: the FLAT gallery's guest book, which no gate reads back either. check_play walks this
    # route with WebGL refused, but it finishes the book step by clicking "walk on" - so it would pass
    # unchanged if the step rendered an empty box. Same engine, same JSON, second render path; a fresh
    # context so ST.signed starts false and fireForm is not short-circuited by the drive above.
    fl = b.new_page(viewport={"width": 900, "height": 1000})
    flerrs = []
    fl.on("pageerror", lambda e: flerrs.append(str(e)))
    fl.on("console", lambda m: flerrs.append(m.text) if m.type == "error" else None)
    fl.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    fl.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    fl.wait_for_timeout(2500)
    check(fl.evaluate("() => !!document.querySelector('#lbFlat') && !document.querySelector('#lb.webgl')"),
          "flat: WebGL refused, so the DOM gallery is what rendered")
    fl.click("#flNext")                                   # entrance -> book
    fl.wait_for_selector("#flBookMount form.q input[type=radio]", timeout=5000)
    check(fl.evaluate("""() => {
              const p = document.querySelector('#flBookMount [data-privacy]');
              const q1 = document.querySelector('#flBookMount .q-item');
              return !!(p && q1 && p.textContent.trim() && p.getClientRects().length
                        && (p.compareDocumentPosition(q1) & Node.DOCUMENT_POSITION_FOLLOWING)); }"""),
          "flat: the privacy statement is visible above the first question here too")
    check(fl.evaluate("""() => Array.from(document.querySelectorAll('#flBookMount input'))
              .every(i => i.type === 'radio')"""),
          "flat: no free-text city, country or income input remains")
    for name in ("housing", "burden", "sharing", "space"):
        fl.locator("#flBookMount input[name=%s]" % name).first.check()
    fl.click("#flBookMount button[type=submit]")
    fl.wait_for_timeout(500)
    check(fl.evaluate("""() => { const o = document.querySelector('#flBookMount .q-out');
              return !!o && !o.hidden && o.querySelectorAll('.q-outcome').length >= 3; }"""),
          "flat: the outcomes render in place, and the step did not advance past them")
    check(fl.evaluate("""() => { try { const a = JSON.parse(localStorage.getItem('mbs-state'))
                  .submissions.lilboyfriend;
              return !!a && !!a.housing && a.city === undefined && a.income === undefined;
            } catch (e) { return false; } }"""),
          "flat: MBS.form carried the assessment answers, with no city or income key")
    fl.click("#flSkip")
    fl.wait_for_timeout(400)
    check(not fl.evaluate("() => !!document.querySelector('#flBookMount')"),
          "flat: and 'walk on' moves the gallery on")
    flclean = [e for e in flerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not flclean, "flat: no page errors (%s)" % (flclean[:2] or "none"))

    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
