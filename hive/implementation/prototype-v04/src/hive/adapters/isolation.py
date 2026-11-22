"""Fail-closed execution boundary for repository test missions.

Production execution is Docker-only. This module deliberately has no host
subprocess fallback for repository commands.
"""
from __future__ import annotations

import hashlib
import json
import uuid
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path


class SandboxUnavailable(RuntimeError):
    """The requested isolated execution controls could not be proved."""


class StopRequested(RuntimeError):
    """Operator STOP interrupted the isolated command."""


@dataclass(frozen=True)
class IsolationResult:
    state: str
    receipt: dict


def _digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _bounded_process(argv: list[str], *, timeout_s: int, output_limit: int, stop_check=None) -> tuple[int, bytes, bytes, bool, bool]:
    """Capture bounded output and terminate on timeout or output overflow."""
    proc = subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output = {"out": bytearray(), "err": bytearray()}
    overflow = threading.Event()

    def drain(stream, key):
        while True:
            chunk = stream.read(65536)
            if not chunk:
                return
            room = output_limit - len(output[key])
            if room > 0:
                output[key].extend(chunk[:room])
            if len(chunk) > room:
                overflow.set()
                try:
                    proc.kill()
                except OSError:
                    pass

    threads = [threading.Thread(target=drain, args=(proc.stdout, "out"), daemon=True),
               threading.Thread(target=drain, args=(proc.stderr, "err"), daemon=True)]
    for thread in threads:
        thread.start()
    timed_out = False
    stopped = False
    deadline = time.monotonic() + timeout_s
    try:
        while proc.poll() is None:
            if stop_check is not None and stop_check():
                stopped = True
                proc.kill()
                break
            if time.monotonic() >= deadline:
                timed_out = True
                proc.kill()
                break
            time.sleep(0.05)
        proc.wait()
    except OSError:
        proc.kill()
        proc.wait()
        raise
    for thread in threads:
        thread.join(timeout=2)
    return proc.returncode, bytes(output["out"]), bytes(output["err"]), timed_out or overflow.is_set() or stopped, stopped


class DockerIsolation:
    """Run a pinned command in a digest-pinned, networkless Docker image."""
    def __init__(self, docker_executable: str | None = None):
        self.docker = docker_executable or shutil.which("docker")

    def inspect(self, image: dict) -> dict:
        if not self.docker:
            raise SandboxUnavailable("BLOCKED_SANDBOX: Docker CLI is unavailable")
        reference, digest = image.get("reference"), image.get("digest")
        if (not isinstance(reference, str) or not reference or not isinstance(digest, str)
                or not digest.startswith("sha256:") or len(digest) != 71):
            raise SandboxUnavailable("BLOCKED_SANDBOX: image reference and sha256 digest are required")
        try:
            version = subprocess.run([self.docker, "info", "--format", "{{.ServerVersion}}"],
                                     stdin=subprocess.DEVNULL, capture_output=True, text=True,
                                     timeout=5, check=True).stdout.strip()
            inspect = subprocess.run([self.docker, "image", "inspect", reference,
                                      "--format", "{{json .RepoDigests}}"],
                                     stdin=subprocess.DEVNULL, capture_output=True, text=True,
                                     timeout=5, check=True).stdout.strip()
            digests = json.loads(inspect)
        except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as exc:
            raise SandboxUnavailable(f"BLOCKED_SANDBOX: Docker daemon/image verification failed ({type(exc).__name__})") from exc
        if not version or not isinstance(digests, list) or not any(item.endswith("@" + digest) for item in digests):
            raise SandboxUnavailable("BLOCKED_SANDBOX: daemon or exact image digest could not be verified")
        return {"engine": "docker", "server_version": version, "image_reference": reference,
                "image_digest": digest, "network": "none", "read_only_root": True,
                "source_mount": "read_only", "capabilities": "drop_all", "no_new_privileges": True}

    def execute(self, request: dict) -> IsolationResult:
        repo = Path(request["repo_copy"]).resolve(strict=True)
        controls = self.inspect(request["image"])
        limits = request["limits"]
        command = request["command"]
        if not isinstance(command, list) or not command or not all(isinstance(v, str) and v and "\x00" not in v for v in command):
            raise ValueError("verifier command must be a nonempty argv list")
        # Pin invocation to the exact digest. Never pull or fall back to a host command.
        image = request["image"]["reference"].split("@", 1)[0] + "@" + request["image"]["digest"]
        container_name = "hive-code-" + uuid.uuid4().hex
        argv = [self.docker, "run", "--pull=never", "--rm", "--name", container_name, "--network=none", "--read-only",
                "--cap-drop=ALL", "--security-opt=no-new-privileges", "--user=1000:1000",
                f"--memory={limits['memory_mb']}m", f"--cpus={limits['cpu_count']}",
                f"--pids-limit={limits['pids']}", "--tmpfs=/tmp:rw,noexec,nosuid,size=16m",
                "--mount", f"type=bind,src={repo},dst=/work,readonly", "--workdir=/work",
                # The watchdog lives inside the container, so killing the HIVE
                # host process cannot leave candidate code running indefinitely.
                image, "timeout", "--signal=KILL", f"{int(limits['timeout_s'])}s", *command]
        started = time.monotonic()
        code, stdout, stderr, bounded, stopped = _bounded_process(argv, timeout_s=limits["timeout_s"],
                                                                  output_limit=limits["output_bytes"],
                                                                  stop_check=request.get("stop_check"))
        cleanup = {"attempted": False, "verified_absent": True}
        if bounded:
            cleanup["attempted"] = True
            try:
                subprocess.run([self.docker, "rm", "--force", container_name], stdin=subprocess.DEVNULL,
                               capture_output=True, timeout=10, check=False)
                check = subprocess.run([self.docker, "container", "inspect", container_name],
                                       stdin=subprocess.DEVNULL, capture_output=True, timeout=5, check=False)
                cleanup["verified_absent"] = check.returncode != 0
            except (OSError, subprocess.SubprocessError):
                cleanup["verified_absent"] = False
            if not cleanup["verified_absent"]:
                raise SandboxUnavailable("BLOCKED_SANDBOX: timed out container cleanup could not be verified")
        receipt = {**controls, "argv_sha256": _digest(json.dumps(command, separators=(",", ":")).encode()),
                   "container_name": container_name, "in_container_watchdog": "coreutils-timeout-KILL",
                   "exit_code": code, "timed_out_or_output_capped": bounded,
                   "stopped": stopped,
                   "timeout_cleanup": cleanup,
                   "duration_s": round(time.monotonic() - started, 6),
                   "stdout_sha256": _digest(stdout), "stderr_sha256": _digest(stderr),
                   "stdout": stdout.decode("utf-8", errors="replace"),
                   "stderr": stderr.decode("utf-8", errors="replace")}
        return IsolationResult("passed" if code == 0 and not bounded else "failed", receipt)


class FixtureIsolation:
    """Explicit synthetic adapter; never executes repository code or commands."""
    synthetic = True

    def execute(self, request: dict) -> IsolationResult:
        fixture = request.get("fixture_result")
        if not isinstance(fixture, dict) or fixture.get("synthetic") is not True:
            raise ValueError("fixture mode requires an explicit synthetic result")
        stdout = json.dumps({"results": fixture.get("results", [])}, separators=(",", ":"), ensure_ascii=False)
        stderr = str(fixture.get("stderr", ""))
        receipt = {"engine": "synthetic_fixture", "network": "none", "source_mount": "not_mounted",
                   "image_digest": None, "command_executed": False,
                   "fixture_id": fixture.get("id"), "exit_code": fixture.get("exit_code"),
                   "stdout": stdout, "stderr": stderr,
                   "stdout_sha256": _digest(stdout.encode()),
                   "stderr_sha256": _digest(stderr.encode())}
        return IsolationResult("passed" if fixture.get("exit_code") == 0 else "failed", receipt)
