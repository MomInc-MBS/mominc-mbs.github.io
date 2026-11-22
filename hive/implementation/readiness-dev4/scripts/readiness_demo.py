"""One-command synthetic operator demo; Docker executes code, model calls stay zero.

The generated source/media are engineering fixtures, never Level A acceptance.
An existing matching demo resumes from its saved manifests without refilling caps.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

REPO = Path(__file__).resolve().parents[1]
IMAGE = 'sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535'


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def prepare(base):
    index = base / 'inputs.json'
    if index.exists():
        return json.loads(index.read_text(encoding='utf-8'))
    if base.exists() and any(base.iterdir()):
        raise ValueError('demo directory must be new or contain its original inputs.json')
    base.mkdir(parents=True, exist_ok=True)
    source = base / 'code-source'; source.mkdir()
    before = 'def total(values):\n    return sum(values[:-1])\n'
    after = 'def total(values):\n    return sum(values)\n'
    (source / 'app.py').write_text(before, encoding='utf-8')
    cases = [
        {'id': 'empty', 'args': [[]], 'kwargs': {}, 'expected': 0},
        {'id': 'positive', 'args': [[1, 2, 3]], 'kwargs': {}, 'expected': 6},
        {'id': 'negative', 'args': [[-3, -1]], 'kwargs': {}, 'expected': -4},
        {'id': 'single', 'args': [[9]], 'kwargs': {}, 'expected': 9},
    ]
    write(source / 'verifier.json', cases)
    (source / 'private').mkdir()
    (source / 'private' / 'canary.txt').write_text('TEST-ONLY; MUST NOT ENTER WORKER MOUNT', encoding='utf-8')
    env = dict(os.environ, GIT_AUTHOR_DATE='2026-11-21T00:00:00Z', GIT_COMMITTER_DATE='2026-11-21T00:00:00Z')
    def git(*args):
        return subprocess.run(['git', '-C', str(source), *args], env=env, check=True,
                              capture_output=True, timeout=20).stdout
    git('init', '-q'); git('config', 'core.hooksPath', str(source / '.git' / 'disabled-hooks'))
    git('config', 'core.autocrlf', 'false')
    git('config', 'commit.gpgsign', 'false'); git('config', 'user.name', 'HIVE synthetic fixture')
    git('config', 'user.email', 'fixture@example.invalid'); git('add', '.')
    git('commit', '-qm', 'Frozen synthetic development fixture')
    revision = git('rev-parse', 'HEAD').decode().strip()
    code = {
        'schema_version': 1, 'id': 'readiness-code-demo',
        'repo': {'path': str(source), 'revision': revision, 'source_sha256': sha(git('archive', '--format=tar', revision))},
        'worker_files': ['app.py'], 'allowlist': ['app.py'],
        'patches': [{'id': 'include-final-value', 'path': 'app.py', 'content': after, 'sha256': sha(after.encode())}],
        'verifier': {'protocol': 'json_function_v1', 'path': 'verifier.json',
                     'sha256': sha((source / 'verifier.json').read_bytes()),
                     'module': 'app', 'function': 'total', 'cases': cases},
        'image': {'reference': 'python:3.11-slim', 'digest': IMAGE},
        'limits': {'timeout_s': 15, 'memory_mb': 128, 'cpu_count': 1, 'pids': 32, 'output_bytes': 8192},
        'network': 'none', 'mounts': 'read_only_source_clean_copy',
    }
    write(base / 'code.json', code)
    write(base / 'code-mission.json', {'schema_version': 1, 'id': 'code-demo', 'stages': [
        {'id': 'repair', 'family': 'code', 'manifest': str(base / 'code.json'), 'depends_on': [], 'max_retries': 0}]})
    media = base / 'video-source'; media.mkdir()
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=10:d=3',
                    '-c:v', 'mpeg4', str(media / 'synthetic.mp4')], check=True, timeout=20)
    (media / 'source.srt').write_text('1\n00:00:00,000 --> 00:00:01,000\nFirst synthetic cue\n\n'
                                    '2\n00:00:01,100 --> 00:00:02,000\nSecond synthetic cue\n', encoding='utf-8')
    write(base / 'video.json', {'allowed_root': str(media), 'media': 'synthetic.mp4', 'subtitles': 'source.srt'})
    write(base / 'video-mission.json', {'schema_version': 1, 'id': 'video-demo', 'stages': [
        {'id': 'caption-and-clip', 'family': 'video', 'manifest': str(base / 'video.json'), 'depends_on': [], 'max_retries': 0}]})
    write(base / 'combined-mission.json', {'schema_version': 1, 'id': 'combined-demo', 'stages': [
        {'id': 'repair', 'family': 'code', 'manifest': str(base / 'code.json'), 'depends_on': [], 'max_retries': 0},
        {'id': 'caption-and-clip', 'family': 'video', 'manifest': str(base / 'video.json'), 'depends_on': ['repair'], 'max_retries': 0}]})
    write(base / 'tool-config.json', {'routes': ['tool'], 'max_retries': 0, 'max_cycles': 16,
                                    'max_wall_s': 90, 'max_requests': 1, 'max_total_tokens': 128})
    inputs = {'code': str(base / 'code-mission.json'), 'video': str(base / 'video-mission.json'),
              'combined': str(base / 'combined-mission.json'),
              'config': str(base / 'tool-config.json'), 'original_source_sha256': sha((source / 'app.py').read_bytes()),
              'source_file': str(source / 'app.py'), 'scope': 'synthetic engineering fixtures; no Level A/B evidence'}
    write(index, inputs)
    return inputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work', type=Path, default=Path('.hive/readiness-demo'))
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    base = args.work.absolute()
    # Refuse redirected workspace components before any writes.
    sys.path.insert(0, str(REPO / 'src'))
    from hive.video_mission import _reject_reparse_components
    _reject_reparse_components(base)
    inputs = prepare(base)
    if args.prepare_only:
        print(json.dumps(inputs, indent=2)); return
    env = dict(os.environ, PYTHONPATH=str(REPO / 'src'))
    records = []
    def invoke(store, *arguments):
        command = [sys.executable, '-m', 'hive', '--store', str(store), *arguments]
        result = subprocess.run(command, env=env, capture_output=True, text=True, timeout=60)
        record = {'arguments': arguments, 'store': str(store), 'exit_code': result.returncode,
                  'stdout_sha256': sha(result.stdout.encode()), 'stderr': result.stderr}
        records.append(record)
        if result.returncode:
            write(base / 'commands.json', records)
            raise RuntimeError(result.stderr)
        value = json.loads(result.stdout); record['result'] = value
        write(base / 'commands.json', records)
        return value
    outputs = {}
    for family in ('video', 'code', 'combined'):
        store = base / (family + '-store')
        command = ('mission', 'run', '--manifest', inputs[family], '--config', inputs['config'])
        first = invoke(store, *command)
        replay = invoke(store, *command)
        status = invoke(store, 'status')
        if first.get('status') != 'COMPLETED' or replay.get('status') != 'COMPLETED':
            write(base / 'commands.json', records)
            raise RuntimeError(f'{family} mission did not complete; inspect commands.json')
        if first.get('budget') != replay.get('budget') or first.get('stages') != replay.get('stages'):
            raise RuntimeError(f'{family} replay changed completed stages or accounting')
        if (status.get('budget') or {}).get('requests', 0) != 0:
            raise RuntimeError('unexpected model consumption')
        outputs[family] = {'first': first, 'replay': replay, 'accounting': status}
    if sha(Path(inputs['source_file']).read_bytes()) != inputs['original_source_sha256']:
        raise RuntimeError('original source changed')
    write(base / 'commands.json', records)
    summary = {'scope': inputs['scope'], 'new_model_calls': 0, 'original_source_unchanged': True,
               'outputs': outputs, 'commands': str(base / 'commands.json')}
    write(base / 'demo-report.json', summary)
    print(json.dumps({'report': str(base / 'demo-report.json'), 'new_model_calls': 0,
                      'statuses': {family: result['first'].get('status') for family, result in outputs.items()}}, indent=2))


if __name__ == '__main__':
    main()
