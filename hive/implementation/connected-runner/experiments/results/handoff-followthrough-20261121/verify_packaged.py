"""Extract a new public source ZIP and replay all public evidence offline."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import sys
import zipfile


def verify(zip_path, work):
    if work.exists():
        raise ValueError('fresh extraction directory required')
    raw_zip = zip_path.read_bytes()
    with zipfile.ZipFile(zip_path) as archive:
        snapshot = json.loads(archive.read('SNAPSHOT_MANIFEST.json'))
        assert snapshot['tracked_dirty'] is False
        assert len(archive.namelist()) == len(set(archive.namelist()))
        assert set(archive.namelist()) == set(snapshot['files']) | {'SNAPSHOT_MANIFEST.json'}
        for name, entry in snapshot['files'].items():
            path = PurePosixPath(name)
            assert not path.is_absolute() and '..' not in path.parts and ':' not in name and '\\' not in name
            payload = archive.read(name)
            assert len(payload) == entry['bytes'] and hashlib.sha256(payload).hexdigest() == entry['sha256']
        archive.extractall(work)
    env = dict(os.environ, PYTHONPATH=str(work / 'src'), PYTHONIOENCODING='utf-8')
    commands = [
        ['-m', 'hive', 'doctor', '--offline'],
        ['scripts/replay_integration_export.py'],
        ['scripts/replay_readiness_exports.py'],
        ['scripts/replay_objective_exports.py'],
        ['scripts/replay_p2_exports.py', '--input',
         'experiments/results/handoff-followthrough-20261121/p2-evidence'],
    ]
    checks = []
    for command in commands:
        run = subprocess.run([sys.executable, *command], cwd=work, env=env,
                             capture_output=True, text=True, encoding='utf-8', timeout=180)
        checks.append({'command': command, 'returncode': run.returncode,
                       'stdout': run.stdout, 'stderr': run.stderr})
        if run.returncode:
            return {'status': 'failed', 'checks': checks}
    doctor = json.loads(checks[0]['stdout'])
    assert doctor['build']['source_sha256'] == '0d97faae0caae31f3918296dccaa21be5ba0ba7a1cec0c8ca5f880001d17320e'
    return {'status': 'passed', 'verified_at': datetime.now(timezone.utc).isoformat(),
            'download_sha256': hashlib.sha256(raw_zip).hexdigest(),
            'source_commit': snapshot['source_commit'], 'payload_files': len(snapshot['files']),
            'runtime_source_sha256': doctor['build']['source_sha256'],
            'new_hive_model_calls': 0, 'checks': checks,
            'scope': 'Fresh published-ZIP extraction and offline evidence replay; full candidate regression is recorded separately.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', required=True, type=Path)
    parser.add_argument('--work', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('preserve existing receipts; choose a new output path')
    try:
        result = verify(args.zip.resolve(), args.work.resolve())
    except Exception as exc:
        result = {'status': 'failed', 'error': type(exc).__name__ + ': ' + str(exc)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k != 'checks'}, indent=2))
    raise SystemExit(0 if result['status'] == 'passed' else 1)
