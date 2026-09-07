# -*- coding: utf-8 -*-
"""The versioned-state gate (PLAN-r8 D.1.2, Stage 2 packet 2 / micro-steps 2.5-2.8).

Covers tv/state.js: the write/read path, the migration from mbs-unlock / mbs-forms / mbs-unlock-at
(corrected against r8's own table - mbs-forms lands in `submissions`, never `drafts`, and
mbs-unlock-at is the one top-level `armedAt` scalar, never a per-channel map), corruption quarantine
and rollback, and active-set completion (C004).

Run:  python tools/check_state.py     (serves the repo itself; nothing else need be running)
"""
import functools, json, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class _Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


_srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % _srv.server_address[1]

ACTIVE = ["fuel", "lilboyfriend", "djscratch", "corgi"]   # window.MBS_CHANNELS.active, read from the manifest today

ok, notes = True, []
def check(c, m):
    global ok
    ok = ok and bool(c)
    notes.append(("PASS " if c else "FAIL ") + m)


def seed(pg, page_errs, legacy=None, state_raw=None):
    """Clear all mbs-* storage, plant exactly the given legacy/raw-state keys, then reload so state.js's
    IIFE re-runs from scratch - the same as a fresh visitor whose browser holds only these bytes."""
    pg.evaluate("""() => { for (const k of Object.keys(localStorage)) localStorage.removeItem(k); }""")
    if legacy:
        pg.evaluate("(l) => { for (const k in l) if (l[k] !== null) localStorage.setItem(k, l[k]); }", legacy)
    if state_raw is not None:
        pg.evaluate("(s) => localStorage.setItem('mbs-state', s)", state_raw)
    page_errs.clear()
    pg.reload(wait_until="load")
    pg.wait_for_timeout(150)
    return [e for e in page_errs if "favicon" not in e]


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page()
    page_errs = []
    pg.on("console", lambda m: page_errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: page_errs.append(str(e)))
    pg.goto(BASE + "/tv/", wait_until="load")
    pg.wait_for_timeout(150)

    print("== 2.5 write path, reload, read path, version present")
    st = pg.evaluate("() => !!window.MBS_STATE")
    check(st, "window.MBS_STATE exists on /tv/")
    pg.evaluate("""() => { const s = window.MBS_STATE.read(); s.channels.fuel.secret.earned = true;
        s.channels.fuel.secret.earnedAt = 12345; window.MBS_STATE.write(s); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    after = pg.evaluate("() => window.MBS_STATE.read()")
    check(after.get("v") == 3, "version field present after reload (v=%r)" % after.get("v"))
    check(after["channels"]["fuel"]["secret"]["earned"] is True and after["channels"]["fuel"]["secret"]["earnedAt"] == 12345,
          "the write survives a reload-read")

    print("== 2.6 migration fixtures (one per legacy shape found in the tree)")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(ACTIVE), "mbs-forms": None, "mbs-unlock-at": None})
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(not errs, "mbs-unlock fixture: no console error")
    check(all(s["channels"][c]["secret"]["earned"] for c in ACTIVE),
          "mbs-unlock (array of ids, tv.js:186 / mbs-shim.js:117) -> channels[id].secret.earned=true for each")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": None, "mbs-forms": json.dumps({"fuel": {"a": 1}}), "mbs-unlock-at": None})
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["submissions"].get("fuel") == {"a": 1} and not s["drafts"],
          "mbs-forms object payload (tv.js:229 / mbs-shim.js:154-155) -> submissions[id], never drafts")
    check(s["channels"]["fuel"]["form"]["status"] == "saved_here", "form.status -> saved_here")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": None, "mbs-forms": json.dumps({"corgi": True}), "mbs-unlock-at": None})
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["submissions"].get("corgi", "MISSING") is None,
          "mbs-forms literal true (tv.js:229: f[site]=data||true) -> submissions[id]=null")

    # mbs-unlock-at is set from inside the page so it matches the browser's own clock, not Python's.
    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(["fuel"])})
    pg.evaluate("""() => { localStorage.setItem('mbs-unlock-at', String(Date.now()));
        localStorage.removeItem('mbs-state'); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(isinstance(s.get("armedAt"), (int, float)) and s["armedAt"] > 0,
          "mbs-unlock-at (tv.js:216 / mbs-shim.js:133) within the 30s window -> top-level armedAt scalar")

    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(["fuel"])})
    pg.evaluate("""() => { localStorage.setItem('mbs-unlock-at', String(Date.now() - 60000));
        localStorage.removeItem('mbs-state'); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("armedAt") is None, "an expired mbs-unlock-at (>30s old) is discarded, not restored as live")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": json.dumps([]), "mbs-forms": None, "mbs-unlock-at": "1"})
    check(not errs, "mbs-unlock-at with empty mbs-unlock: no console error")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q is not None, "mbs-unlock-at with an empty mbs-unlock is treated as corrupt and quarantined")

    before = pg.evaluate("() => localStorage.getItem('mbs-state')")
    pg.evaluate("() => window.MBS_STATE.migrate()")
    after2 = pg.evaluate("() => localStorage.getItem('mbs-state')")
    check(before == after2, "running the migration twice: the second run is a byte-identical no-op")

    print("== 2.7 corruption recovery and rollback")

    errs = seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(ACTIVE)}, state_raw="not json {{{")
    check(not errs, "unparseable payload: no exception reaches the page")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q == "not json {{{", "quarantine key holds the original bytes, unparseable case")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 3, "the visitor gets a fresh working v3 session, unparseable case")

    bad_version = json.dumps({"v": 1, "channels": {}, "drafts": {}, "submissions": {},
                               "facility": {"rooms": {}}, "artifacts": []})
    errs = seed(pg, page_errs, state_raw=bad_version)
    check(not errs, "wrong-version payload: no exception reaches the page")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q == bad_version, "quarantine key holds the original bytes, wrong-version case")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 3, "the visitor gets a fresh working v3 session, wrong-version case")

    bad_shape = json.dumps({"v": 3, "channels": "nope", "drafts": {}, "submissions": {},
                             "facility": {"rooms": {}}, "artifacts": [], "events": []})
    errs = seed(pg, page_errs, state_raw=bad_shape)
    check(not errs, "right-version wrong-shape payload: no exception reaches the page")
    q = pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')")
    check(q == bad_shape, "quarantine key holds the original bytes, wrong-shape case")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 3, "the visitor gets a fresh working v3 session, wrong-shape case")

    print("== 2.24 the v2 -> v3 upgrade (C010): a returning visitor is carried forward, not quarantined")

    # a real v2 body, exactly as this store wrote it before 2.24: earned secret, a submission, a draft.
    v2 = json.dumps({"v": 2, "armedAt": None,
                     "channels": {"fuel": {"form": {"status": "saved_here", "earnedAt": 111},
                                            "secret": {"earned": True, "earnedAt": 222},
                                            "performance": {"earned": False, "earnedAt": None},
                                            "reward": {"earned": False, "earnedAt": None, "kind": None}}},
                     "drafts": {"corgi": {"title": "Corgi", "answers": {"q": "kept"}}},
                     "submissions": {"fuel": {"a": 1}},
                     "facility": {"rooms": {}}, "artifacts": [{"id": "keepsake", "channel": "fuel"}]})
    errs = seed(pg, page_errs, state_raw=v2)
    check(not errs, "a v2 payload upgrades with no console error")
    check(pg.evaluate("() => localStorage.getItem('mbs-state-quarantine')") is None,
          "a v2 payload is NOT quarantined - upgraded in place")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s.get("v") == 3 and s.get("events") == [], "the upgraded state is v3 with an empty event log")
    check(s["channels"]["fuel"]["secret"]["earnedAt"] == 222
          and s["submissions"].get("fuel") == {"a": 1}
          and (s["drafts"].get("corgi") or {}).get("answers") == {"q": "kept"}
          and [a["id"] for a in s["artifacts"]] == ["keepsake"],
          "every earned thing in the v2 body survives the upgrade untouched")
    stored = json.loads(pg.evaluate("() => localStorage.getItem('mbs-state')"))
    check(stored.get("v") == 3, "the upgrade is PERSISTED, so it runs once rather than on every read")

    print("== 2.8 active-set validation (C004): a stale sag/armie entry never counts toward completion")

    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(["sag", "armie"])})
    c = pg.evaluate("() => window.MBS_STATE.completion()")
    check(c["complete"] is False and c["done"] == 0,
          "sag+armie unlocks (both non-active) do not complete the four-set (%r)" % (c,))

    seed(pg, page_errs, legacy={"mbs-unlock": json.dumps(ACTIVE)})
    c = pg.evaluate("() => window.MBS_STATE.completion()")
    check(c["complete"] is True and c["done"] == 4 and c["need"] == 4,
          "exactly the four active ids completes the four-set (%r)" % (c,))

    print("== 2.8b the shared accessors (bankUnlock/setArmedAt/saveForm) - the shell's own read/write path")

    seed(pg, page_errs)
    s = pg.evaluate("() => window.MBS_STATE.bankUnlock('fuel')")
    check(s == ["fuel"], "bankUnlock('fuel') returns the updated unlockedActive() list")
    s2 = pg.evaluate("() => window.MBS_STATE.read()")
    check(s2["channels"]["fuel"]["secret"]["earned"] is True and isinstance(s2["channels"]["fuel"]["secret"]["earnedAt"], (int, float)),
          "bankUnlock stamps secret.earned and secret.earnedAt")

    seed(pg, page_errs)
    pg.evaluate("() => window.MBS_STATE.setArmedAt(999)")
    check(pg.evaluate("() => window.MBS_STATE.getArmedAt()") == 999, "setArmedAt/getArmedAt round-trip")

    print("== 2.9 four independent states (C005): earning one does not stamp the others")

    seed(pg, page_errs)
    pg.evaluate("() => window.MBS_STATE.bankUnlock('fuel')")
    s = pg.evaluate("() => window.MBS_STATE.read()").get("channels", {}).get("fuel", {})
    check(s["secret"]["earned"] is True and s["form"]["earnedAt"] is None
          and s["performance"]["earnedAt"] is None and s["reward"]["earnedAt"] is None,
          "bankUnlock (secret) leaves form/performance/reward earnedAt untouched")

    seed(pg, page_errs)
    pg.evaluate("() => window.MBS_STATE.saveForm('fuel', {a: 1})")
    s = pg.evaluate("() => window.MBS_STATE.read()").get("channels", {}).get("fuel", {})
    check(s["form"]["status"] == "saved_here" and isinstance(s["form"]["earnedAt"], (int, float)),
          "saveForm stamps only form.status/form.earnedAt")
    check(s["secret"]["earned"] is False and s["performance"]["earned"] is False and s["reward"]["earned"] is False,
          "saveForm leaves secret/performance/reward untouched")

    seed(pg, page_errs)
    pg.evaluate("""() => { const s = window.MBS_STATE.read();
        s.channels.fuel.reward = { earned: true, earnedAt: 555, kind: "template" }; window.MBS_STATE.write(s); }""")
    s = pg.evaluate("() => window.MBS_STATE.read()").get("channels", {}).get("fuel", {})
    check(s["reward"]["kind"] == "template" and s["secret"]["earned"] is False and s["form"]["status"] == "draft",
          "reward.kind is a field on the independent reward state, not a second code path")

    print("== 2.11 drafts separate from submissions (C008): clear-drafts leaves submissions intact, both directions")

    seed(pg, page_errs)
    pg.evaluate("""() => { window.MBS_STATE.saveDraft("fuel", {x: 1}); window.MBS_STATE.saveForm("fuel", {y: 2}); }""")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["drafts"].get("fuel") == {"x": 1} and s["submissions"].get("fuel") == {"y": 2},
          "a draft and a submission coexist independently for the same channel")
    pg.evaluate("() => window.MBS_STATE.clearDrafts()")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["drafts"] == {} and s["submissions"].get("fuel") == {"y": 2},
          "clearDrafts empties drafts and leaves submissions intact")

    seed(pg, page_errs)
    pg.evaluate("""() => { window.MBS_STATE.saveDraft("fuel", {x: 1}); window.MBS_STATE.saveForm("fuel", {y: 2});
        window.MBS_STATE.clearSubmissions(); }""")
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check(s["submissions"] == {} and s["drafts"].get("fuel") == {"x": 1},
          "clearSubmissions empties submissions and leaves drafts intact")

    print("== 2.12 truthful receipts (C008): a local saveForm (no server in this build) renders only saved_here")

    seed(pg, page_errs)
    pg.evaluate("() => window.MBS_STATE.saveForm('fuel', {a: 1})")
    status = pg.evaluate("() => window.MBS_STATE.formStatus('fuel')")
    check(status == "saved_here", "formStatus after a local saveForm is saved_here (%r)" % (status,))
    check(status != "received", "formStatus is never received without an actual server response")

    print("== 2.10 the coach-profile adoption: card.js's old third store folds into drafts")

    # a returning visitor who only ever filled coach answers on a landing, and has no mbs-state yet
    seed(pg, page_errs, legacy={"mbs-coach-profile": json.dumps({"fuel": {"title": "Drinks", "answers": {"q1": "a"}}})})
    d = (pg.evaluate("() => window.MBS_STATE.read()")["drafts"].get("fuel")) or {}
    check(d.get("answers") == {"q1": "a"} and d.get("title") == "Drinks",
          "mbs-coach-profile is adopted into drafts, title and answers intact")
    check(pg.evaluate("() => localStorage.getItem('mbs-coach-profile')") is None,
          "the old coach key is consumed, so the adoption cannot run twice")
    check(pg.evaluate("() => !!localStorage.getItem('mbs-coach-profile-backup-v1')"),
          "the original coach bytes are kept as a backup, never simply dropped")

    # it must also work when mbs-state ALREADY exists: a visitor can answer a coach question long after
    # the state store was created, which migrate()'s once-only guard would never catch
    seed(pg, page_errs)
    pg.evaluate("""() => localStorage.setItem('mbs-coach-profile',
        JSON.stringify({corgi: {title: "Corgi", answers: {q: "later"}}}))""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check((s["drafts"].get("corgi") or {}).get("answers") == {"q": "later"},
          "a coach profile written AFTER mbs-state exists is still adopted (not gated by migrate())")

    seed(pg, page_errs)
    pg.evaluate("""() => { window.MBS_STATE.saveDraft("fuel", {title: "mine", answers: {q: "newer"}});
        localStorage.setItem('mbs-coach-profile', JSON.stringify({fuel: {title: "old", answers: {q: "older"}}})); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(150)
    s = pg.evaluate("() => window.MBS_STATE.read()")
    check((s["drafts"].get("fuel") or {}).get("answers") == {"q": "newer"},
          "adoption never overwrites a draft written since")

    print("== 2.10 earnedItems, artifacts, and the Your files route")

    seed(pg, page_errs)
    pg.evaluate("""() => { const S = window.MBS_STATE;
        S.bankUnlock("fuel"); S.saveForm("corgi", {a: 1}); S.saveDraft("djscratch", {title: "DJ", answers: {q: "x"}});
        S.addArtifact({id: "case-file-1", channel: "lilboyfriend", title: "Housing case file", kind: "artifact"}); }""")
    kinds = sorted(pg.evaluate("() => window.MBS_STATE.earnedItems().map(i => i.kind)"))
    check(kinds == ["artifact", "draft", "form", "secret"],
          "earnedItems surfaces each kind independently (%r)" % (kinds,))

    check(pg.evaluate("""() => { window.MBS_STATE.addArtifact({id: "dupe", title: "One"});
        window.MBS_STATE.addArtifact({id: "dupe", title: "One"});
        return window.MBS_STATE.read().artifacts.filter(a => a.id === "dupe").length; }""") == 1,
          "addArtifact is keyed by id, so a replay does not stack duplicates")

    # the route itself: 2.10's acceptance is a reload with populated state listing every earned artifact
    pg.goto(BASE + "/files/", wait_until="load"); pg.wait_for_timeout(200)
    pg.evaluate("""() => { const S = window.MBS_STATE;
        S.bankUnlock("fuel"); S.saveDraft("corgi", {title: "Corgi", answers: {q: "x"}}); }""")
    page_errs.clear()
    pg.reload(wait_until="load"); pg.wait_for_timeout(250)
    listed = pg.evaluate("() => document.querySelectorAll('#out .item').length")
    expected = pg.evaluate("() => window.MBS_STATE.earnedItems().length")
    check(listed == expected and listed >= 2,
          "/files/ lists every earned item after a reload (%d listed, %d in state)" % (listed, expected))
    check(pg.evaluate("() => document.getElementById('empty').hidden") is True,
          "/files/ hides its empty state when the visitor has kept something")
    check(not [e for e in page_errs if "favicon" not in e], "/files/ loads with no console error")

    # the empty state must be honest rather than broken
    pg.evaluate("""() => { for (const k of Object.keys(localStorage)) localStorage.removeItem(k); }""")
    pg.reload(wait_until="load"); pg.wait_for_timeout(250)
    check(pg.evaluate("() => document.getElementById('empty').hidden") is False,
          "/files/ shows its empty state when nothing is kept")
    check(pg.evaluate("() => document.getElementById('actions').hidden") is True,
          "/files/ offers no delete controls when there is nothing to delete")

    b.close()

for n in notes: print("  " + n)
print("\n%d passed, %d failed" % (len([n for n in notes if n.startswith("PASS")]),
                                   len([n for n in notes if n.startswith("FAIL")])))
raise SystemExit(0 if ok else 1)
