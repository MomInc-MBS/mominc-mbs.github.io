"""Synthetic transport tests; no local inference or genuine footage used."""
import json
from unittest.mock import patch

import pytest

from hive.storage import Store
from hive.video_mission import run_mission


def inputs(tmp_path):
    source = tmp_path / 'source'
    source.mkdir()
    (source / 'input.mp4').write_bytes(b'synthetic; probe mocked')
    (source / 'input.srt').write_text(
        '8\n00:00:02,000 --> 00:00:03,000\nSecond cue\n\n'
        '4\n00:00:00,000 --> 00:00:01,000\nFirst cue\n', encoding='utf-8')
    mission = tmp_path / 'mission.json'
    mission.write_text(json.dumps({'allowed_root': str(source), 'media': 'input.mp4',
                                   'subtitles': 'input.srt'}))
    config = tmp_path / 'config.json'
    config.write_text(json.dumps({'routes': ['local_direct', 'tool'], 'max_requests': 1,
                                  'max_total_tokens': 128, 'max_retries': 0}))
    return tmp_path / 'store', mission, config


def catalog(digest='synthetic-pinned'):
    return {'available': True, 'models': [{'id': 'myr5-hold-local:latest', 'digest': digest}]}


def test_verified_local_transport_changes_preference_and_replays_once(tmp_path):
    args = inputs(tmp_path)
    response = {'model': 'myr5-hold-local:latest',
                'message': {'content': '{"cue_ids":["c0002","c0001"]}'}, 'eval_count': 18}
    with patch('hive.video_mission._probe', return_value=4), \
         patch('hive.model_registry.discover', return_value=catalog()), \
         patch('hive.adapters.ollama.post_json', return_value=response) as transport:
        first = run_mission(*args)
        second = run_mission(*args)
    assert first == second
    assert transport.call_count == 1
    assert first['learning']['clip_route_used'] == 'local_direct'
    assert first['learning']['next_proposed_route'] == 'tool'
    assert first['learning']['next_proposed_route_executed'] is False
    assert first['learning']['policy_before_sha256'] != first['learning']['policy_after_sha256']
    assert first['resource_use']['generated_tokens'] == 18
    assert first['editorial_status'] == 'needs_operator_review'
    store = Store(args[0])
    try:
        assert store.get('budget')['requests'] == 1
        assert store.get('policy')['counts']['video_clips']['local_direct']['n'] == 1
        assert store.get('current_checkpoint') is None
    finally:
        store.close()


def test_digest_changes_inside_adapter_before_transport(tmp_path):
    args = inputs(tmp_path)
    # Intake, caption dispatch, clip dispatch see the pinned model; the adapter
    # independently detects the final catalog change before submitting a request.
    with patch('hive.video_mission._probe', return_value=4), \
         patch('hive.model_registry.discover', side_effect=[catalog()] * 3 + [catalog('changed')]), \
         patch('hive.adapters.ollama.post_json') as transport:
        with pytest.raises(RuntimeError, match='failed verification'):
            run_mission(*args)
    transport.assert_not_called()
    assert not (args[0] / 'output' / 'clips.json').exists()
