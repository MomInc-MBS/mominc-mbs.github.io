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

2.21/E.8 is the outcomes, and its acceptance is a rendering claim - "all five render from a completed
fixture; no email or phone is required to reveal any of them" - so it belongs HERE and not in
tools/check_questionnaire.py, which harnesses the engine against synthetic specs. check_questionnaire
is deliberately left untouched by this packet: asserting the same five ids in both places would prove
the engine twice and the channel once. What 2.20 left was a count - "three or more outcome boxes" -
which a stub rendering three empty divs would satisfy. Below, the fixture answers all six questions
including the two the data marks optional, and each of the five outcomes is matched BY ID against the
one branch that fixture selects, so a mis-derived band or a mis-keyed map is a failure rather than a
box that still counts.

3.3 packet 3/C018 adds the last section: what loadState() accepts. Every gate above drives a museum
that loaded its own save, so none of them ever asked what happens when the save is not one. The cases
at the bottom seed the channel's private key with the phases, positions and timestamps a hand edit can
put there and read back what the loader kept, which is the whole of that ticket's claim.
"""
import functools, io, os, re, threading
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


# ---- 2.21/E.8: the completed fixture, and what the five outcomes must say for it -------------------
# Every question answered, including `region` and `wednesday`, which the data marks optional. A fixture
# that skips the Wednesday vote renders that outcome's FALLBACK, which proves the map was never read;
# "a completed fixture" means completed. The four scored answers total 3+4+2+2 = 11, which is the exact
# lower bound of the last band in BOTH band outcomes, so an off-by-one in the engine's range test moves
# two of the five results rather than none.
FIXTURE = {
    "housing": "shared_room",   # 3
    "burden": "over50",         # 4
    "sharing": "few",           # 2
    "space": "room",            # 2
    "region": "midwest",        # unscored, and optional
    "wednesday": "masonjar",    # unscored, optional, and the one answer that changes Wednesday's show
}

# The five E.8 names, in the order tv/data/assessments/lilboyfriend.json declares them.
FIVE = ["compression", "diagnosis", "residence", "context", "wednesday"]

# Substrings rather than whole paragraphs, so the satire can be reworded without breaking the gate -
# but each one is unique to the single branch FIXTURE selects. "The Mason Jar" would NOT do: it appears
# in the prescribed residence and in the Wednesday map both, so a swap between the two would pass.
EXPECTED = {
    "compression": "11 of 14",                          # score, and it knows the declared max
    "diagnosis": "far too large for the economy",        # band, min 11
    "residence": "Airtight, affordable, and yours",      # band, min 11
    "context": "severely cost burdened",                 # map of `burden` -> over50
    "wednesday": "gets the full hour",                   # map of `wednesday` -> masonjar
}

OUTCOME_JS = """(sel) => Array.from(document.querySelectorAll(sel + ' .q-outcome')).map(b => ({
      id: b.dataset.outcome,
      text: (b.querySelector('.q-outcome-text') || {}).textContent || '',
      label: (b.querySelector('.q-outcome-label') || {}).textContent || '',
      shown: b.getClientRects().length > 0,
    }))"""

# The acceptance's second clause, widened from the panel to the whole document: at the moment the result
# is on screen, nothing anywhere on this channel is even CAPABLE of asking for an email or a phone. The
# play page ships zero inputs of its own, so every input found here came from the assessment.
NO_CONTACT_JS = """() => {
      const bad = [];
      document.querySelectorAll('input, textarea, select').forEach(n => {
        const tag = n.tagName.toLowerCase();
        const hint = [n.type, n.name, n.id, n.autocomplete, n.inputMode, n.placeholder,
                      n.getAttribute('aria-label') || ''].join(' ').toLowerCase();
        if (tag !== 'input' || n.type !== 'radio') bad.push(tag + ' [' + hint + ']');
        else if (/mail|phone|tel|mobile|sms/.test(hint)) bad.push(tag + ' [' + hint + ']');
      });
      return bad;
    }"""


def answer_all(page, sel, tag):
    """Check the fixture's option in each group, located by VALUE - which the engine sets as a property
    and not as an attribute, so `input[value=x]` matches nothing and the index has to come from the DOM.
    Real .check() clicks, not `.checked = true`: a drive that sets state directly is not a drive."""
    missing = []
    for name, value in FIXTURE.items():
        vals = page.eval_on_selector_all("%s input[name=%s]" % (sel, name), "ns => ns.map(n => n.value)")
        if value in vals:
            page.locator("%s input[name=%s]" % (sel, name)).nth(vals.index(value)).check()
        else:
            missing.append("%s=%s" % (name, value))
    check(not missing, "%s: every fixture answer exists and was checked (missing: %s)" % (tag, missing or "none"))


def check_five(page, sel, tag):
    got = page.evaluate(OUTCOME_JS, sel)
    ids = [o["id"] for o in got]
    # If the step had advanced past the result, or the panel had closed, `sel` would be gone and this
    # list would be empty - so this subsumes 2.20's "the outcomes render in place" as well.
    check(ids == FIVE, "%s: all five outcomes render in place, by id, in the data's order (got %s)" % (tag, ids))
    by = {o["id"]: o for o in got}
    for oid in FIVE:
        o = by.get(oid, {"text": "", "label": "", "shown": False})
        check(o["shown"] and o["label"].strip() and EXPECTED[oid] in o["text"],
              "%s: %s is visible, labelled, and says what the fixture derives (%r)" % (tag, oid, o["text"][:64]))
    check(page.evaluate(NO_CONTACT_JS) == [],
          "%s: with the result on screen, no field on the channel can ask for an email or a phone (%s)"
          % (tag, page.evaluate(NO_CONTACT_JS)[:2] or "none"))


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
    # 4.1: the mode control is a sibling of the canvas and the hud, so it exists on this path too, and
    # the museum is what a visitor who has never chosen gets. The switching itself is driven on the flat
    # page at the bottom, which is the cheap one - three.js is not what is under test there.
    check(pg.evaluate("() => !!document.querySelector('#lbModeBtn')") and state().get("mode") == "museum",
          "4.1: the mode control is on the 3D path, and the museum walk is the default")
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

        # 2.21/E.8: the completed fixture - all six groups, the two optional ones included
        answer_all(pg, "#bookMount", "3D")
        pg.click("#bookMount button[type=submit]")
        pg.wait_for_timeout(600)

        check(pg.evaluate("() => document.querySelector('#bookPanel').classList.contains('show')"),
              "the panel STAYS open on submit, so the result is readable without an email or a phone")
        check_five(pg, "#bookMount", "3D")
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
    answer_all(fl, "#flBookMount", "flat")
    fl.click("#flBookMount button[type=submit]")
    fl.wait_for_timeout(500)
    check_five(fl, "#flBookMount", "flat")
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

    # ---- 3.3 packet 3 / C018: the save is untrusted input ------------------------------------------
    # loadState() used to Object.assign whatever parsed over the defaults, on BOTH paths, so a
    # hand-edited key was adopted whole. Every case below is seeded through the page (never through
    # add_init_script, which fires on EVERY navigation and would re-seed the reload under test).
    #
    # It reads window.__lbLoaded, not __lbState(): both render paths MOVE the state as they boot - the
    # flat gallery's render() snaps phase and t onto its nearest step before anything can be observed -
    # so __lbState() answers "where is the museum now", which is a different question from "what did the
    # loader accept". The snapshot is taken at module scope, ahead of the WebGL branch, so this is the
    # same answer on either path and the flat page can be reused rather than paying for three.js twice.
    print("\n  -- C018: what loadState() accepts --")

    def seeded(v2, v1=None):
        """Seed the channel's own key(s), reload, and read what loadState() actually returned."""
        fl.evaluate("""([v2, v1]) => {
            localStorage.removeItem('mbs-lilbf-museum-v2');
            localStorage.removeItem('mbs-lilbf-museum');
            if (v2 !== null) localStorage.setItem('mbs-lilbf-museum-v2', v2);
            if (v1 !== null) localStorage.setItem('mbs-lilbf-museum', v1);
        }""", [v2, v1])
        fl.reload(wait_until="load")
        fl.wait_for_function("() => !!window.__lbLoaded", timeout=10000)
        return fl.evaluate("() => window.__lbLoaded")

    now = lambda: fl.evaluate("() => Date.now()")

    # 1. the rebaseline's own example, plus a non-boolean `signed`. Each field is judged on its own
    #    terms rather than the record being thrown away whole: the phase is not a phase, the signature
    #    is not a boolean and the timestamp is not a number, so those three go - but t=99 is a position
    #    that CLAMPS to a real one (the door), and out/1 is a state the walk reaches legitimately.
    s = seeded('{"phase":"banana","t":99,"signed":"yes","shrinkStartedAt":"x"}')
    check(s["phase"] == "out" and s["t"] == 1 and s["signed"] is False and s["shrinkStartedAt"] is None,
          "a junk save is repaired field by field, not adopted whole (%s)" % s)

    # 2. a real phase carrying an impossible position: the phase stands, `t` is clamped onto the path.
    #    zAt(t) and every proximity test take t on trust, so an unclamped 99 puts the camera outside
    #    the hall and NaN would put it nowhere at all.
    s = seeded('{"phase":"back","t":42}')
    check(s["phase"] == "back" and s["t"] == 1 and s["shrinkStartedAt"] is not None
          and s["shrinkStartedAt"] <= now(),
          "an out-of-range t is clamped to the path and the missing clock is backfilled (%s)" % s)
    s = seeded('{"phase":"back","t":"NaN"}')
    check(s["t"] == 0, "a non-numeric t is 0, never NaN (%s)" % s)

    # 3. a timestamp in the FUTURE is the quiet one: shrinkProgress() would sit at 0 for as long as it
    #    is ahead, so the walls never close and nothing on screen says why. Rebuilt from the phase.
    ahead = now() + 3600000
    s = seeded('{"phase":"back","t":0.5,"shrinkStartedAt":%d}' % ahead)
    # rp is read live: render() moves phase and t, but nothing on either path rewrites the shrink clock,
    # so this is the loaded value working as the walls' own input rather than a number in a snapshot.
    rp = fl.evaluate("() => window.__lbState().rp")
    check(s["shrinkStartedAt"] is not None and s["shrinkStartedAt"] <= now() and rp > 0.05,
          "a future shrink clock is rejected and rebuilt, so the walls still close (rp %.3f)" % rp)

    # 4. the other half of the claim: a GOOD save is not damaged by any of this.
    at = now() - 10000
    s = seeded('{"phase":"back","t":0.6,"signed":true,"shrinkStartedAt":%d}' % at)
    check(s["phase"] == "back" and abs(s["t"] - 0.6) < 1e-9 and s["signed"] is True
          and s["shrinkStartedAt"] == at,
          "a valid save is passed through exactly, field for field (%s)" % s)

    # 5. bytes that are not JSON, and JSON that is not an object
    for raw, why in [('{not json', "unparseable bytes"), ('[1,2,3]', "an array"), ('"back"', "a bare string")]:
        s = seeded(raw)
        check(s["phase"] == "out" and s["t"] == 0 and s["signed"] is False,
              "%s loads the defaults rather than throwing or half-loading (%s)" % (why, s))

    # 6. the v1 key, which is the path that used to be the only one that backfilled the clock
    s = seeded(None, '{"phase":"wired","t":0.4}')
    rp = fl.evaluate("() => window.__lbState().rp")
    check(s["phase"] == "slotted" and abs(s["t"] - 0.4) < 1e-9 and s["shrinkStartedAt"] is not None
          and 0.2 < rp < 0.5,
          "a v1 save still migrates: wired -> slotted, with a deterministic backfilled clock (%s, rp %.3f)"
          % (s, rp))

    # 7. and the merge is gone at the WRITE end too - an unknown key from some other version is dropped
    #    on load, so the next saveState() cannot write it back out.
    seeded('{"phase":"out","t":0.2,"bogus":1,"shrinkStartedAt":123}')
    fl.click("#flNext")
    fl.wait_for_timeout(300)
    stored = fl.evaluate("() => localStorage.getItem('mbs-lilbf-museum-v2')")
    check(stored and "bogus" not in stored,
          "an unknown key is dropped on load and never written back (%s)" % stored)

    c18errs = [e for e in flerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not c18errs, "C018: no page errors across any seeded load (%s)" % (c18errs[:2] or "none"))

    # ---- 4.1 / F.2: the two modes ------------------------------------------------------------------
    # "Both reachable; the mode choice persists in state." Driven on the flat page because the mode is
    # a presentation switch, not a WebGL claim - and because seeded() already lives here, which is what
    # lets the allowlist half be asserted against the loader's own answer rather than the DOM.
    #
    # MATCHED PAIR, and it is the reason this section is not four lines: "the chapters are reachable"
    # passes on a build that simply replaced the museum with them, which is precisely what F.2 forbids.
    # So every reach assertion has its opposite - the museum is still there and still reachable after
    # the switch, and it comes back across a reload the same way the chapters do. A one-way gate would
    # be green on the one implementation the ticket rules out.
    print("\n  -- 4.1: the museum walk and the scroll chapters are two MODES --")

    s = seeded('{"phase":"out","t":0,"mode":"chapters"}')
    check(s.get("mode") == "museum",
          "a mode nobody built is the museum, not a blank stage (%s)" % s)
    s = seeded('{"phase":"out","t":0}')
    check(s.get("mode") == "museum",
          "and a save written before the field existed is the museum too - the RETAINED one is the default")
    check(fl.evaluate("""() => !!document.querySelector('#lbFlat')
              && !document.querySelector('#lbStage').classList.contains('mode-scroll')
              && !document.querySelector('#lbScroll')"""),
          "museum mode: the museum rendered, and the chapters were not even built")

    fl.click("#lbModeBtn")
    fl.wait_for_timeout(250)
    n = fl.evaluate("() => document.querySelectorAll('#lbScroll .lb-ch[data-chapter]').length")
    check(n == 6, "the control reaches the scroll chapters, and there are six of them (got %d)" % n)
    check(fl.evaluate("""() => { const s = document.querySelector('#lbScroll'),
                                       f = document.querySelector('#lbFlat');
              return !!s && s.getClientRects().length > 0 && !!f && f.getClientRects().length === 0; }"""),
          "it is a MODE, not both at once: the chapters are on screen and the museum is off it")
    # F.2's "retained", asserted rather than assumed: the museum is HIDDEN, never destroyed. A build that
    # replaced it would pass every reach assertion above and fail this one.
    check(fl.evaluate("() => !!document.querySelector('#lbFlat')"),
          "and the museum was hidden, not torn down - its DOM is still there to come back to")

    check(fl.evaluate("() => JSON.parse(localStorage.getItem('mbs-lilbf-museum-v2')).mode") == "scroll",
          "the choice is written to the channel's own key")
    # 2.22's precedent, made a gate: mbs-state holds EARNED history. A preference is not earned, so
    # nothing about the mode may appear there - and if a later packet moves it, this fails loudly rather
    # than the schema drifting by accident.
    check(fl.evaluate("""() => { try { return !/"mode"/.test(localStorage.getItem('mbs-state') || ''); }
                                 catch (e) { return false; } }"""),
          "and NOT into mbs-state, which holds earned history, not preferences (2.22's precedent)")

    fl.reload(wait_until="load")
    fl.wait_for_function("() => !!window.__lbLoaded", timeout=10000)
    check(fl.evaluate("() => window.__lbLoaded.mode") == "scroll"
          and fl.evaluate("() => document.querySelectorAll('#lbScroll .lb-ch[data-chapter]').length") == 6,
          "the choice PERSISTS: the chapters come back on their own across a reload")

    fl.click("#lbModeBtn")
    fl.wait_for_timeout(250)
    check(fl.evaluate("""() => { const f = document.querySelector('#lbFlat'),
                                       s = document.querySelector('#lbScroll');
              return !!f && f.getClientRects().length > 0 && !!s && s.getClientRects().length === 0; }"""),
          "the museum walk is reachable again from the chapters - the switch goes both ways")
    fl.reload(wait_until="load")
    fl.wait_for_function("() => !!window.__lbLoaded", timeout=10000)
    check(fl.evaluate("() => window.__lbLoaded.mode") == "museum"
          and fl.evaluate("() => !!document.querySelector('#lbFlat') && !document.querySelector('#lbScroll')"),
          "and that choice persists too - the museum is back after a reload, unasked")

    modeerrs = [e for e in flerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not modeerrs, "4.1: no page errors across either mode (%s)" % (modeerrs[:2] or "none"))

    # ---- 4.2: sticky chapters, one phone screen tall, nothing needing a precise finger --------------
    # "Each chapter's height at 390px is within one viewport; no drag or fine-pointer interaction
    # exists." Three things about how that is measured, each of which cost a wrong answer first:
    #
    #   THE VIEWPORT IS THE STAGE, NOT THE WINDOW. fitViewport() sizes #lbStage to the television's
    #   glass minus the ribbon, so at a 390x844 phone the stage is 800px on this route and 566 inside
    #   the set. Measuring innerHeight would grade a chapter against a box it does not live in - and it
    #   is also what makes this route enough on its own: a height:100vh chapter reads 844 here against
    #   an 800px stage and fails, which is the mistake worth catching.
    #
    #   A HEIGHT ASSERTION ALONE IS NOT THE TICKET. "Within one viewport" is satisfied perfectly by a
    #   chapter rendering nothing, and "sticky" is satisfied by neither. So the bound is asserted with
    #   its matched half - every chapter still carries its heading, its photograph and all three of its
    #   sourced fact cards, and nothing inside it is cut off - and pinning is asserted separately.
    #
    #   scroll-behavior IS smooth. Scripted scrolls set it to auto for the duration rather than racing
    #   an animation; the shipped easing is not what is under test here.
    print("\n  -- 4.2: six STICKY chapters, each one stage tall --")

    sc = b.new_page(viewport={"width": 390, "height": 844})
    scerrs = []
    sc.on("pageerror", lambda e: scerrs.append(str(e)))
    sc.on("console", lambda m: scerrs.append(m.text) if m.type == "error" else None)
    sc.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    # the fine-pointer probe. It has to be installed before a single listener is registered, which is
    # what an init script buys; recording the TARGET as well as the type is what lets the question be
    # asked about the chapters specifically rather than about the whole channel.
    sc.add_init_script("""(() => { window.__lbLis = [];
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (t, ...a) {
        try { window.__lbLis.push([this, t]); } catch (e) {}
        return add.call(this, t, ...a); }; })()""")
    sc.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    sc.wait_for_timeout(2500)
    sc.click("#lbModeBtn")
    sc.wait_for_selector("#lbScroll .lb-ch[data-chapter]", timeout=5000)
    sc.wait_for_timeout(600)

    fit = sc.evaluate("""() => {
      const stage = document.querySelector('#lbStage').clientHeight;
      return { stage, win: innerHeight,
        chs: [...document.querySelectorAll('#lbScroll .lb-ch[data-chapter]')].map(c => {
          const inner = c.querySelector('.lb-ch-inner');
          return { n: c.dataset.chapter, h: Math.round(c.getBoundingClientRect().height),
                   cut: inner.scrollHeight - inner.clientHeight,
                   heading: !!(c.querySelector('h3') || {}).textContent,
                   photo: !!c.querySelector('.lb-ch-photo'),
                   facts: c.querySelectorAll('.fl-card').length,
                   srcs: [...c.querySelectorAll('.fl-card .fl-src')]
                           .filter(s => s.textContent.trim()).length }; }) };
    }""")
    check(fit["stage"] > 0 and fit["stage"] != fit["win"],
          "the stage is the viewport and it is NOT the window (stage %d, window %d)"
          % (fit["stage"], fit["win"]))
    check(len(fit["chs"]) == 6, "six chapters to measure (got %d)" % len(fit["chs"]))
    over = [c for c in fit["chs"] if c["h"] > fit["stage"] + 1]
    check(not over, "at 390px every chapter is within ONE stage of %dpx (worst %d)"
          % (fit["stage"], max(c["h"] for c in fit["chs"])))
    # the matched half. Without it the line above is green on six empty sections, which is the one
    # implementation that must not pass: the bound exists to shape the read, not to drop the sources.
    thin = [c["n"] for c in fit["chs"]
            if not (c["heading"] and c["photo"] and c["facts"] == 3 and c["srcs"] == 3)]
    check(not thin, "and nothing was dropped to fit: each keeps its heading, photo and 3 cited facts (%s)"
          % (thin or "all six intact"))
    cut = [(c["n"], c["cut"]) for c in fit["chs"] if c["cut"] > 0]
    check(not cut, "and no chapter's content is cut off inside that stage (%s)" % (cut or "none"))


    # STICKY, which no height assertion reaches: a chapter that is merely one stage tall scrolls away
    # like any other section. Pinned means it holds at the top of the stage while the next one rises
    # over it. Both halves matter - all six frozen at the top forever is not sticky either, it is a
    # broken scroll, so the chapter still to come must be measurably in motion.
    sc.evaluate("() => { document.querySelector('#lbScroll').style.scrollBehavior = 'auto'; }")
    sc.evaluate("""() => { const s = document.querySelector('#lbScroll');
        s.scrollTop = 2.5 * s.clientHeight; }""")
    sc.wait_for_timeout(400)
    rel = sc.evaluate("""() => { const s = document.querySelector('#lbScroll'),
                                       top = s.getBoundingClientRect().top;
        return [...s.querySelectorAll('.lb-ch')].map(c =>
          Math.round(c.getBoundingClientRect().top - top)); }""")
    check(all(abs(v) <= 1 for v in rel[:3]),
          "scrolled past, a chapter PINS to the top of the stage instead of leaving (%s)" % rel[:3])
    check(rel[3] > 1, "and the one still to come is genuinely moving, not frozen with it (%d)" % rel[3])

    # "None requiring precision movement", the reachability half: every chapter arrives by scrolling
    # the run and nothing else - no gesture, no drag, no target to hit.
    missed = []
    for i in range(1, 7):
        sc.evaluate("i => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = i * s.clientHeight; }", i)
        sc.wait_for_timeout(160)
        got = sc.evaluate("""() => { const s = document.querySelector('#lbScroll'),
                                           r = s.getBoundingClientRect();
            const c = [...s.querySelectorAll('.lb-ch')].filter(e => {
              const b = e.getBoundingClientRect();
              return b.top - r.top <= 1 && b.bottom - r.top >= r.height - 1; }).pop();
            return c ? c.dataset.chapter || c.id : null; }""")
        if got != str(i):
            missed.append((i, got))
    check(not missed, "each of the six fills the stage from scroll position alone (%s)"
          % (missed or "1..6 all land"))

    # "No drag or fine-pointer interaction exists." Asserted against what the chapters actually
    # REGISTERED, not against the markup - a drag handler is invisible in the DOM. The instrument's own
    # liveness is the matched half here: "no drag listeners found" is exactly what a probe that recorded
    # nothing at all reports, so the recorder is made to prove it was running.
    probe = sc.evaluate("""() => {
      const s = document.querySelector('#lbScroll');
      const DRAGGY = ['pointermove','mousemove','touchmove','dragstart','drag','gesturechange'];
      const lis = window.__lbLis || [];
      return { total: lis.length,
        offenders: lis.filter(([el, t]) => DRAGGY.includes(t)
                     && el && el.nodeType === 1 && s.contains(el))
                      .map(([el, t]) => (el.className || el.tagName) + ':' + t),
        fine: s.querySelectorAll('[draggable="true"], input[type=range], [contenteditable]').length };
    }""")
    check(probe["total"] > 0,
          "the listener probe was live for the whole load (%d registrations seen)" % probe["total"])
    check(not probe["offenders"],
          "no drag or fine-pointer listener exists inside the chapters (%s)"
          % (probe["offenders"] or "none"))
    check(probe["fine"] == 0,
          "and no draggable, slider or editable target either (%d)" % probe["fine"])

    # ONE STAGE MEANS ONE STAGE, and this is the line that tells `height` from `min-height`. At 390px
    # the photograph's flex absorbs the slack, so a min-height chapter measures a tidy 800 here and the
    # bound above is green on it. Squeeze the stage past the point where the type alone fills it and the
    # two part company at once: a fixed chapter still measures exactly one stage, a min-height chapter
    # grows to its content and the screen-at-a-time read is gone. The stage is squeezed directly rather
    # than by resizing the window because on this route it is CSS height, not fitViewport(), that sets it.
    sc.evaluate("() => { document.querySelector('#lbStage').style.height = '440px'; }")
    sc.wait_for_timeout(400)
    tight = sc.evaluate("""() => { const st = document.querySelector('#lbStage').clientHeight;
        return { stage: st, chs: [...document.querySelectorAll('#lbScroll .lb-ch[data-chapter]')]
          .map(c => ({ n: c.dataset.chapter, h: Math.round(c.getBoundingClientRect().height) })) }; }""")
    grew = [(c["n"], c["h"]) for c in tight["chs"] if c["h"] > tight["stage"] + 1]
    check(not grew, "squeezed to a %dpx stage they are still exactly one stage, not grown to fit (%s)"
          % (tight["stage"], grew or "all six held"))

    scclean = [e for e in scerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not scclean, "4.2: no page errors across the chapter drive (%s)" % (scclean[:2] or "none"))

    # ---- 4.3: the six scroll consequences ----------------------------------------------------------
    # "All six observable across a scripted scroll, each asserted independently." Independently is the
    # word doing the work: one snapshot per chapter, six separate questions asked of it, so a build that
    # shrinks the character and forgets the rent fails on the rent alone rather than on a single
    # composite line that could be green for the wrong reason.
    #
    # A FRESH PAGE, because the section above ends by squeezing the stage to 440px on purpose and every
    # measurement below would then be taken against a stage no visitor has.
    #
    # THE SCENE IS DRIVEN BY SCROLL POSITION AND NOTHING ELSE - no click, no keypress. That is also the
    # trap this channel sets: 4.2's chapters are position:sticky, so a chapter already passed still
    # reports intersectionRatio 1 and an observer reading isIntersecting the obvious way parks on
    # chapter 1 forever. Asserting the scene ADVANCES to 1..6 in step with the scroll is what catches it.
    print("\n  -- 4.3: the six scroll consequences --")

    LABELS = ["THE TEEPEE", "THE CAR", "THE SHOEBOX", "THE STORAGE UNIT", "THE MASON JAR", "THE VAN"]
    # the ordered severity vocabulary, entrance first. "Increasingly aggressive" is read off the copy the
    # visitor can see, against this order - not off a score the channel wrote about itself.
    SEV = ["INTAKE", "ADVISORY", "RECOMMENDED", "PRESCRIBED", "MANDATORY", "ENFORCED", "FINAL"]
    LOST = 192          # 240 sq ft at the entrance, 48 after chapter six
    SNAP = """() => { const q = s => document.querySelector(s);
      const bar = q('.lb-stress').getBoundingClientRect(), fill = q('#lbStressFill').getBoundingClientRect();
      return { scene: q('#lbConsole').dataset.scene,
               figH: +q('#lbFig i').getBoundingClientRect().height.toFixed(2),
               room: q('#lbRoom').textContent.trim(),
               sqft: parseInt(q('#lbSqft').textContent, 10),
               price: q('#lbPrice').textContent.trim(),
               sev: q('#lbRxSev').textContent.trim(),
               rx: q('#lbRx').textContent.trim(),
               stress: bar.width ? +(fill.width / bar.width).toFixed(3) : 0,
               pct: q('#lbStressPct').textContent.trim(),
               // the strip is a FIXED height with overflow:hidden, so a readout that does not fit is
               // not a wrapped line - it is a silently missing one. Anything ellipsised sideways or
               // sitting outside the strip's own box is named here.
               spill: (() => { const c = q('#lbConsole'), cr = c.getBoundingClientRect();
                 const wide = [...c.querySelectorAll('.lb-con-row,.lb-con-rx,.lb-con-row *')]
                   .filter(e => !e.children.length && e.scrollWidth > e.clientWidth + 1);
                 const out = [...c.querySelectorAll('.lb-con-row,.lb-con-rx')].filter(e => {
                   const r = e.getBoundingClientRect();
                   return r.top < cr.top - 0.5 || r.bottom > cr.bottom + 0.5; });
                 return wide.concat(out).map(e => e.id || e.className); })() }; }"""

    cs = b.new_page(viewport={"width": 390, "height": 844})
    cserrs = []
    cs.on("pageerror", lambda e: cserrs.append(str(e)))
    cs.on("console", lambda m: cserrs.append(m.text) if m.type == "error" else None)
    cs.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    # the meter write, sampled off the wire rather than off the DOM: E.5 asks for the call PER
    # INTERSECTION, and mbs-shim.js turns MBS.meter into a GAME_PROGRESS lifecycle event. Recorded from
    # an init script so no event between boot and the first scroll can be missed.
    cs.add_init_script("""(() => { window.__lbProg = [];
      document.addEventListener('mbs:lifecycle', e => {
        if (e.detail && e.detail.type === 'GAME_PROGRESS') window.__lbProg.push(e.detail.detail); }); })()""")
    cs.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    cs.wait_for_timeout(2500)
    cs.click("#lbModeBtn")
    cs.wait_for_selector("#lbConsole", timeout=5000)
    cs.evaluate("() => { document.querySelector('#lbScroll').style.scrollBehavior = 'auto'; }")
    cs.wait_for_timeout(300)

    entrance = cs.evaluate(SNAP)
    snaps = []
    stuck = []
    for i in range(1, 7):
        cs.evaluate("i => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = i * s.clientHeight; }", i)
        try:
            # polling= is mandatory in this file's drivers; the default is "raf".
            cs.wait_for_function("i => document.querySelector('#lbConsole').dataset.scene === String(i)",
                                 arg=i, timeout=3000, polling=60)
        except Exception:
            stuck.append((i, cs.evaluate("() => document.querySelector('#lbConsole').dataset.scene")))
        snaps.append(cs.evaluate(SNAP))

    check(not stuck, "scroll position alone advances the scene 1..6, and sticky chapters do not pin it "
                     "to the first (%s)" % (stuck or "1..6 all reached"))

    # 1. the character becomes smaller. Measured off the rendered figure, and the last one still exists:
    #    "shrinks" satisfied by shrinking to nothing is 4.4's finite bound already broken.
    figs = [s["figH"] for s in snaps]
    check(all(figs[i] < figs[i - 1] for i in range(1, 6)) and figs[0] < entrance["figH"],
          "1. the character is smaller at every chapter than the one before (%s)" % figs)
    check(figs[-1] > 0, "   and is still there at chapter six, not shrunk out of existence (%.2fpx)" % figs[-1])

    # 2. the room changes, teepee -> shoebox -> jar -> car. The chapter sequence IS that sequence, so the
    #    readout is checked against the six rooms in order and against E.5's four by name.
    rooms = [s["room"] for s in snaps]
    check(rooms == LABELS, "2. the room changes with the chapter (%s)" % " > ".join(rooms))
    named = [r for r in ["THE TEEPEE", "THE SHOEBOX", "THE MASON JAR", "THE CAR"] if r in rooms]
    check(len(named) == 4, "   and E.5's teepee, shoebox, jar and car are all four of them (%s)" % named)

    # 3. the price stays FIXED while usable space collapses - two halves, asserted apart, because a build
    #    that collapses both is exactly as wrong as one that collapses neither.
    prices = [s["price"] for s in snaps]
    check(len(set(prices)) == 1 and prices[0] == entrance["price"],
          "3. the monthly price never moves across the six chapters (%s)" % prices[0])
    sqft = [s["sqft"] for s in snaps]
    check(all(sqft[i] < sqft[i - 1] for i in range(1, 6)) and sqft[0] < entrance["sqft"],
          "   while the usable space collapses under it (%d sq ft > %s)" % (entrance["sqft"], sqft))

    # 4. the stress meter rises. The BAR is measured, not the label, and the label is the matched half -
    #    a fill that never paints and a number that only counts are each half a meter.
    stress = [s["stress"] for s in snaps]
    check(all(stress[i] > stress[i - 1] for i in range(1, 6)) and stress[0] > entrance["stress"],
          "4. the stress meter rises at every chapter (%s)" % stress)
    check([s["pct"] for s in snaps] == ["%d%% COMPRESSION" % (i * 16) for i in range(1, 7)],
          "   and it is labelled with the compression it is showing (%s)" % snaps[-1]["pct"])
    prog = cs.evaluate("() => window.__lbProg")
    pcts = [p["pct"] for p in prog if p and p.get("label") == "COMPRESSION"]
    check(pcts == sorted(set(pcts)) and pcts[-1:] == [96],
          "   and the write goes out per intersection, never per frame (%d COMPRESSION writes: %s)"
          % (len(pcts), pcts))

    # 5. MOM's medical copy becomes increasingly aggressive. Escalation is the severity word's position in
    #    an ordered vocabulary the visitor can read; the matched half is that the copy itself is six
    #    different sentences, since one line repeated under six rising labels escalates nothing.
    sevs = [s["sev"] for s in snaps]
    idx = [SEV.index(v) if v in SEV else -1 for v in sevs]
    check(idx == sorted(idx) and len(set(idx)) == 6 and -1 not in idx and idx[-1] == len(SEV) - 1,
          "5. MOM's prescription escalates every chapter and ends at the top of the scale (%s)"
          % " > ".join(sevs))
    rxs = [s["rx"] for s in snaps]
    check(len(set(rxs)) == 6 and all(len(r) > 20 for r in rxs),
          "   and the copy under it is six different sentences, not one label change (%d distinct)"
          % len(set(rxs)))

    # 6. the final scene reveals how much space the audience can restore LIVE. The reveal is the number;
    #    "live" is that pressing it moves the console this instant. Bounded, and the bound is asserted:
    #    the point is that the whole 192 is on the table, not that space is infinite.
    cs.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = s.scrollHeight; }")
    cs.wait_for_timeout(400)
    reveal = cs.evaluate("""() => { const r = document.querySelector('#lbRestore');
        return { shown: !!(r && r.getClientRects().length), text: r ? r.textContent : '',
                 given: +document.querySelector('#lbGiven').textContent }; }""")
    check(reveal["shown"] and ("%d square feet" % LOST) in reveal["text"] and reveal["given"] == 0,
          "6. the closing scene reveals the %d sq ft taken, none of it restored yet (%s)"
          % (LOST, reveal["shown"]))
    before = cs.evaluate(SNAP)
    cs.click("#lbGive")
    cs.wait_for_timeout(150)
    after = cs.evaluate(SNAP)
    check(after["sqft"] > before["sqft"] and after["figH"] > before["figH"]
          and cs.evaluate("() => +document.querySelector('#lbGiven').textContent") > 0,
          "   and the audience restores it LIVE - one press grows the room %d->%d sq ft and the "
          "character with it" % (before["sqft"], after["sqft"]))
    for _ in range(12):
        if cs.evaluate("() => document.querySelector('#lbGive').disabled"): break
        cs.click("#lbGive")
        cs.wait_for_timeout(60)
    end = cs.evaluate("""() => ({ given: +document.querySelector('#lbGiven').textContent,
        done: document.querySelector('#lbGive').disabled,
        sqft: parseInt(document.querySelector('#lbSqft').textContent, 10) }); """)
    check(end["given"] == LOST and end["done"] and end["sqft"] == entrance["sqft"],
          "   up to exactly the %d sq ft that were taken and no further (%d restored, room back to %d)"
          % (LOST, end["given"], end["sqft"]))

    # the strip's own matched half: five readouts are only five readouts if all five are on screen.
    # `.lb p{font-size:clamp(15px,4.2vw,18px)}` out-specifies a bare `.lb-con-row`, and when it did the
    # first line rendered at 16px and left the top of a 60px strip entirely - visible as a stray line of
    # text over the paper, invisible to every assertion above, which all read textContent.
    spill = [(s["scene"], s["spill"]) for s in ([entrance] + snaps) if s["spill"]]
    check(not spill, "and all five readouts fit inside the strip, none clipped or ellipsised (%s)"
          % (spill or "clean at the entrance and all six chapters"))

    csclean = [e for e in cserrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not csclean, "4.3: no page errors across the consequence drive (%s)" % (csclean[:2] or "none"))

    # ---- 4.4: the shrink curve, exponential and finite ---------------------------------------------
    # "Scale at chapter n follows the stated curve and is defined and non-zero at chapter 6."
    #
    # THE STATED CURVE IS EXPONENTIAL, WHICH IS A CLAIM ABOUT RATIOS - not about getting smaller. 4.3's
    # straight line already got smaller and passes every monotonicity check above; the whole content of
    # this packet is the SHAPE, so the only assertion that means anything is that each chapter keeps the
    # same FRACTION of the one before it. A linear descent's fractions fan from 0.87 down to 0.60 and
    # fail here, which is what makes this a gate rather than a restatement.
    #
    # Measured off the same snapshots 4.3 took, and off the RENDERED figure: `#lbFig i` is
    # height:calc(38px * var(--lb-scale)), so its box IS the curve and nothing below asks the source
    # about itself. `entrance` is chapter zero, so the six ratios are the six chapters' own.
    print("\n  -- 4.4: the shrink is exponential and finite --")

    steps = [entrance["figH"]] + figs
    fracs = [round(steps[i] / steps[i - 1], 4) for i in range(1, len(steps))]
    spread = max(fracs) / min(fracs)
    # 5% of slack, and it is quantisation slack only: --lb-scale is written to 4dp off an already-rounded
    # square footage and the browser lays out in 1/64px, which moves the true 0.7647 by under 1%.
    check(spread <= 1.05,
          "the shrink is EXPONENTIAL - every chapter keeps the same fraction of the last (%s, spread %.3f)"
          % (fracs, spread))
    # the matched half, and the half that fails on the curve 4.3 shipped: a linear descent takes EQUAL
    # bites, an exponential one takes a big first bite and a smaller one every time after. Stated as the
    # drops in px, so a ratio check that somehow went green on a flat figure still has to answer this.
    drops = [round(steps[i - 1] - steps[i], 2) for i in range(1, len(steps))]
    check(all(drops[i] < drops[i - 1] for i in range(1, len(drops))),
          "   and it DECELERATES - the first chapter takes the most room, every one after it less (%s)"
          % drops)

    # defined and non-zero at chapter six, read the way a human reads it rather than the way arithmetic
    # does. 38px * FLOOR is 7.6px of character; a curve that merely tends to zero is non-zero at a size
    # nobody can see and would pass 4.3's `> 0`, so the floor named here is pixels on screen.
    check(figs[-1] >= 4 and snaps[-1]["sqft"] > 0,
          "the character at chapter six is DEFINED and visibly non-zero, not sub-pixel (%.2fpx, %d sq ft)"
          % (figs[-1], snaps[-1]["sqft"]))

    # FINITE - bounded by the six chapters, not unbounded. `before` was snapped at the very bottom of the
    # run, past the last chapter and before a single square foot was given back: the shrink has STOPPED
    # there rather than carried on, which is the difference between a floor and an asymptote.
    check(abs(before["figH"] - figs[-1]) < 0.5 and before["sqft"] == snaps[-1]["sqft"],
          "and the shrink is FINITE - past the sixth chapter it stops, it does not keep going (%.2fpx / "
          "%d sq ft at chapter six, %.2fpx / %d at the end of the run)"
          % (figs[-1], snaps[-1]["sqft"], before["figH"], before["sqft"]))

    # ---- 4.5: the shoe, the terminal state ---------------------------------------------------------
    # "The shoe fires exactly once, after chapter 6, and only once the diagnosis has rendered."
    #
    # FIRING IS THE ANIMATION STARTING, not a class appearing. A class is what the module says it did;
    # animationstart on #lbShoe is the browser reporting that a shoe actually moved, and it is also the
    # only way to count firings without polling a boolean that was designed to be true forever.
    #
    # THE THREE CLAUSES ARE THREE SEPARATE QUESTIONS and the row states them separately because no two
    # of them fail together. The matched pair that gives "after chapter 6" its teeth is the pair below:
    # at chapter six the FINAL diagnosis is ALREADY on the strip and the shoe has still not fired, so a
    # build that hung the trigger off the diagnosis alone - the obvious wrong reading, and the cheap one
    # - is red here rather than green everywhere.
    print("\n  -- 4.5: the shoe is the terminal state --")

    sh = b.new_page(viewport={"width": 390, "height": 844})
    sherrs = []
    sh.on("pageerror", lambda e: sherrs.append(str(e)))
    sh.on("console", lambda m: sherrs.append(m.text) if m.type == "error" else None)
    sh.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    # what the shoe SAW when it fired, recorded at fire time off the rendered strip. Reading the
    # severity afterwards would only prove it is FINAL now, which it is at every scroll position past
    # chapter six - the claim is that it was FINAL at the instant the shoe was released.
    sh.add_init_script("""(() => { window.__lbShoe = [];
      document.addEventListener('animationstart', e => {
        if (e.target && e.target.id === 'lbShoe') {
          const sev = document.querySelector('#lbRxSev'), c = document.querySelector('#lbConsole');
          window.__lbShoe.push({ sev: sev ? sev.textContent.trim() : null,
                                 scene: c ? c.dataset.scene : null,
                                 name: e.animationName }); }
      }, true); })()""")
    # 4.6: every GAME_COMPLETE this run puts on the wire, in order, WITH ITS DETAIL. The detail is the
    # whole assertion and the count alone is worthless here: while mbs-shim.js:124's transitional
    # emission lives, unlock() also emits GAME_COMPLETE, so a build that never adopted complete() at all
    # can still show exactly one event. {terminal:"shoe"} is the shoe's; {nodes,need} is the door's.
    # Recorded from boot, so nothing emitted between navigation and the first sample is missed.
    sh.add_init_script("""(() => { window.__lbLife = []; window.__lbCompletes = [];
      document.addEventListener('mbs:lifecycle', e => {
        const d = e.detail || {};
        window.__lbLife.push(d.type);
        if (d.type === 'GAME_COMPLETE') window.__lbCompletes.push(d.detail || {});
      }); })()""")
    sh.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    sh.wait_for_timeout(2500)
    sh.click("#lbModeBtn")
    sh.wait_for_selector("#lbShoe", timeout=5000)
    sh.evaluate("() => { document.querySelector('#lbScroll').style.scrollBehavior = 'auto'; }")
    sh.wait_for_timeout(300)

    boot = sh.evaluate("""() => { const s = document.querySelector('#lbScroll').getBoundingClientRect();
        const r = document.querySelector('#lbShoe').getBoundingClientRect();
        return { fired: window.__lbShoe.length, above: r.bottom <= s.top + 1,
                 said: document.querySelector('#lbShoeSaid').textContent.trim(),
                 terminal: document.querySelector('#lbConsole').dataset.terminal || "" }; }""")
    check(boot["fired"] == 0 and boot["above"] and not boot["said"] and not boot["terminal"],
          "at the entrance the shoe has not fired and is off the top of the run (%s)" % boot)

    # chapter six: the diagnosis is up, the shoe is not. This is the half that fails on a build that
    # triggers on the prescription instead of on being past the chapter it belongs to.
    sh.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = 6 * s.clientHeight; }")
    sh.wait_for_function("() => document.querySelector('#lbConsole').dataset.scene === '6'",
                         timeout=3000, polling=60)
    sh.wait_for_timeout(400)
    atsix = sh.evaluate("""() => ({ fired: window.__lbShoe.length,
        sev: document.querySelector('#lbRxSev').textContent.trim(),
        rx: document.querySelector('#lbRx').textContent.trim(),
        done: window.__lbCompletes.slice(),
        terminal: document.querySelector('#lbConsole').dataset.terminal || "" })""")
    check(atsix["sev"] == "FINAL" and atsix["fired"] == 0 and not atsix["terminal"],
          "AT chapter six the diagnosis has rendered - %s / \"%s\" - and the shoe has still not fallen "
          "(%d firings)" % (atsix["sev"], atsix["rx"], atsix["fired"]))
    # 4.6's "ONLY there", and it is the half that gives the clause teeth: six chapters of scrolling -
    # every consequence rendered, the FINAL diagnosis on the strip - and the run has still not reported
    # itself finished. A build that completed on the diagnosis, or on chapter six becoming the scene,
    # is red here and green on every count-after-the-fact assertion below.
    check(atsix["done"] == [],
          "   and NOTHING has completed yet - the diagnosis is not the terminal, the shoe is (%s)"
          % atsix["done"])

    # past it. The end section rising is what releases the shoe.
    sh.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = s.scrollHeight; }")
    sh.wait_for_function("() => window.__lbShoe.length > 0", timeout=4000, polling=60)
    sh.wait_for_timeout(700)          # the drop is 460ms; land it before anything is measured
    seen = sh.evaluate("() => window.__lbShoe")
    check(len(seen) == 1 and seen[0]["scene"] == "6" and seen[0]["sev"] == "FINAL",
          "AFTER chapter six the shoe falls, and the diagnosis was on the strip when it was released "
          "(%s)" % seen)

    # it lands ON the character. Geometry, both axes, off the rendered boxes - a shoe that drops past
    # the figure or beside it is a shoe that fell, not a shoe that fell on someone. The third number is
    # 4.3's guard: the strip's three readouts stay legible, so the terminal beat does not buy its
    # picture by eclipsing the console that gives it meaning.
    land = sh.evaluate("""() => { const q = s => document.querySelector(s).getBoundingClientRect();
        const shoe = q('#lbShoe'), fig = q('#lbFig i'), room = q('#lbRoom'), con = q('#lbConsole');
        return { x: +(Math.min(shoe.right, fig.right) - Math.max(shoe.left, fig.left)).toFixed(2),
                 y: +(Math.min(shoe.bottom, fig.bottom) - Math.max(shoe.top, fig.top)).toFixed(2),
                 figH: +fig.height.toFixed(2),
                 clear: +(room.left - shoe.right).toFixed(2),
                 inStrip: shoe.bottom > con.top && shoe.bottom < con.bottom,
                 said: document.querySelector('#lbShoeSaid').textContent.trim(),
                 terminal: document.querySelector('#lbConsole').dataset.terminal || "" }; }""")
    check(land["x"] > 0 and land["y"] > 0 and land["inStrip"],
          "and it lands ON the character - %.2fpx across and %.2fpx into a %.2fpx person"
          % (land["x"], land["y"], land["figH"]))
    # 4px rather than 0, and the margin is the point: the shoe's rect is not its ink. A sole overhanging
    # to the right or an unspread box-shadow both haze over a readout that measured "clear" by its box,
    # so the sole is flush right and the shadow spread negative, and this asks for room on top of that.
    check(land["clear"] >= 4,
          "   without eclipsing the strip's readouts, which 4.3 fitted to the pixel (%.2fpx of clearance "
          "to the room name)" % land["clear"])
    check(land["terminal"] == "1" and land["said"].endswith("The programme ends here."),
          "   and the run is ENDED - the console is latched terminal and the beat is announced, not "
          "only drawn (%s)" % land["said"])

    # EXACTLY ONCE, and the fixture is the ordinary thing a visitor does in a scroll piece: go back and
    # read something again. Sampled per pass rather than once at the end, so a second firing on the way
    # back up is not hidden by a third on the way down.
    # ---- 4.6: completion, emitted AT the shoe, idempotently, and only there --------------------------
    # THE DETAIL IS THE ASSERTION, not the count. mbs-shim.js:124 still emits GAME_COMPLETE from
    # unlock(), so "exactly one event" is true of a channel that never adopted the API. {terminal:"shoe"}
    # is the only thing that says this one came from the shoe's own complete() call. Scroll mode never
    # reaches the museum door, so on this run complete() is the first call through the shared guard and
    # the payload really is the channel's own; the museum-first order is driven below, where it is not.
    done = sh.evaluate("() => window.__lbCompletes.slice()")
    check(len(done) == 1 and done[0].get("site") == "lilboyfriend"
          and done[0].get("terminal") == "shoe" and "nodes" not in done[0],
          "4.6: the shoe COMPLETES the run, and the payload is the shoe's own rather than the unlock's "
          "transitional one (%s)" % done)

    # EXACTLY ONCE, and the fixture is the ordinary thing a visitor does in a scroll piece: go back and
    # read something again. Sampled per pass rather than once at the end, so a second firing on the way
    # back up is not hidden by a third on the way down - and the completion count is sampled on the same
    # schedule as the animation, because "the shoe fired once" and "the run completed once" are two
    # claims and a build can fail the second while passing the first.
    passes, emits = [], []
    for _ in range(3):
        sh.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = 0; }")
        sh.wait_for_timeout(300)
        passes.append(sh.evaluate("() => window.__lbShoe.length"))
        emits.append(sh.evaluate("() => window.__lbCompletes.length"))
        sh.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = s.scrollHeight; }")
        sh.wait_for_timeout(500)
        passes.append(sh.evaluate("() => window.__lbShoe.length"))
        emits.append(sh.evaluate("() => window.__lbCompletes.length"))
    check(passes == [1] * 6,
          "it fires EXACTLY once - three more passes over the trigger add nothing (%s)" % passes)
    check(emits == [1] * 6,
          "   and it completes exactly once with it - the latch is the guard, so repeated scrolling past "
          "the trigger puts nothing more on the wire (%s)" % emits)
    life = sh.evaluate("() => window.__lbLife")
    check(life.count("GAME_COMPLETE") == 1,
          "   and the whole run carried ONE GAME_COMPLETE end to end (%d lifecycle events: %s)"
          % (len(life), life))

    # consequence 6 survives the terminal, which is the one thing the ending was not allowed to cost:
    # the closing scene is a reveal, and the 192 sq ft are still on the table after the shoe.
    post = sh.evaluate("""() => ({ sqft: parseInt(document.querySelector('#lbSqft').textContent, 10),
        figH: +document.querySelector('#lbFig i').getBoundingClientRect().height.toFixed(2),
        disabled: document.querySelector('#lbGive').disabled })""")
    sh.click("#lbGive")
    sh.wait_for_timeout(200)
    post2 = sh.evaluate("""() => ({ sqft: parseInt(document.querySelector('#lbSqft').textContent, 10),
        figH: +document.querySelector('#lbFig i').getBoundingClientRect().height.toFixed(2),
        given: +document.querySelector('#lbGiven').textContent })""")
    check(not post["disabled"] and post2["sqft"] > post["sqft"] and post2["figH"] > post["figH"]
          and post2["given"] > 0,
          "and GIVE IT BACK still works under the shoe - %d->%d sq ft, %.2f->%.2fpx of character "
          "(%d restored)" % (post["sqft"], post2["sqft"], post["figH"], post2["figH"], post2["given"]))

    # THE SHORT STAGE, and it is checked because the shoe's landing is two hand-derived numbers per
    # branch, not one rule. Inside the television the stage is 566 and the container query swaps the
    # strip to 54px, the figure to 32 and the room name to x 40 - so a shoe positioned off the 72px
    # strip's arithmetic lands 6px BELOW its own character there and eclipses the readout it cleared
    # here. The stage is squeezed directly, as 4.2 does, and this is the last thing the section asks.
    sh.evaluate("() => { document.querySelector('#lbStage').style.height = '566px'; }")
    sh.wait_for_timeout(500)
    short = sh.evaluate("""() => { const q = s => document.querySelector(s).getBoundingClientRect();
        const shoe = q('#lbShoe'), fig = q('#lbFig i'), room = q('#lbRoom'), con = q('#lbConsole');
        return { strip: +con.height.toFixed(0),
                 x: +(Math.min(shoe.right, fig.right) - Math.max(shoe.left, fig.left)).toFixed(2),
                 y: +(Math.min(shoe.bottom, fig.bottom) - Math.max(shoe.top, fig.top)).toFixed(2),
                 clear: +(room.left - shoe.right).toFixed(2) }; }""")
    check(short["strip"] == 54 and short["x"] > 0 and short["y"] > 0 and short["clear"] >= 4,
          "squeezed to the 566px stage the television gives it, the shoe still lands on the character "
          "and still clears the readouts (%dpx strip, %.2f across, %.2f into, %.2f clear)"
          % (short["strip"], short["x"], short["y"], short["clear"]))

    shclean = [e for e in sherrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not shclean, "4.5: no page errors across the terminal drive (%s)" % (shclean[:2] or "none"))

    # ---- 4.6, THE OTHER ORDER: the museum door first, then the chapters ------------------------------
    # D.1.10 says unlock and complete are order-independent, and this channel is the one where the two
    # orders are genuinely different code paths rather than a thought experiment. Scroll mode never
    # reaches fireConnect(), so the run above is the clean one: complete() is the first call through
    # mbs-shim.js's shared per-site guard and the wire carries the shoe's own payload. A visitor who
    # walks the museum to the door FIRST has already spent that guard on unlock()'s transitional
    # emission, so the same call at the shoe is a silent no-op - and the thing the contract actually
    # forbids, a SECOND GAME_COMPLETE for one site, is what this section is here to catch.
    #
    # The door is the flat gallery's, reached by seeding the museum's own save to {phase:"out", t:1} -
    # nearestStep() lands on it - and by asking for ?mode=live, because off stream the hole is a hole
    # and "Nothing happens." is the correct behaviour.
    print("\n  -- 4.6: the museum door first, then the chapters (the other order) --")

    mo = b.new_page(viewport={"width": 390, "height": 844})
    moerrs = []
    mo.on("pageerror", lambda e: moerrs.append(str(e)))
    mo.on("console", lambda m: moerrs.append(m.text) if m.type == "error" else None)
    mo.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    mo.add_init_script("""(() => { window.__lbCompletes = [];
      document.addEventListener('mbs:lifecycle', e => {
        const d = e.detail || {};
        if (d.type === 'GAME_COMPLETE') window.__lbCompletes.push(d.detail || {});
      }); })()""")
    mo.add_init_script("""(() => { window.__lbShoe = [];
      document.addEventListener('animationstart', e => {
        if (e.target && e.target.id === 'lbShoe') window.__lbShoe.push(e.animationName); }, true); })()""")
    mo.goto(BASE + "/play/lilboyfriend/?mode=live", wait_until="load")
    mo.evaluate("""() => localStorage.setItem('mbs-lilbf-museum-v2',
        JSON.stringify({ phase: 'out', t: 1, mode: 'museum', signed: false }))""")
    mo.reload(wait_until="load")
    mo.wait_for_timeout(2500)

    mo.wait_for_selector("#flSlot", timeout=5000)
    check(mo.evaluate("() => window.__lbCompletes.length") == 0,
          "at the museum door, nothing has completed yet")
    mo.click("#flSlot")
    mo.wait_for_function("() => window.__lbState().phase !== 'out'", timeout=4000, polling=60)
    mo.wait_for_timeout(300)
    door = mo.evaluate("() => window.__lbCompletes.slice()")
    check(len(door) == 1 and door[0].get("site") == "lilboyfriend" and "nodes" in door[0],
          "the door unlocks and spends the shared guard on the TRANSITIONAL payload - which is the "
          "defect D.1.10 names, still shipping until caller six lands (%s)" % door)

    # now the chapters, and the shoe. The BEAT must be unconditional - it is this mode's ending and it
    # does not belong to the lifecycle contract - while the wire must stay at one event for the site.
    mo.click("#lbModeBtn")
    mo.wait_for_selector("#lbShoe", timeout=5000)
    mo.evaluate("() => { document.querySelector('#lbScroll').style.scrollBehavior = 'auto'; }")
    mo.wait_for_timeout(300)
    mo.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = s.scrollHeight; }")
    mo.wait_for_function("() => window.__lbShoe.length > 0", timeout=5000, polling=60)
    mo.wait_for_timeout(700)
    after = mo.evaluate("""() => ({ shoe: window.__lbShoe.length,
        done: window.__lbCompletes.slice(),
        terminal: document.querySelector('#lbConsole').dataset.terminal || "",
        said: document.querySelector('#lbShoeSaid').textContent.trim() })""")
    check(after["shoe"] == 1 and after["terminal"] == "1" and after["said"].endswith("ends here."),
          "the shoe still falls and still ends the run for a visitor who walked the museum first - the "
          "BEAT is not conditional on the lifecycle guard (%d firings)" % after["shoe"])
    check(len(after["done"]) == 1 and "nodes" in after["done"][0],
          "   and the site still carries exactly ONE GAME_COMPLETE across both orders - the shoe's call "
          "is a no-op behind the door's, never a second event (%s)" % after["done"])

    moclean = [e for e in moerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not moclean, "4.6: no page errors across the museum-first drive (%s)" % (moclean[:2] or "none"))

    # ---- 4.7 / E.7: The Boat's four synchronized layers, and the choice that gates the fourth --------
    # Two clauses, and they need opposite fixtures. "No audio plays before the choice" is the half where
    # NOTHING happening is the pass, so it is driven as its own full six-chapter scroll with the button
    # untouched - a build that starts its context on mount and merely leaves the gain at zero is red
    # here and green on every assertion that only looks at the run after the click.
    #
    # WHAT COUNTS AS "NO AUDIO" IS MEASURED AT THE PLATFORM, NOT AT THE CHANNEL. A suspended context, a
    # muted element and an autoplay-blocked one are all silent for reasons the BROWSER owns; asking the
    # page whether it thinks it is playing lets a policy pass the packet. So AudioContext construction
    # and OscillatorNode.start() are counted by patching the constructor and the prototype from an init
    # script, before any channel code runs, and the parameter automation the channel actually sends is
    # recorded off AudioParam.prototype.setTargetAtTime. The channel keeps no counter of its own: a
    # source that scores its own silence is its own witness.
    print("\n  -- 4.7: The Boat's four layers, and the sound choice --")

    sd = b.new_page(viewport={"width": 390, "height": 844})
    sderrs = []
    sd.on("pageerror", lambda e: sderrs.append(str(e)))
    sd.on("console", lambda m: sderrs.append(m.text) if m.type == "error" else None)
    sd.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    sd.add_init_script("""(() => {
      const AC = window.AudioContext || window.webkitAudioContext;
      window.__lbA = { ctors: 0, starts: 0, oscs: [], freqs: [], gains: [] };
      if (!AC) return;
      class Counted extends AC { constructor(...a) { super(...a); window.__lbA.ctors++; } }
      window.AudioContext = window.webkitAudioContext = Counted;
      const start = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (...a) {
        window.__lbA.starts++; window.__lbA.oscs.push(this); return start.apply(this, a); };
      // the frequency param and the gain param are told apart by IDENTITY against the oscillator that
      // was actually started, not by call order - the channel is free to push them in either order.
      const stt = AudioParam.prototype.setTargetAtTime;
      AudioParam.prototype.setTargetAtTime = function (v, ...a) {
        const mine = window.__lbA.oscs.some(o => o.frequency === this);
        (mine ? window.__lbA.freqs : window.__lbA.gains).push(+Number(v).toFixed(3));
        return stt.call(this, v, ...a); }; })()""")

    # every layer in one sample, each read where the VISITOR gets it: the background off the chapter's
    # computed background-image (so a --lb-close nothing consumes is caught - the string would not move),
    # the character off the rendered figure, the text off the strip, the sound off the automation.
    LAYERS = """() => { const q = s => document.querySelector(s);
      const sc = q('#lbScroll'), ch = q('#lbScroll .lb-ch[data-chapter="1"]');
      return { scene: q('#lbConsole').dataset.scene,
               close: +getComputedStyle(sc).getPropertyValue('--lb-close'),
               bg: getComputedStyle(ch).backgroundImage,
               figH: +q('#lbFig i').getBoundingClientRect().height.toFixed(2),
               text: q('#lbRxSev').textContent.trim() + ' / ' + q('#lbRoom').textContent.trim(),
               ctors: window.__lbA.ctors, starts: window.__lbA.starts,
               freqN: window.__lbA.freqs.length,
               freq: window.__lbA.freqs.slice(-1)[0],
               gain: window.__lbA.gains.slice(-1)[0] }; }"""

    sd.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    sd.wait_for_timeout(2500)
    sd.click("#lbModeBtn")
    sd.wait_for_selector("#lbConsole", timeout=5000)
    sd.evaluate("() => { document.querySelector('#lbScroll').style.scrollBehavior = 'auto'; }")
    sd.wait_for_timeout(300)

    btn = sd.evaluate("""() => { const b = document.querySelector('#lbSoundBtn');
        return b ? { text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed'),
                     shown: b.getClientRects().length > 0 } : null; }""")
    check(btn and btn["shown"] and btn["pressed"] == "false" and "SOUND" in btn["text"].upper(),
          "the choice is offered before anything plays, and it is offered as a choice - \"%s\", "
          "aria-pressed=%s" % (btn["text"] if btn else "MISSING", btn and btn["pressed"]))

    # the silent scroll: the whole piece, end to end, button never touched.
    silent = []
    for i in range(1, 7):
        sd.evaluate("i => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = i * s.clientHeight; }", i)
        sd.wait_for_function("i => document.querySelector('#lbConsole').dataset.scene === String(i)",
                             arg=i, timeout=3000, polling=60)
        silent.append(sd.evaluate(LAYERS))
    sd.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = s.scrollHeight; }")
    sd.wait_for_timeout(700)
    quiet = sd.evaluate("() => ({ ctors: window.__lbA.ctors, starts: window.__lbA.starts, "
                        "          freqs: window.__lbA.freqs.length, gains: window.__lbA.gains.length })")
    check(quiet == {"ctors": 0, "starts": 0, "freqs": 0, "gains": 0},
          "NO AUDIO PLAYS BEFORE THE CHOICE - six chapters and the terminal, and the channel never even "
          "built an AudioContext, let alone started a source (%s)" % quiet)

    # the choice. One press, one context, one source - and the button becomes the way back out of it.
    sd.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = 0; }")
    sd.wait_for_function("() => document.querySelector('#lbConsole').dataset.scene === '0'",
                         timeout=3000, polling=60)
    sd.click("#lbSoundBtn")
    sd.wait_for_timeout(300)
    on = sd.evaluate("""() => ({ ctors: window.__lbA.ctors, starts: window.__lbA.starts,
        gain: window.__lbA.gains.slice(-1)[0], freq: window.__lbA.freqs.slice(-1)[0],
        text: document.querySelector('#lbSoundBtn').textContent.trim(),
        pressed: document.querySelector('#lbSoundBtn').getAttribute('aria-pressed') })""")
    check(on["ctors"] == 1 and on["starts"] == 1 and on["gain"] > 0 and on["pressed"] == "true",
          "and AFTER the choice it does - one context, one source, and the gain is ramped to something "
          "audible (%s)" % on)

    # the scripted scroll, with all four layers live. Sampled per scene, and the assertion is that they
    # move TOGETHER: four separate monotonic claims would each pass on a build where one layer lags a
    # chapter behind the rest, which is the failure "synchronized" actually names.
    live = [sd.evaluate(LAYERS)]
    for i in range(1, 7):
        sd.evaluate("i => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = i * s.clientHeight; }", i)
        sd.wait_for_function("i => document.querySelector('#lbConsole').dataset.scene === String(i)",
                             arg=i, timeout=3000, polling=60)
        sd.wait_for_timeout(120)
        live.append(sd.evaluate(LAYERS))

    closes = [s["close"] for s in live]
    check(all(closes[i] > closes[i - 1] for i in range(1, 7)),
          "1. BACKGROUND: the room closes in on the resident, one step per chapter (%s)" % closes)
    bgs = [s["bg"] for s in live]
    check(len(set(bgs)) == 7 and "gradient" in bgs[0],
          "   and it is RENDERED, not just a variable - the chapter's own background-image is different "
          "ink at all seven positions (%d distinct)" % len(set(bgs)))
    figs = [s["figH"] for s in live]
    check(all(figs[i] < figs[i - 1] for i in range(1, 7)) and figs[-1] > 4,
          "2. CHARACTER: the figure is smaller at every chapter and is still a person at six (%s)" % figs)
    texts = [s["text"] for s in live]
    check(len(set(texts)) == 7 and texts[-1].startswith("FINAL"),
          "3. TEXT: the prescription and the room escalate with it (%s)" % texts[-1])
    freqs = [s["freq"] for s in live]
    check(all(freqs[i] > freqs[i - 1] for i in range(1, 7)),
          "4. SOUND: the room tone rises with the walls, off the same curve as the figure (%s)" % freqs)

    # TOGETHER, and this is the clause the four checks above do not cover between them: at every one of
    # the six boundaries, all four layers moved. A build where the tone is pushed once at the click and
    # never again passes "the tone is higher at six than at zero" and fails here.
    lag = [i for i in range(1, 7)
           if not (live[i]["close"] > live[i - 1]["close"] and live[i]["figH"] < live[i - 1]["figH"]
                   and live[i]["bg"] != live[i - 1]["bg"] and live[i]["text"] != live[i - 1]["text"]
                   and live[i]["freqN"] > live[i - 1]["freqN"] and live[i]["freq"] > live[i - 1]["freq"])]
    check(not lag, "and all four advance TOGETHER - every one of the six boundaries moves background, "
                   "character, text and sound in the same step (lagging: %s)" % (lag or "none"))

    # the fourth layer belongs to the chapters' timeline. Leaving for the museum silences it WITHOUT
    # forgetting the choice, and coming back restores it - matched pair, because "it went quiet" is
    # passed by a build that simply tore the sound down and never brought it back.
    sd.click("#lbModeBtn")
    sd.wait_for_timeout(300)
    away = sd.evaluate("""() => ({ gain: window.__lbA.gains.slice(-1)[0],
        pressed: document.querySelector('#lbSoundBtn').getAttribute('aria-pressed'),
        shown: document.querySelector('#lbSoundBtn').getClientRects().length > 0 })""")
    check(away["gain"] == 0 and away["pressed"] == "true" and not away["shown"],
          "the museum has no timeline for a layer to ride, so the tone goes to silence there - and the "
          "choice is remembered, not spent (%s)" % away)
    sd.click("#lbModeBtn")
    sd.wait_for_timeout(300)
    backs = sd.evaluate("() => window.__lbA.gains.slice(-1)[0]")
    check(backs > 0, "   and it comes back with the chapters (gain %s)" % backs)

    # and the way out. Muting is the gain, not the context - a second context per press is how a channel
    # runs out of them, and the driver is watching the constructor count for exactly that.
    sd.click("#lbSoundBtn")
    sd.wait_for_timeout(300)
    off = sd.evaluate("""() => ({ gain: window.__lbA.gains.slice(-1)[0], ctors: window.__lbA.ctors,
        starts: window.__lbA.starts, text: document.querySelector('#lbSoundBtn').textContent.trim(),
        pressed: document.querySelector('#lbSoundBtn').getAttribute('aria-pressed') })""")
    check(off["gain"] == 0 and off["pressed"] == "false" and off["ctors"] == 1 and off["starts"] == 1,
          "the choice can be taken back, and taking it back is the GAIN - still one context and one "
          "source after four presses (%s)" % off)

    # 4.5/4.6 unharmed: the shoe still falls under the sound layer and the run still completes once.
    sd.evaluate("() => { const s = document.querySelector('#lbScroll'); s.scrollTop = s.scrollHeight; }")
    sd.wait_for_timeout(900)
    end = sd.evaluate("""() => ({ terminal: document.querySelector('#lbConsole').dataset.terminal || "",
        said: document.querySelector('#lbShoeSaid').textContent.trim() })""")
    check(end["terminal"] == "1" and end["said"].endswith("The programme ends here."),
          "and 4.5's terminal is untouched by the fourth layer - the shoe still falls and still ends "
          "the run (%s)" % end["terminal"])

    sdclean = [e for e in sderrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not sdclean, "4.7: no page errors across the layers drive (%s)" % (sdclean[:2] or "none"))

    # ---- 4.8 / E.7: each downward movement reads as walking farther into the museum -----------------
    # 4.8's acceptance is "manual review against the intent, recorded", and a gate cannot review a
    # feeling. What it CAN do is hold the mechanism the review is about to look at, so that the recorded
    # verdict keeps meaning something after the next packet - and, more to the point, prove that the
    # effect did not buy its read by breaking a shipped row. Four claims, in that order:
    #
    #   IT IS THE MOVEMENT, NOT A THRESHOLD. "Each downward movement" is continuous - a chapter that
    #   snaps to a new state when the observer crosses 0.65 is another slide transition, which is the
    #   thing this row exists to replace. So the depth is sampled at five points ACROSS each of the six
    #   movements and has to be strictly increasing at every one of them, in rendered ink as well as in
    #   the animation's own progress.
    #
    #   AND IT ENDS. At the pinned position the content is exactly at rest - no chapter is ever READ
    #   through a perspective distortion, which is the matched half: a build that simply left every
    #   chapter scaled would pass "it moves" and be a worse channel than the one before it.
    #
    #   4.2, 4.4 AND 4.7 ARE UNHARMED. The sections are still one stage tall and still pin to the pixel
    #   WHILE the effect is mid-travel, not merely at rest; and within a movement the depth advances at
    #   samples where --lb-close and the rendered figure do not, which is what says the corridor is its
    #   own layer rather than a re-cut of 4.4's curve or 4.7's veil.
    #
    #   AND THERE IS NO SECOND TIMELINE. The animation's timeline is a ViewTimeline - the browser
    #   reading the scroller - and the scroll run has registered no scroll, wheel or touchmove listener
    #   of its own. That is asserted rather than assumed because a scroll handler writing a variable
    #   would look identical in every check above and would be exactly the thing 4.7's one-write-site
    #   design was built to avoid.
    #
    # SNAPPING IS TURNED OFF FOR THE DURATION, for the same reason scroll-behavior is: 4.2 ships
    # `scroll-snap-type:y proximity`, so a SCRIPTED scrollTop lands on a snap position and three of the
    # five samples collapse onto one offset. A finger does not - snapping applies when the scroll comes
    # to rest, and the travel between chapters is continuous under it. The shipped affordance is not
    # what is under test here; the depth's relationship to scroll position is.
    print("\n  -- 4.8: each downward movement is a step farther in --")

    FRACS = [0.28, 0.44, 0.60, 0.76, 0.88]
    WALK = """k => { const s = document.querySelector('#lbScroll');
      const e = s.querySelector('.lb-ch[data-chapter="' + k + '"] .lb-ch-inner');
      const a = e.getAnimations().find(x => x.animationName === 'lbWalkIn');
      const pr = a ? a.effect.getComputedTiming().progress : null;
      return { p: (pr === null || pr === undefined) ? -1 : +pr.toFixed(4),
               tl: a ? a.timeline.constructor.name : null,
               w: +e.getBoundingClientRect().width.toFixed(2),
               o: +(+getComputedStyle(e).opacity).toFixed(3),
               scene: document.querySelector('#lbConsole').dataset.scene,
               close: +getComputedStyle(s).getPropertyValue('--lb-close'),
               figH: +document.querySelector('#lbFig i').getBoundingClientRect().height.toFixed(2) }; }"""

    def walk_page(reduced=None):
        pg = b.new_page(viewport={"width": 390, "height": 844}, reduced_motion=reduced)
        pg.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (t, ...a) {
            return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
        pg.add_init_script("""(() => { window.__lbLis = [];
          const add = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function (t, ...a) {
            try { window.__lbLis.push([this, t]); } catch (e) {}
            return add.call(this, t, ...a); }; })()""")
        pg.goto(BASE + "/play/lilboyfriend/", wait_until="load")
        pg.wait_for_timeout(2500)
        pg.click("#lbModeBtn")
        pg.wait_for_selector("#lbScroll .lb-ch[data-chapter]", timeout=5000)
        pg.evaluate("""() => { const s = document.querySelector('#lbScroll');
            s.style.scrollBehavior = 'auto'; s.style.scrollSnapType = 'none'; }""")
        pg.wait_for_timeout(400)
        return pg

    def walk_samples(pg):
        """Every chapter's approach, sampled across the movement that brings it in."""
        out = {}
        for k in range(1, 7):
            row = []
            for f in [0.0] + FRACS + [1.0]:
                pg.evaluate("v => { const s = document.querySelector('#lbScroll');"
                            "        s.scrollTop = v * s.clientHeight; }", (k - 1) + f)
                pg.wait_for_timeout(140)
                row.append(pg.evaluate(WALK, str(k)))
            out[k] = row
        return out

    wk = walk_page()
    wkerrs = []
    wk.on("pageerror", lambda e: wkerrs.append(str(e)))
    wk.on("console", lambda m: wkerrs.append(m.text) if m.type == "error" else None)

    persp = wk.evaluate("() => getComputedStyle(document.querySelector('#lbScroll .lb-ch')).perspective")
    check(persp and persp != "none" and float(persp.replace("px", "")) > 0,
          "the chapters are a corridor and not a stack of cards - the section carries a real "
          "perspective for its contents to travel through (%s)" % persp)

    walks = walk_samples(wk)

    # 1. the room ahead is genuinely AHEAD when the movement starts.
    far = [(k, walks[k][0]["w"], walks[k][0]["o"]) for k in range(1, 7)]
    rest = {k: walks[k][-1]["w"] for k in range(1, 7)}
    back = [k for k in range(1, 7)
            if not (walks[k][0]["w"] < rest[k] * 0.92 and walks[k][0]["o"] < 0.6)]
    check(not back, "before the visitor moves, the next room is down the hall - its contents are "
                    "measurably smaller and washed out, not sitting at full size waiting (%s)"
          % (["ch%d w=%s o=%s" % f for f in far[:2]] if not back else back))

    # 2. and it approaches WITH the movement, at every sample, in every one of the six.
    jerky = []
    for k in range(1, 7):
        s = walks[k][1:6]
        if not (all(s[i]["w"] > s[i - 1]["w"] for i in range(1, 5))
                and all(s[i]["o"] > s[i - 1]["o"] for i in range(1, 5))
                and all(s[i]["p"] > s[i - 1]["p"] for i in range(1, 5))):
            jerky.append(k)
    check(not jerky, "and it comes NEARER at every point of the movement, not at a threshold - five "
                     "samples across each of the six downward movements, all six continuous (%s)"
          % (["ch1 " + str([x["w"] for x in walks[1][1:6]])] if not jerky else jerky))

    # 3. the matched half: arriving is ARRIVING. Nothing is read through the corridor.
    stuck = [(k, walks[k][-1]["w"], walks[k][-1]["o"], walks[k][-1]["p"]) for k in range(1, 7)
             if not (walks[k][-1]["o"] == 1 and walks[k][-1]["p"] == 1
                     and walks[k][-1]["w"] > walks[k][-2]["w"])]
    check(not stuck, "and the walk ENDS where the reading starts - every chapter is at full size and "
                     "full ink once the visitor is standing in it (%s)" % (stuck or "all six land"))

    # 4. no second timeline: the browser is reading the scroller, and the channel is not.
    tls = {walks[k][3]["tl"] for k in range(1, 7)}
    lis = wk.evaluate("""() => { const s = document.querySelector('#lbScroll');
      const MOVEY = ['scroll','wheel','touchmove','pointermove'];
      return { total: (window.__lbLis || []).length,
        offenders: (window.__lbLis || []).filter(([el, t]) => MOVEY.includes(t) && el
                     && (el === s || (el.nodeType === 1 && s.contains(el))))
                   .map(([el, t]) => (el.id || el.className || el.tagName) + ':' + t) }; }""")
    check(all(t and "ViewTimeline" in t for t in tls) and lis["total"] > 20
          and not lis["offenders"],
          "and the depth is the BROWSER reading the scroller, not a second timeline - a %s drives it "
          "and the scroll run registered no scroll/wheel/move listener of its own (%d listeners seen, "
          "offenders %s)" % ("/".join(sorted(str(t) for t in tls)), lis["total"],
                             lis["offenders"] or "none"))

    # 5. caution 1: 4.2's contract holds WHILE the effect is travelling, not only at rest. The sections
    #    are what every 4.2 assertion measures, and the travel is deliberately on their child.
    wk.evaluate("() => { const s = document.querySelector('#lbScroll');"
                "        s.scrollTop = 2.6 * s.clientHeight; }")
    wk.wait_for_timeout(200)
    mid = wk.evaluate("""() => { const s = document.querySelector('#lbScroll'),
                                 stage = document.querySelector('#lbStage').clientHeight,
                                 top = s.getBoundingClientRect().top;
      return { stage, chs: [...s.querySelectorAll('.lb-ch[data-chapter]')].map(c => {
        const inner = c.querySelector('.lb-ch-inner');
        return { n: +c.dataset.chapter, h: Math.round(c.getBoundingClientRect().height),
                 rel: Math.round(c.getBoundingClientRect().top - top),
                 cut: inner.scrollHeight - inner.clientHeight }; }) }; }""")
    tall = [(c["n"], c["h"]) for c in mid["chs"] if c["h"] > mid["stage"] + 1]
    pinned = [(c["n"], c["rel"]) for c in mid["chs"] if c["n"] <= 2 and abs(c["rel"]) > 1]
    clipped = [(c["n"], c["cut"]) for c in mid["chs"] if c["cut"] > 0]
    check(not tall and not pinned and not clipped,
          "4.2 is untouched mid-travel: every chapter still exactly one stage of %dpx, the passed ones "
          "still pinned to the pixel, nothing clipped (tall %s, unpinned %s, clipped %s)"
          % (mid["stage"], tall or "none", pinned or "none", clipped or "none"))

    # 6. caution 2: the corridor is its OWN layer. Inside a single movement there are samples where the
    #    depth advanced and the scene did not - and at those, 4.4's figure and 4.7's veil are byte-equal.
    recut, moved = [], 0
    for k in range(1, 7):
        for a, z in zip(walks[k][1:6], walks[k][2:6]):
            if a["scene"] != z["scene"]:
                continue
            moved += 1
            if z["p"] <= a["p"] or z["close"] != a["close"] or z["figH"] != a["figH"]:
                recut.append((k, a["scene"], a["close"], z["close"], a["figH"], z["figH"]))
    check(moved >= 6 and not recut,
          "and it did not re-cut a shipped curve - at %d samples the walk advanced while the scene did "
          "not, and --lb-close and the figure are identical at every one of them (%s)"
          % (moved, recut[:2] or "none"))

    wkclean = [e for e in wkerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not wkclean, "4.8: no page errors across the walking drive (%s)" % (wkclean[:2] or "none"))
    wk.close()

    # 7. caution 4: the accessibility branch. A "feels like" row is exactly where prefers-reduced-motion
    #    gets skipped, and the shoe already honours it. The chapters must still ARRIVE - removing the
    #    motion must not remove the content, so the scene still advances 1..6 with nothing travelling.
    rm = walk_page(reduced="reduce")
    rmwalks = walk_samples(rm)
    travelled = [k for k in range(1, 7)
                 if len({x["w"] for x in rmwalks[k]}) != 1 or len({x["o"] for x in rmwalks[k]}) != 1]
    at_rest = all(x["o"] == 1 and x["w"] == rmwalks[k][-1]["w"]
                  for k in range(1, 7) for x in rmwalks[k])
    scenes = [rmwalks[k][-1]["scene"] for k in range(1, 7)]
    check(not travelled and at_rest and scenes == [str(k) for k in range(1, 7)],
          "under prefers-reduced-motion nothing travels toward the visitor - and the chapters still "
          "arrive, at rest, all six (moving %s, scenes %s)" % (travelled or "none", scenes))
    rm.close()

    # ---- 4.9: the fourth copy of the twelve photographs is gone -------------------------------------
    # The lower "Patient results" gallery re-listed the same six exhibits and hard-coded the same twelve
    # assets/lilbf-*-{cozy,horror}.jpg paths a FOURTH time, below the stage. The three consumers that
    # actually matter all read one array - EXHIBITS in lilboyfriend.js - so the markup was a copy nobody
    # updated. The row asks for the MARKUP, never the files: the jpgs are load-bearing for all three.
    #
    # SO "ZERO 404s" IS NOT ENOUGH ON ITS OWN, AND IS THE WEAKEST HALF OF THIS GATE. A build that
    # deleted the twelve files as well would also report zero 404s - it would simply stop asking for
    # them. Every consumer below is therefore driven to the point where it NAMES a photograph, and the
    # assertion is that the image DECODED (naturalWidth > 0, or a 200 on the wire for the textures the
    # WebGL path hands to three.js rather than to the DOM), with the twelve collected as a SET and
    # compared against EXHIBITS. Twelve distinct decoded photographs is the claim; the 404 sweep across
    # all four pages is the second half, and it catches a path that broke rather than one that vanished.
    #
    # THE DEAD CSS IS ASSERTED THROUGH THE CSSOM, NOT BY GREPPING THE FILE. The `.breached` photo flip
    # had exactly one consumer - this gallery - so the rules and the class write went with it, and the
    # commentary that RECORDS that decision still contains the word. A substring check over the source
    # would fail on its own changelog. `document.styleSheets` answers what actually survived.
    print("\n  -- 4.9: the redundant lower gallery is gone, every consumer still resolves --")

    KINDS = ("cozy", "horror")
    IDS = ["teepee", "car", "shoebox", "storage", "masonjar", "van"]
    WANT = set("lilbf-%s-%s.jpg" % (i, k) for i in IDS for k in KINDS)
    WANT_COZY = set("lilbf-%s-cozy.jpg" % i for i in IDS)
    responses, gerrs = [], []

    def watch(pg):
        pg.on("response", lambda r: responses.append((r.url, r.status)))
        pg.on("pageerror", lambda e: gerrs.append(str(e)))
        pg.on("console", lambda m: gerrs.append(m.text) if m.type == "error" else None)
        return pg

    def shot(url):
        """The filename alone: every consumer resolves against <base href="../../tv/">, so a path that
        went wrong shows up as a 404 in the sweep rather than as a name that quietly still matches."""
        return url.rsplit("/", 1)[-1].split("?")[0]

    # 1. the markup itself. Read off the SHIPPED source, not the DOM, because "the gallery is not
    #    rendered" is also true of a gallery that is merely hidden, and the row asked for a deletion.
    src = io.open(os.path.join(ROOT, "tv", "channels", "lilboyfriend.html"), encoding="utf-8").read()
    #    The three markers are ATTRIBUTES, not prose: the header comment above them is what RECORDS
    #    this deletion, so it names the section and its photo glob, and a looser grep fails on it.
    left = re.findall(r"lilbf-[a-z]+-(?:cozy|horror)\.jpg", src)
    check(not left and 'aria-label="Patient results"' not in src
          and 'id="listings"' not in src and 'class="home"' not in src,
          "the fourth copy is deleted: no <figure class=\"home\"> gallery, and not one of the twelve "
          "photo paths is hard-coded in the markup any more (%s)" % (sorted(set(left))[:3] or "none"))

    # 2. consumer one: the WebGL texture preload. It hands every URL to three.js, never to an <img>, so
    #    the DOM cannot answer for it - the wire and the channel's own load-failure console line can.
    gl = watch(b.new_page(viewport={"width": 1280, "height": 900}))
    gl.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    gl.wait_for_timeout(4000)
    got_gl = set(shot(u) for u, s in responses if s == 200 and shot(u) in WANT)
    check(gl.evaluate("() => !!document.querySelector('#lb.webgl')") and got_gl == WANT,
          "the WebGL preload still resolves all twelve textures on the 3D path (%d of 12, missing %s)"
          % (len(got_gl), sorted(WANT - got_gl) or "none"))
    check(not [e for e in gerrs if "photo failed to load" in e],
          "   and three.js reported no photo it could not load (%s)"
          % ([e for e in gerrs if "photo failed" in e][:2] or "none"))
    gl.close()

    # 3. consumer two: the flat no-WebGL fallback, walked end to end. Both halves of the run - the six
    #    COZY steps outbound and the six HORROR steps back - because they are separate call sites and a
    #    fallback that only got the outbound half right would pass a gate that stopped at the door.
    #    ?mode=live is what makes the door a door: off stream the hole is a hole, by design.
    fw = watch(b.new_page(viewport={"width": 900, "height": 1000}))
    fw.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    fw.goto(BASE + "/play/lilboyfriend/?mode=live", wait_until="load")
    fw.wait_for_timeout(2500)

    def flat_shot():
        """The photograph the current step is showing, once it has actually decoded."""
        try:
            fw.wait_for_function("""() => { const i = document.querySelector('#lbFlat .fl-photo');
                return !!i && i.complete && i.naturalWidth > 0; }""", timeout=6000, polling=80)
        except Exception:
            return None
        return shot(fw.evaluate("() => { const i = document.querySelector('#lbFlat .fl-photo');"
                                "        return i ? (i.currentSrc || i.src) : ''; }"))

    fw.click("#flNext")                                   # entrance -> the guest book
    fw.wait_for_selector("#flSkip", timeout=5000)
    fw.click("#flSkip")                                   # -> the teepee, the first exhibit
    flat_seen = []
    for _ in range(6):                                    # teepee, car, shoebox, storage, masonjar, van
        flat_seen.append(flat_shot())
        fw.click("#flNext")
    fw.wait_for_selector("#flSlot", timeout=5000)         # the door
    fw.click("#flSlot")
    fw.wait_for_function("() => window.__lbState().phase !== 'out'", timeout=4000, polling=60)
    fw.wait_for_selector("#flNext", timeout=6000)
    fw.click("#flNext")                                   # "turn around" -> the horror half
    for _ in range(6):                                    # van-h .. teepee-h
        flat_seen.append(flat_shot())
        fw.click("#flNext")
    check(set(flat_seen) == WANT and None not in flat_seen,
          "the flat fallback still resolves every one of the twelve, cozy AND horror, walked end to "
          "end (%d decoded, missing %s)"
          % (len([x for x in flat_seen if x]), sorted(WANT - set(x for x in flat_seen if x)) or "none"))

    # 3b. the same walk is the regression check on what 4.9 touched in the JS: the door's fireConnect
    #     lost the `.breached` class write and the `restore` it existed for, and kept the wave. A wave
    #     whose restore is dropped must still put the picture back - mbs-runtime.js's purple sweep owns
    #     that - so the gallery is still on screen and still interactive after the breach, above.
    check(fw.evaluate("() => { const f = document.querySelector('#lbFlat');"
                      "        return !!f && f.getClientRects().length > 0; }"),
          "   and the fuse box's wave still hands the picture back with no restore() of its own")

    # 3c. the flip's stylesheet went with the markup it styled. Read from the CSSOM: the rules that are
    #     live, not the bytes of a file that also documents why they are not.
    dead = fw.evaluate("""() => { const out = [];
        for (const sh of document.styleSheets) {
          let rules; try { rules = sh.cssRules; } catch (e) { continue; }
          for (const r of rules || []) {
            const sel = r.selectorText || '';
            if (/\\.homes\\b|\\.home\\b|\\bbreached\\b/.test(sel)) out.push(sel);
          }
        } return out; }""")
    check(not dead, "the gallery's CSS went with it - no .homes, .home or .breached rule is left "
                    "anywhere in the live stylesheets (%s)" % (dead[:3] or "none"))
    fw.close()

    # 4. consumer three: 4.2's scroll chapters. Six cozy photographs, one per chapter, and they are
    #    loading="lazy" inside a scroller - so the run is scrolled through before they are counted,
    #    or five of the six are honestly still unrequested and the check would be measuring patience.
    sr = watch(b.new_page(viewport={"width": 390, "height": 844}))
    sr.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    sr.goto(BASE + "/play/lilboyfriend/", wait_until="load")
    sr.wait_for_timeout(2500)
    sr.click("#lbModeBtn")
    sr.wait_for_selector("#lbScroll .lb-ch[data-chapter]", timeout=5000)
    sr.evaluate("""() => { const s = document.querySelector('#lbScroll');
        s.style.scrollBehavior = 'auto'; s.style.scrollSnapType = 'none'; }""")
    for k in range(1, 8):
        sr.evaluate("v => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = v * s.clientHeight; }", k)
        sr.wait_for_timeout(250)
    chs = sr.evaluate("""() => [...document.querySelectorAll('#lbScroll .lb-ch-photo')]
        .map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth }))""")
    got_sc = set(shot(c["src"]) for c in chs if c["w"] > 0)
    check(len(chs) == 6 and got_sc == WANT_COZY,
          "4.2's six chapters each still decode their own photograph (%d of 6, missing %s)"
          % (len(got_sc), sorted(WANT_COZY - got_sc) or "none"))
    sr.close()

    # 5. and the acceptance's own words, last, because it is the half a deletion of the FILES would
    #    also pass: nothing any of the four pages asked this site for came back missing.
    bad = sorted(set((shot(u), s) for u, s in responses
                     if s >= 400 and u.startswith(BASE) and "favicon" not in u))
    check(not bad, "zero 404s across all four consumers' pages (%s)" % (bad[:4] or "none"))
    gclean = [e for e in gerrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not gclean, "4.9: no page errors across the deletion drive (%s)" % (gclean[:2] or "none"))

    # ---- 4.10 / S1: the wall information is consumable ---------------------------------------------
    # "No paragraph on this channel exceeds three sentences" is the acceptance, and it names an
    # automated check, so this section IS the check. Four things had to be settled before it could
    # mean anything.
    #
    # (1) A CRUDE SCAN COUNTS CSS AND JS AS PROSE. Grepping this channel's markup for sentences finds
    #     a 44-sentence "paragraph" (the <style> block) and a 21-sentence one (the header comment
    #     recording what the last five packets did) before it finds a word a visitor ever reads. The
    #     measurement is therefore taken off the RENDERED page: what a browser has laid out, with
    #     <style>, <script> and SVG chart labels excluded, and nothing that is display:none counted.
    #
    # (2) "PARAGRAPH" IS THE BROWSER'S UNIT, NOT A <p> TAG. Half this channel's copy is a <div> or an
    #     <li>, and the .fl-card that holds a fact is a div with a display:block <span> of citation
    #     inside it. So a paragraph here is any laid-out block box's OWN text - its text nodes plus
    #     its inline children, stopping at the next block. That measures each card body, each citation
    #     and each bullet exactly once, and it is also why the fix works: a <ul> of three <li> is three
    #     paragraphs to this gate and to a reader, where the run-on it replaced was one of five.
    #
    # (3) THE INFOMERCIAL IS ONLY VISIBLE IN THE TELEVISION. Part A isolation lists #lbStage as this
    #     channel's only root, so on /play/ the whole .wrap below the stage carries .mbs-off and every
    #     side-effect and footer line is display:none. Inside /tv/ it renders in full. A gate driven
    #     on one route alone would therefore MISS the worst two paragraphs on the channel (the safety
    #     block at eight sentences, the footer at four) or miss all eighteen sourced facts. Both routes
    #     are swept, and the count of paragraphs actually measured is asserted so that a sweep which
    #     silently found nothing cannot pass.
    #
    # (4) THE PLACARDS ARE CANVAS AND CANNOT BE READ BACK. The museum's wall placards draw their body
    #     with fillText into a texture, so no DOM sweep will ever see them - but they are handed the
    #     SAME FACTS[].body the flat cards and the scroll chapters render, so measuring those measures
    #     the wall. The matched half is below: the two bodies that were re-formatted are asserted to
    #     rejoin, character for character, into the strings that shipped. That is what stops this
    #     packet from passing by PARAPHRASING a sourced housing fact into something shorter, which the
    #     file's own thesis forbids and which every "shorter is better" gate would otherwise reward.
    print("\n  -- 4.10: no paragraph on this channel exceeds three sentences --")

    # The sentence counter, and the abbreviation list is the whole of its subtlety. Requiring a capital
    # or a digit after the stop keeps "HUD. slate.com/..." and every other citation-then-URL to one
    # sentence; allowing the digit is what catches a real "...above 2020. 83% of renters..." boundary;
    # and the digit is why the month abbreviations have to be excluded by name, or "Dec. 2024" reads as
    # two. "Inc." is deliberately NOT in that list: "a compliance program of MOM Inc. Tenants depicted"
    # IS a sentence boundary, and excusing it would have let the footer pass unchanged.
    PROSE_JS = r"""
    (() => {
      const ABBR = new Set(["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Sept","Oct","Nov","Dec",
                            "vol","no","pp","est","approx"]);
      window.__sentences = function (raw) {
        const s = String(raw == null ? "" : raw).replace(/\s+/g, " ").trim();
        if (!s) return 0;
        const re = /([.!?])["')\]]*\s+(?=[A-Z0-9"'(])/g;
        let n = 0, m;
        while ((m = re.exec(s))) {
          const word = (s.slice(0, m.index).match(/[A-Za-z]+$/) || [""])[0];
          if (m[1] === "." && ABBR.has(word)) continue;
          n++;
        }
        return n + 1;                       /* boundaries + 1 = segments, so a body with no full stop is one */
      };
      const BLOCKY = new Set(["block","list-item","flex","grid","table-cell","flow-root"]);
      const isBlock = el => BLOCKY.has(getComputedStyle(el).display);
      const shown = el => el.getClientRects().length > 0;     /* display:none has no boxes: not copy */
      window.__paras = function () {
        const out = [];
        for (const root of document.querySelectorAll(".lb")) {
          for (const el of root.querySelectorAll("*")) {
            const tag = el.tagName.toLowerCase();
            if (tag === "style" || tag === "script" || el.closest("svg,style,script")) continue;
            if (!isBlock(el) || !shown(el)) continue;
            let own = "";
            for (const n of el.childNodes) {
              if (n.nodeType === 3) own += n.nodeValue;
              else if (n.nodeType === 1 && n.tagName.toLowerCase() !== "svg" && shown(n) && !isBlock(n))
                own += n.textContent;       /* inline children belong to this box; a block child is its own */
            }
            own = own.replace(/\s+/g, " ").trim();
            if (own) out.push({ n: window.__sentences(own), text: own,
              where: el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") +
                     (typeof el.className === "string" && el.className.trim()
                        ? "." + el.className.trim().split(/\s+/).join(".") : "") });
          }
        }
        return out;
      };
    })()
    """
    seen, perrs = {}, []

    def sweep(pg):
        for r in pg.evaluate("() => window.__paras()"):
            seen.setdefault(r["text"], (r["n"], r["where"]))

    # route one: /play/, WebGL off, both modes. Covers the museum - the entrance blurb, the six scroll
    # chapters with all eighteen cited facts, the closing panel - and the flat gallery walked end to end
    # so the return leg's housing-help resources are measured too, not just the outbound facts.
    pr = b.new_page(viewport={"width": 390, "height": 844})
    pr.on("pageerror", lambda e: perrs.append(str(e)))
    pr.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    pr.add_init_script(PROSE_JS)
    pr.goto(BASE + "/play/lilboyfriend/?mode=live", wait_until="load")
    pr.wait_for_timeout(2500)
    sweep(pr)
    pr.click("#lbModeBtn")
    pr.wait_for_selector("#lbScroll .lb-ch[data-chapter]", timeout=5000)
    pr.evaluate("""() => { const s = document.querySelector('#lbScroll');
        s.style.scrollBehavior = 'auto'; s.style.scrollSnapType = 'none'; }""")
    for k in range(0, 9):
        pr.evaluate("v => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = v * s.clientHeight; }", k)
        pr.wait_for_timeout(160)
        sweep(pr)
    scroll_seen = len(seen)
    pr.click("#lbModeBtn")                                 # back to the flat museum
    pr.wait_for_timeout(600)
    sweep(pr)
    pr.click("#flNext")
    pr.wait_for_selector("#flSkip", timeout=5000)
    sweep(pr)
    pr.click("#flSkip")
    for _ in range(6):
        pr.wait_for_timeout(300); sweep(pr); pr.click("#flNext")
    pr.wait_for_selector("#flSlot", timeout=5000)
    sweep(pr); pr.click("#flSlot")
    pr.wait_for_function("() => window.__lbState().phase !== 'out'", timeout=4000, polling=60)
    pr.wait_for_selector("#flNext", timeout=6000)
    sweep(pr); pr.click("#flNext")
    for _ in range(7):                                     # the return leg: horror photos, resources
        pr.wait_for_timeout(300); sweep(pr)
        try:
            pr.click("#flNext", timeout=1500)
        except Exception:
            break
    check(scroll_seen > 60 and len(seen) > 90,
          "the museum route was actually read: %d paragraphs across the six chapters, %d by the end of "
          "the walk back" % (scroll_seen, len(seen)))
    pr.close()

    # route two: the television, which is the ONLY place the MOM Inc infomercial below the stage
    # renders - Part A isolation hides it everywhere else, and it holds the two worst paragraphs.
    tv = b.new_page(viewport={"width": 1280, "height": 900})
    tv.on("pageerror", lambda e: perrs.append(str(e)))
    tv.add_init_script(PROSE_JS)
    tv.goto(BASE + "/tv/?ch=lilboyfriend&mode=live", wait_until="load")
    tv.wait_for_timeout(1200)
    for _ in range(3):
        if tv.evaluate("() => { const t = document.querySelector('.tv');"
                       "        return !!t && t.dataset.state === 'on'; }"):
            break
        try:
            tv.click(".power", timeout=2000)
        except Exception:
            break
        tv.wait_for_timeout(1600)
    tv.wait_for_selector(".lb .side", timeout=8000)
    tv.wait_for_timeout(1500)
    before = len(seen)
    sweep(tv)
    check(tv.evaluate("() => { const s = document.querySelector('.lb .side');"
                      "        return !!s && s.getClientRects().length > 0; }")
          and len(seen) - before > 25,
          "and the infomercial below the stage was read where it actually renders, inside the "
          "television: %d further paragraphs the /play/ route cannot see" % (len(seen) - before))
    tv.close()

    over = sorted(((v[0], v[1], t) for t, v in seen.items() if v[0] > 3), reverse=True)
    check(not over, "no paragraph on this channel exceeds three sentences (%d measured, worst %d; %s)"
          % (len(seen), max(v[0] for v in seen.values()),
             [(n, w, t[:70]) for n, w, t in over[:3]] or "none over three"))

    # bullet points, the row's other half - and not just "a <ul> exists somewhere". Every list this
    # packet added has to be carrying copy a visitor reads, so the assertion is on the ITEMS.
    bullets = [t for t, v in seen.items() if v[1].startswith("li")]
    check(len(bullets) >= 15 and all(v[0] <= 3 for t, v in seen.items() if v[1].startswith("li")),
          "the long copy became bullet points: %d list items, none of them over three sentences"
          % len(bullets))

    # THE MATCHED HALF, and the reason this is a formatting packet rather than a content one: the two
    # fact bodies that became bullets must rejoin into the exact strings that shipped. A build that
    # got under three sentences by CUTTING a number, dropping a citation or re-wording a sourced fact
    # is the failure mode this row invites, and it is the one thing the file's thesis forbids outright.
    SHIPPED = {
        "A1": "On one night in January 2024, about 770,000 people in America had nowhere indoors to "
              "sleep. That's 18 percent more than the year before. Nobody fixed it. They just counted "
              "it again.",
        "A17": "It is marketed as freedom. People are selling million dollar homes to live in one. The "
               "median US home costs $434,100. A van is not cheap. It is just cheaper.",
    }
    rj = b.new_page(viewport={"width": 390, "height": 844})
    rj.add_init_script("""(() => { const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; })()""")
    rj.goto(BASE + "/play/lilboyfriend/?mode=live", wait_until="load")
    rj.wait_for_timeout(2500)
    rj.click("#lbModeBtn")
    rj.wait_for_selector("#lbScroll .lb-ch[data-chapter]", timeout=5000)
    rj.evaluate("""() => { const s = document.querySelector('#lbScroll');
        s.style.scrollBehavior = 'auto'; s.style.scrollSnapType = 'none'; }""")
    for k in range(0, 9):
        rj.evaluate("v => { const s = document.querySelector('#lbScroll');"
                    "        s.scrollTop = v * s.clientHeight; }", k)
        rj.wait_for_timeout(120)
    lists = rj.evaluate("""() => [...document.querySelectorAll('#lbScroll .fl-card .fl-bul')]
        .map(u => [...u.children].map(li => li.textContent.replace(/\\s+/g, ' ').trim()).join(' '))""")
    missing = [k for k, v in SHIPPED.items() if v not in lists]
    check(not missing and len(lists) >= 2,
          "and no sourced fact was re-worded to get there: every bullet list rejoins into the string "
          "that shipped, word for word (%d lists, missing %s)" % (len(lists), missing or "none"))
    # and the citations are still attached to the facts they belong to - a bullet list that swallowed
    # the <span class="fl-src"> would read fine and be unattributed.
    cited = rj.evaluate("""() => [...document.querySelectorAll('#lbScroll .fl-card')]
        .filter(c => (c.querySelector('.fl-src') || {}).textContent || ''.trim()).length""")
    check(cited == 18, "and all eighteen facts still carry their citation (%d)" % cited)
    rj.close()

    pclean = [e for e in perrs if "favicon" not in e and "jsdelivr" not in e.lower()]
    check(not pclean, "4.10: no page errors across the prose drive (%s)" % (pclean[:2] or "none"))

    b.close()

print("\n%s" % ("3D PATH DRIVES" if ok else "3D PATH BROKEN"))
raise SystemExit(0 if ok else 1)
