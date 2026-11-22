"""Run actual zero-inference prototype work and fresh-process replay on frozen source."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--runtime', type=Path, required=True)
    parser.add_argument('--demo', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--store', type=Path)
    args = parser.parse_args()
    runtime, demo, output = args.runtime.resolve(), args.demo.resolve(), args.output.resolve()
    store = args.store.resolve() if args.store else demo / 'tool-store'
    if store.exists():
        raise ValueError('First run requires the unused prepared zero-call store; never reset an allocation')
    output.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, PYTHONPATH=str(runtime / 'src'), GIT_CEILING_DIRECTORIES=str(runtime.parent))
    commands = [
        ('data', ['data', '--manifest', str(demo / 'inputs/inventory-mission.json')], 'VERIFIED'),
        ('python', ['mission', 'run', '--manifest', str(demo / 'inputs/python-standalone.json')], 'COMPLETED'),
        ('python-labels', ['mission', 'run', '--manifest', str(demo / 'inputs/python-label-standalone.json')], 'COMPLETED'),
        ('combined', ['mission', 'run', '--manifest', str(demo / 'inputs/combined-mission.json')], 'COMPLETED'),
        ('learning', ['learn', '--plan', str(demo / 'inventory-learning-plan.json')], 'REJECTED'),
    ]
    receipts = []

    def invoke(name, parts):
        command = [sys.executable, '-m', 'hive', '--store', str(store), *parts]
        started = time.monotonic()
        result = subprocess.run(command, cwd=runtime, env=env, capture_output=True, text=True, timeout=240)
        (output / (name + '.json')).write_text(result.stdout, encoding='utf-8')
        (output / (name + '.stderr')).write_text(result.stderr, encoding='utf-8')
        receipts.append({'name': name, 'command': command, 'exit': result.returncode,
                         'elapsed_s': round(time.monotonic() - started, 3)})
        if result.returncode:
            raise RuntimeError(name + ' failed: ' + result.stderr[-1000:])
        return json.loads(result.stdout)

    hashes_before = {p.relative_to(demo / 'inputs').as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                     for p in (demo / 'inputs').rglob('*') if p.is_file() and '.git' not in p.parts}
    results = {}
    for name, command, expected in commands:
        results[name] = invoke(name, command)
        assert results[name]['status'] == expected, (name, results[name])
    learning = results['learning']
    assert learning['subsequent']['status'] == 'VERIFIED'
    assert learning['decision']['accepted'] is False and learning['production_promoted'] is False
    assert learning['beneficial_learning'] is False
    before = invoke('status-before-replay', ['status'])['budget']
    assert before['requests'] == before['tokens_reserved'] == before['tokens_actual'] == 0
    for name, command, expected in commands:
        replayed = invoke(name + '-replay', command)
        assert replayed['status'] == expected
    after = invoke('status-after-replay', ['status'])['budget']
    assert after == before, 'Replay changed the durable aggregate budget'
    hashes_after = {p.relative_to(demo / 'inputs').as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in (demo / 'inputs').rglob('*') if p.is_file() and '.git' not in p.parts}
    assert hashes_after == hashes_before, 'Original inputs changed'
    summary = {'status': 'PASS', 'scope': 'First-party real-source engineering demonstration; no model inference',
               'runtime': str(runtime), 'store': str(store), 'commands': receipts,
               'results': {name: result['status'] for name, result in results.items()},
               'combined_stages': {key: row['state'] for key, row in results['combined']['stages'].items()},
               'subsequent_status': learning['subsequent']['status'],
               'candidate_rejected': True, 'beneficial_learning': False, 'p2_promoted': False,
               'budget_before_replay': before, 'budget_after_replay': after,
               'original_inputs_unchanged': True, 'new_real_model_calls': 0,
               'files': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in output.iterdir()
                         if p.is_file() and p.name != 'summary.json'}}
    (output / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
