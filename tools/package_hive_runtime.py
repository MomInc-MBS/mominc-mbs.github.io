"""Package the non-sensitive bundled-fixture runtime demonstration and source.

python tools/package_hive_runtime.py .hive-local/runtime-v2-run-003
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import statistics
import sys
import zipfile

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))
from tools.hive_engine.audit import check
from tools.hive_engine.core import digest
from tools.hive_engine.fixtures import FROZEN_SHA256
from tools.hive_engine.pilot import write
from tools.hive_engine.runtime import source_hashes


def package(run):
    run = Path(run).resolve()
    result = json.loads((run/'results.json').read_text())
    plan = json.loads((run/'evaluation-plan.json').read_text())
    if plan['dataset_hash'] != FROZEN_SHA256 or result['source_hashes'] != source_hashes():
        raise ValueError('only the frozen synthetic run at these exact sources may be packaged')
    audit = check(run/'state')
    events = [json.loads(line) for line in (run/'state'/'events.jsonl').read_text().splitlines()]
    episodes = [e['payload'] for e in events if e['kind'] == 'RuntimeEpisode']
    resources = {'scope': 'worker process only; not total process tree or GPU',
                 'mean_worker_cpu_seconds': statistics.mean(r['resources']['cpu_seconds'] for r in episodes if r['resources'].get('cpu_seconds') is not None),
                 'peak_worker_rss_bytes': max(r['resources'].get('peak_rss_bytes') or 0 for r in episodes)}
    public = REPO/'hive'/'evidence'/'runtime-v2'
    if (public/'results.json').exists() and json.loads((public/'results.json').read_text()) != result:
        raise ValueError('refusing to replace evidence from a different run')
    public.mkdir(exist_ok=True)
    for name in ('results.json', 'evaluation-plan.json', 'candidate.json', 'rollback-proof.json', 'curated-dev.json'):
        shutil.copyfile(run/name, public/name)
    write(public/'audit.json', audit)
    write(public/'resources.json', resources)
    docs = REPO/'hive'/'implementation'/'runtime-v2'
    lines = ['# Measured runtime v2 results', '',
             '**Decision: rejected. Autonomous learning is not established.**', '',
             f"Run `{run.name}`: {audit['episodes']} episodes independently audited; 72 tasks × four arms × two executions. "
             f"The complete run took {result['elapsed_seconds']:.2f} seconds. The exact candidate was exercised in an isolated "
             'test runtime, reopened, rolled back, and the restored baseline executed after another restart.', '',
             '| Configuration | Development correct | Evaluation correct | Evaluation mean execution ms |',
             '|---|---:|---:|---:|']
    for arm, score in result['metrics'].items():
        dev, hold = score['dev'], score['holdout']
        lines.append(f"| {arm} | {dev['n']-dev['failures']}/{dev['n']} | {hold['n']-hold['failures']}/{hold['n']} | {1000*hold['mean_wall_seconds']:.2f} |")
    lines += ['', 'The evaluation split contains the original 24 synthetic fixtures and was previously exposed. '
              'It is regression evidence, not a fresh blinded test. The controls were selected on development data. '
              'The candidate was frozen before evaluation, and all 288 output/status replays matched.', '',
              'The candidate corrected ffprobe false acceptance, but it did not beat the best simple rules control. '
              'Benefit and holdout-integrity gates failed; retention, safety, unchanged memory, measured budgets, '
              'replay and candidate-bound rollback gates passed. The operational policy remains the original baseline.', '',
              'Execution latency measures admission through adapter completion; verifier time is recorded separately. '
              'SQLite trace/export persistence is excluded from that per-task cost. Total experiment time above includes the full loop. '
              'CPU and peak RAM cover the worker only; hard memory quotas, ffprobe child/GPU attribution and model inference remain unproven.', '',
              f"Mean worker CPU: {resources['mean_worker_cpu_seconds']:.5f} seconds; maximum worker RSS: "
              f"{resources['peak_worker_rss_bytes']/1048576:.2f} MiB. No model inference, model loading or neural training occurred.", '',
              '## Validation and artifacts', '',
              '- 38 tests passed: original contracts plus routing, transport, freeze, tamper, release, rollback and optional search checks.',
              '- Positive acceptance tests use explicitly injected synthetic adapter faults; they prove the release mechanism, not learning superiority.',
              '- A separate live-task CLI submission selected rules, completed, independently verified and persisted experience.',
              '- Existing archived pilot re-audited: 576/576 episodes verified. Static site: 313 pages / 22,806 links passed. Vault: zero errors.',
              '- All 696 snapshotted research, fixture and prior-evidence files remain byte-identical. New research links use a separately validated overlay; see preservation.json.', '',
              '[Machine-readable results](../../evidence/runtime-v2/results.json) · '
              '[Audit](../../evidence/runtime-v2/audit.json) · '
              '[Rollback proof](../../evidence/runtime-v2/rollback-proof.json) · '
              '[Complete source and evidence ZIP](../../evidence/runtime-v2/reproduce.zip)', '',
              'Unzip the archive in a new directory. `python -m tools.hive_engine.audit evidence/state` checks the saved run. '
              '`python -m tools.hive_engine.cycle --out rerun-new` produces a fresh execution of the frozen regression set. '
              'The executable binary/version must match for evidence-bound promotion; timing varies with machine load.', '',
              '## Still unproven', '',
              'No real-model quality benchmark, fresh representative held-out improvement, learned contextual router, '
              'compounding/sample-efficiency gain, weight update, hard hostile-code sandbox or production HIVE runtime is established. '
              'The next deciding experiment needs independently held real caption/media examples and a development failure '
              'that a bounded candidate can improve against the best unchanged baseline.', '']
    (docs/'RESULTS.md').write_text('\n'.join(lines), encoding='utf-8')
    archive = public/'reproduce.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted((REPO/'tools'/'hive_engine').rglob('*')):
            if path.is_file() and (path.suffix == '.py' or 'data' in path.parts) and '__pycache__' not in path.parts:
                z.write(path, path.relative_to(REPO).as_posix())
        for path in sorted(run.rglob('*')):
            if path.is_file() and not path.name.startswith('.') and not path.name.endswith(('-wal', '-shm')):
                z.write(path, 'evidence/'+path.relative_to(run).as_posix())
        for path in sorted(docs.iterdir()):
            if path.suffix in {'.md', '.json'}:
                z.write(path, path.relative_to(REPO).as_posix())
        for path in sorted(public.glob('*.json')):
            if path.name != 'artifact-manifest.json':
                z.write(path, path.relative_to(REPO).as_posix())
        z.write(Path(__file__), 'tools/package_hive_runtime.py')
        for name in ('hive-optuna.in', 'hive-optuna.lock'):
            z.write(REPO/'tools'/name, 'tools/'+name)
        z.writestr('README.md', '# HIVE runtime v2 reproduction\n\n'
                   'Python 3.11+ and ffprobe are required.\n\n'
                   '`python -m tools.hive_engine.audit evidence/state` audits the saved run.\n\n'
                   '`python -m tools.hive_engine.cycle --out rerun-new` reruns the frozen regression set.\n\n'
                   'Reports: hive/implementation/runtime-v2/README.md and RESULTS.md.\n'
                   'Vault/source-reference links and documentation-overlay checks require the full repository checkout.\n'
                   'This candidate was rejected; autonomous learning is not established.\n')
    write(public/'artifact-manifest.json', {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
                                          for p in sorted(public.iterdir()) if p.is_file() and p.name != 'artifact-manifest.json'})
    print(json.dumps({'out': str(public), 'archive_bytes': archive.stat().st_size, 'episodes': audit['episodes']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run', type=Path)
    package(parser.parse_args().run)
