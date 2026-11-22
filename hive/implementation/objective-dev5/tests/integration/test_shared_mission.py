"""Independent DAG controller integration checks with deterministic media and code."""
import importlib.util
import json
from pathlib import Path
from unittest.mock import patch
import pytest
from hive.adapters.isolation import FixtureIsolation
from hive.mission import run_mission_manifest
from hive.storage import Store

_spec = importlib.util.spec_from_file_location('hive_independent_code_fixtures', Path(__file__).parents[1] / 'adversarial' / 'test_code_isolation.py')
_module = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_module)
pinned_repo = _module.pinned_repo


def dag(tmp_path, repo, wrong=False):
    repo['synthetic_fixture'] = {'synthetic':True,'id':'dag-fixture','exit_code':0,
                                 'results':[{'id':'a','value':999 if wrong else 4},{'id':'b','value':999 if wrong else 10}]}
    source = tmp_path / 'media'; source.mkdir()
    (source / 'video.mp4').write_bytes(b'synthetic video')
    (source / 'captions.srt').write_text('1\n00:00:00,000 --> 00:00:01,000\nFirst\n\n2\n00:00:01,100 --> 00:00:02,000\nSecond\n',encoding='utf-8')
    video={'allowed_root':str(source),'media':'video.mp4','subtitles':'captions.srt'}
    value={'schema_version':1,'id':'independent-dag','stages':[{'id':'code','family':'code','manifest':repo,'depends_on':[],'max_retries':0},{'id':'video','family':'video','manifest':video,'depends_on':['code'],'max_retries':0}]}
    path=tmp_path/'dag.json';path.write_text(json.dumps(value),encoding='utf-8');return path


def test_shared_dag_both_families_and_replay(tmp_path, pinned_repo):
    path=dag(tmp_path,pinned_repo);root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        first=run_mission_manifest(path,root,isolation=FixtureIsolation())
        assert first['status']=='COMPLETED'
        assert first['stages']['code']['state']=='SYNTHETIC_ONLY'
        assert first['stages']['video']['state']=='OBJECTIVE_VERIFIED_REVIEW_PENDING'
        second=run_mission_manifest(path,root,isolation=FixtureIsolation())
    assert first['budget']==second['budget']
    assert first['stages']==second['stages']
    assert first['stages']['code']['result']['patches']==second['stages']['code']['result']['patches']
    assert first['stages']['video']['result']['captions']==second['stages']['video']['result']['captions']


def test_failed_dependency_blocks_video(tmp_path,pinned_repo):
    path=dag(tmp_path,pinned_repo,wrong=True);root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        result=run_mission_manifest(path,root,isolation=FixtureIsolation())
        replay=run_mission_manifest(path,root,isolation=FixtureIsolation())
    assert replay['status']=='FAILED' and replay['stages']['video']['state']=='BLOCKED_DEPENDENCY' and replay['budget']==result['budget']
    assert result['status']=='FAILED'
    assert result['stages']['code']['state']=='FAILED'
    assert result['stages']['video']['state']=='BLOCKED_DEPENDENCY'
    assert not (root/'output'/'captions.srt').exists()


@pytest.mark.parametrize('barrier,status', [('STOP','STOPPED'),('independent-dag.CANCEL','CANCELLED')])
def test_shared_barrier_blocks_dispatch(tmp_path,pinned_repo,barrier,status):
    path=dag(tmp_path,pinned_repo);root=tmp_path/'store';root.mkdir();(root/barrier).touch()
    result=run_mission_manifest(path,root,isolation=FixtureIsolation())
    assert result['status']==status and result['stages']=={}
    store=Store(root)
    try: assert store.jobs()==[]
    finally: store.close()


def test_dag_running_stage_recovers_without_extra_dispatch(tmp_path,pinned_repo):
    path=dag(tmp_path,pinned_repo);root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        first=run_mission_manifest(path,root,isolation=FixtureIsolation())
        assert first['status']=='COMPLETED'
        store=Store(root)
        try:
            before_jobs=[j['id'] for j in store.jobs()]
            state=store.get('mission_dag:independent-dag');state['stages']['code']['state']='RUNNING';state['state']='RUNNING'
            store.set('mission_dag:independent-dag',state)
        finally: store.close()
        recovered=run_mission_manifest(path,root,isolation=FixtureIsolation())
    assert recovered['status']=='COMPLETED' and recovered['budget']==first['budget']
    assert recovered['stages']['code']['attempts']==1
    store=Store(root)
    try: assert [j['id'] for j in store.jobs()]==before_jobs
    finally: store.close()


def test_dag_replay_rejects_corrupt_video_output(tmp_path,pinned_repo):
    from hive.mission import MissionManifestError
    path=dag(tmp_path,pinned_repo);root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        first=run_mission_manifest(path,root,isolation=FixtureIsolation())
        assert first['status']=='COMPLETED'
        Path(first['stages']['video']['result']['captions']).write_text('corrupt',encoding='utf-8')
        with pytest.raises(MissionManifestError): run_mission_manifest(path,root,isolation=FixtureIsolation())


def test_dag_replay_rejects_corrupt_code_output(tmp_path,pinned_repo):
    from hive.mission import MissionManifestError
    path=dag(tmp_path,pinned_repo);root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        first=run_mission_manifest(path,root,isolation=FixtureIsolation())
        assert first['status']=='COMPLETED'
        output=first['stages']['code']['result']['named_outputs']['p']['verdict.json']
        Path(output).write_text('corrupt',encoding='utf-8')
        with pytest.raises(MissionManifestError):run_mission_manifest(path,root,isolation=FixtureIsolation())


def test_dag_replay_rejects_changed_cached_stage_receipt(tmp_path,pinned_repo):
    from hive.mission import MissionManifestError
    path=dag(tmp_path,pinned_repo);root=tmp_path/'store'
    with patch('hive.video_mission._probe',return_value=3.0):
        first=run_mission_manifest(path,root,isolation=FixtureIsolation())
        assert first['status']=='COMPLETED'
        store=Store(root)
        try:
            state=store.get('mission_dag:independent-dag')
            state['stages']['code']['result']['patches']['p']['verification']['passed']=False
            store.set('mission_dag:independent-dag',state)
        finally: store.close()
        with pytest.raises(MissionManifestError):run_mission_manifest(path,root,isolation=FixtureIsolation())
