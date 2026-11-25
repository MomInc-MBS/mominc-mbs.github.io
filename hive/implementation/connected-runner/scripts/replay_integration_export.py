"""Check exported historical integration evidence offline; never dispatch work."""
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from hive.adaptive_metrics import assess_candidate
from hive.learning_policy import Policy
from hive.metric_engine import utility
from hive.orchestrator import code_version, config_hash
from hive.verifier import verify


def main():
    report = json.loads((ROOT / 'experiments/results/integration-smoke/20261121-run/report.json').read_text('utf-8'))
    directory = ROOT / 'experiments/results/adaptation-demo/20261121-complete-receipts'
    receipt = json.loads((directory / 'verification.json').read_text('utf-8'))
    assert receipt['identity'] == report['identity']
    records = {}
    for ref, digest in receipt['artifact_sha256'].items():
        assert re.fullmatch(r'artifacts/[0-9a-f]{64}\.json', ref)
        payload = (directory / ref).read_bytes()
        assert hashlib.sha256(payload).hexdigest() == digest == Path(ref).stem
        records[ref] = json.loads(payload)
    evidence = {}
    for entry in report['execution_index']:
        value = records[entry['evidence_ref']]
        assert value['job_id'] == entry['job'] and value['task'] == entry['task']
        assert value['route'] == entry['route']
        assert value['build']['source_sha256'] == report['identity']['source_sha256']
        assert config_hash(value['config']) == value['config_hash']
        assert verify(value['task'], value['result']) == value['verification']
        verdict, result = value['verification'], value['result']
        assert utility(verdict['quality'], verdict['unsupported'], result['latency_s'], result['tokens']) == value['utility']
        decision = records[value['decision_ref']]
        assert decision == value['decision']
        assert decision['task_hash'] == config_hash(value['task'])
        assert decision['selected_route'] == value['route']
        assert decision['source_hash'] == report['identity']['source_sha256']
        assert decision['config_hash'] == report['identity']['config_hash']
        evidence[entry['job']] = value
    assert set(evidence) == set(report['jobs'])
    initial = records[report['initial_snapshot']]
    candidate = records[report['candidate_snapshot']]
    policy = Policy(state=initial['policy'])
    training_jobs = {entry['job'] for entry in report['training']}
    for ref in candidate['evidence']:
        value = records[ref]
        assert value['job_id'] in training_jobs and value['verification']['valid']
        assert value['task']['split'] == 'development'
        policy.observe(value['task']['category'], value['route'],
                       value['verification']['quality'], value['utility'])
    assert config_hash(policy.snapshot()) == candidate['policy_hash'] == report['candidate_hash']
    rows = {control: [] for control in ('incumbent', 'candidate', 'strongest_fixed', 'learning_disabled')}
    for decision in report['comparison_decisions']:
        value = evidence[decision['job']]
        assert value['task']['id'] == decision['task_id'] and value['route'] == decision['route']
        rows[decision['control']].append({
            'task_id': value['task']['id'], 'category': value['task']['category'],
            'critical': value['task']['critical'], 'valid': value['verification']['valid'],
            'passed': value['verification']['passed'], 'utility': value['utility'],
            'latency_s': value['result']['latency_s'], 'tokens': value['result']['tokens']})
    comparisons = {control: assess_candidate(rows[control], rows['candidate'])
                   for control in ('incumbent', 'strongest_fixed', 'learning_disabled')}
    assert comparisons == report['comparisons']
    expected = 'AWAITING_INDEPENDENT_APPROVAL' if all(row['accepted'] for row in comparisons.values()) else 'REJECTED'
    assert report['candidate_decision'] == expected
    local = [value for value in evidence.values() if value['route'].startswith('local_')]
    assert len(local) == report['budget']['requests']
    assert sum(value['result']['tokens'] for value in evidence.values()) == report['budget']['tokens_actual']
    model = next(row for row in report['training'] if row['route'].startswith('local_'))
    assert all(value['result']['model'] == model['model'] and value['result']['model_digest'] == model['digest'] for value in local)
    print(json.dumps({'status': 'passed', 'verified_jobs': len(evidence),
                      'verified_artifacts': len(records), 'candidate_reconstructed': True,
                      'candidate_decision': expected, 'new_model_calls': 0,
                      'historical_runtime_source_sha256': report['identity']['source_sha256'],
                      'replayer_runtime_source_sha256': code_version()['source_sha256'],
                      'scope': 'offline artifact consistency and verifier replay; no fresh inference or private store'}, indent=2))


if __name__ == '__main__':
    main()
