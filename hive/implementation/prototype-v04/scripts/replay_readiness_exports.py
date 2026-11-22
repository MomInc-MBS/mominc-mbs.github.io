"""Recheck public readiness evidence offline, with no dispatch or private Store.

This verifies exported bytes, objective fixture comparisons and operator job
bundles. Journal/chaos proof comes from the frozen tests; this is not a new run.
"""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from hive.orchestrator import code_version
from hive.pressure import compare
from hive.verifier import verify


def read(relative):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError('missing or out-of-scope public evidence: ' + relative)
    return path.read_bytes()


def recorded_config_hash(value):
    """Reconstruct Executor's hash input from its JSON-only config record.

    config_record names an adapter class; config_hash originally hashes that
    class name under the original adapter key. Never import or instantiate it.
    """
    normalized = dict(value)
    for key in ('adapter', 'isolation_adapter'):
        recorded = 'test_' + key
        if recorded in normalized:
            name = normalized.pop(recorded)
            if key in normalized or not isinstance(name, str) or not name.strip():
                raise ValueError('ambiguous or invalid recorded adapter identity')
            normalized[key] = {'test_adapter': name}
        elif normalized.get(key) is not None:
            raise ValueError('unserialized adapter in public config record')
    raw = json.dumps(normalized, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()
    return hashlib.sha256(raw).hexdigest()


def main():
    index = json.loads(read('build/evidence-index.json'))
    for relative, entry in index['files'].items():
        raw = read(relative)
        if hashlib.sha256(raw).hexdigest() != entry['sha256'] or len(raw) != entry['bytes']:
            raise ValueError('public evidence digest mismatch: ' + relative)
    base = 'experiments/results/readiness-20261121/'
    reports = [json.loads(read(base + f'H{i:02}.json')) for i in range(1, 12)]
    comparison = compare(reports)
    if comparison['research_status'] != 'UNTESTED':
        raise ValueError('unexpected research claim')
    operator = json.loads(read(base + 'operator-evidence/index.json'))
    for job in operator['jobs']:
        if job['artifact'] != job['store'] + '/' + job['result']['evidence_ref']:
            raise ValueError('exported job result does not name its evidence')
        raw = read(base + 'operator-evidence/' + job['artifact'])
        if hashlib.sha256(raw).hexdigest() != Path(job['artifact']).stem:
            raise ValueError('operator artifact hash mismatch')
        bundle = json.loads(raw)
        if bundle['job_id'] != job['job_id'] or bundle['task'] != job['spec']['task']:
            raise ValueError('operator job/task binding mismatch')
        if (bundle['route'] != job['route'] or bundle['route'] != job['spec']['route']
                or recorded_config_hash(bundle['config']) != bundle['config_hash']):
            raise ValueError('operator route/config mismatch')
        if verify(bundle['task'], bundle['result']) != bundle['verification']:
            raise ValueError('operator objective result does not reproduce')
        if bundle['build']['source_sha256'] != index['measured_runtime']['source_sha256']:
            raise ValueError('operator source identity mismatch')
    print(json.dumps({
        'status': 'passed', 'verified_public_files': len(index['files']),
        'fixture_scenarios': len(reports),
        'fixture_observations': sum(len(x['observations']) for x in reports),
        'operator_jobs': len(operator['jobs']), 'new_model_calls': 0,
        'research_status': 'UNTESTED', 'current_runtime': code_version(),
        'scope': 'offline exported bytes and objective-result replay; no fresh missions or private journal replay',
    }, indent=2))


if __name__ == '__main__':
    main()
