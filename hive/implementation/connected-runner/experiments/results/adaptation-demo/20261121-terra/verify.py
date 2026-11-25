"""Independent offline replay and fault checks, never dispatches execution."""
import hashlib
import json
import shutil
import sqlite3
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / 'src'))
from hive.orchestrator import code_version, config_hash
from hive.storage import Store
from hive.verifier import verify
from hive.learning_policy import Policy
from hive.integration import run_integration
import hive.orchestrator as orch

REPORT = ROOT / 'experiments/results/integration-smoke/20261121-run/report.json'
MANIFEST = ROOT / 'experiments/manifests/integration-20261121.json'
CONFIG = ROOT / 'configs/integration-20261121.json'
SOURCE = ROOT / '.hive/integration-20261121'
COPY = ROOT / '.hive/terra-integration-check'
OUT = Path(__file__).parent / 'verification.json'
assert not COPY.exists() and not OUT.exists(), 'preserve prior receipts'
COPY.mkdir(parents=True)
shutil.copytree(SOURCE / 'artifacts', COPY / 'artifacts')
src = sqlite3.connect(f'file:{(SOURCE / "hive.sqlite3").as_posix()}?mode=ro', uri=True)
dst = sqlite3.connect(COPY / 'hive.sqlite3')
src.backup(dst)
src.close(); dst.close()

report = json.loads(REPORT.read_text(encoding='utf-8'))
manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
inputs = json.loads((ROOT / 'experiments/manifests/integration-inputs-20261121.json').read_text(encoding='utf-8'))
labels = json.loads((ROOT / 'experiments/manifests/integration-labels-20261121.json').read_text(encoding='utf-8'))
build = code_version()
assert build['commit'] == '28239aba838fa7f6b2d04719ec75d629d1b14308'
assert build['source_sha256'] == 'c73866989d9c03253af8eb199b0c93509adbc50b92bcab7e0a29fde15db0d9d2'
assert config_hash(inputs) == labels['input_sha256']
assert config_hash(manifest) == report['identity']['manifest_hash']
directive = ROOT / 'docs/INTEGRATION_DIRECTIVE.md'
assert hashlib.sha256(directive.read_bytes()).hexdigest() == inputs['directive_sha256']
for item in inputs['items']:
    assert item['text'] in directive.read_text(encoding='utf-8')
for row in inputs['rows']:
    old = subprocess.check_output(['git', 'show', inputs['source_commit'] + ':' + row['id']], cwd=ROOT)
    assert len(old) == row['bytes'], row['id']
for key in ('directive-train', 'directive-compare'):
    task = manifest['tasks'][key]
    assert task['input']['labels'] == inputs['labels']
    for item in task['input']['items']:
        assert item in inputs['items'] and task['expected']['labels'][item['id']] == labels['labels'][item['id']]
assert 'd1' not in {i['id'] for k in ('directive-train','directive-compare') for i in manifest['tasks'][k]['input']['items']}
for key in ('inventory-train', 'inventory-compare', 'inventory-subsequent'):
    assert all(row in inputs['rows'] for row in manifest['tasks'][key]['input']['rows'])

s = Store(COPY)
budget_before = s.get('budget')
rows = []
for entry in report['execution_index']:
    job = s.get_job(entry['job']); evidence = s.read_artifact(entry['evidence_ref'])
    assert job['result']['evidence_ref'] == entry['evidence_ref']
    assert config_hash(job['spec']) == entry['spec_hash']
    assert evidence['job_id'] == job['id'] and evidence['task'] == entry['task']
    assert evidence['task'] == manifest['tasks'][evidence['task']['id']]
    assert evidence['build'] == build and evidence['route'] == entry['route']
    assert verify(evidence['task'], evidence['result']) == evidence['verification']
    decision = s.read_artifact(evidence['decision_ref'])
    assert decision['task_hash'] == config_hash(evidence['task']) and decision['selected_route'] == evidence['route']
    result = evidence['result']
    if evidence['route'] == 'local_direct':
        assert result['backend'] == 'ollama' and result['model'] == 'myr5-hold-local:latest'
        assert result['model_digest'] == 'a45646773d1ee8a6c1557c7de09a68e78a74f2990c4174a1408f65e777db150c'
        assert result['request']['model'] == result['model'] and result['raw_model_output'] is not None
        assert 'expected' not in json.loads(result['request']['messages'][1]['content'])
    else:
        assert result['backend'] == 'deterministic-tool' and result['model_digest'] == 'builtin-v1'
    rows.append({'job': job['id'], 'task': evidence['task']['id'], 'stage': job['spec']['hypothesis'],
                 'route': evidence['route'], 'pass': evidence['verification']['passed'],
                 'evidence': entry['evidence_ref'], 'input_hash': config_hash(evidence['task']['input']),
                 'output_hash': config_hash(result['output']), 'tokens': result['tokens']})
assert len(rows) == 11 and Counter(r['route'] for r in rows) == {'tool': 5, 'local_direct': 6}
assert sum(r['tokens'] for r in rows) == budget_before['tokens_actual'] == 147
assert budget_before['requests'] == 6 and budget_before['tokens_reserved'] == 768 and budget_before['cycles'] == 11
candidate = s.read_artifact(report['candidate_snapshot'])
initial = s.read_artifact(report['initial_snapshot'])
policy = Policy(state=initial['policy'])
for ref in candidate['evidence']:
    e = s.read_artifact(ref); v = e['verification']
    assert s.get('feedback:' + e['job_id']) == ref and v['valid'] and verify(e['task'], e['result']) == v
    policy.observe(e['task']['category'], e['route'], v['quality'], e['utility'])
assert config_hash(policy.snapshot()) == candidate['policy_hash'] == report['candidate_hash']
assert config_hash(s.get('governing_policy')) == report['governing_hash']
by = {(r['task'], r['stage'].split('/')[-1]): r for r in rows if '/comparison/' in r['stage']}
for control in ('incumbent', 'strongest_fixed', 'learning_disabled'):
    pairs = [(by[(t, control)], by[(t, 'candidate')]) for t in ('inventory-compare','directive-compare')]
    delta = sum(int(c['pass']) - int(b['pass']) for b,c in pairs) / len(pairs)
    assert delta == report['comparisons'][control]['quality_delta'] == -0.5
    assert pairs[0][0]['pass'] and not pairs[0][1]['pass']
    assert not pairs[1][0]['pass'] and not pairs[1][1]['pass']
    assert not report['comparisons'][control]['accepted']
assert report['candidate_decision'] == 'REJECTED' and report['subsequent'][0]['passed']
s.close()

# Fail closed even if a regression accidentally attempts dispatch during replay.
def no_dispatch(*args, **kwargs):
    raise AssertionError('dispatch forbidden during independent review')
orch.execute = no_dispatch
replay = run_integration(COPY, MANIFEST, CONFIG)
assert replay['replayed'] and replay['additional_model_calls'] == 0
s = Store(COPY)
job_id = report['execution_index'][1]['job']
original = s.get_job(job_id)['result']
altered = dict(original, evidence_ref=report['execution_index'][0]['evidence_ref'])
s.db.execute('UPDATE jobs SET result=? WHERE id=?', (json.dumps(altered), job_id)); s.close()
try:
    run_integration(COPY, MANIFEST, CONFIG)
    raise AssertionError('substituted evidence accepted')
except ValueError as exc:
    refusal = str(exc)
s = Store(COPY)
assert s.get('budget') == budget_before
s.db.execute('UPDATE jobs SET result=? WHERE id=?', (json.dumps(original), job_id))
path = COPY / report['candidate_snapshot']
raw = path.read_bytes(); path.write_bytes(raw + b' ')
s.close()
try:
    run_integration(COPY, MANIFEST, CONFIG)
    raise AssertionError('corrupted candidate accepted')
except ValueError as exc:
    corrupt_refusal = str(exc)
s = Store(COPY); assert s.get('budget') == budget_before; s.close()
path.write_bytes(raw)
result = {'reviewer': 'Terra/gpt-6.1-terra', 'build': build, 'budget': budget_before,
          'jobs': rows, 'source_provenance': 'matched 24 git blobs and 8 directive excerpts',
          'candidate_reconstructed': True, 'comparison_quality_delta': -0.5,
          'offline_replay': True, 'dispatch_allowed': False,
          'evidence_substitution_refusal': refusal, 'corrupt_candidate_refusal': corrupt_refusal,
          'budget_unchanged_after_faults': True}
OUT.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))
