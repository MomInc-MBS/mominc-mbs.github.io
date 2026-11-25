"""Public export boundaries and fresh-process replay; deterministic tools only."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from export_p2_evidence import canonical, export
from replay_p2_exports import replay
from p2_tool_comparison import run


@pytest.fixture(scope='module')
def comparison(tmp_path_factory):
    root = tmp_path_factory.mktemp('p2-public')
    work = root / 'work'
    run(work, root / 'comparison.json', 4)
    # Not reachable from the allowed journals: must never be exported.
    db = sqlite3.connect(work / 'p2/hive.sqlite3')
    db.execute('INSERT INTO kv(key,value) VALUES (?,?)', ('private_unrelated', json.dumps('PRIVATE_SENTINEL')))
    db.commit()
    db.close()
    (work / 'p2/artifacts' / ('f' * 64 + '.json')).write_text('PRIVATE_SENTINEL', encoding='utf-8')
    return work


def test_public_export_replays_in_fresh_process_without_private_kv_or_artifacts(comparison, tmp_path):
    output = tmp_path / 'public'
    result = export(comparison, output)
    assert result['exported_jobs'] == 18
    assert not list(output.rglob('*.sqlite3'))
    assert all('PRIVATE_SENTINEL' not in path.read_text(encoding='utf-8') for path in output.rglob('*.json'))
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1', PYTHONPATH=str(ROOT / 'src'))
    completed = subprocess.run([sys.executable, str(ROOT / 'scripts/replay_p2_exports.py'), '--input', str(output)],
                               text=True, capture_output=True, check=True, env=env, timeout=60)
    receipt = json.loads(completed.stdout)
    assert receipt['status'] == 'passed' and receipt['new_model_calls'] == 0
    assert receipt['policy_receipts'] == {'legacy': 12, '4': 6}
    assert receipt['independently_verified_passes'] == {'strongest_tool': 6, 'learning_disabled': 6, 'p2': 6}
    with pytest.raises(ValueError, match='overwrite'):
        export(comparison, output)


def test_digest_corruption_refused(comparison, tmp_path):
    output = tmp_path / 'public'
    export(comparison, output)
    journal = output / 'p2/journal.json'
    journal.write_bytes(journal.read_bytes() + b' ')
    with pytest.raises(ValueError, match='digest'):
        replay(output)


def test_unknown_file_and_path_escape_refused(comparison, tmp_path):
    output = tmp_path / 'public'
    export(comparison, output)
    (output / 'private.json').write_text('{}')
    with pytest.raises(ValueError, match='unlisted'):
        replay(output)
    (output / 'private.json').unlink()
    manifest = json.loads((output / 'manifest.json').read_bytes())
    manifest['files']['../escape.json'] = {'bytes': 2, 'sha256': hashlib.sha256(b'{}').hexdigest()}
    manifest.pop('manifest_sha256')
    manifest['manifest_sha256'] = hashlib.sha256(canonical(manifest)).hexdigest()
    (output / 'manifest.json').write_bytes(canonical(manifest))
    with pytest.raises(ValueError, match='out-of-scope'):
        replay(output)


@pytest.mark.parametrize('fault', ['holdout', 'budget', 'count', 'feedback'])
def test_export_refuses_unapproved_store_before_writing(comparison, tmp_path, fault):
    import shutil
    work = tmp_path / 'work'
    shutil.copytree(comparison, work)
    db = sqlite3.connect(work / 'p2/hive.sqlite3')
    if fault == 'holdout':
        job, spec = db.execute('SELECT id,spec FROM jobs LIMIT 1').fetchone()
        spec = json.loads(spec)
        spec['task']['split'] = 'holdout'
        db.execute('UPDATE jobs SET spec=? WHERE id=?', (json.dumps(spec), job))
    elif fault == 'budget':
        value = json.loads(db.execute("SELECT value FROM kv WHERE key='budget'").fetchone()[0])
        value['requests'] = 1
        db.execute("UPDATE kv SET value=? WHERE key='budget'", (json.dumps(value),))
    elif fault == 'count':
        db.execute('DELETE FROM jobs WHERE id=(SELECT id FROM jobs LIMIT 1)')
    else:
        db.execute("DELETE FROM kv WHERE key=(SELECT key FROM kv WHERE key LIKE 'feedback:%' LIMIT 1)")
    db.commit()
    db.close()
    output = tmp_path / 'public'
    with pytest.raises(ValueError):
        export(work, output)
    assert not output.exists()


def test_reforged_journal_cannot_disable_candidate_separation(comparison, tmp_path):
    output = tmp_path / 'public'
    export(comparison, output)
    journal_path = output / 'p2/journal.json'
    journal = json.loads(journal_path.read_bytes())
    journal['state']['policy']['partitions']['foreign-partition'] = {'math': {'tool': {'n': 1, 'successes': 1, 'utility_sum': 1}}}
    raw = canonical(journal)
    journal_path.write_bytes(raw)
    manifest = json.loads((output / 'manifest.json').read_bytes())
    manifest['files']['p2/journal.json'] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    manifest.pop('manifest_sha256')
    manifest['manifest_sha256'] = hashlib.sha256(canonical(manifest)).hexdigest()
    (output / 'manifest.json').write_bytes(canonical(manifest))
    with pytest.raises(ValueError, match='candidate state'):
        replay(output)


def test_v3_history_uses_its_original_policy_receipts(tmp_path):
    work = tmp_path / 'v3-work'
    run(work, tmp_path / 'v3-report.json', 3)
    output = tmp_path / 'public'
    export(work, output)
    assert replay(output)['policy_receipts'] == {'legacy': 12, '3': 6}


def test_rehashed_feedback_cannot_change_partition_binding(comparison, tmp_path):
    output = tmp_path / 'public'
    export(comparison, output)
    manifest = json.loads((output / 'manifest.json').read_bytes())
    journal_path = output / 'p2/journal.json'
    journal = json.loads(journal_path.read_bytes())
    feedback_key = next(key for key in journal['state'] if key.startswith('feedback:'))
    original = journal['state'][feedback_key]
    feedback = json.loads((output / 'p2' / original).read_bytes())
    feedback['partition_key'] = 'forged-partition'
    raw = canonical(feedback)
    forged = 'artifacts/' + hashlib.sha256(raw).hexdigest() + '.json'
    (output / 'p2' / forged).write_bytes(raw)
    (output / 'p2' / original).unlink()
    manifest['files'].pop('p2/' + original)
    manifest['files']['p2/' + forged] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    journal['state'][feedback_key] = forged
    raw = canonical(journal)
    journal_path.write_bytes(raw)
    manifest['files']['p2/journal.json'] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    manifest.pop('manifest_sha256')
    manifest['manifest_sha256'] = hashlib.sha256(canonical(manifest)).hexdigest()
    (output / 'manifest.json').write_bytes(canonical(manifest))
    with pytest.raises(ValueError, match='feedback|partition'):
        replay(output)
