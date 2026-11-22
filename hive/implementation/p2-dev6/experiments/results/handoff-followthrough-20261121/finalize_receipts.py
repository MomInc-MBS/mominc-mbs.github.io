"""Assemble final campaign receipts from completed checks; never run a mission."""
from datetime import datetime, timezone
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sys.path.insert(0, str(ROOT / 'src'))
from hive.orchestrator import code_version
from hive.storage import Store
from hive.work_queue import BuildQueue


def read(path):
    # json.loads(bytes) honors UTF-8/16 BOMs without rewriting original receipts.
    return json.loads((BASE / path).read_bytes())


def write(name, value):
    (BASE / name).write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def tests(path):
    root = ET.parse(BASE / path).getroot()
    suites = [root] if root.tag == 'testsuite' else root.findall('testsuite')
    values = {k: sum(int(s.get(k, 0)) for s in suites) for k in ('tests', 'failures', 'errors', 'skipped')}
    return {'passed': values['tests'] - values['failures'] - values['errors'] - values['skipped'],
        'failed': values['failures'], 'errors': values['errors'], 'skipped': values['skipped'],
        'seconds': sum(float(s.get('time', 0)) for s in suites), 'receipt': path}


def e2e(path):
    report = read(path)['run']
    summary = report['summary']
    return {**summary, 'status': report['status'], 'receipt': path,
        'seconds': (datetime.fromisoformat(report['finishedAt'].replace('Z', '+00:00')) -
                    datetime.fromisoformat(report['startedAt'].replace('Z', '+00:00'))).total_seconds()}


def main():
    runtime = read('output-comparison-final.json')['runtime']
    assert code_version()['source_sha256'] == runtime['source_sha256']
    baseline = tests('terra/pytest.xml')
    final = tests('terra-final/pytest.xml')
    journeys = e2e('terra-final/e2e/report.json')
    smoke = read('terra-final/objective-smoke.json')
    terra = read('terra-final/verdict.json')
    grok = read('grok/review.json')
    assert terra['status'] == 'passed'
    assert terra['source_sha256'] == runtime['source_sha256']
    assert grok['status'] == 'reviewed' and grok['unresolved_blockers'] == []
    assert read('terra-final/doctor.json')['build']['source_sha256'] == runtime['source_sha256']
    assert final['failed'] == final['errors'] == 0 and final['passed'] >= 400
    assert journeys['passed'] == journeys['executed'] == 7 and journeys['failed'] == 0
    assert smoke['task_count'] == 12 and smoke['passed'] is True and smoke['actual_model_requests'] == 0
    assert smoke['all_verifiers_passed'] and smoke['all_replayed_with_equal_budget']
    reconciliation = read('baseline-reconciliation.json')
    ledger = {}
    for name, previous in reconciliation['spent_ledgers'].items():
        store = ROOT / '.hive' / name
        db = sqlite3.connect((store / 'hive.sqlite3').resolve().as_uri() + '?mode=ro', uri=True)
        try:
            budget = json.loads(db.execute("SELECT value FROM kv WHERE key='budget'").fetchone()[0])
        finally:
            db.close()
        ledger[name] = {'budget': budget, 'STOP_present': (store / 'STOP').exists()}
        assert ledger[name] == previous
    write('budget-final.json', {'spent_ledgers': ledger, 'unchanged': True,
        'new_authorized_hive_model_calls': 0, 'actual_new_hive_model_calls': 0})
    write('independent-verdict.json', {'scope': 'engineering and public synthetic development only',
        'runtime': runtime, 'candidate_decision': 'QUARANTINE',
        'level_a': 'NOT_ACCEPTED; 0 genuine attempted; 0 accepted', 'level_b': 'UNTESTED',
        'promotion_authorized': False, 'independent_verifier': 'Terra', 'terra_verdict': terra,
        'grok_verdict': grok,
        'policy_review': 'sol/review.md', 'adversarial_review': 'grok/review.json',
        'baseline_suite': baseline, 'baseline_cli_first_attempt': e2e('terra/e2e-first-report.json'),
        'baseline_cli_retry': e2e('terra/e2e-adaptive-retry-report.json'),
        'candidate_suite': final, 'candidate_cli_journeys': journeys,
        'public_comparison_replay': read('p2-evidence-replay.json'),
        'limits': ['Same-machine engineering checks, not independent scientific replication.',
            'No real model-specialist/team quality comparison; no new allocation.',
            'Resource-exhausted interrupted v4 observations stay queued for operator reconciliation.',
            'Manually incomplete trusted v4 snapshots can default memory on; strict rejection is deferred.',
            'Feedback elapsed_s is diagnostic, not independently replayed deadline or wall-budget proof.',
            'Grok inline response was captured, but its stalled transport was stopped without terminal sign-off.',
            'Historical route-skill aggregate reconstruction and cross-source transfer are not established.']})
    with closing(Store(ROOT / '.hive/handoff-build-queue')) as store:
        queue = BuildQueue(store)
        outcomes = [
            ('reconcile', 'passed', {'receipt': 'baseline-reconciliation.json', 'unexplained_differences': 0}),
            ('p2-safety', 'passed', {'receipt': 'negative-comparison-final.json', 'runtime': runtime}),
            ('independent-checks', 'passed', {'receipt': 'independent-verdict.json', 'tests': final}),
            ('matched-output', 'passed', {'receipt': 'comparison.json', 'quality_delta': 0, 'decision': 'QUARANTINE'}),
            ('objective-smoke', 'passed', {'receipt': 'terra-final/objective-smoke.json', 'tasks': 12}),
            ('acceptance-intake', 'blocked', {'report': 'docs/LEVEL_A_ACCEPTANCE.md',
                'missing': '12 approved unused sources, protected verifiers, source-specific finite resource allocation'}),
            ('learning-study', 'blocked', {'report': 'docs/LEVEL_B_LEARNING_STUDY.md',
                'missing': 'Level A acceptance, independent final preregistration, separate study allocation'})]
        for item, outcome, evidence in outcomes:
            state = queue.status()
            existing = next(row for row in state['items'] if row['id'] == item)
            if existing['status'] == 'PENDING':
                queue.record(item, outcome=outcome, evidence=evidence)
        write('queue-before-publication.json', queue.status())
    manifest = {'version': 1, 'campaign_id': BASE.name, 'date_utc': datetime.now(timezone.utc).isoformat(),
        'scope': 'Synthetic P2 safety development; no genuine acceptance or learning gain',
        'measured_runtime': runtime, 'baseline_reconciliation': 'baseline-reconciliation.json',
        'baseline_suite': baseline, 'tests': final, 'cli_journeys': journeys,
        'objective_smoke': {'tasks': 12, 'exact_passed': 12, 'replay_passed': 12,
            'receipt': 'terra-final/objective-smoke.json', 'new_model_calls': 0},
        'comparison': 'comparison.json', 'trace': 'trace.jsonl', 'decision': 'decision.md',
        'independent_verdict': 'independent-verdict.json', 'rollback': 'rollback-reference.json',
        'public_replay': read('p2-evidence-replay.json'), 'budget_receipt': 'budget-final.json',
        'new_real_model_calls': 0, 'level_a': 'NOT_ACCEPTED;0 genuine attempted,0 accepted',
        'level_b': 'UNTESTED', 'policy_deployed': False, 'P2_decision': 'QUARANTINE', 'quality_gain': False,
        'source_scope': 'six structured-data plus six Python; explicit Ian confirmation overrides attached older video wording',
        'exposure_ledger': 'Public synthetic development only; no new acceptance/holdout sources acquired or exposed.',
        'agent_roles': {'Astra': 'parent coordinator and release checks', 'Sol': 'gpt-6.1-sol; policy/contracts/export',
            'Luna': 'gpt-6-luna; implementation', 'Terra': 'gpt-6.1-terra; independent clean-package verification',
            'Grok': 'grok-4.7-build-fast; bounded adversarial review; see grok/review.json'},
        'routing': 'Previously consulted Ruflo recommendation was a generic fallback; explicit handoff named roles selected. No provider silently substituted; optional NVIDIA unused.',
        'failure_retention': ['luna/focused-test-failure-log.txt', 'parent-review-repairs.xml',
            'terra/e2e-first-report.json', 'terra/v4-feedback-probe.json', 'terra/v4-rollback-probe.json',
            'terra/v4-final-cycle-probe.json'], 'files': {}}
    for path in sorted(BASE.rglob('*')):
        relative = path.relative_to(BASE)
        if (not path.is_file() or path.is_symlink() or path.name == 'manifest.json' and path.parent == BASE
                or any(part in ('probe-stores', 'pytest-temp', '__pycache__', '.pytest_cache') for part in relative.parts)
                or path.suffix in ('.sqlite3', '.db', '.pyc', '.lock')):
            continue
        raw = path.read_bytes()
        manifest['files'][relative.as_posix()] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    write('manifest.json', manifest)
    print(json.dumps({'tests': final, 'journeys': journeys, 'public_evidence_files': len(manifest['files'])}, indent=2))


if __name__ == '__main__':
    main()
