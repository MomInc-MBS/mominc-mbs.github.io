"""Prepare inspectable first-party prototype inputs; never approve or call a model."""
from __future__ import annotations

import argparse
import ast
import csv
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "src"))
from hive.orchestrator import DEFAULT_CONFIG, code_version
from hive.prototype_approval import manifest_fingerprint
from hive.prototype_learning import prepare_prototype_learning

BASE = "0b3bfc391c8fc21555f451012757174933f1c479"
MODEL = "a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c"
IMAGE = "sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535"


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.PIPE)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def public_source(path):
    try:
        return git(REPO, "show", f"{BASE}:{path}"), BASE
    except subprocess.CalledProcessError:
        # An extracted public snapshot has no Git history. Its actual source
        # bytes are still usable development input, with truthful attribution.
        return (REPO / path).read_bytes(), "snapshot:" + code_version()["source_sha256"]


def write(path, value):
    raw = value if isinstance(value, bytes) else (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() != raw:
        raise ValueError("Prepared immutable input already differs: " + str(path))
    if not path.exists():
        path.write_bytes(raw)
    return digest(raw)


def prepare(root):
    root = Path(root).resolve()
    inputs = root / "inputs"
    sources = ["src/hive/data_tasks.py", "src/hive/governor.py", "src/hive/storage.py",
               "src/hive/mission.py", "src/hive/adapters/ollama.py", "src/hive/adapters/isolation.py"]
    rows, provenance = [], []
    for path in sources:
        raw, revision = public_source(path)
        rows.append({"id": path, "group": "adapters" if "/adapters/" in path else "controller", "bytes": len(raw)})
        provenance.append({"path": path, "revision": revision, "sha256": digest(raw), "bytes": len(raw)})
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=["id", "group", "bytes"], lineterminator="\n")
    writer.writeheader(); writer.writerows(rows)
    input_sha = write(inputs / "source-inventory.csv", stream.getvalue().encode())
    inventory = {"version": 1, "id": "prototype-inventory", "source_group": "public-dev6-source-inventory",
                 "allowed_root": str(inputs), "input_path": "source-inventory.csv", "input_sha256": input_sha,
                 "source_format": "csv", "task_type": "inventory", "schema_id": "grouped_inventory_v1"}
    write(inputs / "inventory-mission.json", inventory)

    # Real published prose, selected without inference. These are development
    # inputs; they are not twelve independently sourced research cases.
    selections = [
        ("development", "README.md", [("P2", "Model output cannot invoke shell commands, arbitrary code, network services, or file writes.", "safeguard"),
            ("scope", "Real inference requires local Ollama and an installed model named in `configs/local.json`.", "prerequisite")]),
        ("comparison", "docs/NEXT_WORK_ITEM.md", [("isolation", "STOP and spent budgets remain intact.", "safeguard"),
            ("inputs", "The next externally blocked action is concrete: supply and approve twelve unused source groups/snapshots with permitted use, immutable input hashes, exposure attestations, independently held exact verifiers and per-task plus aggregate resource caps.", "prerequisite")]),
        ("comparison-extra", "docs/RUN_HIVE.md", [("restore", "A restore cannot grant permissions, refill budgets or promote a candidate.", "safeguard"),
            ("python", "Python 3.11 or newer is required; the runtime has no third-party Python dependencies.", "prerequisite")]),
        ("subsequent", "docs/CURRENT_STATE.md", [("policy", "Exact categories require a permitted verifiable tool or abstention.", "safeguard"),
            ("approval", "Model-specialist and team quality comparisons remain blocked by zero new allocation.", "prerequisite")]),
    ]
    classification = []
    for name, path, items in selections:
        raw, revision = public_source(path)
        source = raw.decode("utf-8-sig")
        normalized = " ".join(source.split())
        if any(text not in normalized for _, text, _ in items):
            raise ValueError("Selected real source passage does not reproduce: " + path)
        write(inputs / "provenance" / path.replace("/", "__"), source.encode())
        data = [{"id": item_id, "text": text} for item_id, text, _ in items]
        sha = write(inputs / (name + ".json"), data)
        oracle = {"labels": {item_id: label for item_id, _, label in items}}
        oracle_sha = write(inputs / "private" / (name + "-oracle.json"), oracle)
        manifest = {"version": 1, "id": "prototype-" + name, "source_group": "public-dev6-" + path,
                    "allowed_root": str(inputs), "input_path": name + ".json", "input_sha256": sha,
                    "source_format": "json", "task_type": "classification", "schema_id": "independent_labels_v1",
                    "labels": ["safeguard", "prerequisite"], "oracle_path": "private/" + name + "-oracle.json",
                    "oracle_sha256": oracle_sha}
        write(inputs / (name + "-mission.json"), manifest)
        classification.append(manifest)
        provenance.append({"path": path, "revision": revision, "sha256": digest(raw),
                           "use": "exact excerpts with whitespace normalized; independently reviewed development labels",
                           "label_review": {"status": "INDEPENDENT_REVIEWED", "reviewer": "Terra baseline_verify",
                               "scope": "Exact source support and safeguard/prerequisite label consistency only",
                               "evidence": "Original six exact labels independently reviewed by Terra; extra RUN_HIVE excerpts independently confirmed by baseline_verify on 2026-11-21",
                               "acceptance_claim": False}})

    classification_plan = {"version": 1, "id": "prototype-classification-learning", "development": classification[0],
                           "comparison": classification[1:3], "subsequent": classification[3]}
    prepared_classification = prepare_prototype_learning(classification_plan)
    write(root / "classification-learning-plan.json", prepared_classification["plan"])
    write(root / "private" / "classification-required-approval-manifests.json", prepared_classification["required_approval_manifests"])

    # Every inventory learning input is derived from different actual public files.
    # Metadata extraction is exact work, with no synthetic bytes or labels.
    inventory_sets = [
        ("development", ["src/hive/data_tasks.py", "src/hive/governor.py"]),
        ("comparison", ["src/hive/storage.py", "src/hive/mission.py"]),
        ("comparison-extra", ["src/hive/adapters/ollama.py", "src/hive/adapters/isolation.py"]),
        ("subsequent", ["src/hive/diagnostics.py", "src/hive/code_verifier.py"]),
    ]
    inventory_manifests = []
    for name, paths in inventory_sets:
        inventory_rows = []
        for path in paths:
            raw, revision = public_source(path)
            inventory_rows.append({"id": path, "group": "adapters" if "/adapters/" in path else "controller", "bytes": len(raw)})
            provenance.append({"path": path, "revision": revision, "sha256": digest(raw), "bytes": len(raw),
                               "inventory_learning_input": name, "operation": "exact public-file byte length"})
        source_name = "inventory-learning-" + name + ".json"
        source_sha = write(inputs / source_name, inventory_rows)
        manifest = {"version": 1, "id": "prototype-inventory-" + name,
                    "source_group": "public-dev6-inventory-" + name, "allowed_root": str(inputs),
                    "input_path": source_name, "input_sha256": source_sha, "source_format": "json",
                    "task_type": "inventory", "schema_id": "grouped_inventory_v1"}
        write(inputs / ("inventory-learning-" + name + "-mission.json"), manifest)
        inventory_manifests.append(manifest)
    inventory_plan = {"version": 1, "id": "prototype-inventory-learning", "development": inventory_manifests[0],
                      "comparison": inventory_manifests[1:3], "subsequent": inventory_manifests[3]}
    prepared_inventory = prepare_prototype_learning(inventory_plan)
    write(root / "inventory-learning-plan.json", prepared_inventory["plan"])

    code_root = inputs / "python-snapshot"
    source = public_source("src/hive/data_tasks.py")[0].decode()
    function = next(n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name == "summarize_inventory")
    original = ast.get_source_segment(source, function) + "\n\ndef transform(rows):\n    return summarize_inventory(rows)\n"
    patch = ast.get_source_segment(source, function) + "\n\ndef transform(rows):\n    return [{'group': key, **value} for key, value in summarize_inventory(rows)['groups'].items()]\n"
    def expected(data):
        return [{"group": key, "count": sum(row["group"] == key for row in data),
                 "bytes": sum(row["bytes"] for row in data if row["group"] == key)} for key in sorted({row["group"] for row in data})]
    cases = [{"id": "source-rows", "args": [rows], "kwargs": {}, "expected": expected(rows)},
             {"id": "empty", "args": [[]], "kwargs": {}, "expected": []}]
    write(code_root / "app.py", original.encode())
    verifier_sha = write(code_root / "verifier.json", {"contract": "Group rows into sorted count/byte reports", "cases": cases})
    if not (code_root / ".git").exists():
        git(code_root, "init", "-q")
        git(code_root, "add", "app.py", "verifier.json")
        git(code_root, "-c", "user.name=HIVE prototype preparation", "-c", "user.email=hive@example.invalid", "commit", "-qm", "Pin public-source transformation input and independent cases")
    revision = git(code_root, "rev-parse", "HEAD").decode().strip()
    code = {"schema_version": 1, "id": "prototype-python", "repo": {"path": str(code_root), "revision": revision,
            "source_sha256": digest(git(code_root, "archive", "--format=tar", revision))},
            "verifier": {"path": "verifier.json", "sha256": verifier_sha, "protocol": "json_function_v1",
                         "module": "app", "function": "transform", "cases": cases},
            "worker_files": ["app.py"], "allowlist": ["app.py"],
            "patches": [{"id": "tabular-output", "path": "app.py", "content": patch, "sha256": digest(patch.encode())}],
            "image": {"reference": "python:3.11-slim", "digest": IMAGE},
            "limits": {"timeout_s": 30, "memory_mb": 128, "cpu_count": 1, "pids": 32, "output_bytes": 16384},
            "network": "none", "mounts": "read_only_source_clean_copy"}
    write(inputs / "python-mission.json", code)
    write(inputs / "python-standalone.json", {"schema_version": 1, "id": "prototype-python-standalone",
          "family": "code", "manifest": code, "require_real_verification": True})
    data_child = {**inventory, "id": "prototype-combined-data"}
    combined = {"schema_version": 1, "id": "prototype-combined", "stages": [
        {"id": "data", "family": "structured_data", "manifest": data_child},
        {"id": "python", "family": "code", "manifest": {**code, "id": "prototype-combined-python"}, "depends_on": ["data"],
         "input_from": {"stage": "data", "artifact": "data.json", "pointer": "/rows", "case_id": "source-rows", "argument": 0}},
        {"id": "review", "family": "review", "depends_on": ["data", "python"]},
        {"id": "report", "family": "report", "depends_on": ["review"]}]}
    write(inputs / "combined-mission.json", combined)

    # Model-backed composition consumes the actual independently verified label
    # mapping, not its original rows or an independently recomputed substitute.
    label_root = inputs / "python-label-snapshot"
    label_source = "def transform(labels):\n    return [{'label': label, 'count': 1} for label in labels.values()]\n"
    label_patch = ("def transform(labels):\n    counts = {}\n    for label in labels.values():\n"
                   "        counts[label] = counts.get(label, 0) + 1\n"
                   "    return [{'label': label, 'count': counts[label]} for label in sorted(counts)]\n")
    known_labels = {item["id"]: label for item, (_, _, label) in zip(
        json.loads((inputs / "development.json").read_text(encoding="utf-8")), selections[0][2])}
    label_cases = [
        {"id": "source-labels", "args": [known_labels], "kwargs": {},
         "expected": [{"label": "prerequisite", "count": 1}, {"label": "safeguard", "count": 1}]},
        {"id": "repeat-label", "args": [{"a": "safeguard", "b": "safeguard", "c": "prerequisite"}], "kwargs": {},
         "expected": [{"label": "prerequisite", "count": 1}, {"label": "safeguard", "count": 2}]},
        {"id": "empty", "args": [{}], "kwargs": {}, "expected": []},
    ]
    write(label_root / "app.py", label_source.encode())
    label_verifier_sha = write(label_root / "verifier.json", {"contract": "Count labels and sort by label; independent predeclared cases", "cases": label_cases})
    if not (label_root / ".git").exists():
        git(label_root, "init", "-q")
        git(label_root, "add", "app.py", "verifier.json")
        git(label_root, "-c", "user.name=HIVE prototype preparation", "-c", "user.email=hive@example.invalid", "commit", "-qm", "Pin label-count transformation and independent cases")
    label_revision = git(label_root, "rev-parse", "HEAD").decode().strip()
    label_code = {**code, "id": "prototype-label-python",
                  "repo": {"path": str(label_root), "revision": label_revision,
                           "source_sha256": digest(git(label_root, "archive", "--format=tar", label_revision))},
                  "verifier": {"path": "verifier.json", "sha256": label_verifier_sha, "protocol": "json_function_v1",
                               "module": "app", "function": "transform", "cases": label_cases},
                  "patches": [{"id": "sorted-label-counts", "path": "app.py", "content": label_patch,
                               "sha256": digest(label_patch.encode())}]}
    write(inputs / "python-label-mission.json", label_code)
    write(inputs / "python-label-standalone.json", {"schema_version": 1, "id": "prototype-label-python-standalone",
          "family": "code", "manifest": label_code, "require_real_verification": True})
    label_data = {**classification[0], "id": "prototype-model-combined-data"}
    model_combined = {"schema_version": 1, "id": "prototype-model-combined", "stages": [
        {"id": "data", "family": "structured_data", "manifest": label_data},
        {"id": "python", "family": "code", "manifest": {**label_code, "id": "prototype-model-combined-python"},
         "depends_on": ["data"], "input_from": {"stage": "data", "artifact": "data.json", "pointer": "/labels",
                                                 "case_id": "source-labels", "argument": 0}},
        {"id": "review", "family": "review", "depends_on": ["data", "python"]},
        {"id": "report", "family": "report", "depends_on": ["review"]}]}
    write(inputs / "model-combined-mission.json", model_combined)
    config = {**DEFAULT_CONFIG, "routes": ["tool", "local_direct"], "max_requests": 24, "max_tokens": 128,
              "max_total_tokens": 3072, "max_wall_s": 1800, "max_storage_bytes": 67108864, "max_cycles": 100}
    proposal = {"schema_version": 1, "approved": False, "approved_by": None, "budget_id": "prototype-v04-demo",
                "store_root": str(root / "live-store"), "allowed_root": str(inputs), "model_digest": MODEL,
                "executor_config": config, "tasks": [*prepared_classification["required_approval_tasks"],
                    {"id": label_data["id"], "manifest_sha256": manifest_fingerprint(label_data)}],
                "scope": "Prototype development only. No Level A, Level B or policy promotion authorization."}
    write(root / "operator-approval.proposed.json", proposal)
    source_revisions = sorted({item["revision"] for item in provenance})
    source_revision = source_revisions[0] if len(source_revisions) == 1 else "mixed; see source_provenance"
    index = {"source_revision": source_revision, "source_provenance": provenance, "exposed_to_model": False,
             "new_model_calls": 0, "classification_verifier_review": "INDEPENDENT_DEVELOPMENT_LABELS_REVIEWED",
             "scope": "First-party derived operational inputs; not an unused independent acceptance corpus",
             "inputs": str(inputs), "proposal": str(root / "operator-approval.proposed.json"),
             "classification_learning_plan": str(root / "classification-learning-plan.json"),
             "inventory_learning_plan": str(root / "inventory-learning-plan.json"),
             "classification_source_groups": prepared_classification["source_groups"],
             "classification_input_hashes": prepared_classification["input_sha256"],
             "inventory_source_groups": prepared_inventory["source_groups"],
             "inventory_input_hashes": prepared_inventory["input_sha256"],
             "required_approval_task_count": len(proposal["tasks"]),
             "combined_source_reuse": "Model combined reuses reviewed development excerpts under its own explicitly fingerprinted ID; no fresh-source acceptance claim"}
    write(root / "prototype-demo-manifest.json", index)
    commands = f"""# Prepared prototype operator demonstration

Prepared from public first-party source at `{source_revision}`. Four classification sources
and four inventory inputs are pairwise distinct within each learning plan.
Terra independently checked the original six labels; baseline_verify also checked
the two RUN_HIVE excerpts. This is development review, not research acceptance.
Original input roots remain immutable. Preparation performs no inference.

Run from `{REPO}` in PowerShell:

```powershell
$env:PYTHONPATH = "$PWD\\src"
$demo = '{root}'
# Read-only health. No inference and no implicit downloads:
python -m hive doctor --config configs/local.json
# One shared zero-call allocation for tool-only tasks and learning:
python -m hive --store "$demo/tool-store" data --manifest "$demo/inputs/inventory-mission.json"
python -m hive --store "$demo/tool-store" mission run --manifest "$demo/inputs/python-standalone.json"
python -m hive --store "$demo/tool-store" mission run --manifest "$demo/inputs/combined-mission.json"
python -m hive --store "$demo/tool-store" learn --plan "$demo/inventory-learning-plan.json"
```

Inspect `operator-approval.proposed.json`. It is deliberately `approved:false`;
no command can use it for live inference. The separate operator must review its
eight exact task fingerprints (including recovery variants and combined data),
pinned model digest, sources, labels and caps before saving an approved copy at
`operator-approval.json`. Do not edit generated inputs after review. Approval is
one 24-request / 128-token-per-request / 3072-token allocation, one worker, 1800
active seconds and 64 MiB, bound to `live-store`. No new store refills that cap.

Only after that separate authorization exists:

```powershell
$approval = "$demo/operator-approval.json"
python -m hive --store "$demo/live-store" data --manifest "$demo/inputs/development-mission.json" --approval "$approval"
python -m hive --store "$demo/live-store" mission run --manifest "$demo/inputs/python-label-standalone.json" --approval "$approval" --allowed-root "$demo/inputs"
python -m hive --store "$demo/live-store" mission run --manifest "$demo/inputs/model-combined-mission.json" --approval "$approval" --allowed-root "$demo/inputs"
python -m hive --store "$demo/live-store" learn --plan "$demo/classification-learning-plan.json" --approval "$approval"
# Learning includes development, two frozen comparison sources and a subsequent
# distinct source under the retained permitted procedure. P0 remains governing.
python -m hive --store "$demo/live-store" status
python -m hive --store "$demo/live-store" stop
python -m hive --store "$demo/live-store" resume
# Replay the exact commands above in a fresh process; verify unchanged counters.
python -m hive --store "$demo/live-store" console --allowed-root "$demo/inputs" --approval "$approval"
```

The model-backed combined stage binds actual verified `data.json` `/labels` into
the Python case `source-labels`, argument zero. Its patch counts repeated labels
and returns sorted label/count records. Independent expected cases are fixed
before execution and never generated from the model's actual answer. The
inventory combined mission separately retains `/rows` and case `source-rows`.
Missing Docker/model/approval is a blocker, never permission for a fallback.
Learning ties or weaker quality reject; no beneficial-learning or policy
promotion claim is made by preparation or by merely running this loop.
"""
    # Generated commands are documentation, not an execution identity. Correcting
    # this runbook must not replace immutable sources, oracles or the proposal.
    (root / "runbook.md").write_bytes(commands.encode())
    return index


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(REPO / ".hive" / "prototype-v04-final-inputs"))
    print(json.dumps(prepare(parser.parse_args().root), indent=2))
