"""Focused tests for the task runtime and adapter contracts.

Run with: python -m unittest tools.hive_engine.test_runtime
"""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from . import adapters, checker, runtime


GOOD = b"1\n00:00:00,100 --> 00:00:01,000\nhello\n"


class FakeAdapter:
    def __init__(self, name, output=None, permissions=None, health="ready"):
        self.name = name
        self.output = output if output is not None else {"valid": True, "adapter": name}
        self.permissions = permissions if permissions is not None else ["read-fixture"]
        self.status = health
        self.calls = []

    def manifest(self):
        return {
            "capability_id": self.name,
            "kind": "test-adapter",
            "version": "test-1",
            "adapter": "test",
            "supported_tasks": ["caption-validation"],
            "permissions": list(self.permissions),
            "requirements": {"wall_seconds": 1, "input_bytes": 1024, "concurrency": 1},
            "constraints": {},
            "safe": True,
            "effects": "read-only",
            "health": "unknown",
            "provenance": {"test": True},
        }

    def health(self):
        return self.status

    def execute(self, data, timeout):
        self.calls.append((data, timeout))
        return {"output": dict(self.output), "error": None,
                "wall_seconds": 0.001, "resources": {}}


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.inputs = self.root / "input"
        self.inputs.mkdir()
        self.source = self.inputs / "sample.srt"
        self.source.write_bytes(GOOD)

    def task(self, **changes):
        return runtime.task_for(self.source) | changes

    def make_runtime(self, registry=None, state=None):
        if registry is not None:
            registered = set(registry.adapters)
            allowed = set(runtime.BASELINE.get("allowed", []))
            if allowed - registered:
                name = "rules" if "rules" in registered else next(iter(registry.adapters))
                baseline_patch = patch.object(runtime, "BASELINE", runtime.policy_for(name))
                baseline_patch.start()
                self.addCleanup(baseline_patch.stop)
        return runtime.Runtime(state or self.root / "state", registry=registry)

    def test_active_policy_routes_and_dispatches_selected_adapter(self):
        slow = FakeAdapter("slow", {"valid": False, "adapter": "slow"})
        winner = FakeAdapter("winner", {"valid": True, "adapter": "winner"})
        original = runtime.BASELINE
        runtime.BASELINE = {
            "policy_id": "test-route-v1",
            "allowed": ["slow", "winner"],
            "estimates": {
                "slow": {"p": 0.1, "cost": 0, "latency": 0, "risk": 0},
                "winner": {"p": 1, "cost": 0, "latency": 0, "risk": 0},
            },
            "weights": dict(runtime.WEIGHTS),
        }
        self.addCleanup(setattr, runtime, "BASELINE", original)
        app = self.make_runtime(adapters.Registry([slow, winner]))
        self.addCleanup(app.close)

        episode = app.run(self.task(), self.inputs)

        self.assertEqual("winner", episode["config_id"])
        self.assertTrue(episode["passed"])
        self.assertEqual([], slow.calls)
        self.assertEqual(1, len(winner.calls))
        self.assertEqual(GOOD, winner.calls[0][0])
        route_event = app.store.records("RuntimeRoute")[-1]
        self.assertEqual("winner", route_event["decision"]["selected"])
        self.assertEqual("active", route_event["mode"])

    def test_rejects_path_escape_and_changed_input_hash(self):
        adapter = FakeAdapter("rules")
        app = self.make_runtime(adapters.Registry([adapter]))
        self.addCleanup(app.close)

        escaped = app.run(self.task(input_ref="../outside.srt"), self.inputs)
        self.assertEqual("ValueError", escaped["errors"][0])
        self.assertEqual([], adapter.calls)

        task = self.task()
        self.source.write_bytes(GOOD + b"changed")
        changed = app.run(task, self.inputs)
        self.assertEqual("ValueError", changed["errors"][0])
        self.assertEqual([], adapter.calls)

    def test_permissions_and_budgets_fail_closed(self):
        adapter = FakeAdapter("rules")
        app = self.make_runtime(adapters.Registry([adapter]))
        self.addCleanup(app.close)

        denied = app.run(self.task(permissions=[]), self.inputs)
        self.assertEqual("ineligible", denied["errors"][0])
        self.assertEqual([], adapter.calls)

        with self.assertRaisesRegex(ValueError, "unsupported budget"):
            app.run(self.task(resource_budget={"wall_seconds": 61,
                                               "input_bytes": 1024,
                                               "concurrency": 1}), self.inputs)
        self.assertEqual([], adapter.calls)
        self.assertTrue(app.store.records("RuntimeRejection"))

        too_small = app.run(self.task(resource_budget={"wall_seconds": 3,
                                                       "input_bytes": 1,
                                                       "concurrency": 1}), self.inputs)
        self.assertEqual("ineligible", too_small["errors"][0])
        self.assertEqual([], adapter.calls)

    def test_custom_adapter_contract_and_independent_checker(self):
        # The adapter claims the valid input is invalid. Runtime's checker must
        # retain the disagreement rather than trust the adapter's verdict.
        adapter = FakeAdapter("custom", {"valid": False, "adapter": "custom"})
        app = self.make_runtime(adapters.Registry([adapter]))
        self.addCleanup(app.close)
        episode = app.run(self.task(), self.inputs)

        self.assertEqual("custom", episode["config_id"])
        self.assertFalse(episode["passed"])
        self.assertTrue(episode["expected"])
        self.assertFalse(episode["actual"])
        # The input is independently invalid only if the oracle says so. Check
        # the real oracle separately to ensure this fixture exercises disagreement.
        self.assertTrue(checker.reference(GOOD))
        self.assertFalse(app.store.records("RuntimeVerification")[-1]["result"])
        self.assertEqual([GOOD], [call[0] for call in adapter.calls])

    def test_persistent_store_reopens_with_policy_and_episode(self):
        adapter = FakeAdapter("rules")
        state = self.root / "persistent"
        first = self.make_runtime(adapters.Registry([adapter]), state)
        first.run(self.task(), self.inputs)
        first.close()

        reopened = self.make_runtime(adapters.Registry([FakeAdapter("rules")]), state)
        self.addCleanup(reopened.close)
        self.assertEqual("fixed-rules", reopened.active_policy["policy_id"])
        self.assertEqual(1, len(reopened.store.records("RuntimeEpisode")))
        reopened.store.verify()

    def test_unenrolled_evaluation_policy_cannot_run_on_live_task(self):
        adapter = FakeAdapter("rules")
        app = self.make_runtime(adapters.Registry([adapter]))
        self.addCleanup(app.close)

        with self.assertRaisesRegex(ValueError, "evaluation"):
            app.run(self.task(split="live"), self.inputs,
                    evaluation_policy=runtime.policy_for("rules"))
        self.assertEqual([], adapter.calls)

    def test_unavailable_executable_is_not_healthy(self):
        missing = self.root / "missing-ffprobe.exe"
        adapter = adapters.CaptionAdapter("probe", executable=str(missing))
        self.assertEqual("unavailable", adapter.health())
        self.assertEqual("unknown", adapter.manifest()["health"])
        registry = adapters.Registry([adapter])
        self.assertEqual("unavailable", registry.snapshot()[0]["health"])

    def test_ollama_loopback_residency_and_transport_failures(self):
        model = adapters.OllamaAdapter("http://127.0.0.1:11434", "local-test:latest")

        class Response:
            def __init__(self, value):
                self.value = value

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self, _limit):
                return self.value

        class Opener:
            def __init__(self, value=None, error=None):
                self.value, self.error = value, error
                self.requests = []

            def open(self, request, timeout):
                self.requests.append((request, timeout))
                if self.error:
                    raise self.error
                return Response(self.value)

        resident = Opener(json.dumps({"models": [{"name": "local-test:latest"}]}).encode())
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=resident):
            self.assertEqual("ready", model.health())
        self.assertEqual("/api/ps", resident.requests[0][0].full_url.split(":11434", 1)[1])

        dispatched = {"output": {"valid": True}, "error": None,
                      "wall_seconds": 0, "resources": {}}
        resident_for_execute = Opener(json.dumps({"models": [{"model": "local-test:latest"}]}).encode())
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=resident_for_execute), \
             patch("tools.hive_engine.adapters.isolated", return_value=dispatched) as isolated:
            self.assertIs(dispatched, model.execute(GOOD, 1.25))
        descriptor, forwarded_data, forwarded_timeout = isolated.call_args.args
        self.assertEqual("ollama", descriptor["kind"])
        self.assertEqual("local-test:latest", descriptor["model"])
        self.assertEqual(GOOD, forwarded_data)
        self.assertEqual(1.25, forwarded_timeout)

        absent = Opener(b'{"models": []}')
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=absent):
            self.assertEqual("unavailable", model.health())
        absent_for_execute = Opener(b'{"models": []}')
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=absent_for_execute), \
             patch("tools.hive_engine.adapters.isolated") as isolated:
            outcome = model.execute(GOOD, 1.25)
        self.assertEqual("model-not-resident", outcome["error"])
        isolated.assert_not_called()

        malformed = Opener(b"not-json")
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=malformed):
            with self.assertRaises(json.JSONDecodeError):
                model.health()
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=Opener(b"not-json")):
            self.assertEqual("unavailable", adapters.Registry([model]).snapshot()[0]["health"])

        timed_out = Opener(error=TimeoutError("mock timeout"))
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=timed_out):
            with self.assertRaises(TimeoutError):
                model.health()
        with patch("tools.hive_engine.adapters.urllib.request.build_opener", return_value=Opener(error=TimeoutError())):
            self.assertEqual("unavailable", adapters.Registry([model]).snapshot()[0]["health"])

    def test_actual_isolated_worker_runs_rules_adapter(self):
        adapter = adapters.CaptionAdapter("rules")
        outcome = adapter.execute(GOOD, timeout=5)

        self.assertIsNone(outcome["error"])
        self.assertEqual(0, outcome["returncode"])
        self.assertTrue(outcome["output"]["valid"])
        self.assertTrue(checker.reference(GOOD))
        self.assertGreater(outcome["wall_seconds"], 0)


if __name__ == "__main__":
    unittest.main()
