"""Resolve inline-review concerns with bounded zero-model-call source probes."""
import copy
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / 'src'))
from hive import orchestrator as runtime
from hive.contracts import feedback_partition_key
from hive.learning_policy import Policy
from hive.task_spec import _task


class NoInferenceAdapter:
    def generate(self, *args, **kwargs):
        raise AssertionError('This review must not dispatch a model')


work = ROOT / '.hive/grok-disposition'
work.mkdir(exist_ok=False)
rows = []
classification = {'id': 'grok-disposition-labels', 'category': 'text_classification', 'split': 'development',
    'prompt': 'Classify the synthetic example.',
    'input': {'items': [{'id': 'x', 'text': 'example'}], 'labels': {'a': 'A', 'b': 'B'}},
    'expected': {'labels': {'x': 'a'}}, 'critical': False,
    'evaluator': 'independent_labels_v1', 'allowed_tools': [], 'tool_schemas': {},
    'permissions': {'version': 1, 'routes': ['local_direct']}}
for index, routes in enumerate((['local_direct', 'tool'], ['local_direct'], ['tool', 'local_direct'])):
    executor = runtime.Executor(work / f'identity-{index}', {**runtime.DEFAULT_CONFIG,
        'routes': routes, 'allow_fixtures': True, 'adapter': NoInferenceAdapter(), 'max_tokens': 16})
    try:
        before = copy.deepcopy(executor._budget())
        decision = executor._decision(classification, None, Policy(version=4))
        receipt = decision['receipt']
        assert decision['selected'] == 'local_direct'
        assert receipt['model_identity'] == executor._candidate_model_identity
        expected = feedback_partition_key(receipt['task_contract'], 'local_direct',
            model_identity=receipt['model_identity'], runtime_source_hash=runtime.code_version()['source_sha256'])
        assert receipt['partition_keys']['local_direct'] == expected
        assert executor._budget() == before
        rows.append({'case': f'identity-{index}', 'configured_routes': routes,
            'selected': decision['selected'], 'receipt_model_identity': receipt['model_identity'],
            'partition_recomputed': True, 'budget_unchanged': True, 'dispatches': 0})
    finally:
        executor.close()

original_execute = runtime.execute
for case, value in [('missing', None), ('negative', -1), ('noninteger', 1.5)]:
    task = _task('development', 'math', 1, 20261121)
    executor = runtime.Executor(work / f'tokens-{case}', {**runtime.DEFAULT_CONFIG,
        'routes': ['tool'], 'max_requests': 0, 'max_retries': 0, 'max_tokens': 16})
    try:
        executor.store.set('governing_policy', Policy(version=4).snapshot())
        executor.store.set('policy', Policy(version=4).snapshot())
        result = original_execute(task, 'tool', executor.config)
        if case == 'missing':
            result.pop('tokens')
        else:
            result['tokens'] = value
        runtime.execute = lambda *args, **kwargs: copy.deepcopy(result)
        job = executor.enqueue(task, route='tool')
        outcome = executor.run_one(job)
        assert outcome['passed'] is False
        feedback = executor.store.read_artifact(executor.store.get('feedback:' + job))
        assert feedback['valid'] is False and feedback['feedback_eligible'] is False
        assert executor.store.get('policy')['partitions'] == {}
        assert executor._budget()['requests'] == 0
        rows.append({'case': 'tokens-' + case, 'passed': outcome['passed'],
            'valid': feedback['valid'], 'feedback_eligible': feedback['feedback_eligible'],
            'candidate_partitions': {}, 'normalized_actual_tokens': feedback['charged_cost']['actual_tokens'],
            'model_calls': 0})
    finally:
        runtime.execute = original_execute
        executor.close()

report = {'status': 'passed', 'runtime': runtime.code_version(), 'hive_model_calls': 0,
    'scope': 'Three real governor decisions and three injected malformed tool-result cases; no model output or quality comparison.',
    'cases': rows}
Path(__file__).with_name('parent-probes.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': 'passed', 'cases': len(rows), 'hive_model_calls': 0}))
