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


def lb_walk(pg, rounds=18, wait=420):
    """Lil Boyfriend's flat gallery: next, next, skip the guest book, then CONNECT the fuse, which is a
    drag and not a click (lilboyfriend.html:566) - the one action that fires MBS.unlock in flat mode."""
    for _ in range(rounds):
        if pg.evaluate("()=>!!window.__done"):
            return
        wire = pg.locator("#lbFlat .wire.r")
        if wire.count() and wire.first.is_visible():
            box = wire.first.bounding_box()
            pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            pg.mouse.down()
            for step in range(6):
                pg.mouse.move(box["x"] + box["width"] / 2 - 30 * (step + 1), box["y"] + box["height"] / 2)
                pg.wait_for_timeout(40)
            pg.mouse.up()
            pg.wait_for_timeout(900)
            continue
        pg.evaluate("""()=>{
          const pick = document.querySelector("#flSkip") || document.querySelector("#flNext")
                    || document.querySelector("#lbFlat button");
          if (pick) pick.click();
        }""")
        pg.wait_for_timeout(wait)


def sag_chain(pg, rounds=20, wait=450):
    """Sag's unlock node end to end (sag.html:7): buy the four lots off the flat door list, open the
    locked fifth, drag the chicken leg to Sag, take the receipt, then catch the ball inside the two
    second window (sag.html:1044) - miss it and the whole lot resets instead of unlocking."""
    # One door is FOUR clicks, not one: the first opens the peek, then each further click outbids, and
    # only stage 3 reveals and marks it SOLD (sag.html:559-570). A bought door's button is also left
    # enabled on purpose so the find can be re-read (sag.html:715), so "first enabled button" would
    # re-click door one forever. Drive by index, and wait each door out on its own SOLD tag.
    for i in range(5):
        for _ in range(rounds):
            if pg.locator("#sgLeg").count():
                break
            st = pg.evaluate("(i)=>{const li=document.querySelectorAll('#sgFlatList li')[i];"
                             "return {sold: !!(li && li.querySelector('.wftag.sold')),"
                             " leg: !!document.getElementById('sgLeg')};}", i)
            if st["sold"] or st["leg"]:
                break
            # the reveal pop-up dismisses itself (showReveal auto:true) and the node is created once and
            # reused, so its presence says nothing; clicking the button directly ignores it either way
            pg.evaluate("(i)=>{const b=document.querySelectorAll('#sgFlatList button')[i];"
                        "if (b && !b.disabled) b.click();}", i)
            pg.wait_for_timeout(wait)
        if pg.locator("#sgLeg").count():
            break

    leg, sag = pg.locator("#sgLeg"), pg.locator("#sgSagFig")
    if not leg.count():
        return
    a, z = leg.bounding_box(), sag.bounding_box()
    pg.mouse.move(a["x"] + a["width"] / 2, a["y"] + a["height"] / 2)
    pg.mouse.down()
    for step in range(1, 9):                       # a real drag: the leg tracks pointermove (sag.html:985)
        pg.mouse.move(a["x"] + (z["x"] + z["width"] / 2 - a["x"]) * step / 8,
                      a["y"] + (z["y"] + z["height"] / 2 - a["y"]) * step / 8)
        pg.wait_for_timeout(40)
    pg.mouse.up()
    pg.wait_for_timeout(1400)

    pg.evaluate('()=>{const r=document.getElementById("sgReceipt"); if(r) r.click();}')
    pg.wait_for_timeout(400)                       # inside the 2s window, never after it
    pg.evaluate('()=>{const b=document.getElementById("sgBall"); if(b) b.click();}')
    pg.wait_for_timeout(900)


ARMIE_SELECT = """()=>{
  document.querySelector('#selStyles .styleCard').click();
  document.querySelector('#selExp .lvl').click();
  const s=document.getElementById('selSpecies');
  if(!s.value){ s.value=[...s.options].map(o=>o.value).find(v=>v)||s.options[1].value; }
  s.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('selStart').click();
}"""

# Each checkpoint is a five-question quiz with no answer key in the DOM - but onPick REVEALS the right
# option by classing it .correct (armie.html:1007). So the driver learns: it records the correct answer
# text against the question text on every pick, and uses what it has learned the next time the same
# question comes round. Getting caught returns the player to the last cleared checkpoint rather than
# ending the run (armie.html:5), so a second pass is always available and the quiz is winnable.
ARMIE_STEP = """(known)=>{
  const vis = n => n && n.getBoundingClientRect().height > 0;
  const out = {learned:null, did:"none"};

  const serum = document.getElementById("arSerum");
  if (serum && !serum.hidden) { out.did = "done"; return out; }

  const opt = [...document.querySelectorAll(".qzOpt")].filter(b => !b.disabled);
  const qEl = document.querySelector(".qzQ");
  if (opt.length && qEl) {
    const q = qEl.textContent.trim();
    const want = known[q];
    const pick = (want && opt.find(b => b.textContent.trim() === want)) || opt[0];
    pick.click();
    const right = document.querySelector(".qzOpt.correct");
    if (right) out.learned = [q, right.textContent.trim()];
    out.did = "answer";
    return out;
  }
  const next = document.getElementById("qzNext");
  if (vis(next) && !next.hidden) { next.click(); out.did = "next"; return out; }

  for (const id of ["qzRetakeGo", "cpConfirm", "cpGo", "cpStart"]) {
    const b = document.getElementById(id);
    if (vis(b)) { b.click(); out.did = id; return out; }
  }
  const modal = document.querySelector("#cpModalWrap:not([hidden]) button, .modalWrap:not([hidden]) .modalBtns button");
  if (vis(modal)) { modal.click(); out.did = "modal"; return out; }

  document.getElementById("btnInteract").click();
  document.getElementById("btnUp").click();
  out.did = "walk";
  return out;
}"""


def armie_hall(pg, rounds=260, wait=110):
    """Armie end to end: pick a fighter, walk the corridor, clear three five-question checkpoints, then
    hold the sac through the breathing beat, which is what fires MBS.unlock (armie.html:1188)."""
    pg.evaluate(ARMIE_SELECT)
    pg.wait_for_timeout(1500)

    known = {}
    for _ in range(rounds):
        if pg.evaluate("()=>!!window.__done"):
            return
        # the breathing beat is a real hold, so it is held for real
        if pg.evaluate('()=>{const w=document.getElementById("breathModalWrap"); return !!w && !w.hidden;}'):
            # held with the keyboard, which armie documents as the equivalent control (armie.html:1202)
            # and which needs no pointer geometry inside a modal that has just scrolled itself into view.
            # HOLD_MS is 15s (armie.html:1152) and any release before it resets the bar to zero.
            pg.keyboard.down(" ")
            for _ in range(38):
                pg.wait_for_timeout(500)
                if pg.evaluate("()=>!!window.__done"):
                    break
            pg.keyboard.up(" ")
            pg.wait_for_timeout(600)
            return
        r = pg.evaluate(ARMIE_STEP, known)
        if r["learned"]:
            known[r["learned"][0]] = r["learned"][1]
        pg.wait_for_timeout(wait)


def scratch_three(pg):
    for _ in range(3):
        pg.click("#scratchHand", no_wait_after=True)
        pg.wait_for_timeout(320)
    pg.wait_for_timeout(1600)


def fuel_seal(pg):
    # complete() wants EVERY row set plus a flavour (fuel.html:449), so set all six, not one
    rows = pg.locator("#stackCard .srow")
    for i in range(rows.count()):
        rows.nth(i).locator(".lvl").last.click(no_wait_after=True)
        pg.wait_for_timeout(90)
    pg.click("#flavours .flv", no_wait_after=True); pg.wait_for_timeout(200)
    pg.click("#submitBtn", no_wait_after=True); pg.wait_for_timeout(900)


# slug -> (driver, force WebGL off, terminal state must be reached)
PLAN = {
    "djscratch":    (scratch_three, False, True),
    "fuel":         (fuel_seal,     True,  True),
    "corgi":        (grind,         True,  True),
    "lilboyfriend": (lb_walk,       True,  True),
    "sag":          (sag_chain,     True,  True),
    "armie":        (armie_hall,    False, True),
    "goon":         (grind,         False, False),   # a compiled third-party bundle in an iframe; checked separately below
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
        stored = pg.evaluate("()=>{try{return JSON.parse(localStorage.getItem('mbs-unlock')||'[]')}catch(e){return []}}")
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

    # Dr Girlfriend calls no MBS.unlock at all by design (girlfriend.html:9), so her terminal is not an
    # unlock and cannot be asserted as one. What Part A can break for her is the documented fallback:
    # with WebGL refused the room must switch to flat and say so in words.
    pg = b.new_page(viewport=VP)
    pg.add_init_script(NO_WEBGL)
    pg.goto(BASE + "/play/girlfriend/", wait_until="load"); pg.wait_for_timeout(2600)
    flat = pg.evaluate("""()=>{const r=document.querySelector(".dg"), f=document.querySelector(".dg-flat");
        return {flat: !!r && r.classList.contains("flat"),
                words: !!f && f.getBoundingClientRect().height > 0};}""")
    good = flat["flat"] and flat["words"]
    ok &= good
    print("  %s girlfriend    no-WebGL fallback: .dg is flat=%s, the written room renders=%s"
          % ("PASS" if good else "FAIL", flat["flat"], flat["words"]))
    pg.close()

    # Goon's game is a compiled third-party bundle inside a same-origin iframe with no exposed state, so
    # seeding it to one merge below its win would mean reverse-engineering minified code - out of all
    # proportion to a change that never touches the bundle. What Part A CAN break is the iframe itself:
    # it is loading="lazy" (goon.html:95), and a lazy iframe inside a collapsed ancestor never loads.
    pg = b.new_page(viewport=VP)
    codes = []
    pg.on("response", lambda r: codes.append(r.status) if "games/goon/assets/" in r.url else None)
    pg.goto(BASE + "/play/goon/", wait_until="load"); pg.wait_for_timeout(3500)
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
