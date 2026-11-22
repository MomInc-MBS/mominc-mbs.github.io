"""Interrupted wall reservations survive CLI resume and recovery-write crashes."""
import json
import subprocess
import sys
from pathlib import Path
import os

import pytest

from hive.orchestrator import DEFAULT_CONFIG, Executor
from hive.storage import Store

ENV = dict(os.environ, PYTHONPATH=str(Path(__file__).resolve().parents[2] / 'src'))


def interrupted(root):
    store = Store(root)
    job = store.enqueue({'task': 'never-dispatched'})
    subprocess.run([sys.executable, '-c',
                    'from hive.storage import Store; import sys; s=Store(sys.argv[1]); s.claim("dead-owner"); s.close()',
                    str(root)], env=ENV, check=True)
    budget = {'requests': 1, 'tokens_reserved': 128, 'tokens_actual': 0,
              'wall_s': 0.0, 'cycles': 1}
    store.set('budget', budget)
    store.set('inflight', {'job': job, 'reserved_wall_s': 120})
    return store, job, budget


def test_cli_resume_charges_interruption_once_before_any_new_dispatch(tmp_path):
    store, job, before = interrupted(tmp_path)
    store.close()
    (tmp_path / 'STOP').touch()
    command = [sys.executable, '-m', 'hive', '--store', str(tmp_path), 'resume']
    first = subprocess.run(command, env=ENV, capture_output=True, text=True, check=True)
    assert json.loads(first.stdout)['recovered'] == [job]
    second = subprocess.run(command, env=ENV, capture_output=True, text=True, check=True)
    assert json.loads(second.stdout)['recovered'] == []
    executor = Executor(tmp_path, dict(DEFAULT_CONFIG, max_wall_s=120))
    try:
        assert executor.store.get('budget') == dict(before, wall_s=120.0)
        assert executor.store.get('inflight') is None
        assert executor.store.get_job(job)['state'] == 'QUEUED'
        assert executor.loop(1) == []
        assert executor.store.get('stop_reason') == 'mission wall-time budget exhausted'
        assert executor.store.get('budget') == dict(before, wall_s=120.0)
    finally:
        executor.close()


def test_recovery_debit_and_requeue_roll_back_together_on_write_failure(tmp_path, monkeypatch):
    store, job, before = interrupted(tmp_path)
    original = Store.set
    def fail_after_debit(self, key, value):
        original(self, key, value)
        if key == 'budget':
            raise RuntimeError('injected recovery write failure')
    monkeypatch.setattr(Store, 'set', fail_after_debit)
    with pytest.raises(RuntimeError, match='injected'):
        store.recover()
    assert store.get_job(job)['state'] == 'RUNNING'
    assert store.get('budget') == before
    assert store.get('inflight')['reserved_wall_s'] == 120
    monkeypatch.setattr(Store, 'set', original)
    assert store.recover() == [job]
    assert store.get('budget') == dict(before, wall_s=120.0)
    assert store.get('inflight') is None
    assert store.recover() == []
    assert store.get('budget') == dict(before, wall_s=120.0)
    store.close()


def test_legacy_resume_orphan_is_debited_without_requeue_or_second_charge(tmp_path):
    store, job, before = interrupted(tmp_path)
    store.db.execute("UPDATE jobs SET state='QUEUED',owner=NULL,pid=NULL WHERE id=?", (job,))
    assert store.recover() == []
    assert store.get('budget') == dict(before, wall_s=120.0)
    assert store.get('inflight') is None
    assert store.recover() == []
    assert store.get('budget') == dict(before, wall_s=120.0)
    store.close()
