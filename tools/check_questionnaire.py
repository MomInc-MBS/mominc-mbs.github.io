# -*- coding: utf-8 -*-
"""The questionnaire-engine gate (PLAN-r9 Stage 2 packet 15, micro-step 2.19, Part E.8).

2.19's acceptance is one sentence: "the engine renders all three assessments from data alone; no
channel-specific branch exists in the engine." Both halves are asserted here, and neither is asserted
by reading the engine's own answer back to itself:

  - "from data alone"  - this file parses the three JSON specs itself and computes, in Python, the
    score and the exact outcome text each answer set should produce. The browser then answers the
    forms for real (element.click(), then the submit button), and the two are compared. A gate that
    called the engine's own scorer would pass no matter what the engine did.
  - "no channel-specific branch" - the id list comes from tv/channel-manifest.json, not from a
    constant in this file, so a channel added to the manifest tomorrow is checked tomorrow.

All three assessments are mounted into ONE page at once, which is also the check that two forms whose
question ids collide (all three carry a `wednesday` vote) keep their radio groups apart.

The data invariants below exist because the data is now where the behaviour lives: a band table with a
gap in it, a declared max that no answer set can reach, or a map missing one of its question's options
would all render silently and wrongly. Assert the property (bands tile 0..max exactly once), never a
constant.

Run:  python tools/check_questionnaire.py     (serves the repo itself; nothing else need be running)
"""
import functools, io, json, os, re, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ASSESS_DIR = os.path.join(ROOT, "tv", "data", "assessments")
ENGINE = os.path.join(ROOT, "tv", "questionnaire.js")
IDS = ["lilboyfriend", "fuel", "armie"]          # E.8 names these three explicitly


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ok, notes = True, []


def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


# ---------------------------------------------------------------- the specs, and Python's own reading

SPECS = {}
for cid in IDS:
    with io.open(os.path.join(ASSESS_DIR, cid + ".json"), encoding="utf-8") as fh:
        SPECS[cid] = json.load(fh)


def norm(v):
    """A band or map entry is a string or {text, src}. Same normalisation the engine does, written
    independently so a change to one has to be made deliberately to the other."""
    if v is None or v == "":
        return None
    return v if isinstance(v, dict) else {"text": str(v)}


def within(b, n):
    lo = b.get("min")
    hi = b.get("max")
    return (lo is None or n >= lo) and (hi is None or n <= hi)


def score_of(spec, ans):
    total = 0
    for q in spec["questions"]:
        op = next((o for o in q["options"] if o["value"] == ans.get(q["id"])), None)
        if op:
            total += op.get("score") or 0
    return total


def outcomes_of(spec, ans, score):
    """What the engine must render, computed here from the JSON. Returns [(id, text, src|None)]."""
    out = []
    for o in spec.get("outcomes", []):
        if o["kind"] == "score":
            mx = (spec.get("score") or {}).get("max")
            r = norm("%d of %d" % (score, mx) if mx is not None else str(score))
        elif o["kind"] == "band":
            r = norm(next((b for b in o.get("bands", []) if within(b, score)), None)) or norm(o.get("fallback"))
        else:
            r = norm((o.get("map") or {}).get(ans.get(o["of"]))) or norm(o.get("fallback"))
        if r and r.get("text"):
            out.append((o["id"], r["text"], r.get("src")))
    return out


def pick(spec, which):
    """Answer every question with its first or its last option - two sets far enough apart that a
    band table which never moves is visible as one that never moves."""
    idx = 0 if which == "first" else -1
    return {q["id"]: q["options"][idx]["value"] for q in spec["questions"]}


# ---------------------------------------------------------------- 1. the engine carries no channel

with io.open(ENGINE, encoding="utf-8") as fh:
    engine_src = fh.read()
with io.open(os.path.join(ROOT, "tv", "channel-manifest.json"), encoding="utf-8") as fh:
    manifest = json.load(fh)
manifest_ids = [c["id"] for c in (manifest.get("channels") if isinstance(manifest, dict) else manifest)]

check(len(manifest_ids) >= 9, "the manifest supplies the id list (%d channels)" % len(manifest_ids))
named = [cid for cid in manifest_ids if re.search(r"\b%s\b" % re.escape(cid), engine_src, re.I)]
check(not named, "no channel id appears anywhere in tv/questionnaire.js (found: %r)" % (named,))
# the header comment states E.8's rule in words, so this reads the CODE only: a check that greps a
# file's own prose about a thing being absent finds the prose and calls it the thing.
engine_code = re.sub(r"/\*.*?\*/", "", engine_src, flags=re.S)
engine_code = re.sub(r"^\s*//.*$", "", engine_code, flags=re.M)
check(not re.search(r"\b(email|phone|tel|mailto)\b", engine_code, re.I),
      "the engine's code has no email/phone concept at all - no field type could ask for one")

print("== the data invariants")

for cid in IDS:
    spec = SPECS[cid]
    check(spec.get("id") == cid, "%s: the spec's own id matches its filename" % cid)
    check(bool(spec.get("privacy", "").strip()), "%s: carries a privacy statement" % cid)
    check("device" in spec.get("privacy", "").lower(),
          "%s: the privacy statement says the answers stay on this device" % cid)

    qids = [q["id"] for q in spec["questions"]]
    check(len(set(qids)) == len(qids), "%s: question ids are unique (%d questions)" % (cid, len(qids)))
    for q in spec["questions"]:
        vals = [o["value"] for o in q["options"]]
        check(len(set(vals)) == len(vals) and len(vals) >= 2,
              "%s/%s: two or more options, all distinct" % (cid, q["id"]))
        check(all(isinstance(o.get("score", 0), (int, float)) for o in q["options"]),
              "%s/%s: every score is a number" % (cid, q["id"]))

    # E.8: a range, never an exact figure; a broad region, never a city. No free-text field exists in
    # the engine at all, so this checks the wording as well as the shape.
    # the questions only. The privacy statement's whole job is to name what is NOT asked, so scanning
    # it fails the assessment on its own promise.
    blob = json.dumps(spec["questions"], ensure_ascii=False).lower()
    check(not re.search(r"\b(zip|postcode|postal code|street address|exact income|exact city)\b", blob),
          "%s: asks for no exact address and no exact income" % cid)

    # the declared max must be the one an answer set can actually reach
    reachable = sum(max((o.get("score") or 0) for o in q["options"]) for q in spec["questions"])
    check((spec.get("score") or {}).get("max") == reachable,
          "%s: declared score.max %r is the maximum actually reachable (%d)"
          % (cid, (spec.get("score") or {}).get("max"), reachable))

    for o in spec.get("outcomes", []):
        if o["kind"] == "band":
            # every score from 0 to max resolves, and to exactly one band
            hits = [len([b for b in o["bands"] if within(b, n)]) for n in range(0, reachable + 1)]
            check(all(h == 1 for h in hits),
                  "%s/%s: the bands tile 0..%d exactly once, no gap and no overlap"
                  % (cid, o["id"], reachable))
        if o["kind"] == "map":
            q = next((q for q in spec["questions"] if q["id"] == o["of"]), None)
            check(q is not None, "%s/%s: maps a question the assessment asks" % (cid, o["id"]))
            missing = [v["value"] for v in q["options"] if v["value"] not in o.get("map", {})]
            check(not missing, "%s/%s: covers every option of %s (missing %r)"
                  % (cid, o["id"], o["of"], missing))
            # an optional question can be left blank, so its map needs the blank case answered
            if q.get("optional"):
                check(bool(o.get("fallback")),
                      "%s/%s: %s is optional, so the outcome carries a fallback"
                      % (cid, o["id"], o["of"]))

# ---------------------------------------------------------------- 2. the browser

READ = """(id) => {
  const f = window.__inst[id].inst.form;
  const out = f.querySelector('.q-out'), err = f.querySelector('.q-error');
  const p = f.querySelector('[data-privacy]'), q1 = f.querySelector('.q-item');
  return {
    assessment: f.dataset.assessment,
    privacyText: p ? p.textContent : '',
    privacyFirst: !!(p && q1 && (p.compareDocumentPosition(q1) & Node.DOCUMENT_POSITION_FOLLOWING)),
    items: Array.from(f.querySelectorAll('.q-item')).map(li => ({
      q: li.dataset.q, radios: li.querySelectorAll('input[type=radio]').length })),
    fields: Array.from(f.querySelectorAll('input, textarea, select')).map(e => ({
      tag: e.tagName, type: e.type || null, name: e.name || null })),
    outHidden: out.hidden,
    outcomes: Array.from(out.querySelectorAll('.q-outcome')).map(b => ({
      id: b.dataset.outcome,
      text: b.querySelector('.q-outcome-text').textContent,
      src: b.querySelector('.q-src') ? b.querySelector('.q-src').textContent : null })),
    error: err.hidden ? null : err.textContent,
    result: window.__inst[id].last.result,
    focusName: (document.activeElement && document.activeElement.name) || null,
    checked: Array.from(f.querySelectorAll('input[type=radio]')).filter(i => i.checked)
                  .map(i => [i.name, i.value]),
  };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # a same-origin page with no shell on it: the engine is the only thing under test
    pg.goto(BASE + "/tv/data/assessments/", wait_until="load")
    pg.add_script_tag(url="/tv/mbs-channels.js")
    pg.add_script_tag(url="/tv/state.js")
    pg.add_script_tag(type="module", content=(
        'import * as Q from "/tv/questionnaire.js";\n'
        'window.__Q = Q;\n'
        'window.__inst = {};\n'
        'window.__mk = async (id) => {\n'
        '  const spec = await Q.load("/tv/data/assessments/" + id + ".json");\n'
        '  const host = document.createElement("div");\n'
        '  host.id = "host-" + id; document.body.appendChild(host);\n'
        '  const last = { result: null };\n'
        '  const inst = Q.create(host, spec, { onComplete: r => { last.result = r; } });\n'
        '  window.__inst[id] = { inst, spec, last, host };\n'
        '  return true;\n'
        '};\n'
        'window.__pick = (id, answers) => {\n'
        '  const f = window.__inst[id].inst.form;\n'
        '  Array.from(f.querySelectorAll("input[type=radio]")).forEach(i => {\n'
        '    if (answers[i.name] === i.value) i.click();\n'
        '  });\n'
        '};\n'
        'window.__submit = (id) => window.__inst[id].inst.form.querySelector(".q-submit").click();\n'
    ))
    pg.wait_for_function("() => !!window.__mk")
    check(pg.evaluate("() => !!window.MBS_STATE"), "the shared store is present, so persistence is exercisable")

    print("== all three assessments mount into one page")
    for cid in IDS:
        pg.evaluate("id => window.__mk(id)", cid)
    pg.wait_for_function("() => Object.keys(window.__inst).length === 3")
    check(pg.evaluate("() => document.querySelectorAll('form.q').length") == 3,
          "three forms render from three JSON files through one create()")

    for cid in IDS:
        spec = SPECS[cid]
        print("== %s" % cid)
        r = pg.evaluate(READ, cid)

        check(r["assessment"] == cid, "%s: the form declares its assessment" % cid)
        check(r["privacyText"] == spec["privacy"], "%s: the privacy statement renders verbatim" % cid)
        check(r["privacyFirst"], "%s: the privacy statement comes BEFORE the first question" % cid)
        check([i["q"] for i in r["items"]] == [q["id"] for q in spec["questions"]],
              "%s: every question renders, in order (%d)" % (cid, len(spec["questions"])))
        check(all(i["radios"] == len(q["options"])
                  for i, q in zip(r["items"], spec["questions"])),
              "%s: every option renders as a radio" % cid)

        # E.8's hard rule, asserted on the rendered form rather than on the source
        bad = [f for f in r["fields"]
               if f["tag"] != "INPUT" or f["type"] != "radio"
               or re.search(r"mail|phone|tel", f["name"] or "", re.I)]
        check(not bad, "%s: the form is radios and nothing else - no email, phone or free text (%r)"
              % (cid, bad))

        # nothing answered: no result, and the first REQUIRED question is named and focused
        pg.evaluate("id => window.__submit(id)", cid)
        r = pg.evaluate(READ, cid)
        first_required = next(q for q in spec["questions"] if not q.get("optional"))
        check(r["outHidden"] and not r["outcomes"], "%s: an empty form reveals nothing" % cid)
        check(r["error"] and first_required["label"] in r["error"],
              "%s: the error names the first unanswered required question (%r)" % (cid, r["error"]))
        check(r["focusName"] == first_required["id"],
              "%s: focus lands on it (%r)" % (cid, r["focusName"]))
        check(r["result"] is None, "%s: onComplete did not fire for an incomplete form" % cid)

        # two answer sets, both computed here, both answered by clicking
        seen = {}
        for which in ("first", "last"):
            ans = pick(spec, which)
            pg.evaluate("([id, a]) => window.__pick(id, a)", [cid, ans])
            pg.evaluate("id => window.__submit(id)", cid)
            r = pg.evaluate(READ, cid)
            want_score = score_of(spec, ans)
            want = outcomes_of(spec, ans, want_score)

            check(dict(r["checked"]) == ans, "%s/%s: the form holds exactly the answers clicked" % (cid, which))
            check(not r["outHidden"] and r["error"] is None,
                  "%s/%s: a complete form reveals its result and clears the error" % (cid, which))
            check(r["result"] and r["result"]["score"] == want_score,
                  "%s/%s: score is %d, computed here from the JSON's own weights (engine said %r)"
                  % (cid, which, want_score, r["result"] and r["result"]["score"]))
            check([(o["id"], o["text"], o["src"]) for o in r["outcomes"]] == want,
                  "%s/%s: all %d outcomes render the exact text this gate computed from the data"
                  % (cid, which, len(want)))
            check(r["result"] and r["result"]["saved"] is True,
                  "%s/%s: the answers were actually written to the store" % (cid, which))
            seen[which] = (want_score, dict((o["id"], o["text"]) for o in r["outcomes"]))

        check(seen["first"][0] != seen["last"][0],
              "%s: the two answer sets score differently (%d vs %d)" % (cid, seen["first"][0], seen["last"][0]))
        moved = [k for k in seen["first"][1] if seen["first"][1][k] != seen["last"][1].get(k)]
        check(len(moved) >= 3,
              "%s: %d outcomes changed with the answers - the bands and maps resolve live, they are not constants (%r)"
              % (cid, len(moved), moved))

        # persistence, and the restore a second mount performs
        stored = pg.evaluate("id => window.MBS_STATE.draftFor(id)", cid)
        check(stored and stored.get("answers") == pick(spec, "last"),
              "%s: the draft in `mbs-state` holds the last answers" % cid)
        check(stored and stored.get("title") == spec["title"],
              "%s: the draft carries the assessment title, in card.js's own shape" % cid)
        again = pg.evaluate("""async (id) => {
            window.__inst[id].inst.destroy();
            const gone = document.querySelectorAll('form[data-assessment="' + id + '"]').length;
            await window.__mk(id);
            return { gone, restored: window.__inst[id].inst.restored };
        }""", cid)
        check(again["gone"] == 0, "%s: destroy() removes the form" % cid)
        check(again["restored"] == pick(spec, "last"),
              "%s: a fresh mount restores the saved answers" % cid)

    print("== a spec the engine cannot honour fails loudly")
    thrown = pg.evaluate("""() => {
        const base = { id: "x", privacy: "p", questions: [
            { id: "a", label: "A", options: [{ value: "1", label: "one" }, { value: "2", label: "two" }] }] };
        const out = {};
        const host = document.createElement("div"); document.body.appendChild(host);
        const t = (k, spec) => { try { window.__Q.create(host, spec, {}); out[k] = null; }
                                 catch (e) { out[k] = String(e.message || e); } };
        t("noQuestions", { id: "x", privacy: "p", questions: [] });
        t("oneOption", { ...base, questions: [{ id: "a", label: "A", options: [{ value: "1", label: "one" }] }] });
        t("badKind", { ...base, outcomes: [{ id: "o", kind: "vibes" }] });
        t("badMap", { ...base, outcomes: [{ id: "o", kind: "map", of: "nope", map: {} }] });
        return out;
    }""")
    check(thrown["noQuestions"], "a spec with no questions throws (%r)" % thrown["noQuestions"])
    check(thrown["oneOption"], "a question with one option throws (%r)" % thrown["oneOption"])
    check(thrown["badKind"] and "vibes" in thrown["badKind"],
          "an unknown outcome kind throws and names it (%r)" % thrown["badKind"])
    check(thrown["badMap"] and "nope" in thrown["badMap"],
          "an outcome mapping a question that is not asked throws and names it (%r)" % thrown["badMap"])

    check(not [e for e in errs if "favicon" not in e], "no console errors across the run (%r)" % (errs,))
    b.close()

for n in notes:
    print("  " + n)
print("\n%d passed, %d failed" % (len([n for n in notes if n.startswith("PASS")]),
                                  len([n for n in notes if n.startswith("FAIL")])))
raise SystemExit(0 if ok else 1)
