"""Matched decision-only negative controls, with real v4 rejection dispatches.

Model availability is an explicit test adapter that cannot perform inference.
No model answer/quality is simulated; these are engineering decisions only.
"""
import argparse
import copy
import json
from pathlib import Path
import sys
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
import hive.orchestrator as runtime
from hive.learning_policy import Policy
from hive.task_spec import _task


class NoInference:
    def generate(self, *args, **kwargs):
        raise AssertionError('This comparison must never dispatch model inference')


CASES = ('available', 'permission_missing', 'tool_scope_missing', 'tool_unavailable',
         'explicit_model', 'verifier_unavailable', 'false_verifier', 'no_routes',
         'budget_exhausted', 'model_required')


def task_for(case):
    task = _task('development', 'math', 1, 20261121)
    task['source_group'] = 'synthetic-negative-control-' + case
    if case == 'permission_missing':
        task['permissions'] = {'version': 1, 'routes': ['local_direct']}
    elif case == 'tool_scope_missing':
        task['allowed_tools'] = task['input']['allowed_tools'] = []
        task['tool_schemas'] = task['input']['tool_schemas'] = {}
    elif case == 'no_routes':
        task['permissions'] = {'version': 1, 'routes': []}
    elif case == 'model_required':
        task = {'id': 'synthetic-model-required', 'category': 'text_classification',
                'split': 'development', 'prompt': 'Classify the synthetic example.',
                'input': {'items': [{'id': 'x', 'text': 'example'}], 'labels': {'a': 'A', 'b': 'B'}},
                'expected': {'labels': {'x': 'a'}}, 'critical': False,
                'evaluator': 'independent_labels_v1', 'allowed_tools': [], 'tool_schemas': {},
                'permissions': {'version': 1, 'routes': ['local_direct']},
                'source_group': 'synthetic-model-required'}
    return task


def run(work, output):
    if work.exists() or output.exists():
        raise ValueError('Use a new output/store; previous receipts must be preserved')
    work.mkdir(parents=True)
    # This fixture budget permits a route decision, never a live request.
    config = dict(runtime.DEFAULT_CONFIG, routes=['tool', 'local_direct'],
                  max_requests=1, max_total_tokens=128, max_cycles=1,
                  max_retries=0, max_wall_s=30, allow_fixtures=True, adapter=NoInference())
    rows = []
    original_verify = runtime.verify
    arms = {'strongest_exact': (3, True, True), 'frozen_p2_v3': (3, True, False),
            'candidate_p2_v4': (4, True, False), 'candidate_memory_off': (4, False, False)}
    for case in CASES:
        task = task_for(case)
        for name, (version, memory, exact_control) in arms.items():
            ex = runtime.Executor(work / case / name, config)
            policy = Policy(version=version, **({'memory_enabled': memory} if version == 4 else {}))
            requested = 'tool' if exact_control else ('local_direct' if case == 'explicit_model' else None)
            if case == 'budget_exhausted':
                ex.store.set('budget', {'requests': 0, 'tokens_reserved': 0,
                                       'tokens_actual': 0, 'wall_s': 30.0, 'cycles': 0})
            original_checks = ex._route_checks

            def checks(*args, **kwargs):
                values = original_checks(*args, **kwargs)
                if case == 'tool_unavailable':
                    values['tool'] = 'synthetic exact-tool outage'
                return values

            def verify(*args, **kwargs):
                if case == 'verifier_unavailable':
                    raise RuntimeError('synthetic verifier outage')
                if case == 'false_verifier':
                    return {'valid': True, 'passed': True, 'quality': 1}
                return original_verify(*args, **kwargs)

            before = copy.deepcopy(ex._budget())
            try:
                with patch.object(ex, '_route_checks', side_effect=checks), patch.object(runtime, 'verify', side_effect=verify):
                    decision = ex._decision(task, requested, policy)
                    actual_dispatch = None
                    # Exercise the real rejection path; the wall-budget case
                    # stops at the earlier global barrier and is decision-only.
                    if version == 4 and decision['selected'] is None and case != 'budget_exhausted':
                        ex.store.set('governing_policy', policy.snapshot())
                        job = ex.store.enqueue({'task': task, 'route': requested,
                                               'learn_feedback': False, 'allow_retry': False})
                        ex.loop(1)
                        saved = ex.store.get_job(job)
                        assert saved['state'] == 'BLOCKED' and saved['result']['failure_category'] == 'GOVERNANCE'
                        actual_dispatch = {'job_id': job, 'state': saved['state'],
                                           'decision_ref': saved['result']['decision_ref']}
                after = ex._budget()
                assert before == after, 'decision/abstention unexpectedly charged execution'
                if version == 4 and task['category'] == 'math':
                    assert decision['selected'] in ('tool', None)
                rows.append({'case': case, 'arm': name, 'task_hash': runtime.config_hash(task),
                             'input_hash': runtime.config_hash(task['input']), 'decision': decision,
                             'budget_before': before, 'budget_after': after,
                             'executed_rejection': actual_dispatch})
            finally:
                ex.close()
    report = {'scope': 'synthetic decision/abstention engineering; no model-output quality comparison',
              'runtime': runtime.code_version(), 'cases': len(CASES), 'arms': list(arms),
              'input_pairing': 'Identical task bytes and resource caps across each case; route preference is the arm intervention',
              'availability': 'Explicit non-inference test adapter; tool/verifier outages are injected',
              'decisions': len(rows), 'rejection_dispatches': sum(r['executed_rejection'] is not None for r in rows),
              'actual_model_calls': 0, 'task_output_quality_measured': False,
              'controller_seconds': None, 'controller_time_status': 'unmeasured',
              'model_team_arms': 'BLOCKED: no new finite inference allocation',
              'decision': 'QUARANTINE', 'promotion_authorized': False, 'rows': rows}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, sort_keys=True, indent=2) + '\n', encoding='utf-8')
    return {key: report[key] for key in ('cases', 'decisions', 'rejection_dispatches', 'actual_model_calls', 'decision')}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(run(args.work.resolve(), args.output.resolve()), indent=2))
