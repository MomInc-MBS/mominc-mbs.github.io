#!/usr/bin/env python3
"""PRIZE LEVELS 1 and 2, driven in a real browser.

Two unlock prizes, and the point of both is that they are EARNED, so every assertion here is about
the locked state being real rather than cosmetic:

  Prize 1, the hand editor on DJ Scratch, pays out for solving THAT page.
  Prize 2, Coach MYR5 on MOM Inc, pays out for solving EVERY page.

WHY A LOCK NEEDS ITS OWN GATE. A prize hidden with CSS alone still ships its payload to someone who
has not won it, and the hand drags a 1.19 MB model behind it. So the expensive half is asserted
directly: while the crate is shut the .obj is never requested at all. `display:none` would pass a
"cannot see it" check and fail that one.

ROOT IS DERIVED FROM THIS FILE, not typed. drive_mominc.py and drive_djscratch.py both hardcode
`ROOT = D:\\MBS Pages`, so running either from a worktree silently gates the OTHER checkout and
reports PASS for code it never loaded. That cost a false green while this feature was being built.

Run:  python tools/check_prizes.py
"""
import functools
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok = True


def check(cond, msg):
    global ok
    ok &= bool(cond)
    print("  %s %s" % ("PASS" if cond else "FAIL", msg))


VISIBLE = """(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  return { there: true, shown: cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0 };
}"""

errs = []

with sync_playwright() as pw:
    b = pw.chromium.launch()

    def page(tag):
        p = b.new_page(viewport={"width": 900, "height": 1000})
        p.on("pageerror", lambda e: errs.append("%s: %s" % (tag, e)))
        return p

    def power_on(p):
        """Turn the set on. drive_mominc.py and check_press.py both do this and say why: OFF, `#dark`
        is a sibling of the screen, covers the glass and EATS EVERY CLICK, so a picker measures the
        off-state overlay instead of the channel. mode=live is not enough on its own; the overlay is
        the power state, not the schedule."""
        for _ in range(3):
            if p.evaluate("() => (document.querySelector('.tv')||{}).dataset"
                          " && document.querySelector('.tv').dataset.state === 'on'"):
                return True
            try:
                p.click(".power", timeout=3000)
            except Exception:
                return False
            p.wait_for_timeout(2600)
        return p.evaluate("() => document.querySelector('.tv').dataset.state === 'on'")

    def pick(p, rid, ms=15000):
        """Drive the LABEL, then assert the input took it, because the label IS the control here.
        The radio is `opacity:0; pointer-events:none` and the styled <label for> is what a person
        clicks, so `Locator.check` on the input reports "not actionable" and would be measuring the
        stylesheet rather than the feature. Clicking what a visitor clicks is the honest probe.

        MBS-TRAPS' rule still applies to the shape: this RETURNS rather than raising, so one
        unreachable control cannot take every assertion after it down with the one that broke."""
        try:
            p.locator('label[for="%s"]' % rid).click(timeout=ms)
            p.wait_for_timeout(120)
            return bool(p.evaluate("id => { const el = document.getElementById(id);"
                                   " return !!el && el.checked; }", rid))
        except Exception:
            return False

    def bank(p, ids):
        """Bank unlock nodes the way the shell does, through MBS_STATE, then reload so the channel
        mounts against the banked store rather than being poked after the fact."""
        p.evaluate("ids => ids.forEach(i => window.MBS_STATE.bankUnlock(i))", ids)

    # ================================================================================
    print("\n  -- PRIZE 1: the hand editor is what solving DJ Scratch pays out --")
    # ================================================================================
    obj_hits = []
    p1 = page("prize1-locked")
    p1.on("request", lambda r: obj_hits.append(r.url) if "floating-hand" in r.url else None)
    p1.goto(BASE + "/tv/?ch=djscratch", wait_until="load")
    p1.wait_for_timeout(1800)

    locked = p1.evaluate("() => { const c = document.querySelector('#customize');"
                         "return c ? c.classList.contains('is-locked') : null; }")
    crate = p1.evaluate(VISIBLE, "#customize .prizelock")
    body = p1.evaluate(VISIBLE, "#customize .prizebody")
    check(locked is True, "arriving unsolved, the hand editor is LOCKED (is-locked=%s)" % locked)
    check(crate and crate["shown"], "and the crate is what stands in its place")
    check(body and not body["shown"], "and not one control of the editor is on the page")

    # THE EXPENSIVE HALF. The observer is attached at reveal, so a prize nobody has won costs no
    # bandwidth. Scrolled to the bottom on purpose: this is where the card is, and where a still
    # attached observer would fire.
    p1.evaluate("() => { const s = document.querySelector('#screen') || document.scrollingElement;"
                "s.scrollTop = s.scrollHeight; }")
    p1.wait_for_timeout(1500)
    check(not obj_hits, "and the 1.19 MB model is never even requested for it (%s)"
          % (obj_hits[:1] or "no fetch"))

    # ---- and it opens for someone who has solved it
    p2 = page("prize1-open")
    p2.goto(BASE + "/tv/?ch=djscratch", wait_until="load")
    p2.wait_for_timeout(900)
    bank(p2, ["djscratch"])
    p2.goto(BASE + "/tv/?ch=djscratch", wait_until="load")
    p2.wait_for_timeout(1800)
    open_now = p2.evaluate("() => { const c = document.querySelector('#customize');"
                           "return c ? !c.classList.contains('is-locked') : null; }")
    body2 = p2.evaluate(VISIBLE, "#customize .prizebody")
    crate2 = p2.evaluate(VISIBLE, "#customize .prizelock")
    racks = p2.evaluate("() => document.querySelectorAll('#orderForm input[type=radio]').length")
    check(open_now is True, "having solved it, the crate is open")
    check(body2 and body2["shown"] and racks >= 12,
          "and the editor is all there - %d picks across its racks" % racks)
    check(crate2 and not crate2["shown"], "and the crate is gone rather than sitting above it")
    p1.close()
    p2.close()

    # ================================================================================
    print("\n  -- PRIZE 2: Coach MYR5 is what solving EVERY page pays out --")
    # ================================================================================
    # mode=live for the reason drive_mominc.py writes down at its own URL: OFF AIRTIME A #dark
    # OVERLAY COVERS THE CHANNEL AND EATS CLICKS, so a picker here reports "intercepts pointer
    # events" and the whole section dies on one Locator.check the way MBS-TRAPS describes.
    p3 = page("prize2-locked")
    p3.goto(BASE + "/tv/?ch=mominc&mode=live", wait_until="load")
    p3.wait_for_timeout(1200)
    check(power_on(p3), "the set powers on, so the picks are reachable rather than under #dark")
    p3.wait_for_timeout(600)
    active = p3.evaluate("() => (window.MBS_CHANNELS && window.MBS_CHANNELS.active) || []")
    n = len(active)
    check(n > 0, "the family is read from the generated manifest (%d active: %s)" % (n, active))

    p2locked = p3.evaluate("() => { const s = document.querySelector('#myrPrize');"
                           "return s ? s.classList.contains('is-locked') : null; }")
    prog = p3.evaluate("() => (document.querySelector('#myrProg')||{}).textContent || ''")
    pills = p3.evaluate("() => Array.from(document.querySelectorAll('#myrList li'))"
                        ".map(li => [li.textContent, li.classList.contains('got')])")
    form = p3.evaluate(VISIBLE, "#myrPrize .prizebody")
    check(p2locked is True, "arriving with nothing solved, Coach MYR5 is LOCKED")
    check(form and not form["shown"], "and the builder is not on the page at all")
    check(("0 of %d" % n) in prog, "and the lock counts from the manifest, not from a typed number (%r)" % prog)
    check(len(pills) == n and not any(g for _, g in pills),
          "and it names which of the family is still owed, none of them marked yet (%d pills)" % len(pills))

    # ---- partway: the count has to MOVE, or it is decoration
    bank(p3, active[:2])
    p3.goto(BASE + "/tv/?ch=mominc&mode=live", wait_until="load")
    p3.wait_for_timeout(1200)
    power_on(p3)
    p3.wait_for_timeout(600)
    prog2 = p3.evaluate("() => (document.querySelector('#myrProg')||{}).textContent || ''")
    got2 = p3.evaluate("() => document.querySelectorAll('#myrList li.got').length")
    still = p3.evaluate("() => { const s = document.querySelector('#myrPrize');"
                        "return s ? s.classList.contains('is-locked') : null; }")
    check(("2 of %d" % n) in prog2 and got2 == 2,
          "solving two of them moves the count and marks those two (%r, %d lit)" % (prog2, got2))
    check(still is True, "and two is not four, so the coach stays locked")

    # ---- all of them: the payout
    bank(p3, active)
    p3.goto(BASE + "/tv/?ch=mominc&mode=live", wait_until="load")
    p3.wait_for_timeout(1200)
    power_on(p3)
    p3.wait_for_timeout(800)
    unlocked = p3.evaluate("() => { const s = document.querySelector('#myrPrize');"
                           "return s ? !s.classList.contains('is-locked') : null; }")
    body3 = p3.evaluate(VISIBLE, "#myrPrize .prizebody")
    crate3 = p3.evaluate(VISIBLE, "#myrPrize .prizelock")
    check(unlocked is True, "solving every one of them opens Coach MYR5")
    check(body3 and body3["shown"], "and the builder is on the page")
    check(crate3 and not crate3["shown"], "and the lock is gone")

    # ---- the builder actually builds
    spec0 = p3.evaluate("() => (document.querySelector('#myrSpec')||{}).textContent || ''")
    img0 = p3.evaluate("() => ((document.querySelector('#myrImg')||{}).getAttribute)"
                       "? document.querySelector('#myrImg').getAttribute('src') : ''")
    got_w = pick(p3, "my-w3")
    got_v = pick(p3, "my-v2")
    check(got_w and got_v, "the picks are actually operable (who=%s, voice=%s)" % (got_w, got_v))
    p3.wait_for_timeout(300)
    spec1 = p3.evaluate("() => (document.querySelector('#myrSpec')||{}).textContent || ''")
    img1 = p3.evaluate("() => document.querySelector('#myrImg').getAttribute('src')")
    cap1 = p3.evaluate("() => (document.querySelector('#myrCap')||{}).textContent || ''")
    check(spec0 and spec1 and spec0 != spec1,
          "changing a pick rewrites the specification rather than leaving the first one standing")
    check(img0 != img1 and "sticker-5" in img1 and "WITNESS" in cap1.upper(),
          "and the preview changes to the one that was chosen (%s / %s)" % (img1.split('/')[-1], cap1))

    # THE PRE-ORDER IS NOT A SALE, and that is the half worth gating: this site has no send path
    # (C008), so the link has to be a mailto that stops in the visitor's own mail program.
    href = p3.evaluate("() => (document.querySelector('#myrMail')||{}).getAttribute('href') || ''")
    fields = p3.evaluate("""() => {
      const s = document.querySelector('#myrPrize');
      if (!s) return null;
      return Array.from(s.querySelectorAll('input,select,textarea'))
        .map(e => (e.type || e.tagName).toLowerCase())
        .filter(t => t !== 'radio');
    }""")
    check(href.startswith("mailto:"), "the pre-order is a mailto and nothing else (%s)" % href[:34])
    check("Coach%20MYR5%20pre-order" in href or "Coach+MYR5+pre-order" in href,
          "and it carries the subject rather than an empty draft")
    check(fields == [], "and the panel asks for NOTHING - no text field, no address, no card (%s)"
          % (fields if fields else "no inputs but the picks"))

    body_txt = p3.evaluate("() => (document.querySelector('#myrPrize')||{}).textContent || ''")
    check("\u2014" not in body_txt, "and her rules hold: not one em-dash in the whole panel")
    check("no claim about your body" in body_txt,
          "and it makes no health claim, which is the one thing she never does")

    p3.close()

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors across either prize (%s)" % (clean[:2] or "none"))
    b.close()

print("\n%s" % ("PRIZES ARE EARNED" if ok else "PRIZES BROKEN"))
sys.exit(0 if ok else 1)
