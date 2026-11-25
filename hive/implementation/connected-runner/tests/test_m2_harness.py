import base64, copy, csv, importlib.util, io, json, sys
from pathlib import Path
import pytest
from hive import m2_model as M, m2_views as V, m2_workflow as W
from hive.storage import Store

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))
import m2_stub_server as STUB  # noqa: E402

BYTES_MSG = "bytes must be a canonical nonnegative decimal integer"
RANGE_MSG = "bytes must be an integer between 0 and 1,000,000,000"
canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def load_script():
    spec = importlib.util.spec_from_file_location("m2c", SCRIPTS / "m2_campaign.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def docker_ok():
    try:
        from hive.adapters.isolation import DockerIsolation, PINNED_IMAGE
        DockerIsolation().inspect(PINNED_IMAGE); return True
    except Exception:
        return False


def patch_policy(monkeypatch, **kw):
    p = W.load_policy(); p.update(kw)
    monkeypatch.setattr(W, "load_policy", lambda: p)
    return p


# ---- synthetic data: tiny test-local oracle over csv/json bytes (independent of the views) ----
def csv_file(rows):
    buf = io.StringIO(newline=""); w = csv.writer(buf, lineterminator="\n"); w.writerow(["id", "group", "bytes"]); [w.writerow(r) for r in rows]
    return {"format": "csv", "text": buf.getvalue()}


def json_file(rows):  # deliberately non-canonical: indent, unsorted keys, literal non-ASCII
    return {"format": "json", "text": json.dumps([{"id": i, "group": g, "bytes": b} for i, g, b in rows], indent=2, ensure_ascii=False)}


def oracle_rows(f):
    """(rows, first_error) for a test file; only the cases the fixtures use."""
    if f["format"] == "csv":
        raw = list(csv.reader(io.StringIO(f["text"], newline="")))[1:]
        rows, err = [], None
        for i, g, b in raw:
            if err is None and b != "0" and not (b[0] in "123456789" and b.isdigit()): err = BYTES_MSG
            if err is None and int(b) > 10 ** 9: err = RANGE_MSG
            rows.append({"id": i, "group": g, "bytes": int(b) if b.isdigit() else b})
        return rows, err
    rows = json.loads(f["text"]); err = None
    for r in rows:
        if err is None and (type(r["bytes"]) is not int or not 0 <= r["bytes"] <= 10 ** 9): err = RANGE_MSG
    return rows, err


def expect_R(f):
    rows, err = oracle_rows(f)
    return canon({"error": "source_rejected"}) if err else canon({"converted": canon(rows), "quarantined": []})


def expect_C(files):
    groups, quar = {}, []
    for k, f in enumerate(files):
        rows, err = oracle_rows(f)
        if err: quar.append({"index": k, "reason": err}); continue
        for r in rows:
            g = groups.setdefault(r["group"], {"bytes": 0, "count": 0}); g["bytes"] += r["bytes"]; g["count"] += 1
    return canon({"groups": groups, "quarantined": quar})


def r_cases(prefix):
    fl = [json_file([("a", "café", 5), ("b", "g2", 10)]), csv_file([("x", "g", "01"), ("y", "g", "2")]), csv_file([("x", "g", "7"), ("y", "g", "3")]),
          json_file([("p", "g", 1.5), ("q", "g", 2)]), csv_file([("m", "h", "4"), ("n", "h", "1000000001")]), csv_file([("z", "h", "9"), ("w", "h", "8")])]
    # order: valid, defective, defective, ... so the first 3 are 1 valid + 2 defective
    fl = [fl[0], fl[1], fl[3], fl[2], fl[4], fl[5]]
    return [{"case_id": f"{prefix}-{i}", "format": f["format"], "source": base64.b64encode(f["text"].encode("utf-8")).decode(), "expected": expect_R(f),
             "counts": {"defective": int(oracle_rows(f)[1] is not None), "cats": {}}} for i, f in enumerate(fl)]


def c_cases(prefix):
    good = lambda: csv_file([("a", "g", "5"), ("b", "h", "6")])
    bad = lambda: csv_file([("a", "g", "05"), ("b", "h", "6")])
    batches = [[good(), good()], [good(), bad()], [bad(), good(), bad()], [good(), bad(), bad()], [bad(), good()], [good(), bad(), good()]]
    env = lambda b: base64.b64encode(json.dumps({"files": b}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).decode()
    return [{"case_id": f"{prefix}-{i}", "format": "envelope", "source": env(b), "expected": expect_C(b), "counts": {"files": len(b), "invalid_files": sum(bool(oracle_rows(f)[1]) for f in b), "first_cats": []}} for i, b in enumerate(batches)]


def write_data(d):
    for part, tag in (("f_dev", "dev"), ("f_sel", "sel"), ("f_final", "fin"), ("f_reuse", "reu")):
        for e, mk in (("R", r_cases), ("C", c_cases)):
            (d / f"{part}_{e}.jsonl").write_text("".join(json.dumps(c) + "\n" for c in mk(tag)), encoding="utf-8", newline="\n")


# ---- to_json, counts, pins ----
def test_to_json_canonical():
    rows = [{"id": "b", "group": "café", "bytes": 5}, {"id": "a", "group": "g", "bytes": 0}]
    out = V.to_json(rows)
    assert out == {"format": "json", "bytes": b'[{"bytes":5,"group":"caf\\u00e9","id":"b"},{"bytes":0,"group":"g","id":"a"}]'}  # keys sorted, rows in input order, ASCII
    assert V.to_json([]) == {"format": "json", "bytes": b"[]"}
    assert V.TYPES["to_json"] == ("List[Row]", "Source") and "to_json" in V.PRIMS


def test_counts_and_legal_lists():
    assert W.space_counts() == W.EXPECTED_COUNTS == {"symbols": 10, "lists": 1110, "legal": {"R": 7, "C": 3}}
    R = {tuple(s) for s in V.enumerate_legal("Source", "Source")}
    assert R == {("identity",), ("identity", "identity"), ("identity", "identity", "identity"), ("parse_whole", "to_json"), ("identity", "parse_whole", "to_json"),
                 ("parse_whole", "to_json", "identity"), ("split_rows", "each(parse_whole)", "to_json")}
    C = {tuple(s) for s in V.enumerate_legal("List[Source]", "Report")}
    assert C == {("each(parse_whole)", "aggregate"), ("each(identity)", "each(parse_whole)", "aggregate"), ("each(split_rows)", "each(parse_whole)", "aggregate")}


def test_pins_and_m1_untouched():
    inv = W.inventory()
    assert set(inv) == {"identity", "parse_whole", "split_rows", "aggregate", "each", "to_json"} and inv["to_json"]["wraps"] == {}
    assert W.verify_m1_pins() == []


def test_wrong_type_and_validation():
    assert W.is_wrong_type(W.W_STRICT, "R") and W.is_wrong_type(W.W_STRICT, "C")
    assert W.is_wrong_type(["parse_whole", "to_json"], "C") and not W.is_wrong_type(["parse_whole", "to_json"], "R")
    assert W.is_wrong_type(["split_rows", "each(parse_whole)", "aggregate"], "C")  # M1's workflow: Source input
    for bad in (["rm_rf"], ["identity"] * 4, ["aggregate", "parse_whole"], [], ["each(each(identity))"], ["Identity"], ["parse_whole"]):
        with pytest.raises(W.PolicyViolation): W.validate(bad, "R")


def test_projections_local():
    csvb = b"id,group,bytes\na,x,1\nb,y,02\nc,x,5\n"
    def run(steps, env):
        ns = {}; exec(W.compile_source(steps), ns); return ns["apply"](json.dumps(env), {})
    r = {"format": "csv", "source_b64": base64.b64encode(csvb).decode()}
    assert json.loads(run(["parse_whole", "to_json"], r)) == {"error": "source_rejected"}      # whole-file failure outside each
    dec = json.loads(run(["split_rows", "each(parse_whole)", "to_json"], r))                   # row-quarantine variant passes valid files only
    assert dec["quarantined"] == [{"index": 1, "reason": BYTES_MSG}] and json.loads(dec["converted"])[0]["id"] == "a"
    assert json.loads(run(["identity"], r))["converted"] == csvb.decode()
    ok = {"format": "csv", "source_b64": base64.b64encode(csvb.replace(b"02", b"2")).decode()}
    assert json.loads(run(["parse_whole", "to_json"], ok)) == {"converted": '[{"bytes":1,"group":"x","id":"a"},{"bytes":2,"group":"y","id":"b"},{"bytes":5,"group":"x","id":"c"}]', "quarantined": []}
    files = [{"format": "csv", "text": csvb.decode()}, {"format": "csv", "text": csvb.decode().replace("02", "2")}]
    out = json.loads(run(["each(parse_whole)", "aggregate"], {"files": files}))
    assert out["quarantined"] == [{"index": 0, "reason": BYTES_MSG}] and out["groups"] == {"x": {"bytes": 6, "count": 2}, "y": {"bytes": 2, "count": 1}}
    arm3 = json.loads(run(["each(split_rows)", "each(parse_whole)", "aggregate"], {"files": files}))
    assert arm3["quarantined"] == [{"index": 1, "reason": BYTES_MSG}]                          # row-level, not file-level: differs from the nominee


def test_wrong_type_runs_nothing(tmp_path):
    s = Store(tmp_path); root = W.register_root(s)
    cases = [{"case_id": "c", "format": "csv", "source": "", "expected": "E"}] * 3
    before = W.STATS["docker_runs"]
    for e in "RC": assert W.execute_batch(s, root, e, cases) == [W.WRONG_TYPE] * 3
    assert W.STATS["docker_runs"] == before and W.selected(s, "R", retained=False) == root
    s.close()


# ---- reply parsing ----
@pytest.mark.parametrize("content,want", [
    ('{"steps":["a","b"]}', ["a", "b"]),
    ('think {"steps":["x"]} then {"steps":["y","z"]}', ["y", "z"]),                       # last wins
    ('```json\n{"steps": ["parse_whole"]}\n```', ["parse_whole"]),                         # no fence stripping needed: scan finds it
    ('{"steps":["a"],"extra":1}', None), ('{"steps":[]}', None), ('{"steps":["a","b","c","d"]}', None), ('{"steps":["a",1]}', None), ('{"steps":"a"}', None),
    ('{"steps":["a"', None), ('{"stepz":["a"]}', None), ('', None), (None, None), ('[ "a" ]', None),
    ('{"outer":{"steps":["n"]}}', ["n"]),                                                  # every { position is scanned
    ('{"steps":["good"]} then {"steps":["bad",}', ["good"]),                               # a later broken object does not hide the last valid one
    ('{"steps":["Parse_Whole"]}', ["Parse_Whole"]),                                       # no normalisation: validity is checked later against the inventory
])
def test_parse_reply(content, want):
    assert M.parse_reply(content) == want


# ---- prompts ----
def test_prompts_clean_and_rules():
    assert W.scan_prompts() == []
    p = lambda n: (W.PROMPT_DIR / n).read_text(encoding="utf-8")
    assert p("system.txt").startswith("Reasoning: low")
    for n in ("propose_R.txt", "propose_C.txt"):
        t = p(n)
        for sym in ("identity", "parse_whole", "split_rows", "aggregate", "to_json", "each("): assert sym in t
        assert t.count('"source row does not match the pinned schema"') == 1 and "<<EXAMPLES>>" in t and "<<HISTORY>>" in t and "<<CONTRACT>>" in t
        for hint in ("validate each", "split into rows", "then serialize", "parse then", "F-sel", "F-final", "F-reuse"): assert hint not in t
    assert "Harness projection" not in p("propose_R.txt") and "Whole-file rejection" not in p("propose_R.txt")


def test_prompt_scan_blocks(tmp_path, monkeypatch):
    for n in W.load_policy()["prompt_files"]: (tmp_path / n).write_text("fine\n", encoding="utf-8")
    monkeypatch.setattr(W, "PROMPT_DIR", tmp_path)
    assert W.scan_prompts() == []
    for tok in ("M1 result", "calls parse_source", "a Decoy", "quarantine variant", "wrong_type"):
        (tmp_path / "propose_R.txt").write_text(tok, encoding="utf-8")
        assert W.scan_prompts(), tok


def test_prompt_cap_drops_oldest_and_blocks_oversize():
    log = []
    rows = [f"row{i}:" + "x" * 1000 + "\n" for i in range(6)]
    system, user, size = M.assemble("sys", "head <<HISTORY>> tail <<CONTRACT>>", rows, "C", 3500, log.append)
    assert size <= 3500 and len(log) == 3 and "row0:" not in user and "row5:" in user and log[0]["dropped_history_row"].startswith("row0")  # oldest first, one at a time, logged
    assert M.assemble("s", "<<HISTORY>><<CONTRACT>>", rows[:1], "c", 10_000)[2] <= 10_000
    with pytest.raises(M.PromptTooLarge): M.assemble("s", "h" * 100 + "<<HISTORY>><<CONTRACT>>", rows, "c", 50)


def test_real_prompt_fits_cap_with_max_history():
    m = load_script(); dev = r_cases("d") + r_cases("e")
    rows = [{"round": i, "steps": ["parse_whole", "to_json"], "outcome": "F-dev passes 3 of 24", "failures": [{"case_id": "c", "actual": "a" * 900, "expected": "e" * 900}] * 3} for i in range(1, 7)]
    for e in "RC":
        _, _, size = m.build_prompt(e, dev if e == "R" else c_cases("d"), rows)
        assert size <= 28000


# ---- approval gate (§13) ----
def good_approval(tmp_path):
    pol = W.load_policy()
    man = tmp_path / "man.json"
    man.write_text(json.dumps({"schema": pol["manifest_schema"], "protocol": {"blob_sha256": W.protocol_sha()}, "policy": {"blob_sha256": W.policy_sha()},
                               "inventory": W.inventory(), "prompts": W.prompt_hashes(pol)}), encoding="utf-8")
    a = {"schema": pol["approval_schema"], "approver": "t", "approved_at": "2026-11-24", "protocol_blob_sha256": W.protocol_sha(), "protocol_commit": pol["protocol_commit"],
         "model_id": pol["model"]["id"], "model_file_sha256": pol["model"]["sha256"], "endpoint": pol["model"]["endpoint"], "caps": pol["approval_caps"], "statement": "go"}
    p = tmp_path / "appr.json"; p.write_text(json.dumps(a), encoding="utf-8")
    return a, p, man


def test_approval_gate_refusals(tmp_path):
    a, p, man = good_approval(tmp_path)
    assert M.approval_problems(p, None, man) == []
    assert M.approval_problems(tmp_path / "nope.json", None, man) == ["approval file missing"]
    for k, bad in (("schema", "x"), ("protocol_blob_sha256", "0" * 64), ("protocol_commit", "f" * 40), ("model_id", "other/model"), ("model_file_sha256", "1" * 64),
                   ("endpoint", "http://localhost:9999/v1"), ("caps", {**a["caps"], "model_calls": 65}), ("statement", ""), ("approver", None)):
        p.write_text(json.dumps({**a, k: bad}), encoding="utf-8")
        assert M.approval_problems(p, None, man), k
    p.write_text(json.dumps({k: v for k, v in a.items() if k != "caps"}), encoding="utf-8"); assert M.approval_problems(p, None, man)
    p.write_text("not json", encoding="utf-8"); assert M.approval_problems(p, None, man)
    p.write_text(json.dumps(a), encoding="utf-8")
    assert M.approval_problems(p, None, tmp_path / "missing_manifest.json")             # manifest absent = not frozen
    m = json.loads(man.read_text()); m["prompts"] = {"system.txt": "0" * 64}; man.write_text(json.dumps(m)); assert "manifest prompt hashes" in M.approval_problems(p, None, man)
    m["schema"] = "x"; man.write_text(json.dumps(m)); assert "manifest schema" in M.approval_problems(p, None, man)


def test_model_refuses_without_approval_and_wrong_host(tmp_path):
    with pytest.raises(M.Refused): M.Model(tmp_path / "o", approval_path=tmp_path / "nope.json", manifest_path=tmp_path / "nope2.json")
    with pytest.raises(M.Invalidated): M.Model(tmp_path / "o", endpoint="http://example.com/v1")
    with pytest.raises(M.Invalidated): M.Model(tmp_path / "o", stub=True, endpoint="http://example.com/v1")
    assert not (tmp_path / "o" / "model_calls.jsonl").exists()


# ---- client against the stub ----
def test_seeds():
    pol = W.load_policy()
    assert M.seed_for("A", "R", 1, pol) == 2026110000 + 1000 + 100 + 1 and M.seed_for("B", "C", 12, pol) == 2026110000 + 2000 + 200 + 12
    assert M.smoke_seed(1, pol) == 2026119001 and M.smoke_seed(2, pol) == 2026119002


def test_stub_call_body_ignores_reasoning_and_logs(tmp_path):
    srv, url = STUB.serve_thread({"R": [["parse_whole", "to_json"]]}, log=tmp_path / "req.jsonl")
    try:
        mdl = M.Model(tmp_path / "o", stub=True, endpoint=url)
        r = mdl.call("proposal", [{"role": "system", "content": "Reasoning: low"}, {"role": "user", "content": "Target type: Source"}], 2026110101, "A-R", 1)
        assert M.parse_reply(r["content"]) == ["parse_whole", "to_json"]                                  # reasoning_content ("aggregate") never read
        body = json.loads((tmp_path / "req.jsonl").read_text().splitlines()[0])
        assert {k: body[k] for k in ("temperature", "top_p", "top_k", "max_tokens", "stream", "n", "repeat_penalty", "frequency_penalty", "presence_penalty", "seed", "model")} == {
            "temperature": 0.7, "top_p": 0.95, "top_k": 40, "max_tokens": 6000, "stream": False, "n": 1, "repeat_penalty": 1.0, "frequency_penalty": 0, "presence_penalty": 0,
            "seed": 2026110101, "model": "openai/gpt-oss-20b"} and "tools" not in body and "response_format" not in body
        led = mdl.ledger()[0]
        assert led["request_body"] and led["response_text"] and led["usage"]["total_tokens"] > 0 and led["seed"] == 2026110101 and led["kind"] == "proposal"
        assert mdl.list_models() == ["openai/gpt-oss-20b"]
    finally: srv.shutdown()


def test_transport_failure_consumes_proposal_with_identical_retries(tmp_path):
    srv, url = STUB.serve_thread({"R": [{"http_status": 500}]}, log=tmp_path / "req.jsonl")
    try:
        mdl = M.Model(tmp_path / "o", stub=True, endpoint=url)
        r = mdl.call("proposal", [{"role": "user", "content": "Target type: Source"}], 7, "A-R", 1)
        assert r["status"] == "transport_failure" and r["attempts"] == 3 and mdl.totals()["calls"] == 3  # retries count as calls
        bodies = (tmp_path / "req.jsonl").read_text().splitlines()
        assert len(set(bodies)) == 1 and len({l["request_sha256"] for l in mdl.ledger()}) == 1             # identical bytes
    finally: srv.shutdown()


def test_call_and_token_caps(tmp_path, monkeypatch):
    srv, url = STUB.serve_thread({"R": [["identity"]]})
    try:
        pol = patch_policy(monkeypatch, max_model_calls=2)
        mdl = M.Model(tmp_path / "o", stub=True, endpoint=url)
        msg = [{"role": "user", "content": "Target type: Source"}]
        mdl.call("proposal", msg, 1); mdl.call("proposal", msg, 2)
        with pytest.raises(M.CapReached): mdl.call("proposal", msg, 3)
        pol["max_model_calls"] = 64; pol["max_tokens_total"] = 1
        with pytest.raises(M.CapReached): mdl.call("proposal", msg, 4)
    finally: srv.shutdown()


def test_unexpected_model_id_invalidates(tmp_path):
    srv = STUB.make_server(None, 0, model_id="other/model"); import threading; threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        mdl = M.Model(tmp_path / "o", stub=True, endpoint=f"http://127.0.0.1:{srv.server_port}/v1")
        with pytest.raises(M.Invalidated): mdl.list_models()
    finally: srv.shutdown()


def test_weight_sha_check(tmp_path, monkeypatch):
    f = tmp_path / "w.bin"; f.write_bytes(b"tiny weights")
    pol = patch_policy(monkeypatch); pol["model"] = {**pol["model"], "sha256": __import__("hashlib").sha256(b"tiny weights").hexdigest()}
    mdl = M.Model(tmp_path / "o", stub=True, weights_path=f)
    assert mdl.check_weights("before") == pol["model"]["sha256"]
    f.write_bytes(b"edited weights")
    with pytest.raises(M.Invalidated): mdl.check_weights("after")
    assert [json.loads(l)["ok"] for l in (tmp_path / "o" / "weight_checks.jsonl").read_text().splitlines()] == [True, False]


# ---- end to end on the stub with synthetic data ----
@pytest.mark.skipif(not docker_ok(), reason="Docker/pinned image unavailable")
def test_stub_end_to_end(tmp_path, monkeypatch):
    data = tmp_path / "data"; data.mkdir(); write_data(data)
    replies = {"R": [["identity"], "I have no idea", ["aggregate", "parse_whole"], ["parse_whole", "to_json"]],
               "C": [["each(split_rows)", "each(parse_whole)", "aggregate"], ["each(parse_whole)", "aggregate"]]}
    real_store = ROOT / "build" / "m2" / "store"
    snap = lambda: sorted((str(p), p.stat().st_size, p.stat().st_mtime_ns) for p in real_store.rglob("*")) if real_store.exists() else None
    before = snap()
    srv, url = STUB.serve_thread(replies)
    pol = patch_policy(monkeypatch, proposals_per_campaign=4)
    pol["decision"] = {**pol["decision"], "reuse_min_pass": 5, "b_reuse_min_pass": 5}
    monkeypatch.setattr(W, "MANIFEST_PATH", tmp_path / "nope.json")
    try:
        m = load_script(); out = tmp_path / "out"
        monkeypatch.setenv("M2_OUT", str(out)); monkeypatch.setenv("M2_DATA", str(data)); monkeypatch.delenv("M2_MANIFEST", raising=False)
        m.configure(out, data, url)
        assert out != ROOT / "build" / "m2"
        sm = m.smoke(m.make_model()); assert all(x["ok"] for x in sm)
        summary = m.run_campaigns(m.make_model(), "all")
        assert summary["A-R"]["digest"] == W.canonical_digest(["parse_whole", "to_json"]) and summary["A-R"]["dev"] == [6, 6]
        assert summary["A-C"]["digest"] == W.canonical_digest(["each(parse_whole)", "aggregate"])
        assert summary["B-R"]["digest"] and summary["B-C"]["digest"]
        tr = [json.loads(l) for l in (out / "transcript_A-R.jsonl").read_text().splitlines()]
        assert [r["outcome"].split(":")[0].split(" ")[0] for r in tr] == ["F-dev", "refused", "refused", "F-dev"]   # identity scored, junk + type error refused
        assert tr[0]["dev_pass"] == 0 and tr[1]["steps"] is None and "type error" in tr[2]["outcome"] and tr[3]["dev_pass"] == 6
        calls = [json.loads(l) for l in (out / "model_calls.jsonl").read_text().splitlines()]
        assert sum(c["kind"] == "smoke" for c in calls) == 2 and sum(c["kind"] == "proposal" for c in calls) == 16
        assert snap() == before                                                                                     # stub records never enter the M2-2 store
        a4 = m.arm4(); assert set(a4) == {"R", "C"} and a4["R"]["type_legal"]["legal_draws"] == 20
        fin = m.final_effect("R"); assert fin["outcome"] == "ACCEPTED" and fin["passes"]["nominee"] == 6 and fin["passes"]["arm1_W_strict"] == 0 and fin["passes"]["arm2_disabled"] == 0
        assert fin["decision"]["p_one_sided"] == 1 / 64 and all(v["ok"] for v in fin["cross_checks"].values()) or "other_effect_nominee" not in fin["cross_checks"]
        with pytest.raises(SystemExit): m.final_effect("R")                                                          # holdout retired
        finc = m.final_effect("C"); assert finc["outcome"] == "ACCEPTED" and finc["passes"]["arm3_strongest_old"] == 1   # arm 3 passes only the clean batch
        assert finc["cross_checks"]["other_effect_nominee"]["pass"] == 0 and finc["cross_checks"]["m1_workflow"]["pass"] == 0
        before = m.runs()["total"]
        lc = m.lifecycle()
        assert lc["all_ok"], json.dumps(lc, indent=1, default=str)[:3000]
        assert lc["restart_pid_differs"] and all(v["rollback"]["history"] == ["select", "rollback"] and v["rollback"]["container_runs_added"] == 0 for v in lc["effects"].values())
        assert lc["effects"]["R"]["reuse"]["B_reproduction"]["ok"] and m.runs()["total"] <= 160 and m.runs()["total"] > before
        with pytest.raises(SystemExit): m.run_campaign("A-R", m.make_model())                                       # nominee immutable
    finally: srv.shutdown()


def test_freeze_manifest_refuses_overwrite_and_pins_partitions(tmp_path, monkeypatch):
    data = tmp_path / "data"; data.mkdir(); write_data(data)
    monkeypatch.setattr(W, "MANIFEST_PATH", tmp_path / "evaluation_manifest.json")
    monkeypatch.delenv("M2_MANIFEST", raising=False); monkeypatch.delenv("M2_STUB_URL", raising=False)
    m = load_script(); m.configure(tmp_path / "out", data, None)
    r = m.freeze_manifest()
    man = json.loads((tmp_path / "evaluation_manifest.json").read_text())
    assert r["problems"] == [] and man["schema"] == "hive-m2-evaluation-manifest-v1" and man["protocol"]["commit"] == "d4b71d2fb070786245d71666365c270bf8b651d7"
    assert len(man["partitions"]) == 8 and set(man["evaluator"]) >= {"oracle.py"} and man["partitions"]["f_dev_R.jsonl"] == W._sha((data / "f_dev_R.jsonl").read_bytes())
    ex = [json.loads(l) for l in (tmp_path / "out" / "exposure.jsonl").read_text().splitlines()]
    assert len(ex) == 8 and all(e["who"] == "m2_evaluator" and e["action"] == "write" for e in ex)
    with pytest.raises(SystemExit): m.freeze_manifest()
    (data / "f_dev_R.jsonl").write_text("{}"+chr(10))                                   # partition bytes must match the manifest
    with pytest.raises(M.Invalidated): m.load_part("f_dev", "R")


@pytest.mark.skipif(not docker_ok() or not (ROOT / "build/m2/data/f_dev_R.jsonl").exists(), reason="Docker or public M2 data unavailable")
def test_integration_proof_on_public_data(tmp_path, monkeypatch):
    monkeypatch.setattr(W, "MANIFEST_PATH", tmp_path / "nope.json"); monkeypatch.delenv("M2_MANIFEST", raising=False); monkeypatch.delenv("M2_STUB_URL", raising=False)
    m = load_script(); m.configure(tmp_path / "out", ROOT / "build/m2/data", "http://127.0.0.1:1/v1")  # stub-mode paths: never writes build/m2
    res = m.prove()
    for e, nom in (("R", "nominee"), ("C", "nominee")):
        for part, n in (("f_dev", 24), ("f_sel", 20)): assert res[e][nom][part]["pass"] == n, res[e][nom][part]
    assert all(res["R"]["arm3_identity"][p]["pass"] == 0 for p in ("f_dev", "f_sel"))
    assert all(res["C"]["arm3_row_level"][p]["defective_passed"] == 0 for p in ("f_dev", "f_sel"))
    assert all(res[e]["W_strict"][p]["pass"] == 0 for e in "RC" for p in ("f_dev", "f_sel"))
