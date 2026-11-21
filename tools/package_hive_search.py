"""Package the audited, exposed-fixture comparison; no local private inputs."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys
import zipfile

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))
from tools.hive_engine import search
from tools.hive_engine.pilot import write


def package(run):
    run = Path(run).resolve()
    checked = search.check(run)
    result = json.loads((run/'results.json').read_text())
    if not checked['complete']:
        raise ValueError('full comparison required for final package')
    public = REPO/'hive/evidence/recipe-search-v1'
    public.mkdir(exist_ok=True)
    if (public/'results.json').exists() and json.loads((public/'results.json').read_text()) != result:
        raise ValueError('refusing to replace evidence')
    for name in ('results.json', 'experiment.json', 'search-events.jsonl'):
        shutil.copyfile(run/name, public/name)
    write(public/'audit.json', checked)
    lines = ['# Equal-budget recipe search results', '',
             '**No verified improvement established. Every candidate is rejected for operational promotion.**', '',
             f"Run `{run.name}`: {checked['trials']} retained trials; {checked['episodes']} independently audited task episodes. "
             'Optuna 5.1.0, three fixed seeds, four development trials plus one evaluation per arm/seed. '
             'All four arms had the same 216-call / 240-second ceiling per seed; the aggregate ceiling was 2,592 calls / 2,880 seconds. '
             'Measured cost includes the repeated baseline trials and proposal overhead, not just the chosen recipe.', '',
             '| Arm | Evaluation correct | Mean execution ms | Total trial wall s | Adapter calls | Dev trials below 100% | Noncompleted trials |',
             '|---|---:|---:|---:|---:|---:|---:|']
    for name, row in result['arms'].items():
        latency = f"{1000*row['mean_execution_seconds']:.2f}" if row['mean_execution_seconds'] is not None else 'unknown'
        inferior = sum(r['arm'] == name and r['phase'] == 'development' and r['successes'] < 48 for r in result['all_trials'])
        lines.append(f"| {name} | {row['successes']}/{row['tasks']} | {latency} | {row['total_wall_seconds']:.2f} | {row['task_calls']} | {inferior}/12 | {row['failures']} |")
    lines += ['', 'The 72 evaluation calls per arm repeat the same 24 exposed synthetic fixtures across three seeds; '
              'they are not 72 independent new examples. All development trials, including inferior recipes, '
              'are retained in results.json and the raw event/SQLite archive. Candidate selection uses development data only. '
              'Independent audit verifies selection chronology, lineage, frozen task order, artifact verdicts, '
              'source/lock identity, partial-trial accounting and the final decisions.', '',
              'The rules control already solves this small rubric perfectly. Four TPE trials per seed are a wiring and budget test, '
              'not a powered optimizer comparison. Differences in latency reflect a short serial experiment on a shared PC; '
              'no confidence interval, causal sample-efficiency improvement or broader transfer claim is supported. '
              'Fresh holdout, novel-family retention and candidate-specific recovery gates remain false. '
              'The existing runtime separately proves rejection and exact-candidate restart/rollback.', '',
              'Per-task execution latency includes admission through adapter completion; verification is separate. '
              'Total trial wall time includes proposal subprocesses, execution, verification, persistence and audit. '
              'Worker CPU/RSS exclude ffprobe descendants and Optuna proposal CPU/RSS; hard memory limits are unproven. '
              'No model inference, GPU allocation, paid requests, external actions or neural training occurred.', '',
              f"Measured worker CPU across all trials: {sum(r['cpu_seconds'] for r in result['arms'].values()):.2f} seconds. "
              f"Maximum worker RSS: {max(r['peak_rss_bytes'] for r in result['arms'].values())/1048576:.2f} MiB. These are partial resource observations, not total experiment CPU/RAM.", '',
              '## Reproduction and evidence', '',
              '[Experiment and limits](LEARNING_ACCELERATION.md) · [raw results](../../evidence/recipe-search-v1/results.json) · '
              '[frozen spec](../../evidence/recipe-search-v1/experiment.json) · [audit](../../evidence/recipe-search-v1/audit.json) · '
              '[source and full trial archive](../../evidence/recipe-search-v1/reproduce.zip)', '',
              'Extract the ZIP and run `python -m tools.hive_engine.search --audit evidence` without installing Optuna. '
              'To execute new trials, create the isolated environment from the hash lock as documented in LEARNING_ACCELERATION.md. '
              'Exact recipes and decisions replay from stored metrics; wall-time measurements depend on the machine.', '']
    docs = REPO/'hive/implementation/runtime-v2'
    (docs/'SEARCH_RESULTS.md').write_text('\n'.join(lines), encoding='utf-8')
    with zipfile.ZipFile(public/'reproduce.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted((REPO/'tools/hive_engine').rglob('*')):
            if path.is_file() and (path.suffix == '.py' or 'data' in path.parts) and '__pycache__' not in path.parts:
                z.write(path, path.relative_to(REPO).as_posix())
        for name in ('hive-optuna.in', 'hive-optuna.lock', 'package_hive_search.py'):
            z.write(REPO/'tools'/name, 'tools/'+name)
        for path in sorted(run.rglob('*')):
            if path.is_file() and not path.name.startswith('.') and not path.name.endswith(('-wal', '-shm')):
                z.write(path, 'evidence/'+path.relative_to(run).as_posix())
        for path in sorted(docs.iterdir()):
            if path.suffix in {'.md', '.json'}:
                z.write(path, path.relative_to(REPO).as_posix())
        for path in sorted(public.glob('*.json')):
            if path.name != 'artifact-manifest.json':
                z.write(path, path.relative_to(REPO).as_posix())
        z.writestr('README.md', '# HIVE recipe search reproduction\n\nPython 3.11+.\n\n'
                   '`python -m tools.hive_engine.search --audit evidence` rechecks the saved experiment without Optuna.\n\n'
                   'Read hive/implementation/runtime-v2/LEARNING_ACCELERATION.md for isolated installation and rerun commands.\n'
                   'Vault/source-reference links and documentation-overlay checks require the full repository checkout.\n'
                   'Exposed synthetic regression evidence; no autonomous learning or operational promotion.\n')
    write(public/'artifact-manifest.json', {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
          for p in sorted(public.iterdir()) if p.is_file() and p.name != 'artifact-manifest.json'})
    print(json.dumps({'out': str(public), 'audit': checked, 'archive_bytes': (public/'reproduce.zip').stat().st_size}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run', type=Path)
    package(parser.parse_args().run)
