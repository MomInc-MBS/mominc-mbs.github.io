import subprocess
import time
import pytest
from hive import lineage as L
from hive.adapters.isolation import DockerIsolation, PINNED_IMAGE, SandboxUnavailable
from hive.experiment_compare import run_isolated
from hive.storage import Store

try:
    DockerIsolation().inspect(PINNED_IMAGE)
    OK = ""
except SandboxUnavailable as e:
    OK = str(e)
pytestmark = pytest.mark.skipif(bool(OK), reason=OK or "docker")


def run(src, text="a,b\n", **kw):
    return run_isolated(src, text, {}, backend="container", **kw)


def leftovers():
    return subprocess.run(["docker", "ps", "-aq", "--filter", "name=hive-code-"], capture_output=True, text=True).stdout.split()


def test_honest_roundtrip():
    assert run("def apply(text, checks):\n    return text.upper() + str(checks)\n") == "A,B\n{}"


def test_network_fails():
    assert run("import socket\ndef apply(t, c):\n    try:\n        socket.create_connection(('1.1.1.1', 80), 2); return 'NET'\n    except OSError:\n        return 'blocked'\n") == "blocked"


def test_write_outside_output_dir_fails():
    src = ("def apply(t, c):\n    r = []\n    for p in ('/etc/x', '/work/x', '/usr/x'):\n"
           "        try: open(p, 'w').write('x'); r.append('W')\n        except OSError: r.append('ro')\n    return ','.join(r)\n")
    assert run(src) == "ro,ro,ro"


def test_cannot_read_host_files():
    src = ("import os\ndef apply(t, c):\n    return str([p for p in ('/host_mnt', '/mnt/d', '/d', 'D:/Repos') if os.path.exists(p)])\n")
    assert run(src) == "[]"


def test_fork_bomb_contained_by_pids_limit():
    src = ("import os\ndef apply(t, c):\n    n = 0\n    for _ in range(500):\n        try:\n            if os.fork() == 0:\n                import time; time.sleep(30); os._exit(0)\n            n += 1\n"
           "        except OSError:\n            break\n    return str(n)\n")
    try:
        n = int(run(src))
        assert n < 40
    except RuntimeError:
        pass  # killed/failed is also contained
    time.sleep(1)
    assert leftovers() == []


def test_timeout_kills_container():
    t0 = time.time()
    with pytest.raises(RuntimeError, match="timed out"):
        run("def apply(t, c):\n    while True: pass\n", timeout=2)
    assert time.time() - t0 < 15 and leftovers() == []


def test_oversized_output_fails_only_its_arm():
    with pytest.raises(RuntimeError, match="exceeds"):
        run("def apply(t, c):\n    return t * 200000\n", max_out=1000)
    assert run("def apply(t, c):\n    return 'ok'\n") == "ok"


def test_lineage_container_operator_needs_backend(tmp_path):
    s = Store(tmp_path)
    r = L.register(s, "id", [], {}, "e" * 64, {"root": "P0"})
    with pytest.raises(ValueError, match="FR-8"):
        L.register(s, "x", [r], {"class": "code"}, "e" * 64, {})
    assert L.register(s, "x", [r], {"class": "code"}, "e" * 64, {}, backend="container")


def test_code_class_refuses_process_backend():
    s = "def apply(t, c):\n    return t\n"
    with pytest.raises(RuntimeError, match="must run with backend='container'"):
        run_isolated(s, "a", {}, operator_class="code")
    with pytest.raises(RuntimeError, match="must run with backend='container'"):
        run_isolated(s, "a", {}, backend="process", operator_class="generated")
    assert run_isolated(s, "a", {}, backend="container", operator_class="code") == "a"


def test_genome_records_backend_and_compare_runs_code_candidate_in_container(tmp_path):
    from test_experiment_compare import _run
    from hive.experiment_compare import Candidate
    marker = "def apply(text, checks):\n    import os\n    return text if os.path.exists('/.dockerenv') else text + 'HOST'\n"
    s = Store(tmp_path / "lin")
    c = Candidate("C-code", marker, "x", {"diagnosis_sha256": "d"}, "p", operator_class="code")
    assert c.backend == "container"
    r, _ = _run(tmp_path, extra_candidates=[c], lineage_store=s)
    rec = next(x for x in r["candidates"] if x["candidate"] == "C-code")
    assert rec["aborted_at"] is None and "P0" in rec["identical_output_to"]  # ran in the container: output == input
    h = __import__("json").loads((tmp_path / "out" / "lineage.json").read_text())["candidates"]["C-code"]["lineage_hash"]
    assert L.get(s, h)["backend"] == "container" and L.get(s, h)["operator"]["class"] == "code"


def test_mislabelled_data_rule_source_is_forced_into_container():
    # FR-9: a caller cannot earn the process backend by labelling arbitrary code as data_rule
    from hive.experiment_compare import Candidate, _scrub_lowercase_source
    rogue = Candidate("x", "def apply(text, checks):\n    return text\n", "r", {}, "p", operator_class="data_rule")
    builtin = Candidate("y", _scrub_lowercase_source(), "r", {}, "p")
    assert rogue.backend == "container"
    assert builtin.backend == "process"
