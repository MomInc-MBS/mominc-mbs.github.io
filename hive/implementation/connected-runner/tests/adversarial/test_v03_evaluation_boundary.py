"""Independent synthetic controls. No model calls or real holdout stores."""
import json

from hive.task_spec import load_tasks
from hive.verifier import verify


def test_synthetic_confidently_wrong_tool_result_is_rejected():
    task = next(t for t in load_tasks('development', count_per_category=1) if t['category'] == 'tool_routing')
    payload = dict(task['expected'], result=task['expected']['result'] + 1)
    # Confidence/claimed success is metadata, not an oracle.
    checked = verify(task, {'output': json.dumps(payload), 'confidence': 1.0, 'passed': True})
    assert checked['valid'] and not checked['passed'] and checked['quality'] == 0


def test_synthetic_claimed_pass_cannot_override_wrong_answer():
    task = next(t for t in load_tasks('development', count_per_category=1) if t['category'] == 'math')
    checked = verify(task, {'output': json.dumps({'answer': task['expected']['answer'] + 1}), 'passed': True, 'quality': 1})
    assert checked['valid'] and not checked['passed'] and checked['quality'] == 0

# Registry fixtures are synthetic; tmp_path databases are disposable.
def _case(split, n=0):
    import hashlib
    return {'task_id': f'{split}-{n}', 'family_id': f'family-{split}-{n}',
            'generator_or_source_id': f'source-{split}-{n}', 'split': split,
            'creation_time': '2026-11-21T00:00:00Z',
            'fixture_hash': hashlib.sha256(json.dumps({'prompt': f'synthetic prompt {split}-{n}'}, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest(),
            'gold_verifier_version': 'synthetic-v1', 'exposure_status': 'unexposed',
            'consumed_at': None, 'public': {'prompt': f'synthetic prompt {split}-{n}'},
            'private': {'gold': 'SYNTHETIC_SECRET_921'}}


def test_candidate_view_excludes_synthetic_gold(tmp_path):
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        r.register_manifest('m', [_case('development'), _case('holdout')])
        dev = r.get_public_cases('m', 'development')
        held = r.consume_once('m', 'holdout', 'mission', 'policy', 'evaluator')
        assert 'SYNTHETIC_SECRET_921' not in json.dumps([dev, held])
        assert 'private' not in json.dumps([dev, held])
    finally:
        r.close()


def test_same_fixture_cannot_be_relabelled_between_splits(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        original = _case('development')
        relabel = _case('holdout')
        relabel['public'] = original['public'].copy()
        relabel['fixture_hash'] = original['fixture_hash']
        with pytest.raises((ValueError, PermissionError)):
            r.register_manifest('m', [original, relabel])
    finally:
        r.close()


def test_same_heldout_case_cannot_be_reused_via_new_manifest(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        case = _case('holdout')
        r.register_manifest('first', [case])
        r.consume_once('first', 'holdout', 'mission-a', 'policy-a', 'evaluator-a')
        with pytest.raises((ValueError, PermissionError)):
            r.register_manifest('alias', [case])
            r.consume_once('alias', 'holdout', 'mission-b', 'policy-b', 'evaluator-a')
    finally:
        r.close()


def test_synthetic_one_use_survives_process_exit_and_identity_mutation(tmp_path):
    import os
    import subprocess
    import sys
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    path = tmp_path / 'registry.db'
    r = BenchmarkRegistry(path)
    r.register_manifest('m', [_case('holdout'), _case('future')])
    r.close()
    code = ("import os,sys; from hive.benchmark_registry import BenchmarkRegistry; "
            "r=BenchmarkRegistry(sys.argv[1]); "
            "r.consume_once('m',sys.argv[2],'mission','policy','eval-v1'); os._exit(0)")
    for split in ('holdout', 'future'):
        subprocess.run([sys.executable, '-c', code, str(path), split], check=True, env=os.environ.copy())
        r = BenchmarkRegistry(path)
        try:
            assert r.consume_once('m', split, 'mission', 'policy', 'eval-v1')[0]['exposure'] == 'resumed'
            for identity in [('new-mission', 'policy', 'eval-v1'), ('mission', 'new-policy', 'eval-v1'), ('mission', 'policy', 'eval-v2')]:
                with pytest.raises((ValueError, PermissionError)):
                    r.consume_once('m', split, *identity)
        finally:
            r.close()


def test_relabelled_heldout_fixture_cannot_be_consumed_again(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        case = _case('holdout')
        alias = _case('holdout', 1)
        alias['public'] = case['public'].copy()
        alias['fixture_hash'] = case['fixture_hash']
        r.register_manifest('first', [case])
        r.consume_once('first', 'holdout', 'mission-a', 'policy-a', 'eval')
        with pytest.raises((ValueError, PermissionError)):
            r.register_manifest('alias', [alias])
            r.consume_once('alias', 'holdout', 'mission-b', 'policy-b', 'eval')
    finally:
        r.close()


def test_nested_gold_in_public_payload_is_rejected(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        case = _case('development')
        case['public']['nested'] = [{'expected': 'SYNTHETIC_SECRET_921'}]
        with pytest.raises(ValueError):
            r.register_manifest('m', [case])
    finally:
        r.close()


def test_source_case_and_whitespace_alias_cannot_cross_splits(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        dev = _case('development')
        hold = _case('holdout')
        hold['generator_or_source_id'] = '  ' + dev['generator_or_source_id'].upper() + '  '
        with pytest.raises((ValueError, PermissionError)):
            r.register_manifest('m', [dev, hold])
    finally:
        r.close()


def test_changed_registered_manifest_or_evaluator_ref_is_rejected(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'registry.db')
    try:
        case = _case('future')
        r.register_manifest('m', [case])
        r.consume_once('m', 'future', 'mission', 'policy', 'eval-config-sha-a')
        mutated = _case('future')
        mutated['gold_verifier_version'] = 'synthetic-v2'
        with pytest.raises(ValueError):
            r.register_manifest('m', [mutated])
        with pytest.raises((ValueError, PermissionError)):
            r.consume_once('m', 'future', 'mission', 'policy', 'eval-config-sha-b')
    finally:
        r.close()


def _set_public(case, value):
    import hashlib
    case['public'] = value
    case['fixture_hash'] = hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')).hexdigest()
    return case


def test_numeric_and_unicode_equivalent_payloads_cannot_bypass_one_use(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    pairs = [({'prompt': ['café', 1]}, {'prompt': ['cafe\u0301', 1.0]}),
             ({'prompt': {'café': 7}}, {'prompt': {'cafe\u0301': 7.0}})]
    for i, (first, alias) in enumerate(pairs):
        r = BenchmarkRegistry(tmp_path / f'fixture-{i}.db')
        try:
            r.register_manifest('a', [_set_public(_case('holdout'), first)])
            r.consume_once('a', 'holdout', 'mission-a', 'policy-a', 'eval')
            with pytest.raises((ValueError, PermissionError)):
                r.register_manifest('b', [_set_public(_case('holdout', 1), alias)])
                r.consume_once('b', 'holdout', 'mission-b', 'policy-b', 'eval')
        finally:
            r.close()


def test_disguised_gold_field_names_are_rejected_after_valid_hash(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    for i, key in enumerate(('  expected  ', 'ex\u200bpected', 'g\u200cold', ' answer ', 'verifier\u200d_result')):
        r = BenchmarkRegistry(tmp_path / f'gold-{i}.db')
        try:
            case = _set_public(_case('development'), {'prompt': 'synthetic', 'nested': [{key: 'secret'}]})
            with pytest.raises(ValueError):
                r.register_manifest('m', [case])
        finally:
            r.close()


def test_invisible_source_identity_is_rejected(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    r = BenchmarkRegistry(tmp_path / 'ids.db')
    try:
        dev = _case('development')
        hold = _case('holdout')
        hold['generator_or_source_id'] = dev['generator_or_source_id'] + '\u200b'
        with pytest.raises(ValueError):
            r.register_manifest('m', [dev, hold])
    finally:
        r.close()


def test_non_json_native_tuple_cannot_enter_public_or_private(tmp_path):
    import pytest
    from hive.benchmark_registry import BenchmarkRegistry
    for field in ('public', 'private'):
        r = BenchmarkRegistry(tmp_path / f'{field}.db')
        try:
            case = _case('development')
            case[field]['nested'] = ('synthetic', 1)
            if field == 'public':
                _set_public(case, case['public'])  # json.dumps would otherwise silently coerce the tuple
            with pytest.raises(ValueError):
                r.register_manifest('m', [case])
        finally:
            r.close()
