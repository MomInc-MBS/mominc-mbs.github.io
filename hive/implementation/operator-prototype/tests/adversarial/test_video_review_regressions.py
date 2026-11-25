import hashlib
import json
import os
import subprocess

import pytest

from hive.storage import Store
from hive.verifier import verify
from hive.video_mission import _atomic_output, _tasks, run_mission


def test_clip_verifier_rejects_negative_source_time():
    cues = [{'id': 'one', 'start_ms': -1, 'end_ms': 100, 'text': 'one'},
            {'id': 'two', 'start_ms': 200, 'end_ms': 300, 'text': 'two'}]
    task = _tasks('', '', cues, 1000, 'negative')[1]
    verdict = verify(task, {'output': json.dumps({'cue_ids': ['one', 'two']})})
    assert not verdict['passed'] and not verdict['valid']


def test_each_output_consumes_the_remaining_storage_capacity(tmp_path):
    store = Store(tmp_path / 'store')
    data = b'x' * 300
    try:
        # Persist intents before measuring, isolating payload growth from SQLite pages.
        for name in ('captions.srt', 'clips.json'):
            store.set('video_output_intent:' + name,
                      {'sha256': hashlib.sha256(data).hexdigest(), 'size': len(data)})
        current = sum(p.stat().st_size for p in store.root.rglob('*') if p.is_file())
        ceiling = current + 400
        _atomic_output(store, 'captions.srt', data, max_storage_bytes=ceiling)
        with pytest.raises(RuntimeError, match='storage budget'):
            _atomic_output(store, 'clips.json', data, max_storage_bytes=ceiling)
        assert not (store.root / 'output' / 'clips.json').exists()
    finally:
        store.close()


@pytest.mark.skipif(os.name != 'nt', reason='Windows junction boundary')
def test_store_junction_rejected_before_lock_or_database_write(tmp_path):
    outside = tmp_path / 'outside'
    outside.mkdir()
    root = tmp_path / 'store'
    created = subprocess.run(['cmd', '/c', 'mklink', '/J', str(root), str(outside)],
                             capture_output=True, text=True)
    if created.returncode:
        pytest.skip('Windows junction creation unavailable')
    with pytest.raises(ValueError, match='reparse'):
        run_mission(root, tmp_path / 'not-read.json')
    assert list(outside.iterdir()) == []


@pytest.mark.skipif(os.name != 'nt', reason='Windows junction boundary')
def test_allowed_input_root_junction_rejected_before_reading_media(tmp_path):
    outside = tmp_path / 'outside'
    outside.mkdir()
    root = tmp_path / 'inputs'
    created = subprocess.run(['cmd', '/c', 'mklink', '/J', str(root), str(outside)],
                             capture_output=True, text=True)
    if created.returncode:
        pytest.skip('Windows junction creation unavailable')
    mission = tmp_path / 'mission.json'
    mission.write_text(json.dumps({'allowed_root': str(root), 'media': 'absent.mp4',
                                   'subtitles': 'absent.srt'}), encoding='utf-8')
    with pytest.raises(ValueError, match='reparse'):
        run_mission(tmp_path / 'store', mission)
    assert list(outside.iterdir()) == []
