"""Independent sandbox boundary checks; no hostile code executes on host."""
import subprocess
import pytest
from hive.adapters.isolation import DockerIsolation, FixtureIsolation, SandboxUnavailable


def test_missing_daemon_blocks_before_any_candidate_execution(monkeypatch, tmp_path):
    calls = []
    def fail(argv, **kwargs):
        calls.append(argv)
        raise subprocess.CalledProcessError(1, argv)
    monkeypatch.setattr(subprocess, 'run', fail)
    monkeypatch.setattr(subprocess, 'Popen', lambda *a, **k: pytest.fail('candidate execution attempted'))
    request = {'repo_copy': str(tmp_path), 'image': {'reference': 'hive/test', 'digest': 'sha256:' + 'a' * 64},
               'limits': {'timeout_s': 1, 'output_bytes': 100, 'memory_mb': 64, 'cpu_count': 1, 'pids': 4},
               'command': ['untrusted-command']}
    with pytest.raises(SandboxUnavailable, match='BLOCKED_SANDBOX'):
        DockerIsolation('docker').execute(request)
    assert calls and calls[0][1] == 'info'


def test_fixture_never_executes_command(monkeypatch):
    monkeypatch.setattr(subprocess, 'Popen', lambda *a, **k: pytest.fail('host execution attempted'))
    with pytest.raises(ValueError): FixtureIsolation().execute({'command': ['untrusted']})
    result = FixtureIsolation().execute({'fixture_result': {'synthetic': True, 'id': 'test', 'exit_code': 0}, 'command': ['untrusted']})
    assert result.receipt['command_executed'] is False
    assert result.receipt['engine'] == 'synthetic_fixture'

@pytest.fixture
def pinned_repo(tmp_path):
    import hashlib, json
    from pathlib import Path
    repo = tmp_path / 'repo'; repo.mkdir()
    (repo / 'app.py').write_text('def double(x): return x * 2\n', encoding='utf-8')
    (repo / 'verifier.json').write_text('{"trusted":true}', encoding='utf-8')
    (repo / 'secrets').mkdir(); (repo / 'secrets' / 'key.txt').write_text('PRIVATE', encoding='utf-8')
    def git(*args, binary=False):
        result = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, check=True)
        return result.stdout if binary else result.stdout.decode().strip()
    git('init', '-q'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'test')
    git('add', '.'); git('commit', '-qm', 'fixture')
    rev = git('rev-parse', 'HEAD'); content = 'def double(x): return x * 2\n'
    sha = lambda b: hashlib.sha256(b).hexdigest()
    manifest = {'schema_version':1, 'id':'adversarial-fixture', 'repo':{'path':str(repo),'revision':rev,'source_sha256':sha(git('archive','--format=tar',rev,binary=True))},
       'verifier':{'path':'verifier.json','sha256':sha((repo/'verifier.json').read_bytes()),'protocol':'json_function_v1','module':'app','function':'double','cases':[{'id':'a','args':[2],'kwargs':{},'expected':4},{'id':'b','args':[5],'kwargs':{},'expected':10}]},
       'worker_files':['app.py'],'allowlist':['app.py'],'patches':[{'id':'p','path':'app.py','content':content,'sha256':sha(content.encode())}],
       'image':{'reference':'python:3.11-slim','digest':'sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535'},
       'limits':{'timeout_s':10,'memory_mb':128,'cpu_count':1,'pids':32,'output_bytes':5000},'network':'none','mounts':'read_only_source_clean_copy'}
    return manifest


def test_rejects_traversal_secret_and_verifier_patch(pinned_repo):
    import copy
    from hive.code_verifier import validate_manifest, MissionValidationError
    validate_manifest(pinned_repo)
    for path in ('../escape.py', 'secrets/key.txt', 'verifier.json', 'tests/test_app.py'):
        altered = copy.deepcopy(pinned_repo)
        altered['worker_files'].append(path); altered['allowlist'] = [path]; altered['patches'][0]['path'] = path
        with pytest.raises(MissionValidationError): validate_manifest(altered)

@pytest.mark.parametrize('candidate,expected_pass', [
    ('def double(x): return x * 2\n', True),
    ('import os\nos._exit(0)\n', False),
    ('print("tests passed")\ndef double(x): return 999\n', False),
    ('import os\ndef double(x): return 4 if os.path.exists("/work/secrets/key.txt") else -1\n', False),
    ('def double(x): return {"passed": True, "reward": 999}\n', False),
])
def test_real_docker_candidate_cannot_forge_success(tmp_path, pinned_repo, candidate, expected_pass):
    import hashlib, json
    from hive.code_verifier import validate_manifest, verify_code_task_output
    repo = tmp_path / 'worker'; repo.mkdir(); (repo / 'app.py').write_text(candidate, encoding='utf-8')
    validated = validate_manifest(pinned_repo)
    request = {'repo_copy':str(repo), 'command':validated['command'], 'image':validated['image'], 'limits':validated['limits']}
    try: isolated = DockerIsolation().execute(request)
    except SandboxUnavailable as exc: pytest.skip(str(exc))
    receipt = dict(isolated.receipt, source_sha256=validated['source_sha256'], verifier_sha256=validated['verifier_sha256'],
                   patch_sha256=validated['patches'][0]['sha256'], operation_key='fixture-operation')
    task = {'input':{'manifest':pinned_repo,'patch_id':'p','operation_key':'fixture-operation'}}
    result = verify_code_task_output(json.dumps({'receipt':receipt}), task)
    assert result['passed'] is expected_pass


def test_extracted_worker_excludes_evaluator_and_secrets(tmp_path, pinned_repo):
    from hive.code_verifier import validate_manifest, extract_clean_snapshot
    destination = tmp_path / 'clean'
    extract_clean_snapshot(validate_manifest(pinned_repo), destination)
    assert (destination / 'app.py').is_file()
    assert not (destination / 'verifier.json').exists()
    assert not (destination / 'secrets' / 'key.txt').exists()


def test_real_code_mission_replays_without_extra_budget(tmp_path, pinned_repo):
    import json
    from hive.code_mission import run_code_mission
    manifest = tmp_path / 'manifest.json'; manifest.write_text(json.dumps(pinned_repo), encoding='utf-8')
    first = run_code_mission(manifest, tmp_path / 'store')
    if first['status'] == 'BLOCKED_SANDBOX': pytest.skip('Docker sandbox unavailable')
    assert first['status'] == 'VERIFIED'
    second = run_code_mission(manifest, tmp_path / 'store')
    assert second['patches'] == first['patches'] and second['budget'] == first['budget']


@pytest.mark.skipif(__import__('os').name != 'nt', reason='Windows junction test')
def test_mission_store_junction_is_rejected(tmp_path, pinned_repo):
    import json
    from hive.code_mission import run_code_mission
    from hive.code_verifier import MissionValidationError
    target = tmp_path / 'outside'; target.mkdir(); link = tmp_path / 'linked'
    created = subprocess.run(['cmd', '/c', 'mklink', '/J', str(link), str(target)], capture_output=True, text=True)
    if created.returncode: pytest.skip('junction creation unavailable')
    manifest = tmp_path / 'manifest.json'; manifest.write_text(json.dumps(pinned_repo), encoding='utf-8')
    with pytest.raises((MissionValidationError, ValueError, OSError)):
        run_code_mission(manifest, link)
    assert not list(target.iterdir())

@pytest.mark.parametrize('point,exit_code', [('before',73), ('after',74)])
def test_code_crash_evidence_commit_recovers_without_fake_completion(tmp_path, pinned_repo, point, exit_code):
    import json, os, sys
    from pathlib import Path
    from hive.code_mission import run_code_mission
    from hive.storage import Store
    manifest = tmp_path / 'manifest.json'; manifest.write_text(json.dumps(pinned_repo), encoding='utf-8')
    store_path = tmp_path / 'store'
    script = r'''import os,sys
from hive.storage import Store
from hive.code_mission import run_code_mission
original=Store.put_artifact
point=sys.argv[3]
def crash(self,value):
    if isinstance(value,dict) and {'job_id','verification','result'}.issubset(value):
        if point=='before': os._exit(73)
        original(self,value); os._exit(74)
    return original(self,value)
Store.put_artifact=crash
run_code_mission(sys.argv[1],sys.argv[2])'''
    env = dict(os.environ, PYTHONPATH=str(Path('src').resolve()))
    child = subprocess.run([sys.executable,'-c',script,str(manifest),str(store_path),point], env=env, capture_output=True,text=True)
    assert child.returncode == exit_code, child.stderr
    store = Store(store_path)
    try:
        jobs = store.jobs(); assert len(jobs) == 1 and jobs[0]['state'] == 'VERIFYING'
        assert store.get('budget')['cycles'] == 1
    finally: store.close()
    result = run_code_mission(manifest, store_path)
    assert result['status'] == 'VERIFIED'
    assert result['budget']['cycles'] == 2
    again = run_code_mission(manifest, store_path)
    assert again['patches'] == result['patches'] and again['budget'] == result['budget']
    store = Store(store_path)
    try:
        assert len(store.jobs()) == 1
        assert store.db.execute("SELECT count(*) FROM kv WHERE key LIKE 'feedback:%'").fetchone()[0] == 0
    finally: store.close()


def test_code_stop_inflight_kills_worker_and_does_not_fake_success(tmp_path, pinned_repo):
    import hashlib, json, os, sys, time
    from pathlib import Path
    from hive.storage import Store
    from hive.code_mission import run_code_mission
    candidate = 'import time\ndef double(x):\n time.sleep(30)\n return x*2\n'
    pinned_repo['patches'][0].update(content=candidate, sha256=hashlib.sha256(candidate.encode()).hexdigest())
    pinned_repo['limits']['timeout_s'] = 30
    manifest = tmp_path / 'manifest.json'; manifest.write_text(json.dumps(pinned_repo),encoding='utf-8')
    root = tmp_path / 'store'
    env = dict(os.environ, PYTHONPATH=str(Path('src').resolve()))
    script = 'import sys;from hive.code_mission import run_code_mission;run_code_mission(sys.argv[1],sys.argv[2])'
    child = subprocess.Popen([sys.executable,'-c',script,str(manifest),str(root)], env=env, stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            if (root/'hive.sqlite3').exists():
                store=Store(root)
                try: inflight=store.get('inflight')
                finally: store.close()
                if inflight: break
            if child.poll() is not None: pytest.fail('mission ended before dispatch: '+child.stderr.read())
            time.sleep(.1)
        else: pytest.fail('mission did not dispatch before deadline')
        (root/'STOP').write_text('stop')
        stdout, stderr = child.communicate(timeout=20)
        assert child.returncode == 0, stderr
        result = run_code_mission(manifest, root)
        assert result['status'] != 'VERIFIED'
        assert not any(p.get('verification',{}).get('passed') for p in result['patches'].values())
        budget = result['budget']
        again = run_code_mission(manifest, root)
        assert again['status'] != 'VERIFIED' and again['budget'] == budget
    finally:
        if child.poll() is None: child.kill(); child.wait(timeout=5)


def test_code_stop_before_dispatch_survives_restart(tmp_path, pinned_repo):
    import json
    from hive.code_mission import run_code_mission
    manifest = tmp_path / 'manifest.json'; manifest.write_text(json.dumps(pinned_repo),encoding='utf-8')
    root = tmp_path / 'store'; root.mkdir(); (root / 'STOP').write_text('stop')
    first = run_code_mission(manifest, root)
    assert first['status'] == 'STOPPED' and not first['patches']
    second = run_code_mission(manifest, root)
    assert second['status'] == 'STOPPED' and not second['patches'] and second['budget'] == first['budget']

@pytest.mark.parametrize('candidate', [
    'import os\nos._exit(0)\n',
    'print("tests passed")\ndef double(x): return 999\n',
    'import os\ndef double(x): return 4 if os.path.exists("/work/verifier.json") or os.path.exists("/work/secrets/key.txt") else -1\n',
])
def test_real_mission_rejects_false_success_and_evaluator_leak(tmp_path, pinned_repo, candidate):
    import hashlib, json
    from hive.code_mission import run_code_mission
    pinned_repo['patches'][0].update(content=candidate, sha256=hashlib.sha256(candidate.encode()).hexdigest())
    manifest = tmp_path / 'manifest.json'; manifest.write_text(json.dumps(pinned_repo), encoding='utf-8')
    result = run_code_mission(manifest, tmp_path / 'store')
    if result['status'] == 'BLOCKED_SANDBOX': pytest.skip('Docker sandbox unavailable')
    assert result['status'] == 'FAILED'
    assert not next(iter(result['patches'].values()))['verification']['passed']


def test_docker_worker_dies_after_host_process_is_killed(tmp_path):
    import os, sys, time
    from pathlib import Path
    root = tmp_path / 'worker'; root.mkdir()
    def running():
        proc = subprocess.run(['docker','ps','--filter','name=hive-code-','--format','{{.Names}}'],capture_output=True,text=True,check=True)
        return set(proc.stdout.splitlines())
    try: before = running()
    except (OSError, subprocess.CalledProcessError): pytest.skip('Docker daemon unavailable')
    script = r'''import sys
from hive.adapters.isolation import DockerIsolation
req={'repo_copy':sys.argv[1],'image':{'reference':'python:3.11-slim','digest':'sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535'},'limits':{'timeout_s':4,'memory_mb':128,'cpu_count':1,'pids':32,'output_bytes':5000},'command':['python','-c','import time;time.sleep(60)']}
DockerIsolation().execute(req)'''
    env = dict(os.environ, PYTHONPATH=str(Path('src').resolve()))
    child = subprocess.Popen([sys.executable,'-c',script,str(root)], env=env, stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    selected = set()
    try:
        deadline=time.monotonic()+15
        while time.monotonic()<deadline:
            selected=running()-before
            if selected: break
            if child.poll() is not None: pytest.fail('sandbox child exited before worker observed')
            time.sleep(.1)
        assert len(selected)==1
        child.kill(); child.wait(timeout=5)
        deadline=time.monotonic()+12
        while time.monotonic()<deadline and running() & selected: time.sleep(.2)
        assert not (running() & selected), 'isolated worker survived its declared wall cap after host death'
    finally:
        if child.poll() is None: child.kill(); child.wait(timeout=5)
        for name in selected:
            subprocess.run(['docker','rm','--force',name],capture_output=True,timeout=10)


def test_code_replay_rejects_other_mission_job(tmp_path,pinned_repo):
    import copy
    from hive.code_mission import run_code_mission
    from hive.code_verifier import MissionValidationError
    from hive.storage import Store
    pinned_repo['synthetic_fixture']={'synthetic':True,'id':'fixture','exit_code':0,'results':[{'id':'a','value':4},{'id':'b','value':10}]}
    other=copy.deepcopy(pinned_repo);other['id']='other-mission';root=tmp_path/'store'
    first=run_code_mission(pinned_repo,root,isolation=FixtureIsolation())
    second=run_code_mission(other,root,isolation=FixtureIsolation())
    store=Store(root)
    try:
        state=store.get('mission:'+pinned_repo['id']);state['patches']['p']['job_id']=second['patches']['p']['job_id']
        store.set('mission:'+pinned_repo['id'],state)
    finally: store.close()
    assert first['patches']['p']['job_id'] != second['patches']['p']['job_id']
    with pytest.raises((MissionValidationError, ValueError)):
        run_code_mission(pinned_repo,root,isolation=FixtureIsolation())


def test_code_replay_rejects_changed_job_spec(tmp_path,pinned_repo):
    import json
    from hive.code_mission import run_code_mission
    from hive.code_verifier import MissionValidationError
    from hive.storage import Store
    pinned_repo['synthetic_fixture']={'synthetic':True,'id':'fixture','exit_code':0,'results':[{'id':'a','value':4},{'id':'b','value':10}]}
    root=tmp_path/'store';report=run_code_mission(pinned_repo,root,isolation=FixtureIsolation());job_id=report['patches']['p']['job_id']
    store=Store(root)
    try:
        job=store.get_job(job_id);spec=job['spec'];spec['task']['id']='different-task'
        store.db.execute('UPDATE jobs SET spec=? WHERE id=?',(json.dumps(spec),job_id))
    finally: store.close()
    with pytest.raises((MissionValidationError,ValueError)):
        run_code_mission(pinned_repo,root,isolation=FixtureIsolation())


@pytest.mark.parametrize('mutation',['verdict','trace','escape'])
def test_code_replay_rejects_corrupt_named_output(tmp_path,pinned_repo,mutation):
    from hive.code_mission import run_code_mission
    from hive.code_verifier import MissionValidationError
    pinned_repo['synthetic_fixture']={'synthetic':True,'id':'fixture','exit_code':0,'results':[{'id':'a','value':4},{'id':'b','value':10}]}
    root=tmp_path/'store'; result=run_code_mission(pinned_repo,root,isolation=FixtureIsolation())
    from pathlib import Path
    if mutation=='verdict': Path(result['named_outputs']['p']['verdict.json']).write_text('corrupt',encoding='utf-8')
    elif mutation=='trace': Path(result['named_outputs']['trace.jsonl']).write_text('corrupt',encoding='utf-8')
    else:
        from hive.storage import Store
        store=Store(root)
        try:
            state=store.get('mission:'+pinned_repo['id']);state['named_outputs']['p']['verdict.json']=str(tmp_path/'outside.json');store.set('mission:'+pinned_repo['id'],state)
        finally: store.close()
    with pytest.raises((MissionValidationError,ValueError,OSError)):
        run_code_mission(pinned_repo,root,isolation=FixtureIsolation())


def test_code_cycle_exhaustion_survives_restart_without_refill(tmp_path,pinned_repo):
    import copy
    from hive.code_mission import run_code_mission
    from hive.orchestrator import DEFAULT_CONFIG
    pinned_repo['synthetic_fixture']={'synthetic':True,'id':'fixture','exit_code':0,'results':[{'id':'a','value':4},{'id':'b','value':10}]}
    second=copy.deepcopy(pinned_repo['patches'][0]);second['id']='second';pinned_repo['patches'].append(second)
    root=tmp_path/'store';config=dict(DEFAULT_CONFIG,max_cycles=1,routes=['tool'])
    first=run_code_mission(pinned_repo,root,executor_config=config,isolation=FixtureIsolation())
    assert first['status']=='STOPPED' and first['budget']['cycles']==1
    again=run_code_mission(pinned_repo,root,executor_config=config,isolation=FixtureIsolation())
    assert again['status']=='STOPPED' and again['budget']==first['budget']
    assert again['patches']['second']['state']=='QUEUED'
    assert again['patches']['p']['verification']['passed']


def test_code_repo_gitlink_mount_rejected(tmp_path,pinned_repo):
    import hashlib
    from hive.code_verifier import validate_manifest, MissionValidationError
    repo=pinned_repo['repo']['path']; rev=pinned_repo['repo']['revision']
    def git(*args): return subprocess.run(['git','-C',repo,*args],check=True,capture_output=True).stdout
    git('update-index','--add','--cacheinfo','160000',rev,'submodule')
    git('commit','-qm','add submodule entry')
    commit=git('rev-parse','HEAD').decode().strip();pinned_repo['repo']['revision']=commit
    pinned_repo['repo']['source_sha256']=hashlib.sha256(git('archive','--format=tar',commit)).hexdigest()
    with pytest.raises(MissionValidationError,match='submodule'):
        validate_manifest(pinned_repo)


@pytest.mark.skipif(__import__('os').name!='nt',reason='Windows junction test')
def test_code_repo_junction_ancestor_rejected(tmp_path,pinned_repo):
    from hive.code_verifier import validate_manifest, MissionValidationError
    link=tmp_path/'repo-link';created=subprocess.run(['cmd','/c','mklink','/J',str(link),pinned_repo['repo']['path']],capture_output=True,text=True)
    if created.returncode: pytest.skip('junction unavailable')
    pinned_repo['repo']['path']=str(link)
    with pytest.raises(MissionValidationError): validate_manifest(pinned_repo)
