"""Package reviewed public files and prepare the existing static HIVE publication."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path, required=True)
    args = parser.parse_args()
    site = args.site.resolve() / 'hive'
    public = REPO / 'build/prototype-v04/public'
    decision = json.loads((public / 'release-decision.json').read_text())
    assert decision['status'] == 'READY_FOR_LIVE_DEMO' and decision['new_real_model_calls'] == 0
    spec = importlib.util.spec_from_file_location('exporter', REPO / 'scripts/export_snapshot.py')
    exporter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(exporter)
    destination = site / 'implementation/prototype-v04'
    archive = site / 'downloads/HIVE_Operational_Prototype_v0_4_0_dev1.zip'
    manifest = exporter.export_snapshot(REPO, destination, archive)
    assert manifest['tracked_dirty'] is False
    digest = hashlib.sha256()
    for path in sorted((destination / 'src/hive').rglob('*.py')):
        digest.update(path.relative_to(destination / 'src/hive').as_posix().encode())
        digest.update(path.read_bytes())
    assert digest.hexdigest() == decision['runtime_source_sha256']
    record = {'date': datetime.now(timezone.utc).isoformat(), 'status': decision['status'],
        'source_commit': manifest['source_commit'], 'tracked_dirty': False, 'runtime_version': decision['version'],
        'runtime_source_sha256': digest.hexdigest(), 'measured_runtime_source_sha256': digest.hexdigest(),
        'measured_source_commit': decision['measured_source_commit'],
        'download': archive.relative_to(site).as_posix(), 'download_sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
        'snapshot_manifest': 'implementation/prototype-v04/SNAPSHOT_MANIFEST.json',
        'snapshot_file_count': len(manifest['files']),
        'evidence_manifest': 'implementation/prototype-v04/build/prototype-v04/public/evidence-index.json',
        'release_decision': 'implementation/prototype-v04/build/prototype-v04/public/release-decision.json',
        'tests': decision['tests'], 'cli_journeys': decision['cli_journeys'], 'objective_smoke': decision['objective_smoke'],
        'new_real_model_calls': 0, 'policy_deployed': False, 'quality_gain': False, 'P2_decision': 'QUARANTINED',
        'level_a': 'NOT_ACCEPTED;0 genuine acceptance attempts,0 accepted', 'level_b': 'UNTESTED',
        'baseline_publication': 'implementation/readiness-dev4-publication.json',
        'previous_supplement': 'implementation/p2-dev6-publication.json',
        'evidence_scope': 'Real-source tool and Docker work plus synthetic regression checks; zero new model calls',
        'headline': 'Real work. An inspectable local workflow.',
        'summary': 'The local console runs typed data through isolated Python, independent review and a report. A bounded candidate comparison rejects ties and verifies a distinct subsequent task. Saved work replays without additional calls.',
        'limitations': 'READY_FOR_LIVE_DEMO: the corrected handoff requires separate approval for new local-model inference. P2 stays quarantined. Beneficial learning and Level A acceptance are unproven.'}
    (site / 'implementation/prototype-v04-publication.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    evidence = '/hive/implementation/prototype-v04/build/prototype-v04/public/'
    note = f'''# HIVE operational workflow — 0.4.0.dev1

**READY_FOR_LIVE_DEMO.** The local console, typed data adapter, isolated Python workflow and bounded candidate comparison are implemented and verified. New local-model inference still needs the separate finite approval specified in the corrected dev6 handoff.

The frozen suite passed **{decision['tests']['passed']} tests**, with three Windows symlink-permission skips and zero failures. Seven serial CLI journeys passed. The existing twelve-task synthetic objective campaign passed, including fresh-process replay. The actual first-party source inventory, both Docker transformations and combined data → Python → independent review → report mission verified. A real-source exact-tool comparison tied, rejected the candidate and verified its distinct subsequent source. All engineering commands replayed with unchanged aggregate budget and **zero new HIVE model calls**.

[Download complete source](/hive/{record['download']}) · [Publication manifest](/hive/implementation/prototype-v04-publication.json) · [Full measured report]({evidence}prototype-report.md) · [Evidence index]({evidence}evidence-index.json)

![Authenticated local HIVE console showing verified work and candidate rejection]({evidence}console/console-desktop.png)

The screenshot is the actual local console running the frozen source. Desktop and 390 px mobile Chromium checks covered registered mission replay, independent stage verdicts, candidate rejection display, artifact download, local health, STOP/resume and process restart. This is browser emulation, not a physical-phone test. The public site serves documentation and source; it does not expose the runtime, tokens or evaluator stores.

## What changed

- Restricted CSV/JSON intake preserves original bytes and fingerprints sources, procedures, model, verifier, policy and outputs. Exact inventory uses the deterministic tool; classification requires a pinned local model and separately approved task fingerprints. Missing independent labels stay review-pending.
- Combined missions share the existing Store, Executor and finite budget. Python consumes the actual verified upstream artifact while host-only expected cases remain fixed. Failed, pending or synthetic stages block real dependencies.
- The candidate loop freezes development, comparison and subsequent source groups before execution. P0, strongest applicable tool, fixed specialist, conditional checker/recovery team and learning-disabled controls are explicit; duplicated executions are aliases. Ties and regressions reject. Governing P0 remains unchanged.
- The authenticated loopback console supports prepared source selection, live state, exact counters, artifacts, learning state, STOP/resume and approved checkpoint restore. Unknown interrupted model outcomes cannot silently dispatch again.

## Measured scope and next action

The [release decision]({evidence}release-decision.json) lists every O1–O10 gate. O5 is blocked by missing new inference authorization. This release is not yet an operationally validated model prototype. The [unapproved proposal]({evidence}operator-approval.proposed.json) pins eight possible classification tasks under one maximum allocation of 24 requests, 128 generated tokens each, 3,072 total tokens, one global request at a time, 1,800 active seconds and 64 MiB. It grants no authority by itself.

The [runbook]({evidence}prepared-runbook.md) prepares and runs the permitted local workflows. [Actual tool/Docker receipts]({evidence}engineering-demo/summary.json), [learning decision]({evidence}engineering-demo/learning.json), [console checks]({evidence}console/report.json) and [independent review]({evidence}independent-review.md) retain exact outcomes. [Earlier failures and limits]({evidence}scope-and-readiness.md) remain visible.

These are first-party development inputs. The learning slices are distinct within their plans; some inventory source files also appeared in the aggregate demo. They are not an untouched research corpus. No beneficial-learning gain, Level A acceptance or P2 promotion is claimed. Level A still requires six unused data sources plus six unused Python snapshots and at least ten accepted outputs of twelve attempted. Level B remains a separate preregistered study with at least 24 held-out tasks.

The preserved [dev6 result](/hive/notes/P2SAFETY/) and [dev4 readiness baseline](/hive/notes/READINESS/) retain their original scope. The main navigation now opens this current engineering update.

Measured implementation commit: `{record['measured_source_commit']}`. Packaging commit: `{record['source_commit']}`. Runtime SHA-256: `{record['runtime_source_sha256']}`. Download SHA-256: `{record['download_sha256']}`.
'''
    note_path = site / 'updates/HIVE_Operational_Prototype_2026-11-22.md'
    if note_path.exists():
        raise ValueError('Versioned prototype note already exists; preserve prior publication')
    note_path.write_text(note, encoding='utf-8')
    updates_path = site / 'updates/index.json'
    updates = json.loads(updates_path.read_text())
    assert not any(row['id'] == 'OPERATIONAL' for row in updates['entries'])
    updates['entries'].append({'id': 'OPERATIONAL', 'path': note_path.relative_to(site).as_posix(),
        'title': 'Operational Workflow — 0.4.0.dev1', 'type': 'build', 'status': 'measured',
        'evidence_status': 'measured', 'implementation_status': 'ready_for_live_demo', 'revision': '0.4.0.dev1',
        'date': '2026-11-22', 'citation_label': 'HIVE operational workflow (22 November 2026 UTC)',
        'tags': ['hive', 'operational-prototype', 'local-console', 'measured'],
        'sha256': hashlib.sha256(note_path.read_bytes()).hexdigest()})
    updates['edges'].extend({'source': source, 'target': 'OPERATIONAL', 'relation': 'related_to'}
                            for source in ('HOME', 'STATUS', 'RELEASES', 'P2SAFETY'))
    updates_path.write_text(json.dumps(updates, indent=2) + '\n', encoding='utf-8')
    release_path = site / 'CURRENT_RELEASE.json'
    release = json.loads(release_path.read_text())
    release['latest_verified'] = {'note_id': 'OPERATIONAL', 'publication_manifest': 'implementation/prototype-v04-publication.json'}
    release_path.write_text(json.dumps(release, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(record, indent=2))


if __name__ == '__main__':
    main()
