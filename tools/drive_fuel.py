"""Drive fuel's seal button: the three P0 acceptance clauses of 3.3 packet 1, read back off the page.

WHY A DRIVER AND NOT AN ASSERTION COUNT. check_play already drives fuel - it sets six rows, picks a
flavour, clicks SEAL THE CAN once and looks for the unlock. That is exactly the one path where all three
of these tickets are invisible: C061 is about what the visitor can READ, C064 only fires on the failure
branch check_play never takes, and C065 needs a SECOND click, which nothing in this repo has ever sent.

  C061  every number in the result can be reproduced from visible assumptions.
        Reproduced here means reproduced: this file parses the dollars-per-kilogram and grams-per-scoop
        out of the rendered #assumpBody TEXT, recomputes the scoop and container figures itself, and
        compares them to the rendered #costBar text. Nothing is read out of fuel.js. If the record and
        the cost bar ever drift apart, the arithmetic stops matching and this fails.
  C064  incomplete choices get actionable guidance - the note names the first missing choice and the
        caret lands on it.
  C065  repeated clicks neither replay the reward nor create multiple creator-facing entries. Counted
        two ways: MBS.wave is wrapped to count the visible reward, and MBS_STATE.events() is read for
        participation_form_saved, which is the creator-facing entry.

WEBGL IS REFUSED, the same way check_play does it, so the flat rows stay in the DOM: under .has3d they
are display:none and the C064 focus assertion would be testing a hidden element. The seal button, the
cost bar and the record are in the same card and visible on both paths.
"""
import functools, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join("D:\\", "MBS Pages")

NO_WEBGL = """(() => { const g = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()"""

# counts the visible reward without changing it: the wrapper still calls through
COUNT_WAVE = """document.addEventListener('mbs:ready', () => {}, {once:true});
  (() => { const tick = () => {
    if (!(window.MBS && window.MBS.wave)) return setTimeout(tick, 50);
    const real = window.MBS.wave; window.__waves = 0;
    window.MBS.wave = (...a) => { window.__waves++; return real(...a); };
  }; tick(); })()"""


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


def set_all(pg, level):
    """Set every row to `level` through the real .lvl buttons, never through dataset."""
    rows = pg.locator("#stackCard .srow")
    for i in range(rows.count()):
        rows.nth(i).locator('.lvl[data-level="%s"]' % level).click(no_wait_after=True)
        pg.wait_for_timeout(60)


def saved_count(pg):
    return pg.evaluate("""()=>{try{return window.MBS_STATE
        .events({event:'participation_form_saved', channel:'fuel'}).length}catch(e){return -1}}""")


with sync_playwright() as pw:
    b = pw.chromium.launch()
    c = b.new_context(viewport={"width": 1280, "height": 900})
    pg = c.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script(NO_WEBGL)
    pg.add_init_script(COUNT_WAVE)
    pg.goto(BASE + "/play/fuel/", wait_until="load")
    pg.wait_for_timeout(2600)

    check(pg.is_visible("#stackCard"), "WebGL refused, so the flat stack rows are the live controls")
    check(pg.evaluate("()=>typeof window.__waves==='number'"), "MBS.wave is wrapped and counting")

    # ---- C064. Nothing set at all: the note must name the FIRST row, and focus must land in it.
    print("== C064 incomplete choices get actionable guidance")
    pg.click("#submitBtn", no_wait_after=True)
    pg.wait_for_timeout(200)
    first_name = pg.locator("#stackCard .srow").first.locator(".name").inner_text().strip()
    note = pg.inner_text("#resultNote")
    check(first_name.upper() in note.upper(), "the note names the first missing row (%s)" % first_name)
    check(pg.evaluate("""()=>{const a=document.activeElement; const r=a&&a.closest('.srow');
        return !!(a&&a.classList.contains('lvl')&&r===document.querySelector('#stackCard .srow'));}"""),
          "and the caret is on that row's own level buttons")
    check(pg.evaluate("()=>window.__waves") == 0 and saved_count(pg) == 0,
          "an incomplete seal rewards nothing and files nothing")

    # every row set, no flavour: the missing choice is now the flavour, and it must say so
    set_all(pg, "strong")
    pg.click("#submitBtn", no_wait_after=True)
    pg.wait_for_timeout(200)
    note = pg.inner_text("#resultNote")
    check("FLAVOUR" in note.upper() and first_name.upper() not in note.upper(),
          "with all six rows set the note switches to the flavour, not the row")
    check(pg.evaluate("()=>document.activeElement && document.activeElement.classList.contains('flv')"),
          "and the caret moves to the flavour picker")

    # ---- C061. Recompute the cost bar from the printed record alone.
    print("== C061 every number reproduces from the visible assumptions")
    check(not pg.is_visible("#assumpBody"), "the record starts folded away, native <details>, no script")
    pg.click("#assumpBox summary", no_wait_after=True)      # the visitor's own one click, not an `open` attribute
    pg.wait_for_timeout(200)
    check(pg.is_visible("#assumpBody"), "and one click on the summary opens it")
    rec = pg.inner_text("#assumpBody")
    check("fuel-cost-" in rec, "the record prints its version")
    check(re.search(r"SNAPSHOT \d{4}-\d{2}-\d{2}", rec) is not None, "and a snapshot date")
    check("NOT COUNTED:" in rec and "shipping" in rec.lower(), "and the excluded costs it does not carry")
    check("COST-MODEL" not in pg.content(), "and the page cites no COST-MODEL.md, which never existed")

    per_kg = {m.group(1).strip(): float(m.group(2)) for m in
              re.finditer(r"^([^:\n]+): \$([\d.]+)/kg", rec, re.M)}
    strong = {m.group(1).strip(): float(m.group(2)) for m in
              re.finditer(r"^([^:\n]+):.*STRONG ([\d.]+) g/scoop", rec, re.M)}
    fl = re.search(r"^FLAVOUR: \$([\d.]+)/kg · ([\d.]+) g/scoop", rec, re.M)
    pack = re.search(r"PACKAGING: \$([\d.]+) PER CONTAINER · (\d+) SCOOPS", rec)
    check(len(per_kg) == 7 and len(strong) == 6 and fl and pack,
          "six ingredients, a flavour and a packaging line all parse out of the printed record")

    row_names = [n.strip() for n in pg.locator("#stackCard .srow .name").all_inner_texts()]
    check(all(n in per_kg for n in row_names),
          "and every row in the stack is named identically in the record (%s)" % ", ".join(row_names))

    # all six rows are on STRONG and a flavour is picked below; do the sum the record describes
    pg.click("#flavours .flv", no_wait_after=True)
    pg.wait_for_timeout(200)
    scoop = sum(strong[n] / 1000.0 * per_kg[n] for n in row_names) + float(fl.group(2)) / 1000.0 * float(fl.group(1))
    container = scoop * int(pack.group(2)) + float(pack.group(1))
    bar = pg.inner_text("#costBar")
    shown_scoop = float(re.search(r"COST/SCOOP \(est\.\): \$([\d.]+)", bar).group(1))
    shown_cont = float(re.search(r"COST/CONTAINER \(est\., \d+ sv\): \$([\d.]+)", bar).group(1))
    check(abs(shown_scoop - scoop) < 5e-5,
          "the printed cost per scoop reproduces from the record: $%.4f shown, $%.4f recomputed"
          % (shown_scoop, scoop))
    check(abs(shown_cont - container) < 5e-3,
          "and the cost per container: $%.2f shown, $%.2f recomputed" % (shown_cont, container))

    # ---- C065. The stack is complete now. Seal it, then click again.
    print("== C065 a repeated seal replays nothing")
    pg.click("#submitBtn", no_wait_after=True)
    pg.wait_for_timeout(1200)
    check(pg.evaluate("()=>window.__waves") == 1, "the first seal fires exactly one wave")
    check(saved_count(pg) == 1, "and files exactly one creator-facing entry")
    check(pg.evaluate("()=>window.MBS_STATE.unlockedActive().includes('fuel')"), "and banks the node")
    check(pg.is_disabled("#submitBtn"), "the button is now disabled against a duplicate click")

    pg.evaluate("()=>document.querySelector('#submitBtn').click()")   # force one past the disabled state
    pg.wait_for_timeout(900)
    check(pg.evaluate("()=>window.__waves") == 1, "a forced second click on the SAME stack fires no second wave")
    check(saved_count(pg) == 1, "and files no second entry")

    # change the concept: it is a different stack, and must be sealable again
    pg.locator("#stackCard .srow").first.locator('.lvl[data-level="weak"]').click(no_wait_after=True)
    pg.wait_for_timeout(200)
    check(not pg.is_disabled("#submitBtn"), "changing a level re-arms the button - a different stack, a new seal")
    check(pg.inner_text("#submitBtn").strip().upper() == "SEAL THE CAN", "and the button says so again")
    pg.click("#submitBtn", no_wait_after=True)
    pg.wait_for_timeout(1200)
    check(pg.evaluate("()=>window.__waves") == 2, "the changed stack seals, and waves, once more")
    check(saved_count(pg) == 2, "and files its own entry")

    clean = [e for e in errs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not clean, "no page errors throughout (%s)" % (clean[:2] or "none"))
    b.close()

_srv.shutdown()
print("\n%s" % ("drive_fuel: PASS" if ok else "drive_fuel: FAIL"))
raise SystemExit(0 if ok else 1)
