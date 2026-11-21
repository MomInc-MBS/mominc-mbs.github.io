import json
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from hive.storage import Store
from hive.video_mission import _atomic_output, _safe_file, run_mission


@pytest.fixture
def mission(tmp_path):
    source = tmp_path / 'source'
    source.mkdir()
    (source / 'video.mp4').write_bytes(b'synthetic media')
    (source / 'captions.srt').write_text('1\n00:00:00,000 --> 00:00:01,000\nFirst cue\n\n2\n00:00:01,100 --> 00:00:02,000\nSecond cue\n', encoding='utf-8')
    spec = tmp_path / 'mission.json'
    spec.write_text(json.dumps({'allowed_root': str(source), 'media': 'video.mp4', 'subtitles': 'captions.srt'}))
    config = tmp_path / 'config.json'
    config.write_text(json.dumps({'routes': ['tool'], 'max_retries': 0}))
    return tmp_path / 'store', spec, config, source


def run(args):
    with patch('hive.video_mission._probe', return_value=3.0):
        return run_mission(*args[:3])


def test_changed_source_and_corrupted_output_fail_closed(mission):
    result = run(mission)
    output = Path(result['captions'])
    output.write_text('corrupt')
    with pytest.raises((ValueError, RuntimeError)):
        run(mission)
    assert output.read_text() == 'corrupt'
    (mission[3] / 'captions.srt').write_text('changed')
    with pytest.raises((ValueError, RuntimeError)):
        run(mission)


def test_path_escape_and_symlink_rejected(mission, tmp_path):
    store, spec, config, source = mission
    outside = tmp_path / 'outside.srt'
    outside.write_text('outside')
    data = json.loads(spec.read_text())
    data['subtitles'] = '../outside.srt'
    spec.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        run(mission)
    link = source / 'link.srt'
    try:
        link.symlink_to(outside)
    except OSError:
        pytest.skip('OS does not allow creating symlinks')
    data['subtitles'] = 'link.srt'
    spec.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        run(mission)


def test_stop_and_cycle_limit_prevent_output(mission):
    store, spec, config, _ = mission
    store.mkdir()
    (store / 'STOP').write_text('stop')
    with pytest.raises((ValueError, RuntimeError)):
        run(mission)
    assert not (store / 'output' / 'captions.srt').exists()
    (store / 'STOP').unlink()
    config.write_text(json.dumps({'routes': ['tool'], 'max_retries': 0, 'max_cycles': 1}))
    # A stopped store may already bind its configuration; use a fresh store.
    limited = (store.parent / 'limited', spec, config, mission[3])
    with pytest.raises((ValueError, RuntimeError)):
        run(limited)
    assert not (limited[0] / 'output' / 'captions.srt').exists()
    with pytest.raises((ValueError, RuntimeError)):
        run(limited)


def test_post_write_before_receipt_reconciles_without_overwrite(tmp_path):
    store = Store(tmp_path / 'store')
    try:
        with patch('hive.video_mission.os.replace', side_effect=lambda src, dst: (os.rename(src, dst), (_ for _ in ()).throw(RuntimeError('crash')))):
            with pytest.raises(RuntimeError):
                _atomic_output(store, 'captions.srt', b'one')
        path = store.root / 'output' / 'captions.srt'
        before = path.stat().st_mtime_ns
        assert _atomic_output(store, 'captions.srt', b'one') == str(path)
        assert path.stat().st_mtime_ns == before
        with pytest.raises(ValueError):
            _atomic_output(store, 'captions.srt', b'two')
    finally:
        store.close()


def test_stale_model_before_dispatch_blocks_calls(mission):
    store, spec, config, _ = mission
    config.write_text(json.dumps({'routes': ['tool', 'local_direct'], 'max_retries': 0}))
    catalogs = [{'models': [{'id': 'myr5-hold-local:latest', 'digest': 'first'}]},
                {'models': [{'id': 'myr5-hold-local:latest', 'digest': 'changed'}]}]
    with patch('hive.video_mission._probe', return_value=3.0), patch('hive.model_registry.discover', side_effect=catalogs), patch('hive.orchestrator.execute') as execute:
        with pytest.raises(ValueError, match='digest changed'):
            run_mission(store, spec, config)
        execute.assert_not_called()


def test_stop_blocks_recreation_of_missing_cached_output(mission):
    result = run(mission)
    captions = Path(result['captions'])
    captions.unlink()
    (mission[0] / 'STOP').write_text('stop')
    with pytest.raises((ValueError, RuntimeError)):
        run(mission)
    assert not captions.exists()


def test_unknown_existing_output_is_never_overwritten(tmp_path):
    store = Store(tmp_path / 'store')
    try:
        output = store.root / 'output'
        output.mkdir()
        target = output / 'captions.srt'
        target.write_bytes(b'operator file')
        with pytest.raises(ValueError):
            _atomic_output(store, 'captions.srt', b'generated file')
        assert target.read_bytes() == b'operator file'
    finally:
        store.close()


@pytest.mark.skipif(os.name != 'nt', reason='Windows junction test')
def test_output_junction_cannot_redirect_effects(tmp_path):
    store = Store(tmp_path / 'store')
    outside = tmp_path / 'outside'
    outside.mkdir()
    try:
        proc = subprocess.run(['cmd', '/c', 'mklink', '/J', str(store.root / 'output'), str(outside)], capture_output=True, text=True)
        if proc.returncode:
            pytest.skip('Windows junction unavailable: ' + proc.stderr)
        with pytest.raises((ValueError, OSError)):
            _atomic_output(store, 'captions.srt', b'generated')
        assert not (outside / 'captions.srt').exists()
    finally:
        store.close()


@pytest.mark.skipif(os.name != 'nt', reason='Windows junction test')
def test_input_junction_is_rejected_even_within_allowed_root(mission):
    store, spec, config, source = mission
    inner = source / 'inner'
    inner.mkdir()
    (inner / 'subtitle.srt').write_text('1\n00:00:00,000 --> 00:00:01,000\nCue\n\n2\n00:00:01,100 --> 00:00:02,000\nCue two\n')
    link = source / 'junction'
    proc = subprocess.run(['cmd', '/c', 'mklink', '/J', str(link), str(inner)], capture_output=True, text=True)
    if proc.returncode:
        pytest.skip('Windows junction unavailable: ' + proc.stderr)
    data = json.loads(spec.read_text())
    data['subtitles'] = 'junction/subtitle.srt'
    spec.write_text(json.dumps(data))
    with pytest.raises((ValueError, OSError)):
        _safe_file(source, 'junction/subtitle.srt')


def _child(mission, phase):
    store, spec, config, _ = mission
    script = r'''
import os, sys
from unittest.mock import patch
from hive.video_mission import run_mission
phase, store, spec, config = sys.argv[1:]
if phase == 'dispatch':
    def die(*a, **k): os._exit(41)
    target = patch('hive.orchestrator.execute', side_effect=die)
elif phase == 'publish':
    import hive.video_mission as vm
    original = os.replace
    def rename_then_die(src, dst):
        original(src, dst)
        if str(dst).endswith('captions.srt'): os._exit(42)
    target = patch('hive.video_mission.os.replace', side_effect=rename_then_die)
else:
    from contextlib import nullcontext
    target = nullcontext()
with patch('hive.video_mission._probe', return_value=3.0), target:
    run_mission(store, spec, config)
'''
    env = dict(os.environ, PYTHONPATH=str(Path('src').resolve()))
    return subprocess.run([sys.executable, '-c', script, phase, str(store), str(spec), str(config)], env=env, capture_output=True, text=True)


def _snapshot(store_path):
    store = Store(store_path)
    try:
        jobs = store.jobs()
        budget = store.get('budget')
        feedback = store.db.execute("SELECT count(*) FROM kv WHERE key LIKE 'feedback:%'").fetchone()[0]
        return jobs, budget, feedback
    finally:
        store.close()


def test_subprocess_death_after_claim_recovers_budget_and_feedback(mission):
    killed = _child(mission, 'dispatch')
    assert killed.returncode == 41, killed.stderr
    jobs, budget, feedback = _snapshot(mission[0])
    assert jobs[0]['state'] == 'RUNNING'
    assert budget['cycles'] == 1
    assert feedback == 0
    resumed = _child(mission, 'resume')
    assert resumed.returncode == 0, resumed.stderr
    after, new_budget, feedback = _snapshot(mission[0])
    assert [j['id'] for j in after] == [j['id'] for j in jobs]
    assert new_budget['cycles'] >= budget['cycles']
    assert feedback == 2
    again = _child(mission, 'resume')
    assert again.returncode == 0, again.stderr
    final, final_budget, final_feedback = _snapshot(mission[0])
    assert [j['id'] for j in final] == [j['id'] for j in jobs]
    assert final_budget == new_budget
    assert final_feedback == feedback


def test_subprocess_death_after_rename_reconciles_same_output(mission):
    killed = _child(mission, 'publish')
    assert killed.returncode == 42, killed.stderr
    target = mission[0] / 'output' / 'captions.srt'
    before = target.read_bytes(), target.stat().st_mtime_ns
    jobs, budget, feedback = _snapshot(mission[0])
    resumed = _child(mission, 'resume')
    assert resumed.returncode == 0, resumed.stderr
    after, new_budget, new_feedback = _snapshot(mission[0])
    assert (target.read_bytes(), target.stat().st_mtime_ns) == before
    assert [j['id'] for j in after] == [j['id'] for j in jobs]
    assert new_budget == budget
    assert new_feedback == feedback == 2
