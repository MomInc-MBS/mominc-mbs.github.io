"""Drive MOM Inc's inspection booth and the goon's unlock window.

3.3 packet 5 / C091, C093, C097. Three defects that no existing check could see, because every one of
them is a behaviour rather than a shape: check_teardown mounts the channel and fires ONE 'a' to prove
the document listener is released, which passes identically whether 'a' means APPROVE or DENY.

C093 - the keyboard stamped the OPPOSITE of the pointer. `a` wrote DENY and `d` wrote APPROVE while
the mouse path directly above them was correct, so a visitor using the keyboard recorded the reverse
of their own judgement and was then graded on it. There was also no `e.repeat` guard (a held key
stamped a run of cards) and no target check (typing "a" into any field on the channel stamped one).
Sections 2-6 drive all four: the mapping in both directions, the repeat, the field, and the letters
now printed on the stamps themselves.

C091 - the key was a flat id->letter map under a comment citing ANSWER-KEY.md, a file in neither
tree. The booth graded people against a basis they could not read. Sections 7-10 read the record back
off the RENDERED page from a seeded save - the source is not its own witness, so asserting against
mominc.js would prove nothing about what a visitor sees. Section 8 also takes the filenames the page
prints and checks each one against the images actually on disk: a provenance line that names a file
that is not there is the exact failure C091 exists to end.

C097 - `explode()` ended in a 2.6s reveal nothing could cancel. `ctx.timeout` is runtime-owned so a
CHANNEL CHANGE cancelled it, but a `disarm()` inside the same channel did not, and the stale timer
printed THE REAL PROGRAM IS OPEN after the window had closed. Sections 11-12 are a matched pair on
fresh pages: disarm inside the window (must stay silent) and the same drive without the disarm (must
speak). A one-sided "stayed silent" would pass on a channel whose explode had simply stopped working.

mominc is the hub channel and has no gameRoute (check_gameframe), so this drives /tv/?ch=mominc.
"""
import functools, json, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join("D:\\", "MBS Pages")
ITER_DIR = os.path.join(ROOT, "tv", "assets", "iterations")
INSPECT_KEY = "mbs-mominc-inspect-v2"


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]
URL = BASE + "/tv/?ch=mominc&mode=live"   # off airtime a #dark overlay covers the channel and eats clicks

ok = True


def check(cond, msg):
    global ok
    ok &= bool(cond)
    print("  %s %s" % ("PASS" if cond else "FAIL", msg))


def recs(page):
    """The booth's saved verdicts, id -> 'a'|'d', straight out of localStorage."""
    raw = page.evaluate("k => localStorage.getItem(k)", INSPECT_KEY)
    return (json.loads(raw) or {}).get("recs", {}) if raw else {}


def basis_lines(page):
    """Every line the booth prints under WHAT YOU ARE BEING GRADED AGAINST, as rendered."""
    return page.evaluate(
        "() => Array.from(document.querySelectorAll('#miBasis span')).map(s => s.textContent)")


def fire(page, key, **kw):
    kw.setdefault("repeat", False)
    page.evaluate("a => document.dispatchEvent(new KeyboardEvent('keydown', a))",
                  dict(kw, key=key, bubbles=True))


def power_on(page):
    """Turn the set on without toggling it off - copied from check_press, for the same reason.

    Off, `#dark` covers the glass as a sibling of the screen and eats every click, so a pointer
    probe silently measures the off-state overlay instead of the channel.
    """
    for _ in range(3):
        if page.evaluate("() => document.querySelector('.tv').dataset.state === 'on'"):
            return True
        page.click(".power", timeout=3000)
        page.wait_for_timeout(2600)
    return page.evaluate("() => document.querySelector('.tv').dataset.state === 'on'")


def open_booth(pw, seed=None):
    """A fresh context on the channel, powered on, optionally with the booth's save pre-loaded."""
    b = pw.chromium.launch()
    page = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    page.goto(URL, wait_until="load")
    page.wait_for_selector("#miDeny", timeout=10000)
    if seed is not None:
        # seeded, then RELOADED: the record has to survive the channel's own boot and be printed by
        # its render path, not injected into a DOM that is already on screen.
        page.evaluate("a => localStorage.setItem(a[0], a[1])",
                      [INSPECT_KEY, json.dumps({"v": 2, "recs": seed})])
        page.reload(wait_until="load")
        page.wait_for_selector("#miDeny", timeout=10000)
    if not power_on(page):
        raise SystemExit("could not power the set on; every pointer probe below would be a lie")
    return b, page, errs


with sync_playwright() as pw:
    all_errs = []

    print("== 1. the booth is mounted and the cards are real")
    b, pg, errs = open_booth(pw)
    ids = pg.evaluate("""() => Array.from(document.querySelectorAll('#channel .itcard')).map(c => {
        const i = c.querySelector('.itfront img'); const m = i && i.getAttribute('src').match(/(myr-\\d+)-/);
        return m ? m[1] : null; })""")
    check(len(ids) == 15 and all(ids), "fifteen iteration cards, every one with a readable id")
    check(len(set(ids)) == 15, "and no id is used twice")
    check(pg.evaluate("() => !!document.querySelector('#miBasis')"),
          "the booth prints a basis panel (#miBasis exists)")

    print("== 2. C093: D denies and A approves - the letters mean what the buttons say")
    fire(pg, "d")
    r = recs(pg)
    check(r.get(ids[0]) == "d", "pressing D stamps DENY on the current card (%s -> %s)" % (ids[0], r.get(ids[0])))
    fire(pg, "a")
    r = recs(pg)
    check(r.get(ids[1]) == "a", "pressing A stamps APPROVE on the next one (%s -> %s)" % (ids[1], r.get(ids[1])))
    check(len(r) == 2, "and two keys stamped exactly two cards (%d)" % len(r))

    print("== 3. C093: the pointer and the keyboard now agree")
    pg.click("#miDeny")
    pg.click("#miApprove")
    r = recs(pg)
    check(r.get(ids[2]) == "d" and r.get(ids[3]) == "a",
          "clicking DENY then APPROVE writes the same pair the keys did (%s, %s)" % (r.get(ids[2]), r.get(ids[3])))

    print("== 4. C093: a HELD key stamps once, not a run")
    before = len(recs(pg))
    for _ in range(8):
        fire(pg, "d", repeat=True)
    check(len(recs(pg)) == before,
          "eight auto-repeat events stamped nothing (%d cards before, %d after)" % (before, len(recs(pg))))
    fire(pg, "d")
    check(len(recs(pg)) == before + 1, "and the next real keypress still stamps, so the guard is not a mute button")

    print("== 5. C093: typing into a field on the channel does not stamp")
    pg.evaluate("""() => { const i = document.createElement('input'); i.id = '__probe';
        document.getElementById('channel').appendChild(i); i.focus(); }""")
    before = len(recs(pg))
    pg.evaluate("""() => document.getElementById('__probe').dispatchEvent(
        new KeyboardEvent('keydown', {key:'a', bubbles:true}))""")
    check(len(recs(pg)) == before, "an 'a' typed into an input on the channel stamps nothing")
    pg.evaluate("() => document.getElementById('__probe').remove()")

    print("== 6. C093: the arrows follow the buttons, and the buttons carry their letter")
    before = len(recs(pg))
    fire(pg, "ArrowLeft")
    fire(pg, "ArrowRight")
    r = recs(pg)
    got = [r[i] for i in ids[before:before + 2]]
    check(got == ["d", "a"], "ArrowLeft is the left button (DENY) and ArrowRight the right (APPROVE): %s" % got)
    txt = pg.evaluate("""() => ({ d: document.querySelector('#miDeny').textContent,
                                  a: document.querySelector('#miApprove').textContent,
                                  hint: document.querySelector('#miHintText').textContent })""")
    check(re.search(r"DENY\s*D\b", txt["d"]) and re.search(r"APPROVE\s*A\b", txt["a"]),
          "each stamp prints its own key, so the binding is readable off the button (%r / %r)" % (txt["d"], txt["a"]))
    check("D to deny" in txt["hint"] and "A to approve" in txt["hint"],
          "and the hint names which letter does which, not just 'A / D' (%r)" % txt["hint"])
    all_errs += errs
    b.close()

    print("== 7. C091: a stamped card prints its record; an unstamped one does not")
    b, pg, errs = open_booth(pw, seed={"myr-01": "d"})
    lines = basis_lines(pg)
    head = lines[0] if lines else ""
    check(re.search(r"KEY mominc-inspection-key-[\d.]+, SNAPSHOT \d{4}-\d\d-\d\d", head),
          "the panel opens with a versioned, dated key record (%r)" % head[:60])
    check("not a measure" in head or "not image forensics" in head,
          "and it states plainly that the score is not an AI-detection benchmark")
    one = [l for l in lines[1:] if "myr-01" in l]
    check(len(one) == 1, "the one stamped card prints exactly one record line (%d)" % len(one))
    for field in ("ORIGIN:", "TELL:", "FILED:", "YOU STAMPED:"):
        check(field in one[0], "that line carries %s" % field)
    check(not any("myr-03" in l or "myr-05" in l for l in lines[1:]),
          "and no unstamped card's answer is printed - the panel is not a spoiler")
    all_errs += errs
    b.close()

    print("== 8. C091: every file the page names is a file that exists")
    every_d = {i: "d" for i in ids}
    b, pg, errs = open_booth(pw, seed=every_d)
    lines = basis_lines(pg)
    check(len(lines) == 16, "fifteen records under one header (%d lines)" % len(lines))
    files = re.findall(r"(myr-\d+-[a-z0-9-]+\.png)", " ".join(lines))
    check(len(files) == 15, "each record names the image it is about (%d filenames)" % len(files))
    missing = [f for f in files if not os.path.exists(os.path.join(ITER_DIR, f))]
    check(not missing, "and every named file is on disk in tv/assets/iterations (%s)" % (missing or "none missing"))
    check(not any("ANSWER-KEY" in l for l in lines),
          "nothing points the visitor at ANSWER-KEY.md, which exists in neither tree")
    src = open(os.path.join(ROOT, "tv", "channels", "mominc.js"), encoding="utf-8").read()
    check("ANSWER-KEY.md" not in src, "and the dangling citation is gone from the source too")

    print("== 9. C091: the printed record is the one the grading uses")
    filed = dict(zip(re.findall(r"\((myr-\d+),", " ".join(lines[1:])),
                     re.findall(r"FILED: (DENY|APPROVE)", " ".join(lines[1:]))))
    check(len(filed) == 15, "the page prints a filed answer for all fifteen (%d)" % len(filed))
    approves = [k for k, v in filed.items() if v == "APPROVE"]
    check(approves == ["myr-10"], "exactly one card is filed APPROVE, and it is the reveal (%s)" % approves)
    score = pg.evaluate("() => document.querySelector('#miScore').textContent")
    check("14/15 CORRECT" in score, "stamping all fifteen DENY scores 14 - the reveal is the miss (%r)" % score)
    check("0 STRIKE" in score, "and denying a card that should be denied is never a strike (%r)" % score)
    all_errs += errs
    b.close()

    b, pg, errs = open_booth(pw, seed={k: ("a" if v == "APPROVE" else "d") for k, v in filed.items()})
    score = pg.evaluate("() => document.querySelector('#miScore').textContent")
    check("15/15 CORRECT" in score and "QUOTA MET" in score,
          "stamping what the page says is filed scores full marks, so the record IS the key (%r)" % score)
    check("YOU STAMPED: APPROVE" in " ".join([l for l in basis_lines(pg) if "myr-10" in l]),
          "and the panel reads back the visitor's own stamp beside the filed one")
    all_errs += errs
    b.close()

    print("== 10. C097: disarm inside the window kills the pending reveal")
    b, pg, errs = open_booth(pw)
    pg.evaluate("() => document.dispatchEvent(new Event('mbs:arm'))")
    check(pg.evaluate("() => document.querySelector('#channel .mi').classList.contains('armed')"),
          "the unlock window is open")
    pg.click("#goon")
    check(pg.evaluate("() => document.querySelector('#goon').classList.contains('boom')"),
          "the goon exploded, so a reveal is genuinely pending")
    pg.wait_for_timeout(300)
    pg.evaluate("() => document.dispatchEvent(new Event('mbs:disarm'))")
    pg.wait_for_timeout(3200)          # well past the 2.6s reveal
    state = pg.evaluate("""() => ({ bar: document.querySelector('#mailbar').textContent,
                                    mail: document.querySelector('#channel .mi').classList.contains('mail') })""")
    check("THE REAL PROGRAM IS OPEN" not in state["bar"],
          "after the window closed, the stale timer printed nothing (%r)" % state["bar"][:40])
    check(not state["mail"], "and the mail bar never came up")
    all_errs += errs
    b.close()

    print("== 11. C097 control: without the disarm, the same drive DOES reveal")
    b, pg, errs = open_booth(pw)
    pg.evaluate("() => document.dispatchEvent(new Event('mbs:arm'))")
    pg.click("#goon")
    pg.wait_for_timeout(3200)
    state = pg.evaluate("""() => ({ bar: document.querySelector('#mailbar').textContent,
                                    mail: document.querySelector('#channel .mi').classList.contains('mail') })""")
    check("THE REAL PROGRAM IS OPEN" in state["bar"],
          "left alone, the reveal still arrives - section 10 is a cancel, not a corpse")
    check(state["mail"], "and the mail bar comes up with it")

    print("== 12. and the drive is clean")
    all_errs += errs
    b.close()
    clean = [e for e in all_errs if "favicon" not in e and "jsdelivr" not in e.lower()
             and "myr5-explode" not in e and "ERR_" not in e]
    check(not clean, "no page errors across every case (%s)" % (clean[:2] or "none"))

print("\n%s" % ("BOOTH HONEST, WINDOW CANCELS" if ok else "BOOTH BROKEN"))
raise SystemExit(0 if ok else 1)
