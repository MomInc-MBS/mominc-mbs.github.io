import os, subprocess, sys
from pathlib import Path

ENV = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2] / 'src'))
import pytest
from hive.storage import Store

def test_dead_process_recovery_and_stale_generation(tmp_path):
    s = Store(tmp_path); job_id = s.enqueue({'task': 1}); s.close()
    code = 'from hive.storage import Store; import sys; s=Store(sys.argv[1]); print(s.claim("child")["generation"], flush=True); os._exit(0)'
    code = 'import os; ' + code
    child = subprocess.run([sys.executable, '-c', code, str(tmp_path)], capture_output=True, text=True, check=True, env=ENV)
    generation = int(child.stdout.strip())
    s = Store(tmp_path)
    assert s.recover() == [job_id]
    claim = s.claim('new')
    assert claim['generation'] > generation
    with pytest.raises(PermissionError): s.transition(job_id, 'VERIFYING', owner='child', generation=generation)
    s.close()

def test_live_child_claim_is_not_recovered(tmp_path):
    s = Store(tmp_path); s.enqueue({}); s.close()
    code = 'from hive.storage import Store; import sys; s=Store(sys.argv[1]); s.claim("child"); print("ready",flush=True); sys.stdin.readline()'
    child = subprocess.Popen([sys.executable, '-c', code, str(tmp_path)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, env=ENV)
    try:
        assert child.stdout.readline().strip() == 'ready'
        s = Store(tmp_path); assert s.recover() == []; s.close()
    finally:
        child.stdin.write('\n'); child.stdin.flush(); child.wait(timeout=10)
