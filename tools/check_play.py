# -*- coding: utf-8 -*-
"""Part A's playthrough gate: does an ISOLATED route still let the game finish, and does any game
write into furniture that mount hid?

check_contract.py proves the page is gone. It cannot prove the GAME is whole - that is the bug class
that put fuel's SEAL THE CAN outside #stageCard, djscratch's signal line outside #deck, and sag's
inventory bar outside #sgStage. So this gate:

  1. arms a MutationObserver over the whole document BEFORE the fragment's scripts are re-created, and
     reports any mutation landing under a .mbs-off ancestor. Mount's own class writes are excluded by
     ignoring class-attribute mutations, which is the only write mount ever performs.
  2. drives each game to its real terminal state and requires MBS.unlock for THAT game, matched on the
     lifecycle event's own `game` field. The shim nests its payload one level deeper (mbs-shim.js:36),
     so reading detail.site finds nothing and would silently accept any completion at all.
  3. forces WebGL off wherever the channel ships a documented flat fallback, so the fallback is what
     gets played rather than the 3D path.

Where a terminal state is not reachable by script it is reported as PROBED, listed in the summary, and
never counted as a playthrough.

Run:  python tools/check_play.py     (serves the repo itself; nothing else need be running)
"""
import functools, os, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shots")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

VP = {"width": 390, "height": 844}

# Armed from an init script, so it is already watching before mount runs, and over the whole document,
# so a node the game MOVES out of #channel is still seen.
WATCH = """
window.__hidW = [];
(() => {
  const hidden = (n) => {
    for (let p = (n && n.nodeType === 1 ? n : n && n.parentElement); p; p = p.parentElement)
      if (p.classList && p.classList.contains("mbs-off")) return p;
    return null;
  };
  const name = (h) => (h.tagName ? h.tagName.toLowerCase() : "#text")
                      + "." + String(h.className || "").split(" ")[0];
  const obs = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === "attributes" && m.attributeName === "class") continue;
      const h = hidden(m.target);
      if (h) window.__hidW.push(name(m.target) + " under " + name(h));
      for (const n of (m.addedNodes || [])) {
        const h2 = hidden(n);
        if (h2) window.__hidW.push(name(n) + " under " + name(h2));
      }
    }
  });
  // observe the DOCUMENT, not documentElement: an init script is guaranteed to run before any page
  // script but not that documentElement exists yet, and waiting for readystatechange would arm this
  // only after mount.js and the re-created fragment scripts had already run
  obs.observe(document, {subtree: true, childList: true, attributes: true, characterData: true});
})();
"""

# WebGL refused, so the channel takes its documented flat path
NO_WEBGL = """(() => { const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()"""


def grind(pg, rounds=16, wait=520):
    """Press every enabled control the game still owns, round after round, until it completes.
    A picker fallback (corgi's floor plan, lil boyfriend's gallery, sag's door list) is finished by
    exactly this, and it needs no per-game map that would rot the first time a game is edited."""
    for _ in range(rounds):
        if pg.evaluate("()=>!!window.__done"):
            return
        pg.evaluate("""()=>{
          const vis = n => { const r = n.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
          document.querySelectorAll("button,[role=button],.lvl,.flv,.sgtab,.cc-fb-map button")
            .forEach(n => { if (vis(n) && !n.closest(".mbs-off") && !n.disabled
                                && !n.classList.contains("locked")) { try { n.click(); } catch (e) {} } });
        }""")
        pg.wait_for_timeout(wait)


def lb_walk(pg, rounds=11, wait=350):
    """Lil Boyfriend's flat gallery, finished build (lilboyfriend.js:934-1058): the old wire-drag
    widget is gone. entrance -> book -> six exhibits -> door, an empty magnifying-glass hole (#flSlot)
    that does nothing off stream and fires MBS.unlock on click while MBS.isLive. Reload with ?mode=live
    for exactly that reason - a tone switch per Codex C6, never an entitlement, and the standard way any
    visitor sees the live version."""
    pg.goto(pg.url + "?mode=live", wait_until="load")
    pg.wait_for_timeout(2600)
    for _ in range(rounds):
        if pg.evaluate("()=>!!window.__done"):
            return
        slot = pg.locator("#flSlot")
        if slot.count() and slot.is_visible() and not slot.is_disabled():
            slot.click(no_wait_after=True)
            pg.wait_for_timeout(1200)
            continue
        pg.evaluate("""()=>{
          const pick = document.querySelector("#flSkip") || document.querySelector("#flNext")
                    || document.querySelector("#lbFlat button");
          if (pick) pick.click();
        }""")
        pg.wait_for_timeout(wait)


def dj_rack(pg):
    """DJ Scratch's finished mechanic (djscratch.html:614-799): the three-scratch trigger is gone. Flip
    POWER, then touch each control in SEQUENCE order (bass knob, treble knob, volume slider, tempo
    slider) - registerTouch() only checks which control was touched, not which lamp is lit, so driving
    the fixed sequence always hits. finishGame() -> breakThrough() -> MBS.unlock('djscratch') follows."""
    pg.click("#powerSwitch", no_wait_after=True)
    pg.wait_for_timeout(400)
    for key,target in (("bass",8),("treble",3),("volume",7),("tempo",9)):
        for _ in range((target-5)%11):pg.click('.knobface[data-key="%s"], .slidertrack[data-key="%s"]' % (key, key), no_wait_after=True)
        pg.wait_for_timeout(350)
    pg.wait_for_timeout(2200)   # finishGame() -> 400ms -> breakThrough()'s typed reveal -> unlock


def fuel_seal(pg):
    for i in range(4):
        for _ in range(2):
            pg.locator('#batchIngredients button').nth(i).click()
    pg.click('#batchNext')
    pg.locator('#batchFlavors button').first.click()
    for _ in range(3):
        pg.click('#batchNext')
        pg.wait_for_timeout(800)
    pg.click('#submitBtn'); pg.wait_for_timeout(900)


# slug -> (driver, force WebGL off, terminal state must be reached)
# sag and armie are coming_soon (tv/registry.json) and ship no play route, so their drivers are gone with
# them: four terminal playthroughs, plus the two behavioral probes below that were never playthroughs.

# --- suppressed channels (C081/C084). GOON's compiled bundle asks visitors for card details, so its
# route is closed and /play/goon/ 404s. Its checks below skip rather than being deleted, because a
# deleted test is invisible where a SKIPPED line is not. Two of them were GOON's only because GOON
# happened to be the site's only same-origin iframe, and 3.G0 gave each a fixture under
# tools/fixtures/ instead: the coverage no longer depends on this set. Remove the slug here when the
# C084 rebuild lands and the goon rows come back on their own.
SUPPRESSED = set()

PLAN = {
    "djscratch":    (dj_rack,       False, True),
    "fuel":         (fuel_seal,     True,  True),
    "corgi":        (grind,         True,  True),
    "lilboyfriend": (lb_walk,       True,  True),
    "girlfriend":   (grind,         False, False),   # calls no MBS.unlock at all by design; checked separately below
}

# Writes into hidden furniture that are known to be cosmetic, and why. Anything not listed here is a
# missing root and fails. Kept deliberately narrow: it names the node being written, not the container,
# so a real game write into the same container would still be caught.
ALLOW = {
    # goon dresses every googly eye and rolls its pupils on rAF (goon.html:208,216). Four of them sit in
    # the donation boards, which are page. Decoration on furniture the player cannot see - wasted work
    # inside the channel, not a game output that has gone missing.
    "goon": ("myr", "pupil", "img."),
}

if not os.path.isdir(SHOTS):
    os.makedirs(SHOTS)

ok, probed = True, []
print("== playthrough on the isolated route (unlock reached, nothing written into hidden furniture)")
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for slug, (drive, no_webgl, must_unlock) in PLAN.items():
        pg = b.new_page(viewport=VP)
        done, errs = [], []
        pg.expose_function("__unl", lambda g: done.append(g))
        pg.add_init_script(WATCH)
        pg.add_init_script(
            "document.addEventListener('mbs:lifecycle',e=>{const d=e.detail||{};"
            "if(d.type==='GAME_COMPLETE'){window.__done=1; window.__unl && window.__unl(String(d.game||''));}})")
        if no_webgl:
            pg.add_init_script(NO_WEBGL)
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))

        pg.goto(BASE + "/play/" + slug + "/", wait_until="load")
        pg.wait_for_timeout(2600)
        try:
            drive(pg)
        except Exception as e:
            errs.append("driver: " + str(e)[:80])

        hid = pg.evaluate("()=>Array.from(new Set(window.__hidW||[]))")
        hid = [w for w in hid if not any(a in w.split(" under ")[0] for a in ALLOW.get(slug, ()))][:4]
        escaped = pg.evaluate("""()=>Array.from(document.querySelectorAll(".mbs-off"))
            .filter(n=>!n.closest("#channel")).map(n=>n.tagName.toLowerCase()+"#"+n.id).slice(0,2)""")
        stored = pg.evaluate("()=>{try{return window.MBS_STATE.unlockedActive()}catch(e){return []}}")
        # the event must name THIS game, and the stored node must agree
        reached = (slug in done) and (slug in (stored or []))
        pg.screenshot(path=os.path.join(SHOTS, slug + ("-flat" if no_webgl else "") + ".png"))
        clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
        good = (not hid) and (not escaped) and (reached if must_unlock else True) and not clean
        ok &= good
        if not must_unlock:
            probed.append(slug)
        print("  %s %-13s %s unlock=%-5s hidden-writes=%s%s%s" %
              ("PASS" if good else "FAIL", slug, "PLAYED" if must_unlock else "PROBED", reached,
               hid or "none",
               ("  ESCAPED=" + str(escaped)) if escaped else "",
               ("  ERR=" + str(clean[:1])) if clean else ""))
        pg.close()

    # The two routes with no scriptable terminal still get a real assertion each, rather than a shrug.
    # Neither is a playthrough and neither is counted as one.
    print("== the two routes with no scriptable terminal, checked for what CAN be checked")

    # Paper factory remains interactive with WebGL refused; no rendering fallback is needed.
    pg = b.new_page(viewport={"width":844,"height":390})
    pg.add_init_script(NO_WEBGL)
    pg.goto(BASE + "/play/girlfriend/", wait_until="load")
    pg.locator('#dgDock button').first.wait_for()
    good = pg.evaluate("() => !!window.__dg?.paper && !document.querySelector('#dgStage canvas')")
    ok &= good
    print("  %s girlfriend    paper scene and controls render without WebGL" % ("PASS" if good else "FAIL"))
    pg.close()

    # Goon's game is a compiled third-party bundle inside a same-origin iframe with no exposed state, so
    # seeding it to one merge below its win would mean reverse-engineering minified code - out of all
    # proportion to a change that never touches the bundle. What Part A CAN break is the iframe itself:
    # it is loading="lazy" (goon.html:95), and a lazy iframe inside a collapsed ancestor never loads.
    #
    # 3.G0: while goon is suppressed this slot runs tools/fixtures/lazyframe.html instead of printing a
    # SKIPPED line - the same failure with the bundle taken out of it: one loading="lazy" iframe, one
    # ancestor, one height. Matched pair, because "it loaded" on its own would pass just as happily on
    # a page whose iframe was never lazy. The substitution is one branch on SUPPRESSED, so goon's own
    # case returns of its own accord when the slug leaves that set, and the branch is what puts the
    # named SKIPPED back if it ever leaves with nothing having replaced this fixture.
    if "goon" in SUPPRESSED:
        for label, qs, want in (("collapsed", "?collapse=1", False), ("open", "", True)):
            pg = b.new_page(viewport=VP)
            codes = []
            pg.on("response",
                  lambda r: codes.append(r.status) if "fixtures/frame-inner.html" in r.url else None)
            pg.goto(BASE + "/tools/fixtures/lazyframe.html" + qs, wait_until="load")
            pg.wait_for_timeout(1500)
            fr = pg.evaluate("""()=>{const f=document.getElementById("lfGame");
                const r=f?f.getBoundingClientRect():null; let d=null; try{d=f&&f.contentDocument}catch{}
                return {w:r?Math.round(r.width):0, h:r?Math.round(r.height):0,
                        painted: !!(d && d.querySelector("#fxStage") && d.querySelector("#fxStage").children.length)};}""")
            # LOADED is about the fetch and the paint, never about the box. Folding "h > 0" in here is
            # how the first version of this check passed for the wrong reason: a zero-height lazy frame
            # is loaded EAGERLY by Chromium, so the collapsed half read as "did not load" while the
            # inner document had in fact been fetched and painted. The box is asserted separately, and
            # only where it means something - the open half, which must actually have one.
            loaded = bool(codes) and all(c == 200 for c in codes) and fr["painted"]
            good = (loaded == want) and (not want or (fr["w"] > 0 and fr["h"] > 0))
            ok &= good
            print("  %s fixture %-9s lazy iframe: %dx%d, inner=%s, painted=%s -> loaded=%s want=%s"
                  % ("PASS" if good else "FAIL", label, fr["w"], fr["h"], codes[:2] or "none",
                     fr["painted"], loaded, want))
            pg.close()
        pg = None
    else:
        pg = b.new_page(viewport=VP)
        codes = []
        pg.on("response", lambda r: codes.append(r.status) if "games/goon/assets/" in r.url else None)
        pg.goto(BASE + "/play/goon/", wait_until="load"); pg.wait_for_timeout(3500)
    if pg is not None:
        fr = pg.evaluate("""()=>{const f=document.getElementById("ggGame");
            const r=f?f.getBoundingClientRect():null; const d=f&&f.contentDocument;
            return {w:r?Math.round(r.width):0, h:r?Math.round(r.height):0,
                    painted: !!(d && d.querySelector("#game-container") && d.querySelector("#game-container").children.length)};}""")
        good = fr["w"] > 0 and fr["h"] > 0 and fr["painted"] and codes and all(c == 200 for c in codes)
        ok &= good
        print("  %s goon          lazy iframe: %dx%d, bundle=%s, game mounted inside=%s"
              % ("PASS" if good else "FAIL", fr["w"], fr["h"], codes[:2] or "none", fr["painted"]))
        pg.close()
    b.close()

if probed:
    print("\nNOT a playthrough, terminal state not driven: " + ", ".join(probed))
print("\nISOLATED ROUTES STILL PLAYABLE" if ok else "\nFAILURES ABOVE")
sys.exit(0 if ok else 1)
