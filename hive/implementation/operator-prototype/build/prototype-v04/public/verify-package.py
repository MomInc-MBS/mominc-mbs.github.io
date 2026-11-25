"""Verify shipped bytes and a zero-inference entry point from a fresh extraction."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', type=Path, required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    root = args.work.resolve()
    if root.exists():
        raise ValueError('Preserve previous extraction and store; choose an unused verification directory')
    with zipfile.ZipFile(args.zip) as archive:
        manifest = json.loads(archive.read('SNAPSHOT_MANIFEST.json'))
        assert manifest['tracked_dirty'] is False
        for name in archive.namelist():
            target = (root / name).resolve()
            assert target.is_relative_to(root) and '\\' not in name
        for name, record in manifest['files'].items():
            data = archive.read(name)
            assert len(data) == record['bytes'] and hashlib.sha256(data).hexdigest() == record['sha256'], name
        archive.extractall(root)
    env = dict(os.environ, PYTHONPATH=str(root / 'src'), GIT_CEILING_DIRECTORIES=str(root.parent))
    receipts = {}
    def call(name, *parts):
        result = subprocess.run([sys.executable, *parts], cwd=root, env=env,
                                capture_output=True, text=True, timeout=90)
        assert result.returncode == 0, name + ': ' + result.stderr[-1000:]
        receipts[name] = {'command': [sys.executable, *parts], 'exit': result.returncode,
                          'stdout_sha256': hashlib.sha256(result.stdout.encode()).hexdigest()}
        return json.loads(result.stdout)
    doctor = call('doctor', '-m', 'hive', 'doctor', '--offline')
    decision = json.loads((root / 'build/prototype-v04/public/release-decision.json').read_text())
    assert doctor['build']['source_sha256'] == decision['runtime_source_sha256']
    assert doctor['build']['commit'] == 'unversioned'
    call('prepare', 'scripts/prepare_operational_demo.py')
    demo = root / '.hive/prototype-v04-final-inputs'
    proposal = json.loads((demo / 'operator-approval.proposed.json').read_text())
    assert proposal['approved'] is False and not (demo / 'live-store').exists()
    provenance = json.loads((demo / 'prototype-demo-manifest.json').read_text())
    expected_revision = 'snapshot:' + decision['runtime_source_sha256']
    assert provenance['source_revision'] == expected_revision
    assert all(item['revision'] == expected_revision for item in provenance['source_provenance'])
    args_data = ['-m', 'hive', '--store', str(demo / 'tool-store'), 'data', '--manifest', str(demo / 'inputs/inventory-mission.json')]
    first = call('data', *args_data)
    replay = call('data-replay', *args_data)
    assert first == replay and first['status'] == 'VERIFIED'
    assert first['budget']['cycles'] == 1 and first['budget']['requests'] == first['budget']['tokens_actual'] == 0
    report = {'status': 'PASS', 'source_commit': manifest['source_commit'],
              'zip_sha256': hashlib.sha256(args.zip.read_bytes()).hexdigest(),
              'runtime_sha256': doctor['build']['source_sha256'], 'files_verified': len(manifest['files']),
              'snapshot_provenance_verified': True, 'proposal_approved': False, 'live_store_created': False,
              'data_status': first['status'], 'fresh_process_replay_equal': True,
              'budget': first['budget'], 'new_real_model_calls': 0, 'receipts': receipts}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
