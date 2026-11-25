"""Manifest and receipt verification for bounded repository missions."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import tarfile
import io
from pathlib import Path, PurePosixPath


class MissionValidationError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _safe_rel(value, label):
    if not isinstance(value, str) or not value or "\\" in value or "\x00" in value or ":" in value:
        raise MissionValidationError(f"{label} must be a safe relative POSIX path")
    raw_parts = value.split("/")
    if any(part in ("", ".", "..") or part.endswith((".", " ")) for part in raw_parts):
        raise MissionValidationError(f"{label} must be a safe relative POSIX path")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise MissionValidationError(f"{label} must be a safe relative POSIX path")
    reserved = {"con", "prn", "aux", "nul", *(f"com{i}" for i in range(1, 10)), *(f"lpt{i}" for i in range(1, 10))}
    if any(part.split(".", 1)[0].casefold() in reserved for part in raw_parts):
        raise MissionValidationError(f"{label} contains a Windows-reserved device name")
    return path.as_posix()


def _git(repo: Path, *args, binary=False):
    try:
        result = subprocess.run(["git", *args], cwd=repo, stdin=subprocess.DEVNULL,
                                capture_output=True, timeout=30, check=True)
    except (OSError, subprocess.SubprocessError) as exc:
        raise MissionValidationError(f"git snapshot verification failed ({type(exc).__name__})") from exc
    return result.stdout if binary else result.stdout.decode("utf-8", errors="strict").strip()


def validate_manifest(manifest: dict) -> dict:
    if not isinstance(manifest, dict) or manifest.get("schema_version") != 1:
        raise MissionValidationError("unsupported code mission manifest")
    if not isinstance(manifest.get("id"), str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,100}", manifest["id"]):
        raise MissionValidationError("mission id is invalid")
    repo = manifest.get("repo")
    verifier = manifest.get("verifier")
    if not isinstance(repo, dict) or not isinstance(verifier, dict):
        raise MissionValidationError("repo and verifier records are required")
    raw_repo_path = repo.get("path")
    if not isinstance(raw_repo_path, str) or not raw_repo_path:
        raise MissionValidationError("repository path is required")
    repo_path = Path(raw_repo_path).absolute()
    if not repo_path.is_dir():
        raise MissionValidationError("repository path must be a directory")
    # Reject symlink/junction ancestors, including the repo itself.
    probe = Path(repo_path.anchor)
    for piece in repo_path.parts[1:]:
        probe = probe / piece
        try:
            attrs = probe.lstat().st_file_attributes
        except AttributeError:
            if probe.is_symlink():
                raise MissionValidationError("repository ancestors may not be symlinks")
        if probe.is_symlink() or bool(attrs & 0x400):
            raise MissionValidationError("repository ancestors may not be symlinks or reparse points")
        attrs = 0
    repo_path = repo_path.resolve(strict=True)
    revision = repo.get("revision")
    if not isinstance(revision, str) or not revision or revision.startswith("-"):
        raise MissionValidationError("repository revision is required")
    resolved_revision = _git(repo_path, "rev-parse", "--verify", revision + "^{commit}")
    if resolved_revision != revision:
        raise MissionValidationError("repository revision must be a full immutable commit id")
    source_archive = _git(repo_path, "archive", "--format=tar", revision, binary=True)
    source_hash = sha256(source_archive)
    if repo.get("source_sha256") != source_hash:
        raise MissionValidationError("repository source snapshot hash mismatch")
    members = _git(repo_path, "ls-tree", "-r", "-z", "--full-tree", revision, binary=True).split(b"\0")
    files = {}
    for row in members:
        if not row:
            continue
        meta, path_bytes = row.split(b"\t", 1)
        path = path_bytes.decode("utf-8", errors="strict")
        _safe_rel(path, "tracked source path")
        mode, kind, blob = meta.decode("ascii").split()
        if mode == "160000" or kind == "commit":
            raise MissionValidationError("git submodules are not supported in isolated source snapshots")
        files[path] = (mode, blob)
    verifier_path = _safe_rel(verifier.get("path"), "verifier path")
    if verifier_path not in files or verifier.get("sha256") != sha256(_git(repo_path, "show", f"{revision}:{verifier_path}", binary=True)):
        raise MissionValidationError("trusted verifier path/hash does not match pinned source")
    if verifier.get("protocol") != "json_function_v1":
        raise MissionValidationError("only the independently checked json_function_v1 protocol is accepted")
    module, function = verifier.get("module"), verifier.get("function")
    if (not isinstance(module, str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.]*", module)
            or not isinstance(function, str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", function)):
        raise MissionValidationError("verifier must pin a Python module and function")
    cases = verifier.get("cases")
    if not isinstance(cases, list) or not 2 <= len(cases) <= 100:
        raise MissionValidationError("json_function_v1 requires 2..100 objective cases")
    case_ids = set()
    public_cases, expected_cases = [], []
    for case in cases:
        if (not isinstance(case, dict) or set(case) != {"id", "args", "kwargs", "expected"}
                or not isinstance(case.get("id"), str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", case["id"])
                or case["id"] in case_ids or not isinstance(case.get("args"), list)
                or not isinstance(case.get("kwargs"), dict)):
            raise MissionValidationError("invalid or duplicate objective verifier case")
        case_ids.add(case["id"])
        public_cases.append({"id": case["id"], "args": case["args"], "kwargs": case["kwargs"]})
        expected_cases.append({"id": case["id"], "expected": case["expected"]})
    suite_hash = sha256(json.dumps(cases, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8"))
    worker_files = manifest.get("worker_files")
    if not isinstance(worker_files, list) or not worker_files:
        raise MissionValidationError("explicit worker_files list is required for secret-free mounts")
    worker = {_safe_rel(path, "worker file") for path in worker_files}
    if len(worker) != len(worker_files) or verifier_path in worker:
        raise MissionValidationError("worker files must be unique and exclude the trusted verifier")
    for path in worker:
        if path not in files or files[path][0] not in {"100644", "100755"}:
            raise MissionValidationError("worker mount may include only tracked regular files")
        if not path.endswith(".py"):
            raise MissionValidationError("worker mount is limited to explicitly pinned Python source files")
        lowered = path.lower()
        if (any(piece in {"tests", "test", "fixtures", "secrets", "secret", ".github"} for piece in PurePosixPath(lowered).parts)
                or Path(path).name.startswith(".") or any(word in lowered for word in ("secret", "credential", "password"))):
            raise MissionValidationError("worker mount contains a test, secret, or hidden path")
        blob = _git(repo_path, "cat-file", "blob", files[path][1], binary=True)
        if len(blob) > 4 * 1024 * 1024 or re.search(rb"(?i)-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(?:api[_-]?key|access[_-]?token|password)\s*=\s*['\"][^'\"]{20,}", blob):
            raise MissionValidationError("worker source size or credential scan exceeded the safe mount contract")
    module_path = module.replace(".", "/") + ".py"
    if module_path not in worker:
        raise MissionValidationError("pinned function module must be in the explicit worker mount")
    allowlist = manifest.get("allowlist")
    patches = manifest.get("patches")
    if not isinstance(allowlist, list) or not allowlist or not isinstance(patches, list) or not patches:
        raise MissionValidationError("a nonempty concrete patch allowlist and patch set are required")
    allowed = {_safe_rel(item, "allowlist path") for item in allowlist}
    if len(allowed) != len(allowlist):
        raise MissionValidationError("duplicate allowlist path")
    if verifier_path in allowed or not allowed.issubset(worker) or any(path.startswith("tests/") or path in {"pyproject.toml", "setup.py", "tox.ini", "pytest.ini"} for path in allowed):
        raise MissionValidationError("patch allowlist may not modify verifier or test configuration")
    patch_ids = set()
    normalized_patches = []
    for patch in patches:
        if not isinstance(patch, dict) or not isinstance(patch.get("id"), str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", patch["id"]):
            raise MissionValidationError("patch ids must be stable identifiers")
        if patch["id"] in patch_ids:
            raise MissionValidationError("duplicate patch id")
        patch_ids.add(patch["id"])
        path = _safe_rel(patch.get("path"), "patch path")
        content = patch.get("content")
        if path not in allowed or not isinstance(content, str) or sha256(content.encode("utf-8")) != patch.get("sha256"):
            raise MissionValidationError("patch does not match concrete allowlist/content hash")
        if path not in files:
            raise MissionValidationError("patch target must already exist in pinned source")
        normalized_patches.append({"id": patch["id"], "path": path, "content": content, "sha256": patch["sha256"]})
    image = manifest.get("image")
    if not isinstance(image, dict):
        raise MissionValidationError("pinned execution image is required")
    limits = manifest.get("limits")
    if (not isinstance(limits, dict) or any(type(limits.get(key)) is not int for key in ("timeout_s", "memory_mb", "cpu_count", "pids", "output_bytes"))
            or not 1 <= limits["timeout_s"] <= 900 or not 64 <= limits["memory_mb"] <= 8192
            or not 1 <= limits["cpu_count"] <= 8 or not 16 <= limits["pids"] <= 1024
            or not 1024 <= limits["output_bytes"] <= 1_000_000):
        raise MissionValidationError("invalid resource limits")
    if manifest.get("network") != "none" or manifest.get("mounts") != "read_only_source_clean_copy":
        raise MissionValidationError("networkless read-only clean-copy execution is mandatory")
    return {"manifest": manifest, "repo_path": str(repo_path), "revision": revision,
            "source_sha256": source_hash, "archive": source_archive,
            "files": files, "verifier_path": verifier_path,
            "verifier_sha256": verifier["sha256"], "command": function_command(module, function, public_cases),
            "module": module, "function": function, "public_cases": public_cases,
            "expected_cases": expected_cases, "suite_sha256": suite_hash,
            "worker_files": sorted(worker),
            "allowlist": sorted(allowed), "patches": normalized_patches,
            "image": image, "limits": limits}


def function_command(module: str, function: str, public_cases: list[dict]) -> list[str]:
    """Return the single trusted wrapper command; verifier answers are omitted."""
    wrapper = ("import importlib,json,sys; "
               "m=importlib.import_module(sys.argv[1]); f=getattr(m,sys.argv[2]); "
               "cases=json.loads(sys.argv[3]); "
               "out=[{'id':c['id'],'value':f(*c['args'],**c['kwargs'])} for c in cases]; "
               "sys.stdout.write(json.dumps({'results':out},separators=(',',':'),ensure_ascii=False,allow_nan=False))")
    cases_json = json.dumps(public_cases, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    if len(cases_json.encode("utf-8")) > 64_000:
        raise MissionValidationError("public function cases exceed the 64 KiB request cap")
    return ["python", "-B", "-c", wrapper, module, function, cases_json]


def verify_execution_receipt(receipt: dict, expected: dict) -> dict:
    """Independent structural check; caller derives pass solely from this result."""
    required_controls = {"network": "none", "read_only_root": True, "source_mount": "read_only",
                         "capabilities": "drop_all", "no_new_privileges": True,
                         "image_digest": expected["image"]["digest"],
                         "source_sha256": expected["source_sha256"],
                         "verifier_sha256": expected["verifier_sha256"],
                         "patch_sha256": expected["patch"]["sha256"],
                         "operation_key": expected["operation_key"]}
    if expected.get("synthetic") is True:
        valid = (isinstance(receipt, dict) and receipt.get("engine") == "synthetic_fixture"
                 and receipt.get("command_executed") is False and receipt.get("network") == "none"
                 and receipt.get("operation_key") == expected["operation_key"]
                 and receipt.get("source_sha256") == expected["source_sha256"]
                 and receipt.get("verifier_sha256") == expected["verifier_sha256"]
                 and receipt.get("patch_sha256") == expected["patch"]["sha256"]
                 and type(receipt.get("exit_code")) is int
                 and receipt.get("stdout_sha256") == sha256(receipt.get("stdout", "").encode())
                 and receipt.get("stderr_sha256") == sha256(receipt.get("stderr", "").encode()))
        return {"valid": bool(valid), "passed": bool(valid and receipt.get("exit_code") == 0),
                "reason": "synthetic_fixture_verified" if valid else "invalid_synthetic_fixture",
                "evaluator": "code-mission-fixture-v1", "synthetic": True}
    valid = isinstance(receipt, dict) and all(receipt.get(k) == v for k, v in required_controls.items())
    valid = valid and type(receipt.get("exit_code")) is int and isinstance(receipt.get("stdout"), str) and isinstance(receipt.get("stderr"), str)
    valid = valid and receipt.get("stdout_sha256") == sha256(receipt.get("stdout", "").encode())
    valid = valid and receipt.get("stderr_sha256") == sha256(receipt.get("stderr", "").encode())
    valid = valid and receipt.get("argv_sha256") == sha256(json.dumps(expected["command"], separators=(",", ":")).encode())
    valid = valid and receipt.get("timed_out_or_output_capped") is False
    cleanup = receipt.get("timeout_cleanup")
    valid = valid and isinstance(cleanup, dict) and cleanup.get("verified_absent") is True
    return {"valid": bool(valid), "passed": bool(valid and receipt.get("exit_code") == 0),
            "reason": "verified" if valid and receipt.get("exit_code") == 0 else "invalid_or_failed_isolated_execution",
            "evaluator": "code-mission-receipt-v1"}


def verify_code_task_output(output: str, task: dict) -> dict:
    """Check sandbox provenance and compare returned values to host-only cases."""
    try:
        payload = json.loads(output, object_pairs_hook=_unique_object, parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
        manifest = task["input"]["manifest"]
        validated = validate_manifest(manifest)
        patch = next(p for p in validated["patches"] if p["id"] == task["input"]["patch_id"])
        operation_key = task["input"]["operation_key"]
        receipt = payload["receipt"]
        expected = {**validated, "patch": patch, "operation_key": operation_key,
                    "synthetic": receipt.get("engine") == "synthetic_fixture"}
        execution = verify_execution_receipt(receipt, expected)
        raw_results = json.loads(receipt.get("stdout", ""), object_pairs_hook=_unique_object,
                                 parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
        if (set(payload) not in ({"receipt"}, {"receipt", "synthetic"})
                or ("synthetic" in payload and type(payload["synthetic"]) is not bool)
                or set(raw_results) != {"results"} or not isinstance(raw_results["results"], list)):
            raise ValueError("malformed trusted wrapper output")
        if payload.get("synthetic", False) != (receipt.get("engine") == "synthetic_fixture"):
            raise ValueError("synthetic/production receipt label mismatch")
        expected_cases = validated["expected_cases"]
        results = raw_results["results"]
        cases_pass = len(results) == len(expected_cases)
        if cases_pass:
            for got, want in zip(results, expected_cases):
                if (not isinstance(got, dict) or set(got) != {"id", "value"} or got["id"] != want["id"]
                        or type(got["value"]) is not type(want["expected"]) or got["value"] != want["expected"]):
                    cases_pass = False
                    break
        valid = execution["valid"] and receipt.get("exit_code") == 0
        passed = valid and cases_pass
        return {"valid": bool(valid), "passed": bool(passed), "quality": int(bool(passed)),
                "unsupported": 0, "reason": "objective_cases_passed" if passed else "isolated_case_mismatch_or_invalid_receipt",
                "evaluator": "json-function-v1", "suite_sha256": validated["suite_sha256"],
                "cases_checked": len(expected_cases), "synthetic": receipt.get("engine") == "synthetic_fixture"}
    except (KeyError, TypeError, ValueError, StopIteration, MissionValidationError, json.JSONDecodeError):
        return {"valid": False, "passed": False, "quality": 0, "unsupported": 1,
                "reason": "malformed_or_nonreproducible_code_evidence", "evaluator": "json-function-v1"}


def _unique_object(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError("duplicate JSON object key")
        obj[key] = value
    return obj


def extract_clean_snapshot(validated: dict, destination: Path) -> None:
    """Build a secret-free worker tree from explicitly listed pinned files."""
    destination.mkdir(parents=True, exist_ok=False)
    selected = set(validated["worker_files"])
    seen = set()
    with tarfile.open(fileobj=io.BytesIO(validated["archive"]), mode="r:") as archive:
        for member in archive.getmembers():
            name = _safe_rel(member.name, "archive entry")
            if name not in selected:
                continue
            if not member.isfile():
                raise MissionValidationError("worker mount may contain only regular files")
            target = destination.joinpath(*PurePosixPath(name).parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            source = archive.extractfile(member)
            if source is None:
                raise MissionValidationError("source archive entry is unreadable")
            data = source.read()
            target.write_bytes(data)
            target.chmod(0o644)
            seen.add(name)
    if seen != selected:
        raise MissionValidationError("worker source snapshot is missing a pinned file")
