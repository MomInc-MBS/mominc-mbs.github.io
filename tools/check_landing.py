# -*- coding: utf-8 -*-
"""The landing-card gate: every /games/<slug>/ must put its whole CTA inside the first phone viewport
at a real touch size, and must not clip its title at any tested width.

This is what survived of verify.py. Its play-route half is gone, because check_contract.py and
check_play.py now assert far more about the play routes than "it mounted with no console errors" - the
assertion that let round 1 pass 8/8 while three games rendered short.

Run:  python tools/check_landing.py     (serves the repo itself; nothing else need be running)
"""
import collections, functools, io, json, os, re, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

GEN_DIR = os.path.dirname(os.path.abspath(__file__))   # gen.py lives in the repo as of 2026-09-06
REG = json.load(io.open(os.path.join(ROOT, "tv", "registry.json"), encoding="utf-8"))
SIZES = [(320, 568), (360, 800), (390, 844), (430, 932)]

ok = True
print("== landing cards (whole CTA inside the first 320x568 viewport, no clipped title)")
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for g in REG["games"]:
        slug = g["slug"]
        errs = []
        pg = b.new_page(viewport={"width": 320, "height": 568})
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/games/" + slug + "/", wait_until="load")
        pg.wait_for_timeout(350)

        # Posters are the launch target; Armie's locked page points back to DJ.
        cta = pg.locator("a.cta, a.cta-still, #gate a").first
        box = cta.bounding_box() or {}
        h, w = round(box.get("height", 0)), round(box.get("width", 0))
        bottom = round(box.get("y", 0) + box.get("height", 0))
        in_fold = bottom <= 568 and h >= 44 and w >= 44      # 44px is the smallest honest touch target

        clip = []
        for vw, vh in SIZES:
            pg.set_viewport_size({"width": vw, "height": vh}); pg.wait_for_timeout(120)
            over = pg.evaluate("()=>{const t=document.querySelector('.title');"
                               "return t?Math.round(t.scrollWidth-t.clientWidth):-1}")
            if over > 1:
                clip.append("%dpx@%d" % (over, vw))

        clean = [e for e in errs if "favicon" not in e]
        good = in_fold and not clip and not clean
        ok &= good
        print("  %s %-13s cta=%-18s %dx%d bottom=%d%s%s" %
              ("PASS" if good else "FAIL", slug, (cta.inner_text() or "").strip()[:18], w, h, bottom,
               ("  CLIP=" + str(clip)) if clip else "",
               ("  ERR=" + str(clean[:1])) if clean else ""))
        pg.close()
    b.close()



# --- The card is no longer just a launch button, so the gate is no longer just a CTA check.
#
# Two things are being defended here. First, that every promise the card makes is one the code keeps:
# the profile really does stay on the device, the resume state really does match what the game saves,
# and the share image really does resolve. Second, and more important, that everything which could
# become a LIE if it were rendered early stays suppressed until it is configured - a mission block with
# no broadcast behind it, a reminder for a date nobody confirmed, or an identity form with nowhere to
# send an address. The suppression is tested in BOTH directions: absent when unconfigured, present when
# configured, because a switch that is only ever tested in the off position is not known to work.
REG = json.load(io.open(os.path.join(ROOT, "tv", "registry.json"), encoding="utf-8"))
GAMES = {g["slug"]: g for g in REG["games"]}
# sag and armie are coming_soon: no play route, no finish, no profile form, not a stop on the onward
# cycle. Anywhere this file needs one representative playable route to probe, it picks the first of these
# rather than a hard-coded slug, so it cannot go stale the next time a channel's status changes.
PLAYABLE = [g for g in REG["games"] if g.get("status") != "coming_soon"]
PROBE_SLUG = PLAYABLE[0]["slug"]

print("== accent text is legible on every card, not just the ones with a bright accent")
# This class of bug has bitten twice: the CTA (dark ink on Corgi's dark purple) and then every accent
# LABEL on a dark panel. Both were found by eye, which is not a method. The contrast is computed here
# instead, against the real composited background, so the next dark accent added to the registry fails
# the gate rather than shipping.
CONTRAST = """(sels)=>{
  // Resolve every colour by painting one pixel and reading it back. Parsing computed strings is not
  // safe here: Chromium returns a color-mix() as color(srgb 0.99 0.95 0.8), whose 0-1 components a
  // naive regex reads as 0-255 and scores as near-black. The canvas cannot be wrong about this.
  const ctx = document.createElement("canvas").getContext("2d", {willReadFrequently: true});
  const px = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = (c) => { const f = c.slice(0, 3).map(v => { v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };

  // collect background layers up the tree until an opaque one, then composite bottom-up
  const bgOf = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = px(getComputedStyle(n).backgroundColor);
      if (c[3] === 0) continue;
      layers.push(c);
      if (c[3] === 1) break;
    }
    if (!layers.length || layers[layers.length - 1][3] !== 1) layers.push([255, 255, 255, 1]);
    let acc = layers[layers.length - 1].slice(0, 3);
    for (let i = layers.length - 2; i >= 0; i--) {
      const L = layers[i], a = L[3];
      acc = [L[0]*a + acc[0]*(1-a), L[1]*a + acc[1]*(1-a), L[2]*a + acc[2]*(1-a)];
    }
    return acc;
  };
  const out = [];
  for (const sel of sels) {
    const el = document.querySelector(sel);
    if (!el) continue;                       // not every card renders every component
    const l1 = lum(px(getComputedStyle(el).color)), l2 = lum(bgOf(el));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    out.push([sel, Math.round(ratio * 100) / 100]);
  }
  return out;
}"""
ACCENT_ON_DARK = [".facts dt", ".profile-voice", ".profile-count", ".next-lead", "#play", ".cta-2"]
MIN_RATIO = 4.5

with sync_playwright() as pw:
    _b = pw.chromium.launch()
    for g in REG["games"]:
        _pg = _b.new_page(viewport={"width": 390, "height": 844})
        _pg.goto(BASE + "/games/" + g["slug"] + "/", wait_until="load"); _pg.wait_for_timeout(300)
        rows = _pg.evaluate(CONTRAST, ACCENT_ON_DARK)
        weak = [(s, r) for s, r in rows if r < MIN_RATIO]
        good = not weak
        ok &= good
        print("  %s %-13s worst %.2f:1%s" %
              ("PASS" if good else "FAIL", g["slug"],
               min([r for _, r in rows] or [99]), ("  UNDER=" + str(weak)) if weak else ""))
        _pg.close()
    _b.close()


print("== share previews resolve, and the published size matches the real file")
for g in REG["games"]:
    fp = os.path.join(ROOT, "tv", g["share_image"].replace("/", os.sep))
    bad = []
    if not os.path.isfile(fp):
        bad.append("missing file")
    else:
        # real size straight off the PNG header, compared with what the card publishes. Existence alone
        # would have let the old hard-coded 512x512 through on every card.
        with io.open(fp, "rb") as fh:
            head = fh.read(24)
        w = int.from_bytes(head[16:20], "big")
        h = int.from_bytes(head[20:24], "big")
        page = io.open(os.path.join(ROOT, "games", g["slug"], "index.html"), encoding="utf-8").read()
        mw = re.search(r'og:image:width" content="(\d+)"', page)
        mh = re.search(r'og:image:height" content="(\d+)"', page)
        malt = re.search(r'og:image:alt" content="([^"]*)"', page)
        if not mw or int(mw.group(1)) != w: bad.append("width says %s, file is %d" % (mw and mw.group(1), w))
        if not mh or int(mh.group(1)) != h: bad.append("height says %s, file is %d" % (mh and mh.group(1), h))
        # the two channels with no mark of their own publish MOM's, and must say so
        want_mom = g["share_image"].endswith("mom-inc-mark.png")
        if malt and (("MOM Inc" in malt.group(1)) != want_mom):
            bad.append("alt %r does not describe the image published" % malt.group(1))
    good = not bad
    ok &= good
    print("  %s %-13s %-28s%s" % ("PASS" if good else "FAIL", g["slug"], g["share_image"],
                                  ("  " + "; ".join(bad)) if bad else ""))

print("== the onward route is a complete cycle, and every stop exists")
order = sorted(PLAYABLE, key=lambda g: g["ch"])
hops, seen, cur = [], set(), order[0]["slug"]
for _ in range(len(order)):
    hops.append(cur); seen.add(cur)
    html_ = io.open(os.path.join(ROOT, "games", cur, "index.html"), encoding="utf-8").read()
    m = re.search(r'data-next-slug="([a-z]+)"', html_)
    cur = m.group(1) if m else ""
good = len(seen) == len(order) and cur == order[0]["slug"] and all(s in GAMES for s in hops)
ok &= good
print("  %s %d channels, cycle closes back to %s" % ("PASS" if good else "FAIL", len(seen), cur))

print("== nothing unconfigured is claimed, and the switch works when it is configured")
probe = io.open(os.path.join(ROOT, "games", PROBE_SLUG, "index.html"), encoding="utf-8").read()
absent = [t for t in ('class="mission', 'id="remindBtn"', 'id="identityForm"', "Watch MBS live") if t in probe]
present = "Saved only in this browser; nothing is sent." in probe
good = not absent and present
ok &= good
print("  %s off: no mission block, no reminder, no identity form%s; the honest note is shown=%s"
      % ("PASS" if good else "FAIL", ("  LEAKED=" + str(absent)) if absent else "", present))

# turn it on, regenerate, look, then put the registry back exactly as it was
_reg_path = os.path.join(ROOT, "tv", "registry.json")
_orig = io.open(_reg_path, encoding="utf-8").read()
try:
    _r = json.loads(_orig, object_pairs_hook=collections.OrderedDict)
    _r["live"].update({"state": "live", "broadcast_url": "https://example.invalid/live",
                       "next_broadcast_at": "2026-09-10T19:00:00-07:00",
                       "schedule_label": "Wednesdays, 7 PM PT",
                       "rules_url": "https://example.invalid/rules"})
    io.open(_reg_path, "w", encoding="utf-8", newline="\n").write(json.dumps(_r, indent=2, ensure_ascii=False) + "\n")
    subprocess.run([sys.executable, "gen.py"], cwd=GEN_DIR, capture_output=True)
    live_html = io.open(os.path.join(ROOT, "games", PROBE_SLUG, "index.html"), encoding="utf-8").read()
    want = ('class="mission is-live"', "Live now", 'id="remindBtn"', "Watch MBS live",
            "published rules", 'data-live-at="2026-09-10')
    missing = [t for t in want if t not in live_html]
    good = not missing
    ok &= good
    print("  %s on:  mission, reminder and live link all render%s"
          % ("PASS" if good else "FAIL", ("  MISSING=" + str(missing)) if missing else ""))
finally:
    io.open(_reg_path, "w", encoding="utf-8", newline="\n").write(_orig)
    subprocess.run([sys.executable, "gen.py"], cwd=GEN_DIR, capture_output=True)

print("== the identity form, when switched on, can actually collect an address")
_orig2 = io.open(_reg_path, encoding="utf-8").read()
try:
    _r2 = json.loads(_orig2, object_pairs_hook=collections.OrderedDict)
    _r2["identity_api"] = "https://example.invalid/verify"
    io.open(_reg_path, "w", encoding="utf-8", newline=chr(10)).write(
        json.dumps(_r2, indent=2, ensure_ascii=False) + chr(10))
    subprocess.run([sys.executable, "gen.py"], cwd=GEN_DIR, capture_output=True)
    idh = io.open(os.path.join(ROOT, "games", PROBE_SLUG, "index.html"), encoding="utf-8").read()
    # a verification form with no address field would post a channel choice and nothing else, which is
    # how the dormant version shipped; switching it on has to produce a form that can do its job
    want = ('id="identityForm"', 'name="address"', 'name="channel"', "Send verification code")
    missing = [t for t in want if t not in idh]
    still_deferred = "There is nowhere to send this" in idh
    good = not missing and not still_deferred
    ok &= good
    print("  %s form has an address field and the deferred note steps aside%s"
          % ("PASS" if good else "FAIL", ("  MISSING=" + str(missing)) if missing else ""))
finally:
    io.open(_reg_path, "w", encoding="utf-8", newline=chr(10)).write(_orig2)
    subprocess.run([sys.executable, "gen.py"], cwd=GEN_DIR, capture_output=True)

print("== a browser that refuses storage is told the truth, not told it saved")
with sync_playwright() as pw:
    _b = pw.chromium.launch()
    _pg = _b.new_page(viewport={"width": 390, "height": 844})
    # private windows and blocked site data throw here; the card used to answer "Saved" anyway
    _pg.add_init_script("Object.defineProperty(Storage.prototype,'setItem',"
                        "{value:function(){throw new Error('blocked')}})")
    _pg.goto(BASE + "/games/" + PROBE_SLUG + "/", wait_until="load"); _pg.wait_for_timeout(350)
    _pg.locator("details.profile").evaluate("el => el.open = true")
    _pg.fill("#%s-q1" % PROBE_SLUG, "probe")
    _pg.locator("details.profile").evaluate("el => el.open = true")
    _pg.click("#profileForm button[type=submit]"); _pg.wait_for_timeout(250)
    said = _pg.inner_text("#profileSaved")
    good = "not letting" in said
    ok &= good
    print("  %s says %r" % ("PASS" if good else "FAIL", said[:70]))
    _pg.close(); _b.close()


print("== the profile keeps its promise: on this device, and gone when asked")
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for g in PLAYABLE:      # a coming_soon page carries no game and no profile form to make this promise
        slug = g["slug"]
        errs = []
        pg = b.new_page(viewport={"width": 390, "height": 844})
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "/games/" + slug + "/", wait_until="load"); pg.wait_for_timeout(350)
        bad = []

        pg.locator("details.profile").evaluate("el => el.open = true")
        n = pg.locator("#profileForm textarea").count()
        if n != len(g["profile_questions"]):
            bad.append("questions=%d want=%d" % (n, len(g["profile_questions"])))

        # write one answer, prove it survives a reload, then prove delete really deletes
        pg.fill("#%s-q1" % slug, "gate probe")
        pg.locator("details.profile").evaluate("el => el.open = true")
        pg.click("#profileForm button[type=submit]"); pg.wait_for_timeout(250)
        # coach answers live in the one shared store's `drafts` as of 2.10; card.js's own
        # `mbs-coach-profile` key was a third source of truth and is now adopted into it on load.
        # Same coverage as before, read through the store that is actually authoritative.
        sent = pg.evaluate("()=>Object.keys(window.MBS_STATE.read().drafts)")
        if slug not in sent:
            bad.append("not saved")
        pg.reload(wait_until="load"); pg.wait_for_timeout(350)
        if pg.input_value("#%s-q1" % slug) != "gate probe":
            bad.append("did not survive reload")
        pg.locator("details.profile").evaluate("el => el.open = true")
        pg.click("#profileDelete"); pg.wait_for_timeout(250)
        left = pg.evaluate("()=>Object.keys(window.MBS_STATE.read().drafts)")
        if slug in left:
            bad.append("delete left it behind")

        # a resume claim is allowed only where the game truly writes that key
        key, label = g.get("progress_key"), g.get("continue_cta")
        if key:
            # a real save is a JSON object, so that is what is written; then a corrupt value is written
            # to prove a stale or junk key cannot claim progress the game could not actually resume
            pg.evaluate("(k)=>localStorage.setItem(k, JSON.stringify({resumed:true}))", key)
            pg.reload(wait_until="load"); pg.wait_for_timeout(350)
            if pg.locator("#resume").is_hidden() or pg.inner_text("#play").strip().upper() != label.upper():
                bad.append("resume did not offer %r" % label)
            for junk, why in (("not json", "corrupt"), ("{}", "empty")):
                pg.evaluate("([k,v])=>localStorage.setItem(k,v)", [key, junk])
                pg.reload(wait_until="load"); pg.wait_for_timeout(350)
                if pg.locator("#resume").is_visible():
                    bad.append("claimed progress from a %s save" % why)
            pg.evaluate("(k)=>localStorage.removeItem(k)", key)
        else:
            if pg.locator("#resume").is_visible():
                bad.append("claims saved progress with no key")

        clean = [e for e in errs if "favicon" not in e]
        if clean:
            bad.append("ERR=" + str(clean[:1]))
        good = not bad
        ok &= good
        print("  %s %-13s %s" % ("PASS" if good else "FAIL", slug, "; ".join(bad) if bad else
                                 ("saves, survives, deletes" + (", resumes" if key else ", claims no save"))))
        pg.close()
    b.close()

print("\nLANDING CARDS PASS" if ok else "\nFAILURES ABOVE")
sys.exit(0 if ok else 1)
