"""Verify an exported ZIP in a fresh directory, using synthetic media and no inference."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile
from datetime import datetime, timezone


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    base = Path(tempfile.mkdtemp(prefix='hive-clean-release-'))
    source = base / 'source'
    with zipfile.ZipFile(args.zip) as archive:
        # Only this repository's exporter output is accepted.
        for name in archive.namelist():
            target = (source / name).resolve()
            if not target.is_relative_to(source.resolve()) or ':' in name or '\\' in name:
                raise ValueError('Unsafe archive path')
        archive.extractall(source)
    manifest = json.loads((source / 'SNAPSHOT_MANIFEST.json').read_text('utf-8'))
    assert manifest['tracked_dirty'] is False
    for name, record in manifest['files'].items():
        data = (source / name).read_bytes()
        assert hashlib.sha256(data).hexdigest() == record['sha256']
        assert len(data) == record['bytes']
    env = dict(os.environ, PYTHONPATH=str(source / 'src'))
    inputs, store = base / 'inputs', base / 'store'
    inputs.mkdir()
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i',
                    'color=c=black:s=32x32:r=10:d=3', '-c:v', 'mpeg4',
                    str(inputs / 'synthetic.mp4')], check=True, timeout=20)
    (inputs / 'synthetic.srt').write_text(
        '4\n00:00:01,100 --> 00:00:02,000\nSecond synthetic cue\n\n'
        '2\n00:00:00,000 --> 00:00:01,000\nFirst synthetic cue\n', encoding='utf-8')
    mission, config = base / 'mission.json', base / 'config.json'
    mission.write_text(json.dumps({'allowed_root': str(inputs), 'media': 'synthetic.mp4',
                                   'subtitles': 'synthetic.srt'}), encoding='utf-8')
    config.write_text(json.dumps({'routes': ['tool'], 'max_retries': 0}), encoding='utf-8')

    def invoke(*tail, success=True):
        run = subprocess.run([sys.executable, '-m', 'hive', '--store', str(store), *tail],
                             cwd=source, env=env, capture_output=True, text=True, timeout=30)
        assert (run.returncode == 0) is success, run.stdout + run.stderr
        return json.loads(run.stdout) if success else {'error': run.stderr + run.stdout}

    command = ('video', '--mission', str(mission), '--config', str(config))
    first = invoke(*command)
    assert first['status'] == 'objective_verified'
    assert first['editorial_status'] == 'needs_operator_review'
    assert first['resource_use']['model_requests'] == 0
    files = [Path(first[key]) for key in ('captions', 'clips')]
    before = [(path.read_bytes(), path.stat().st_mtime_ns) for path in files]
    second = invoke(*command)
    assert first == second
    status_before = invoke('status')
    invoke('stop')
    stopped = invoke(*command, success=False)
    assert 'STOP' in json.dumps(stopped)
    invoke('resume')
    third = invoke(*command)
    assert third == first
    assert before == [(path.read_bytes(), path.stat().st_mtime_ns) for path in files]
    status_after = invoke('status')
    assert status_before['budget'] == status_after['budget']
    receipt = {
        'date': datetime.now(timezone.utc).isoformat(), 'status': 'passed',
        'scope': 'synthetic deterministic CLI on extracted ZIP; not genuine acceptance or inference',
        'snapshot_source_commit': manifest['source_commit'],
        'zip_sha256': hashlib.sha256(args.zip.read_bytes()).hexdigest(),
        'verified_manifest_files': len(manifest['files']),
        'runtime': first['source']['runtime'],
        'checks': ['all exported file hashes', 'fresh-process CLI execution and replay',
                   'STOP blocks completed output replay', 'resume keeps output bytes and mtimes',
                   'job identity stable', 'zero model requests', 'budget unchanged on replay'],
        'model_requests': 0, 'genuine_tasks': 0,
        'resource_use': first['resource_use'], 'budget': status_after['budget'],
        'outputs': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as handle:
        json.dump(receipt, handle, indent=2)
        handle.write('\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
