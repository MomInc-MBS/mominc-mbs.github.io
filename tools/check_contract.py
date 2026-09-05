# -*- coding: utf-8 -*-
"""The play-route host-contract gate. Replaces verify_host.py and four ad-hoc scripts.

WHY THIS SHAPE. Round 1 passed 8/8 while three games rendered 13% short, because the gate only asserted
"mounted, no console errors". Two later attempts were also wrong:
  * comparing play-route height to television height -- .glass is legitimately a different size on /tv/
    (a ~183px control panel shares the viewport) than on /play/ (the game is the whole screen);
  * asserting rendered height as a percentage of .glass -- sag's reserve is heroH + ribbonH + 26, which is
    content-dependent, so 0.80 is correct for sag and says nothing about the zoom.

The invariant that actually catches the bug needs no per-game formula. The games set a height INSIDE
.channel's zoom:1.15 context, pre-divided by 1.15. offsetHeight is LAYOUT px; getBoundingClientRect() is
VISUAL px. So visual/layout == 1.15 proves the zoom contract is reproduced, and == 1.00 is the round-1 bug.
"""
import os, sys
from playwright.sync_api import sync_playwright

# The gate serves the repo itself, on its own thread and its own port. It used to point at whatever
# dev server happened to be running on 8877; that server is single threaded, and after a few dozen
# pages a request from the harness would deadlock behind the browser's keep-alive connection.
import functools, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]
VP = {"width": 390, "height": 844}
ROOTS = {"goon":"#ggFrame", "lilboyfriend":"#lbStage", "sag":"#sgStage", "corgi":"#ccViewport",
         "djscratch":"#deck", "girlfriend":"#dgTrack", "fuel":"#stageCard", "armie":"#gameWrap"}

# armie hides #gameWrap until its picker is satisfied (armie.html:1114,1135). A root that is not measured
# is not a verdict, so the gate drives the real UI rather than skipping the game.
ARMIE_UNLOCK = """()=>{
  document.querySelector('#selStyles .styleCard').click();
  document.querySelector('#selExp .lvl').click();
  const s=document.getElementById('selSpecies');
  if(!s.value){ s.value=[...s.options].map(o=>o.value).find(v=>v)||s.options[1].value; }
  s.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('selStart').click();
}"""

def instrument(b):
    pg = b.new_page(viewport=VP); seen = []; errs = []
    pg.expose_function("__mbs", lambda t: seen.append(t))
    pg.add_init_script("document.addEventListener('mbs:lifecycle',e=>window.__mbs&&window.__mbs(e.detail.type))")
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    return pg, seen, errs

rows, ok = [], True
with sync_playwright() as pw:
    b = pw.chromium.launch()

    print("== zoom contract (visual/layout must be 1.15; 1.00 is the round-1 bug)")
    for slug, sel in ROOTS.items():
        pg, seen, errs = instrument(b)
        pg.goto(f"{BASE}/play/{slug}/", wait_until="load"); pg.wait_for_timeout(2600)
        if slug == "armie":
            pg.evaluate(ARMIE_UNLOCK); pg.wait_for_timeout(1800)
        m = pg.evaluate("""(sel)=>{const r=document.querySelector(sel);
            return r?{v:r.getBoundingClientRect().height,l:r.offsetHeight,
                      g:document.querySelector('.glass').getBoundingClientRect().height}:null}""", sel)
        z = (m["v"]/m["l"]) if (m and m["l"]) else 0
        clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
        good = bool(m) and m["v"] > 0 and abs(z-1.15) < 0.02 and "GAME_READY" in seen and not clean
        ok &= good
        print(f"  {'PASS' if good else 'FAIL'} {slug:13} {sel:12} visual={m['v']:7.1f} layout={m['l']:7.1f} "
              f"zoom={z:.3f} glass={m['g']:.0f}"
              f"{'  <-- NO ZOOM' if abs(z-1.0)<0.02 else ''}{('  ERR='+str(clean[:1])) if clean else ''}")
        pg.close()

    print("== GAME_READY means mounted, never earlier (D2)")
    pg, seen, _ = instrument(b)
    pg.goto(f"{BASE}/play/goon/", wait_until="commit")
    hosted = None
    for _ in range(40):
        pg.wait_for_timeout(50)
        if "GAME_READY" in seen:
            hosted = pg.evaluate("()=>!!document.querySelector('#channel [data-host]')"); break
    good = hosted is True; ok &= good
    print(f"  {'PASS' if good else 'FAIL'} READY observed with [data-host] already present = {hosted}")
    pg.close()

    print("== GAME_START is scoped to the game, not the page furniture (D2)")
    # goon is included deliberately: its game is a same-origin <iframe> (goon.html:95) whose events never
    # bubble to the parent, so it needs MBS.bindFrames() and no parent-side listener alone can serve it.
    for slug, target, in_frame in (("djscratch", "#scratchHand", False),
                                   ("lilboyfriend", "#lbStage", False),
                                   ("goon", "body", True)):
        for label, want in (("exit", False), ("game", True)):
            pg, seen, _ = instrument(b)
            pg.goto(f"{BASE}/play/{slug}/", wait_until="load"); pg.wait_for_timeout(3000)
            if not want:
                pg.click(".exit", no_wait_after=True)
            elif in_frame:
                pg.frame_locator("#ggGame").locator(target).click(position={"x":80,"y":80}, timeout=5000)
            else:
                pg.click(target, no_wait_after=True)
            pg.wait_for_timeout(400)
            got = "GAME_START" in seen; good = got == want; ok &= good
            print(f"  {'PASS' if good else 'FAIL'} {slug:13} {label:4} START={got} want={want}")
            pg.close()
    b.close()

import io

# --- Part A isolation: the page furniture is gone and the game is not.
#
# The main assertion is EXHAUSTIVE and needs no per-channel list of furniture: read the route's own
# declared roots, then require that every element inside #channel which actually renders is either
# inside a root or an ancestor of one. Anything else that renders is page the visitor can still see.
# A hand-written list of "these blocks must be gone" only ever tests the blocks somebody remembered
# (Codex round 2, finding 3), and it goes stale the moment a channel gains a section.
#
# What stays hand-written is the other direction: the game parts that must NOT be hidden. That cannot
# be derived, because several of them are legitimately hidden by their own game until it needs them -
# fuel's #fuFlavTag carries `hidden` until a flavour is picked, armie's #gameWrap until the picker is
# satisfied - so these are asserted on the CLASS mount applies, never on visibility.
ISOLATION = {
  "armie":       {"kept": ["#selectWrap", "#gameWrap", "#ar .arGrain"]},
  "corgi":       {"kept": ["#cc", "#ccMeter", "#ccPaws", "#ccBookStage", "#channel > svg"]},
  "djscratch":   {"kept": ["#deck", "#sigLbl", "#deckHint"]},
  "fuel":        {"kept": ["#stageCard", "#stackCard", "#flavCard", "#nameCard", "#fuFlavTag",
                           '#fu .card[aria-label="Your can"]', "#submitBtn"]},
  "girlfriend":  {"kept": ["#dgTrack", ".dg-flat"]},
  "goon":        {"kept": ["#ggFrame", "#ggGame", "#gnCode"]},
  "lilboyfriend":{"kept": ["#lbStage", "#lbCanvas", "#lbHud"]},
  "sag":         {"kept": ["#sgStage", "#sgTabs", "#sgWheelSec", "#sgInvSrc"]},
}

# Every rendering element inside #channel must be inside a declared root, or on the path to one. The
# path ancestors render their own box on purpose - they frame interleaved game status such as
# djscratch's signal line and fuel's flavour readout - so they are allowed; anything else is a leak.
OWNED = """()=>{
  const host = document.getElementById("channel");
  const cfg = JSON.parse(document.documentElement.dataset.roots || "null") || {};
  const roots = Array.isArray(cfg) ? cfg : (cfg.roots || []);
  const hides = (Array.isArray(cfg) ? [] : cfg.hide) || [];
  const keep = new Set(), path = new Set(), cut = new Set();
  for (const sel of roots) {
    let el = host.querySelector(sel);
    if (!el) {
      // a root may legally leave #channel at run time - sag pins its inventory bar into .glass
      // (sag.html:1083) - and once outside it cannot be furniture left rendering inside, so skip it.
      // Absent from the whole document is a different thing, and still a failure.
      el = document.querySelector(sel);
      if (!el) return ["ROOT MISSING " + sel];
      continue;
    }
    keep.add(el);
    for (let n = el.parentElement; n && n !== host; n = n.parentElement) path.add(n);
  }
  // hide SUBTRACTS from ownership, so a named exclusion inside a root is tested like any other page
  // node rather than inheriting the root's ownership
  for (const sel of hides) {
    const el = host.querySelector(sel);
    if (!el) return ["HIDE MISSING " + sel];
    cut.add(el);
  }
  const owned = (n) => {
    for (let p = n; p && p !== host; p = p.parentElement) {
      if (cut.has(p)) return false;          // whichever comes first walking up wins
      if (keep.has(p)) return true;
    }
    return false;
  };
  // "not rendering" is getClientRects().length === 0, which is true for a node inside a display:none
  // ancestor and false for a laid-out node of zero size - so a zero-geometry but focusable page control
  // is caught, which a width>0 && height>0 test would wave through. Media is checked separately because
  // a display:none <video> or <audio> still plays.
  const out = [];
  host.querySelectorAll("*").forEach(n => {
    if (owned(n) || path.has(n)) return;
    const playing = (n.tagName === "VIDEO" || n.tagName === "AUDIO") && !n.paused;
    if (n.getClientRects().length > 0 || playing)
      out.push(n.tagName.toLowerCase() + "." + String(n.className||"").split(" ")[0] + (playing ? " (playing)" : ""));
  });
  return out.slice(0, 5);
}"""

# hidden means mount hid this node or an ancestor of it, so walk up looking for the class
OFF = """(sel)=>{const n=document.querySelector(sel); if(!n) return "MISSING";
  for(let p=n; p; p=p.parentElement) if(p.classList && p.classList.contains("mbs-off")) return true;
  return false;}"""

# nothing mount hid may still occupy space, anywhere in the document - not just inside #channel, so a
# node the game MOVES out of #channel while still carrying .mbs-off is caught rather than missed
LEAK = """()=>{const out=[];
  document.querySelectorAll(".mbs-off").forEach(n=>{
    const r=n.getBoundingClientRect();
    if(r.height>0 || r.width>0) out.push(n.tagName.toLowerCase()+"."+(n.className||"").split(" ")[0]);
    if(!n.closest("#channel")) out.push("ESCAPED "+n.tagName.toLowerCase()+"#"+n.id);});
  return out.slice(0,3);}"""

print("== Part A isolation (page furniture hidden, game kept, nothing left rendering or escaped)")
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for slug, want in ISOLATION.items():
        pg, seen, errs = instrument(b)
        pg.goto(BASE + "/play/" + slug + "/", wait_until="load"); pg.wait_for_timeout(2600)
        bad = []
        unowned = pg.evaluate(OWNED)
        if unowned:
            bad.append("STILL PAGE " + str(unowned))
        for sel in want["kept"]:
            r = pg.evaluate(OFF, sel)
            if r is not False:
                bad.append("HIDDEN " + sel + ("(missing)" if r == "MISSING" else ""))
        leak = pg.evaluate(LEAK)
        if leak:
            bad.append("LEAK " + str(leak))
        good = not bad
        ok &= good
        verdict = "PASS" if good else "FAIL"
        detail = ("  " + "; ".join(bad)) if bad else ""
        print("  %s %-13s owned-check kept=%d%s" % (verdict, slug, len(want["kept"]), detail))
        pg.close()

    # sag's inventory bar is the one node that leaves #channel: the game moves it into .glass and clears
    # only its inline display, so a class hide would stick forever and the bar would never be seen again.
    print("== sag's moved inventory bar really renders where the game put it")
    pg, seen, errs = instrument(b)
    pg.goto(BASE + "/play/sag/", wait_until="load"); pg.wait_for_timeout(2600)
    inv = pg.evaluate("""()=>{const n=document.getElementById("sgInvSrc"); if(!n) return null;
        const r=n.getBoundingClientRect();
        return {h:Math.round(r.height), inGlass:!!n.closest(".glass"), off:n.classList.contains("mbs-off")};}""")
    good = bool(inv) and inv["h"] > 0 and inv["inGlass"] and not inv["off"]
    ok &= good
    print("  %s #sgInvSrc height=%s pinned-in-glass=%s carries-mbs-off=%s" %
          ("PASS" if good else "FAIL", inv and inv["h"], inv and inv["inGlass"], inv and inv["off"]))
    pg.close()

    # Two ways the registry can be wrong, and neither may serve the page as if it were the game.
    # Written as real routes and served normally rather than intercepted: Playwright's request
    # interception stalls navigation on a browser that has already driven every route above, and a
    # temporary file on disk tests exactly what a bad registry would actually deploy.
    SAG_PAGE = io.open(os.path.join(ROOT, "play", "sag", "index.html"), encoding="utf-8").read()
    CASES = (("unresolvable root", "#sgStage", "#thisDoesNotExist"),
             ("empty roots list", "[&quot;#sgStage&quot;, &quot;#sgInvSrc&quot;]", "[]"))
    made = []
    try:
        print("== fail closed on the registry as well as on the DOM")
        for i, (label, find, repl) in enumerate(CASES):
            d = os.path.join(ROOT, "play", "_gate%d" % i)
            if not os.path.isdir(d): os.makedirs(d)
            io.open(os.path.join(d, "index.html"), "w", encoding="utf-8", newline=chr(10)).write(
                SAG_PAGE.replace(find, repl))
            made.append(d)

            pg, seen, errs = instrument(b)
            pg.goto(BASE + "/play/_gate%d/" % i, wait_until="load"); pg.wait_for_timeout(2600)
            st = pg.evaluate('()=>({nodes:document.querySelectorAll("#channel *").length,'
                             'boot:!!document.getElementById("boot")})')
            good = st["nodes"] == 0 and st["boot"] is True and "GAME_READY" not in seen
            ok &= good
            print("  %s %-18s channel empty=%s boot shown=%s READY suppressed=%s" %
                  ("PASS" if good else "FAIL", label, st["nodes"] == 0, st["boot"], "GAME_READY" not in seen))
            pg.close()
    finally:
        for d in made:
            try:
                os.remove(os.path.join(d, "index.html")); os.rmdir(d)
            except OSError: pass
    b.close()

print("\nHOST CONTRACT REPRODUCED, LIFECYCLE CORRECT, GAME ISOLATED" if ok else "\nFAILURES ABOVE")
sys.exit(0 if ok else 1)
