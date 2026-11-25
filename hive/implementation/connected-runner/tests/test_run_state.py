import threading

import pytest

from hive.run_state import IllegalTransition, RunStateCorrupt, RunStates
from hive.storage import Store


@pytest.fixture
def root(tmp_path):
    return tmp_path / 'store'


@pytest.fixture
def rs(root):
    store = Store(root)
    yield RunStates(store)
    store.close()


def walk(rs, run, *states):
    for i, s in enumerate(states):
        rs.transition(run, s, f'{run}-{i}-{s}')


def test_happy_path_and_cursor(rs):
    walk(rs, 'r', 'ADMITTED', 'RUNNING', 'CHECKPOINTED', 'VERIFYING', 'ACCEPTED')
    info = rs.resume('r')
    assert (info['state'], info['cursor'], info['terminal']) == ('ACCEPTED', 5, True)
    assert [e['cursor'] for e in rs.events('r')] == [1, 2, 3, 4, 5]
    assert [e['to_state'] for e in rs.events('r', after=3)] == ['VERIFYING', 'ACCEPTED']


def test_paused_resumes_to_running(rs):
    walk(rs, 'r', 'ADMITTED', 'RUNNING', 'PAUSED')
    rs.transition('r', 'RUNNING', 'again')
    assert rs.resume('r')['state'] == 'RUNNING'


@pytest.mark.parametrize('path,bad', [
    ([], 'RUNNING'),                                   # must start ADMITTED
    (['ADMITTED'], 'VERIFYING'),                       # skips states
    (['ADMITTED', 'RUNNING'], 'ACCEPTED'),
    (['ADMITTED', 'RUNNING'], 'ADMITTED'),
    (['ADMITTED', 'RUNNING'], 'NOPE'),
    (['ADMITTED', 'RUNNING', 'PAUSED'], 'VERIFYING'),
    (['ADMITTED', 'RUNNING', 'CHECKPOINTED', 'VERIFYING', 'ACCEPTED'], 'RUNNING'),   # terminal immutable
    (['ADMITTED', 'RUNNING', 'CHECKPOINTED', 'VERIFYING', 'REJECTED'], 'ACCEPTED'),
    (['ADMITTED', 'FAILED'], 'RUNNING'),
])
def test_illegal_transitions_rejected_and_state_unchanged(rs, path, bad):
    walk(rs, 'r', *path)
    cursor = len(path)
    with pytest.raises(IllegalTransition):
        rs.transition('r', bad, 'bad-event')
    if path:
        assert rs.resume('r')['cursor'] == cursor
    else:
        with pytest.raises(KeyError):
            rs.resume('r')


def test_duplicate_event_is_idempotent(rs):
    first = rs.transition('r', 'ADMITTED', 'e1', {'a': 1})
    rs.transition('r', 'RUNNING', 'e2')
    assert rs.transition('r', 'ADMITTED', 'e1', {'a': 1}) == first   # replay returns original, not an error
    assert rs.resume('r')['cursor'] == 2
    with pytest.raises(ValueError):
        rs.transition('r', 'ADMITTED', 'e1', {'a': 2})               # same id, different content


def test_two_connections_racing_one_wins(root):
    Store(root).close()
    seed = Store(root); s = RunStates(seed); walk(s, 'r', 'ADMITTED', 'RUNNING', 'CHECKPOINTED', 'VERIFYING')
    results, barrier = {}, threading.Barrier(2)

    def racer(name, target):
        store = Store(root)   # own connection per thread
        try:
            barrier.wait()
            try:
                results[name] = RunStates(store).transition('r', target, f'ev-{name}')
            except IllegalTransition as e:
                results[name] = e
        finally:
            store.close()

    ts = [threading.Thread(target=racer, args=a) for a in (('a', 'ACCEPTED'), ('b', 'REJECTED'))]
    [t.start() for t in ts]; [t.join(30) for t in ts]
    wins = [k for k, v in results.items() if isinstance(v, dict)]
    losses = [k for k, v in results.items() if isinstance(v, IllegalTransition)]
    assert len(wins) == 1 and len(losses) == 1
    info = RunStates(Store(root)).resume('r')
    assert info['state'] == results[wins[0]]['to_state'] and info['cursor'] == 5
    seed.close()


def test_crash_mid_sequence_preserves_cursor(root):
    store = Store(root); s = RunStates(store)
    walk(s, 'r', 'ADMITTED', 'RUNNING')
    # half-written transition: insert inside an open IMMEDIATE tx, then die without COMMIT
    store.db.execute('BEGIN IMMEDIATE')
    store.db.execute("INSERT INTO run_events VALUES ('r',3,'torn','RUNNING','CHECKPOINTED','{}','x')")
    store.close()
    store2 = Store(root); s2 = RunStates(store2)
    info = s2.resume('r')
    assert (info['state'], info['cursor']) == ('RUNNING', 2)
    assert s2.transition('r', 'CHECKPOINTED', 'torn')['cursor'] == 3   # the lost event can be retried
    store2.close()


def test_effect_receipt_survives_crash_and_is_not_rerun(root):
    store = Store(root); s = RunStates(store)
    walk(s, 'r', 'ADMITTED', 'RUNNING')
    s.effect_begin('r', 'push-1')
    s.effect_receipt('r', 'push-1', 'sha256:aaa')
    store.close()                                         # crash
    s2 = RunStates(Store(root))
    info = s2.resume('r')
    assert info['effects_done'] == ['push-1'] and info['effects_unknown'] == []
    again = s2.effect_receipt('r', 'push-1', 'sha256:aaa')   # replay of the same receipt is a no-op
    assert again['digest'] == 'sha256:aaa'
    with pytest.raises(ValueError):
        s2.effect_receipt('r', 'push-1', 'sha256:bbb')    # cannot rewrite a receipt


def test_unknown_effect_surfaced(root):
    store = Store(root); s = RunStates(store)
    walk(s, 'r', 'ADMITTED', 'RUNNING')
    s.effect_begin('r', 'deploy-1')                       # started, crash before receipt
    s.effect_begin('r', 'deploy-1')                       # re-begin must not reset
    s.effect_begin('r', 'post-2'); s.effect_receipt('r', 'post-2', 'd2')
    store.close()
    info = RunStates(Store(root)).resume('r')
    assert info['effects_unknown'] == ['deploy-1'] and info['effects_done'] == ['post-2']


def test_effects_need_live_run(rs):
    with pytest.raises(KeyError):
        rs.effect_begin('ghost', 'e')
    walk(rs, 'r', 'ADMITTED', 'FAILED')
    with pytest.raises(IllegalTransition):
        rs.effect_begin('r', 'e')


def test_corrupt_event_row_detected(root):
    store = Store(root); s = RunStates(store)
    walk(s, 'r', 'ADMITTED', 'RUNNING', 'CHECKPOINTED')
    store.db.execute("UPDATE run_events SET payload='{\"x\":1}' WHERE run_id='r' AND seq=2")
    with pytest.raises(RunStateCorrupt):
        s.resume('r')
    store.db.execute("UPDATE run_events SET payload='{}' WHERE run_id='r' AND seq=2")  # restore
    assert s.resume('r')['cursor'] == 3
    store.db.execute("UPDATE run_events SET to_state='ACCEPTED' WHERE run_id='r' AND seq=3")
    with pytest.raises(RunStateCorrupt):                  # writer also refuses a tampered tail
        s.transition('r', 'VERIFYING', 'next')
    store.db.execute("UPDATE run_events SET to_state='CHECKPOINTED' WHERE run_id='r' AND seq=3")
    store.db.execute("DELETE FROM run_events WHERE run_id='r' AND seq=2")
    with pytest.raises(RunStateCorrupt):                  # deleted row (gap)
        s.resume('r')
    store.close()
