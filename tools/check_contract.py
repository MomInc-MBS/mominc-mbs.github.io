# -*- coding: utf-8 -*-
"""The play-route host-contract gate. Replaces verify_host.py and four ad-hoc scripts.

WHY THIS SHAPE. Round 1 passed 8/8 while three games rendered 13% short, because the gate only asserted
"mounted, no console errors". Two later attempts were also wrong:
  * comparing play-route height to television height -- .glass is legitimately a different size on /tv/
    (a ~183px control panel shares the viewport) than on /play/ (the game is the whole screen);
  * asserting rendered height as a percentage of .glass -- sag's reserve is heroH + ribbonH + 26, which is
    content-dependent, so 0.80 is correct for sag and says nothing about the zoom.

ROUNDS 1-6 measured the zoom itself: the games sized inside .channel's zoom:1.15 and pre-divided by
1.15, so visual/layout == 1.15 proved the play route reproduced the television's zoom and == 1.00 was
the round-1 bug. **2.16/C002 retired that zoom**, so the ratio is now 1.00 everywhere and the old
assertion is inverted, not deleted: a play route that drifts back to any zoom or stray ancestor scale
fails here, which is the regression the retirement can actually suffer.

That leaves the ORIGINAL bug -- a game rendering short and leaving dead black -- needing its own check,
and it cannot be one formula for all five. Only two of these roots fit themselves to .glass (corgi's
#ccViewport and lilboyfriend's #lbStage, both via a measured fitViewport()). #deck and #dgTrack are
scroll tracks, legitimately taller than the glass, and fuel's #stageCard is a flex card that never
claimed the height. So the fill assertion applies to the fitted pair only, and says so per row rather
than averaging a number that means nothing for the other three.
"""
import html, io, json, os, re, sys
from playwright.sync_api import sync_playwright

# The gate serves the repo itself, on its own thread and its own port. It used to point at whatever
# dev server happened to be running on 8877; that server is single threaded, and after a few dozen
# pages a request from the harness would deadlock behind the browser's keep-alive connection.
import functools, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
REG = json.load(io.open(os.path.join(ROOT, "tv", "registry.json"), encoding="utf-8"))
ACTIVE_GAMES = [g for g in REG["games"] if g.get("status") != "coming_soon"]

class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]
VP = {"width": 390, "height": 844}
# sag and armie are coming_soon (no play route) and are gone from this dict. corgi's selector really is
# #ccViewport, not registry.json's isolation root #cc: #ccViewport is the element corgi.html itself sizes
# to visualTarget (corgi.html's fitViewport), which is the one thing this check can measure; #cc is one
# level up and exists for isolation (what stays visible), a different job. Neither is stale.

# --- suppressed channels (C081/C084). GOON's compiled bundle asks visitors for card details, so its
# route is closed and /play/goon/ 404s. Its checks below skip rather than being deleted, because a
# deleted test is invisible where a SKIPPED line is not. Two of them were GOON's only because GOON
# happened to be the site's only same-origin iframe, and 3.G0 gave each a fixture under
# tools/fixtures/ instead: the coverage no longer depends on this set. Remove the slug here when the
# C084 rebuild lands and the goon rows come back on their own.
SUPPRESSED = {"goon"}

ROOTS = {"lilboyfriend":"#lbStage", "corgi":"#ccViewport",
         "djscratch":"#deck", "girlfriend":"#dgTrack", "fuel":"#stageCard"}

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

    # the fitted pair: the only roots that size themselves against .glass, so the only ones where
    # "short" is even defined. 0.90 is well clear of both live values (corgi .957, lilboyfriend 1.00)
    # and well above the ~.83 a reintroduced 13%-short bug would produce.
    FITTED = {"corgi": 0.90, "lilboyfriend": 0.90}
    print("== zoom contract (visual/layout must be 1.00; 2.16 retired .channel's zoom:1.15)")
    for slug, sel in ROOTS.items():
        pg, seen, errs = instrument(b)
        pg.goto(f"{BASE}/play/{slug}/", wait_until="load"); pg.wait_for_timeout(2600)
        m = pg.evaluate("""(sel)=>{const r=document.querySelector(sel);
            return r?{v:r.getBoundingClientRect().height,l:r.offsetHeight,
                      g:document.querySelector('.glass').getBoundingClientRect().height}:null}""", sel)
        z = (m["v"]/m["l"]) if (m and m["l"]) else 0
        clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
        frac = (m["v"]/m["g"]) if (m and m["g"]) else 0
        floor = FITTED.get(slug)
        fits = (frac >= floor) if floor else True
        good = bool(m) and m["v"] > 0 and abs(z-1.0) < 0.02 and fits and "GAME_READY" in seen and not clean
        ok &= good
        fill = (f"  fill={frac:.3f} (>= {floor:.2f})" if floor else "  fill n/a, not glass-fitted")
        print(f"  {'PASS' if good else 'FAIL'} {slug:13} {sel:12} visual={m['v']:7.1f} layout={m['l']:7.1f} "
              f"zoom={z:.3f} glass={m['g']:.0f}{fill}"
              f"{'  <-- ZOOM IS BACK' if abs(z-1.0)>=0.02 else ''}"
              f"{'  <-- SHORT' if (floor and not fits) else ''}"
              f"{('  ERR='+str(clean[:1])) if clean else ''}")
        pg.close()

    print("== GAME_READY means mounted, never earlier (D2)")
    pg, seen, _ = instrument(b)
    # was /play/goon/ until GOON was suppressed; lilboyfriend exercises the same [data-host] contract
    pg.goto(f"{BASE}/play/lilboyfriend/", wait_until="commit")
    hosted = None
    for _ in range(40):
        pg.wait_for_timeout(50)
        if "GAME_READY" in seen:
            hosted = pg.evaluate("()=>!!document.querySelector('#channel [data-host]')"); break
    good = hosted is True; ok &= good
    print(f"  {'PASS' if good else 'FAIL'} READY observed with [data-host] already present = {hosted}")
    pg.close()

    print("== GAME_START is scoped to the game, not the page furniture (D2)")
    # goon is included deliberately: its game is a same-origin <iframe> (goon.html:136) whose events never
    # bubble to the parent, so it needs MBS.bindFrames() and no parent-side listener alone can serve it.
    #
    # 3.G0: while goon is suppressed its slot runs tools/fixtures/bindframes.html instead of printing a
    # SKIPPED line. GOON was the site's only same-origin iframe, so the skip had retired the sole
    # MBS.bindFrames() coverage; the fixture is that shape against the real shim and no game at all.
    # The substitution is one branch on SUPPRESSED, so goon's own case returns of its own accord the
    # moment the slug leaves that set - and if it ever leaves with nothing having replaced this
    # fixture, the branch is what puts the named SKIPPED back rather than losing the row in silence.
    def in_frame_fixture():
        """The in-frame GAME_START case, without GOON. Matched pair: bound must hear the click through
        the document boundary, unbound must not. A one-sided pass would prove only that clicking
        somewhere emits something, which is true of every other row in this section."""
        good = True
        for label, bind, want in (("bound", "1", True), ("unbound", "0", False)):
            pg, seen, _ = instrument(b)
            pg.goto(f"{BASE}/tools/fixtures/bindframes.html?bind={bind}", wait_until="load")
            pg.wait_for_timeout(400)
            pg.frame_locator("#fxGame").locator("#fxStage").click(position={"x": 40, "y": 40}, timeout=5000)
            pg.wait_for_timeout(400)
            got = "GAME_START" in seen; hit = got == want; good &= hit
            print(f"  {'PASS' if hit else 'FAIL'} {'fixture':13} {label:8} bindFrames={bind == '1'} "
                  f"in-frame START={got} want={want}")
            pg.close()
        return good

    for slug, target, in_frame in (("djscratch", "#scratchHand", False),
                                   ("lilboyfriend", "#lbStage", False),
                                   ("goon", "body", True)):
        if slug in SUPPRESSED:
            if in_frame:
                ok &= in_frame_fixture()
            else:
                print(f"  SKIPPED {slug} (suppressed) - NO coverage of this row while this holds")
            continue
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
  "corgi":       {"kept": ["#cc", "#ccMeter", "#ccPaws", "#ccBookStage", "#channel > svg"]},
  "djscratch":   {"kept": ["#deck", "#sigLbl", "#deckHint"]},
  "fuel":        {"kept": ["#stageCard", "#stackCard", "#flavCard", "#nameCard", "#fuFlavTag",
                           '#fu .card[aria-label="Your can"]', "#submitBtn"]},
  "girlfriend":  {"kept": ["#dgTrack", ".dg-flat"]},
  "lilboyfriend":{"kept": ["#lbStage", "#lbCanvas", "#lbHud"]},
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

    # Two ways the registry can be wrong, and neither may serve the page as if it were the game.
    # Written as real routes and served normally rather than intercepted: Playwright's request
    # interception stalls navigation on a browser that has already driven every route above, and a
    # temporary file on disk tests exactly what a bad registry would actually deploy.
    # The base fixture is registry-selected, not a name hard-coded here: sag was that fixture until it
    # went coming_soon and its play route stopped existing, so this picks whichever active game is first
    # in the registry rather than going stale the next time a channel's status changes.
    FC_GAME = ACTIVE_GAMES[0]
    FC_SLUG = FC_GAME["slug"]
    FC_PAGE = io.open(os.path.join(ROOT, "play", FC_SLUG, "index.html"), encoding="utf-8").read()

    def _with_roots(page, roots):
        payload = html.escape(json.dumps({"roots": roots, "hide": FC_GAME["hide"]}, ensure_ascii=False), quote=True)
        return re.sub(r'data-roots="[^"]*"', 'data-roots="%s"' % payload, page, count=1)

    CASES = (("unresolvable root", _with_roots(FC_PAGE, ["#thisDoesNotExist"])),
             ("empty roots list", _with_roots(FC_PAGE, [])))
    made = []
    try:
        print("== fail closed on the registry as well as on the DOM (base fixture: %s)" % FC_SLUG)
        for i, (label, page_html) in enumerate(CASES):
            d = os.path.join(ROOT, "play", "_gate%d" % i)
            if not os.path.isdir(d): os.makedirs(d)
            io.open(os.path.join(d, "index.html"), "w", encoding="utf-8", newline=chr(10)).write(page_html)
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
