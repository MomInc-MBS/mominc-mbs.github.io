"""Assemble release metadata only from completed frozen verification receipts."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))


def write(name, value):
    text = value if isinstance(value, str) else json.dumps(value, indent=2) + '\n'
    (ROOT / name).write_text(text, encoding='utf-8')


def main():
    tests = ET.parse(ROOT / 'final-verification/pytest.xml').getroot()
    suites = list(tests) if tests.tag == 'testsuites' else [tests]
    counts = {key: sum(int(s.get(key, 0)) for s in suites) for key in ('tests', 'failures', 'errors', 'skipped')}
    counts['passed'] = counts['tests'] - counts['failures'] - counts['errors'] - counts['skipped']
    counts['seconds'] = sum(float(s.get('time', 0)) for s in suites)
    assert counts['failures'] == counts['errors'] == 0
    for name in ('pytest', 'e2e', 'objective', 'replay', 'replay-data'):
        assert (ROOT / ('final-verification/' + name + '.exit')).read_text(encoding='utf-8-sig').strip() == '0', name
    cli = read('final-verification/e2e-report.json')['run']
    assert cli['status'] == 'passed' and cli['summary']['passed'] == 7 and cli['summary']['failed'] == 0
    assert all(len(result['attempts']) == 1 for result in cli['results'])
    demo = read('engineering-demo/summary.json')
    console = read('console/report.json')
    assert demo['status'] == console['status'] == 'PASS'
    proposal = read('operator-approval.proposed.json')
    assert proposal['approved'] is False
    measured = 'dc8cc2d9b421d680d1052ba4f510027ac5a391ad'
    source_sha = 'ef4eb92509af5d5330e90632d178b3cdadc3c11e62f308f58f808be6be625055'
    regression = read('final-verification/manifest.json')
    assert regression['frozen_commit'] == measured and regression['runtime_sha256'] == source_sha
    assert regression['pytest']['passed'] == counts['passed']
    assert regression['pytest']['skipped'] == counts['skipped']
    assert console['frozen_commit'] == measured and console['frozen_runtime_sha256'] == source_sha
    assert console['before'] == console['after_browser'] == console['after_server_restart']
    assert console['new_model_calls'] == console['new_cycles'] == 0
    assert console['page_errors'] == [] and console['mobile_horizontal_overflow'] is False
    assert read('final-verification/doctor-offline.json')['build']['source_sha256'] == source_sha
    assert regression['objective']['verified'] == regression['objective']['equal_budget_fresh_replay'] == 12
    assert demo['budget_before_replay'] == demo['budget_after_replay']
    assert demo['new_real_model_calls'] == demo['budget_after_replay']['requests'] == 0
    checks = {
        'O1_runtime': 'PASS: authenticated local UI/CLI and read-only model/Docker health',
        'O2_data': 'PASS_EXACT_TOOL: real first-party source inventory independently checked; live classification pending',
        'O3_python': 'PASS: pinned Docker transformations with independent host cases',
        'O4_composition': 'PASS: verified real-source data, Python, review and report in one allocation',
        'O5_model': 'BLOCKED: separate finite operator approval not provided; zero new HIVE model calls',
        'O6_evidence': 'PASS_ENGINEERING: tool/source/procedure, verifier, outputs and budget identities checked; new live model/prompt receipt pending',
        'O7_adaptation': 'PASS_ENGINEERING: frozen real-source exact-tool candidate tied and was rejected; live schema recovery pending',
        'O8_subsequent': 'PASS_ENGINEERING: distinct real-source subsequent tool task verified under retained P0 behavior',
        'O9_recovery': 'PASS: fresh-process replay, STOP/resume, reservation reconciliation and approved-only rollback checks',
        'O10_operator': 'PASS: actual Chromium desktop/mobile console journey; not a physical-phone test',
        'R1_beneficial_learning': 'UNPROVEN; no promotion',
        'R2_level_a': 'NOT_ACCEPTED: 0 genuine acceptance attempts, 0 accepted',
    }
    decision = {'schema_version': 1, 'date': datetime.now(timezone.utc).isoformat(),
                'version': '0.4.0.dev1', 'status': 'READY_FOR_LIVE_DEMO',
                'measured_source_commit': measured, 'runtime_source_sha256': source_sha,
                'runtime_identity_commit': 'unversioned (frozen archive)',
                'baseline': 'baseline/baseline.json', 'tests': counts,
                'cli_journeys': {'passed': 7, 'retries': 0, 'workers': 1, 'receipt': 'final-verification/e2e-report.json'},
                'objective_smoke': {'verified': 12, 'fresh_process_replay': 12, 'scope': 'synthetic engineering', 'receipt': 'final-verification/objective-report.json'},
                'real_source_engineering': demo['results'], 'combined_stages': demo['combined_stages'],
                'new_real_model_calls': 0, 'policy_deployed': False, 'P2_decision': 'QUARANTINED',
                'quality_gain': False, 'level_a': 'NOT_ACCEPTED', 'level_b': 'UNTESTED',
                'gates': checks, 'approval_proposal': 'operator-approval.proposed.json',
                'proposal_sha256': hashlib.sha256((ROOT / 'operator-approval.proposed.json').read_bytes()).hexdigest()}
    write('release-decision.json', decision)
    write('unresolved-blockers.json', {'status': decision['status'], 'blockers': [
        {'id': 'LIVE_AUTHORIZATION', 'requires': 'Ian approval of the exact prepared finite local-model allocation',
         'scope': '24 requests total;128 tokens/request;3072 total;one global request;1800s;64MiB;100 cycles',
         'source': 'Corrected handoff WP5: budget is proposed, not already authorized; zero-call dev6 requires separate real authorization',
         'pending_work': ['authorized classification', 'model-backed combined mission', 'live candidate comparison and subsequent distinct task', 'fresh-process real-model receipt replay']},
        {'id': 'ACCEPTANCE_RESEARCH', 'separate_campaign': True,
         'requires': 'six unused data sources and six unused Python snapshots plus independent decisions and finite approval; Level B separate >=24 holdout study'}]})
    gate_table = '\n'.join('| ' + key + ' | ' + value + ' |' for key, value in checks.items())
    text = f'''# HIVE 0.4.0.dev1 measured prototype report

**READY_FOR_LIVE_DEMO.** The local operator workflow is implemented and verified. New HIVE local-model inference remains blocked by the corrected handoff's separate-approval requirement. No operational-model, beneficial-learning, Level A or P2-promotion claim is made.

Frozen implementation: `{measured}`. Runtime SHA-256: `{source_sha}`. The measured archive has identity `unversioned`; the later packaging commit adds evidence without changing runtime bytes.

The final suite passed **{counts['passed']} tests**, with **{counts['skipped']} skips**, zero failures and zero errors. The CLI campaign passed **7/7** with one worker and no retries. The existing objective campaign passed **12/12**, including fresh-process equal-budget replays. These regression fixtures remain synthetic engineering evidence.

The actual first-party inventory, both Docker transformations and four-stage combined mission verified. The source-disjoint inventory learning workflow rejected a tie, retained P0 behavior and verified its distinct subsequent source. Every actual engineering command then replayed in a new process with unchanged aggregate budget: **{demo['budget_after_replay']['cycles']} cycles, 0 requests, 0 tokens**. Original input hashes stayed unchanged.

The final authenticated Chromium console journey used the frozen runtime and the same completed allocation. It checked registered combined replay, learning rejection display, download digest, health, STOP/resume and restart, with desktop and 390 px mobile screenshots. This is emulated mobile testing, not Ian's physical phone.

| Gate | Measured outcome |
| --- | --- |
{gate_table}

## Evidence and reproducibility

- [Baseline and commands](baseline/baseline.json)
- [Scope, preserved failures and gates](scope-and-readiness.md)
- [Independent review and fixes](independent-review.md)
- [Frozen full-suite receipt](final-verification/pytest.xml)
- [CLI journey](final-verification/e2e-report.json)
- [Actual engineering work and replay](engineering-demo/summary.json)
- [Learning arms and rejection](engineering-demo/learning.json)
- [Console journey](console/report.json), [desktop](console/console-desktop.png), [mobile](console/console-mobile.png)
- [Prepared commands](prepared-runbook.md), [unapproved allocation](operator-approval.proposed.json)
- [Remaining gates](unresolved-blockers.json)

Run `scripts/prepare_operational_demo.py` in the shipped source to create immutable permitted inputs. The prepared runbook runs both zero-call and, only after separate approval, live workflows. All live commands share the same pinned allocation. The public proposal documents this machine's exact eight approved-task candidates but grants no authority. Private evaluator contents and runtime databases are excluded from publication.

The demo sources are public first-party development material. Distinct declared source groups and hashes are checked, but do not establish an unbiased independent research corpus. Semantic labels were independently reviewed for development consistency; no HIVE model inference has consumed these sources. The reproducible preparation script contains these public development labels; they are not sealed research oracles. Candidate control aliases do not count as separate independent gains. The strict candidate criterion rejects ties.
'''
    write('prototype-report.md', text)
    write('evidence-index.json', {'schema_version': 1, 'files': {
        p.relative_to(ROOT).as_posix(): {'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size}
        for p in sorted(ROOT.rglob('*')) if p.is_file() and p.name != 'evidence-index.json' and '__pycache__' not in p.parts}})
    print(json.dumps(decision, indent=2))


if __name__ == '__main__':
    main()
