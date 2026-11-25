"""Single dispatch gate for real local-model requests.

``OllamaAdapter.generate`` is the only place HIVE issues a model request. It
calls ``begin`` (ContextPolicy.preflight, fail-closed -> DispatchBlocked) before
the request and ``finish`` (UsageLedger record + budget charge) after it.
Replay and cached paths never reach the adapter, so they never touch this gate.
The policy and ledger load lazily on the first real dispatch.
"""
from __future__ import annotations

import contextlib
import contextvars
import time
import uuid
from pathlib import Path

from .context_policy import POLICY_PATH, ContextPolicy, DispatchBlocked
from .model_route import shadow_route
from .roles import RoleRegistry
from .usage_ledger import UsageLedger, UsageRecord

LEDGER_NAME = "usage-ledger.jsonl"
ROLES_PATH = Path(__file__).resolve().parents[2] / "configs" / "roles.yaml"
DISPATCH_TOOL = "model_dispatch"
# Dispatch has no workspace path; the role's tool grant is the control, so check against the governing config path.
DISPATCH_PATH = "configs/agent_context_policy.yaml"


def _policy_path() -> Path:
    if POLICY_PATH.exists():
        return POLICY_PATH
    return Path(__file__).resolve().parents[2] / POLICY_PATH


def estimate_tokens(text: str) -> int:
    return len(text.encode("utf-8")) // 4 + 1  # same heuristic as cli preflight


class DispatchGate:
    def __init__(self, store_root, policy_path=None, run_id=None, roles=None):
        self.store_root = Path(store_root)
        self._roles = roles  # RoleRegistry; loaded lazily from configs/roles.yaml when None
        self.policy_path = Path(policy_path) if policy_path else None
        self.run_id = run_id or "run-" + uuid.uuid4().hex[:12]
        self._policy = self._ledger = None

    def _ensure(self):
        if self._policy is None:
            self._policy = ContextPolicy(self.policy_path or _policy_path(), self.store_root)
            self._ledger = UsageLedger(self.store_root / LEDGER_NAME, self._policy.pricing)
        return self._policy, self._ledger

    def _model_name(self, policy, model, endpoint):
        if model in policy.models:
            return model
        spec = policy.model_for_endpoint(endpoint)
        return spec.name if spec else model  # unknown name -> preflight blocks it

    def _check_role(self, role, task_id):
        try:
            if self._roles is None:
                self._roles = RoleRegistry.load(ROLES_PATH)
            allowed, reason = self._roles.check(role, DISPATCH_TOOL, DISPATCH_PATH)
        except Exception as exc:  # unreadable/invalid role config: fail closed
            raise DispatchBlocked(f"role check unavailable for {task_id}: {type(exc).__name__}: {exc}") from exc
        if not allowed:
            raise DispatchBlocked(f"role {role!r} may not dispatch a model for {task_id}: {reason}")

    def begin(self, *, task_id, model, endpoint, prompt, max_tokens, role="builder"):
        """Gate a real dispatch (``_begin``), then log what MODEL_ROUTE would have chosen (shadow: never alters it)."""
        try:
            ticket = self._begin(task_id=task_id, model=model, endpoint=endpoint, prompt=prompt,
                                 max_tokens=max_tokens, role=role)
        except DispatchBlocked as exc:
            self._shadow(task_id, model, prompt, blocked=str(exc))
            raise
        ticket["route_shadow"] = self._shadow(task_id, ticket["model"], prompt, reservation_id=ticket["reservation_id"])
        return ticket

    def _shadow(self, task_id, requested, prompt, **kw):
        try:
            policy, _ = self._ensure()
            return shadow_route(policy=policy, store_root=self.store_root, run_id=self.run_id, task_id=task_id,
                                requested=requested, prompt=prompt, est_in=estimate_tokens(prompt), **kw)
        except Exception:  # shadow routing must never affect dispatch
            return None

    def _begin(self, *, task_id, model, endpoint, prompt, max_tokens, role="builder"):
        """Role-check, then atomically (ledger lock) re-sync budget from the shared ledger, preflight and reserve.

        Budget is cumulative across processes: spend and unsettled reservations of every writer are replayed
        into the policy under the cross-process lock, so two simultaneous dispatchers cannot both pass a
        ceiling only one fits under. Lock failure fails closed. Raises DispatchBlocked; returns a ticket.
        """
        self._check_role(role, task_id)
        try:
            policy, ledger = self._ensure()
            name = self._model_name(policy, model, endpoint)
            est_in = estimate_tokens(prompt)
            estimated = policy.models[name].cost_usd(est_in, max_tokens) if name in policy.models else None
            # Reserve an upper bound priced with the ledger's own table: UTF-8 bytes >= BPE tokens, plus chat-template
            # margin, plus the full output cap. Actual settled spend can then never exceed what was reserved.
            bound = 0.0 if name not in ledger.pricing else ledger.cost_usd(UsageRecord(run_id=self.run_id, parent_run_id=None, task_id=task_id, model=name,
                                                fresh_input_tokens=len(prompt.encode("utf-8")) + PROMPT_TOKEN_MARGIN,
                                                cached_read_tokens=0, cache_write_tokens=0, output_tokens=int(max_tokens),
                                                wall_seconds=0.0, measured=False, source="reservation_bound"))
            if estimated is not None or bound:
                estimated = max(estimated or 0.0, bound)
            with ledger.locked():
                policy.reset_budget_state()
                if name in policy.models:
                    totals = ledger.totals()
                    spent = totals["usd_measured"] + totals["usd_estimated"] + ledger.outstanding_reserved_usd()
                    if spent or totals["output_tokens"] or totals["fresh_input_tokens"]:
                        policy.record_usage(model_name=name, input_tokens=totals["fresh_input_tokens"],
                                            output_tokens=totals["output_tokens"],
                                            cached_input_tokens=totals["cached_read_tokens"], cost_usd=spent, requests=0)
                gate = policy.preflight(task_id=task_id, model_name=name, requested_tokens=est_in,
                                        estimated_cost_usd=estimated)
                if not gate["eligible"]:
                    raise DispatchBlocked(f"preflight gate blocked dispatch for {task_id}: " + "; ".join(gate["reasons"]))
                rid = ledger.reserve(self.run_id, task_id, name, estimated or 0.0)
        except (OSError, TimeoutError, ValueError) as exc:  # ledger lock/IO unavailable or torn/corrupt: never dispatch unaccounted
            raise DispatchBlocked(f"usage ledger unavailable for {task_id}: {type(exc).__name__}: {exc}") from exc
        return {"task_id": task_id, "model": name, "est_in": est_in, "start": time.monotonic(), "reservation_id": rid}

    def abort(self, ticket):
        """The request never left the process: void its reservation."""
        self._ensure()[1].release(ticket["reservation_id"])

    def finish(self, ticket, response):
        """Record usage after a completed call. Measured iff Ollama reported both counts."""
        policy, ledger = self._ensure()
        out, prompt = response.get("eval_count"), response.get("prompt_eval_count")
        measured = type(prompt) is int and prompt >= 0 and type(out) is int and out >= 0
        fresh = prompt if measured else ticket["est_in"]
        out = out if type(out) is int and out >= 0 else 0
        rec = UsageRecord(run_id=self.run_id, parent_run_id=None, task_id=ticket["task_id"], model=ticket["model"],
                          fresh_input_tokens=fresh, cached_read_tokens=0, cache_write_tokens=0, output_tokens=out,
                          wall_seconds=time.monotonic() - ticket["start"], measured=measured,
                          source="ollama_response" if measured else "estimate")
        ledger.record(rec, reservation_id=ticket.get("reservation_id"))
        policy.record_usage(model_name=ticket["model"], input_tokens=fresh, output_tokens=out,
                            cost_usd=ledger.cost_usd(rec))


PROMPT_TOKEN_MARGIN = 256  # ponytail: fixed chat-template allowance; measure per model if templates grow


_ACTIVE: contextvars.ContextVar = contextvars.ContextVar("hive_dispatch_gate", default=None)


def active_gate():
    return _ACTIVE.get()


@contextlib.contextmanager
def use_gate(gate):
    """Scope a gate to the dispatches made inside the block (no signature change for execute())."""
    token = _ACTIVE.set(gate)
    try:
        yield gate
    finally:
        _ACTIVE.reset(token)
