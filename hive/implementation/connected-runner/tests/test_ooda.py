import pytest

from hive.ooda import OODAController, OODAError
from hive.storage import Store


@pytest.fixture
def root(tmp_path):
    return tmp_path / 'store'


@pytest.fixture
def oda(root):
    store = Store(root)
    yield OODAController(store)
    store.close()


def make_evidence(refs, **extra):
    return {'refs': refs, **extra}


def walk(oda, experiment_id, steps):
    for s in steps:
        oda.advance(experiment_id, s, make_evidence(['a']))


def test_happy_path_to_accept_checkpoint(oda):
    oda.create('e1', 'hypothesis one', 'baseline-abc',
               {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e1', 'OBSERVE', make_evidence(['r1']))
    oda.advance('e1', 'ORIENT', make_evidence(['r1']))
    oda.advance('e1', 'DECIDE', make_evidence(['r1']))
    oda.advance('e1', 'ACT', make_evidence(['r1']))
    oda.advance('e1', 'VERIFY', make_evidence(['r1']))
    oda.advance('e1', 'ACCEPT',
                make_evidence(['r1'], verifier_verdict='pass', verifier='alice', author='bob'))
    oda.advance('e1', 'CHECKPOINT', make_evidence(['r1']))
    info = oda.get('e1')
    assert info['state'] == 'CHECKPOINT'
    assert info['verdict'] == 'ACCEPT'
    assert [s['to_state'] for s in info['steps']] == [
        'OBSERVE', 'ORIENT', 'DECIDE', 'ACT', 'VERIFY', 'ACCEPT', 'CHECKPOINT']
    assert oda.verify_chain('e1') is True


def test_reject_path(oda):
    oda.create('e2', 'hypothesis two', 'base-x', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e2', 'OBSERVE', make_evidence(['r2']))
    oda.advance('e2', 'ORIENT', make_evidence(['r2']))
    oda.advance('e2', 'DECIDE', make_evidence(['r2']))
    oda.advance('e2', 'ACT', make_evidence(['r2']))
    oda.advance('e2', 'VERIFY', make_evidence(['r2']))
    oda.advance('e2', 'REJECT', make_evidence(['r2'], verifier_verdict='fail'))
    oda.advance('e2', 'CHECKPOINT', make_evidence(['r2']))
    info = oda.get('e2')
    assert info['state'] == 'CHECKPOINT'
    assert info['verdict'] == 'REJECT'
    assert oda.verify_chain('e2') is True


def test_skipping_state_raises_and_writes_nothing(oda):
    oda.create('e3', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    with pytest.raises(OODAError):
        oda.advance('e3', 'ORIENT', make_evidence(['r3']))
    assert oda.get('e3')['state'] == 'CREATED'
    assert oda.get('e3')['steps'] == []


def test_accept_same_author_and_verifier_raises(oda):
    oda.create('e4', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e4', 'OBSERVE', make_evidence(['r4']))
    oda.advance('e4', 'ORIENT', make_evidence(['r4']))
    oda.advance('e4', 'DECIDE', make_evidence(['r4']))
    oda.advance('e4', 'ACT', make_evidence(['r4']))
    oda.advance('e4', 'VERIFY', make_evidence(['r4']))
    with pytest.raises(ValueError):
        oda.advance('e4', 'ACCEPT', make_evidence(
            ['r4'], verifier_verdict='pass', verifier='alice', author='alice'))
    assert oda.get('e4')['state'] == 'VERIFY'


def test_accept_without_pass_raises(oda):
    oda.create('e5', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e5', 'OBSERVE', make_evidence(['r5']))
    oda.advance('e5', 'ORIENT', make_evidence(['r5']))
    oda.advance('e5', 'DECIDE', make_evidence(['r5']))
    oda.advance('e5', 'ACT', make_evidence(['r5']))
    oda.advance('e5', 'VERIFY', make_evidence(['r5']))
    with pytest.raises(ValueError):
        oda.advance('e5', 'ACCEPT', make_evidence(
            ['r5'], verifier_verdict='fail', verifier='alice', author='bob'))
    assert oda.get('e5')['state'] == 'VERIFY'


def test_missing_refs_raises(oda):
    oda.create('e6', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    with pytest.raises(ValueError):
        oda.advance('e6', 'ORIENT', {'other': 1})
    assert oda.get('e6')['state'] == 'CREATED'


def test_max_steps_exhaustion_records_inconclusive_checkpoint(oda):
    oda.create('e7', 'h', 'b', {'max_steps': 2, 'max_wall_seconds': 60})
    oda.advance('e7', 'OBSERVE', make_evidence(['r7']))
    oda.advance('e7', 'ORIENT', make_evidence(['r7']))
    with pytest.raises(OODAError):
        oda.advance('e7', 'DECIDE', make_evidence(['r7']))
    info = oda.get('e7')
    assert info['state'] == 'CHECKPOINT'
    assert info['verdict'] == 'INCONCLUSIVE'
    assert info['reason'] == 'budget'
    assert [s['to_state'] for s in info['steps']] == ['OBSERVE', 'ORIENT', 'INCONCLUSIVE', 'CHECKPOINT']
    assert oda.verify_chain('e7') is True


def test_transition_after_checkpoint_raises(oda):
    oda.create('e8', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e8', 'OBSERVE', make_evidence(['r8']))
    oda.advance('e8', 'ORIENT', make_evidence(['r8']))
    oda.advance('e8', 'DECIDE', make_evidence(['r8']))
    oda.advance('e8', 'ACT', make_evidence(['r8']))
    oda.advance('e8', 'VERIFY', make_evidence(['r8']))
    oda.advance('e8', 'REJECT', make_evidence(['r8']))
    oda.advance('e8', 'CHECKPOINT', make_evidence(['r8']))
    assert oda.get('e8')['state'] == 'CHECKPOINT'
    with pytest.raises(OODAError):
        oda.advance('e8', 'OBSERVE', make_evidence(['r8']))
    with pytest.raises(OODAError):
        oda.advance('e8', 'CHECKPOINT', make_evidence(['r8']))


def test_duplicate_experiment_id_raises(oda):
    oda.create('e9', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    with pytest.raises(ValueError):
        oda.create('e9', 'h2', 'b2', {'max_steps': 10, 'max_wall_seconds': 60})


def test_get_unknown_raises(oda):
    with pytest.raises(KeyError):
        oda.get('nope')


def test_tampered_step_row_breaks_chain(root):
    store = Store(root)
    oda = OODAController(store)
    oda.create('e10', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e10', 'OBSERVE', make_evidence(['r10']))
    oda.advance('e10', 'ORIENT', make_evidence(['r10']))
    store.db.execute("UPDATE ooda_steps SET payload='{}' WHERE experiment_id='e10' AND step=1")
    assert oda.verify_chain('e10') is False
    store.db.execute("UPDATE ooda_steps SET payload='{\"refs\":[\"r10\"]}' WHERE experiment_id='e10' AND step=1")
    assert oda.verify_chain('e10') is True
    store.close()


def test_reopen_store_preserves_state(root):
    store = Store(root)
    oda = OODAController(store)
    oda.create('e11', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('e11', 'OBSERVE', make_evidence(['r11']))
    store.close()
    store2 = Store(root)
    oda2 = OODAController(store2)
    info = oda2.get('e11')
    assert info['state'] == 'OBSERVE'
    assert [s['to_state'] for s in info['steps']] == ['OBSERVE']
    assert oda2.verify_chain('e11') is True  # intact chain, not yet terminal
    oda2.advance('e11', 'ORIENT', make_evidence(['r11']))
    assert oda2.get('e11')['state'] == 'ORIENT'
    store2.close()


def test_accept_requires_named_verifier(tmp_path):
    import pytest
    from hive.ooda import OODAController
    from hive.storage import Store
    c = OODAController(Store(tmp_path / "s.db"))
    c.create("e1", "h", "base", {"max_steps": 20, "max_wall_seconds": 60})
    for s in ("OBSERVE", "ORIENT", "DECIDE", "ACT", "VERIFY"):
        c.advance("e1", s, {"refs": ["r"]})
    with pytest.raises(ValueError):
        c.advance("e1", "ACCEPT", {"refs": ["r"], "verifier_verdict": "pass", "author": "alice"})


class FakeClock:
    def __init__(self, t=1_000_000.0):
        self.t = t

    def __call__(self):
        return self.t


@pytest.fixture
def clocked(root):
    store = Store(root)
    clock = FakeClock()
    yield OODAController(store, clock=clock), clock
    store.close()


def test_wall_clock_exceeded_records_inconclusive_checkpoint(clocked):
    oda, clock = clocked
    oda.create('w1', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    oda.advance('w1', 'OBSERVE', make_evidence(['r']))
    clock.t += 59.9  # still inside the window: allowed
    oda.advance('w1', 'ORIENT', make_evidence(['r']))
    clock.t += 0.2  # 60.1s since create
    with pytest.raises(OODAError, match='wall clock'):
        oda.advance('w1', 'DECIDE', make_evidence(['r']))
    info = oda.get('w1')
    assert info['state'] == 'CHECKPOINT' and info['verdict'] == 'INCONCLUSIVE' and info['reason'] == 'wall_clock'
    assert [s['to_state'] for s in info['steps']] == ['OBSERVE', 'ORIENT', 'INCONCLUSIVE', 'CHECKPOINT']
    assert info['steps'][-1]['payload'] == {'reason': 'wall_clock'}
    assert oda.verify_chain('w1') is True
    with pytest.raises(OODAError, match='terminal'):
        oda.advance('w1', 'DECIDE', make_evidence(['r']))


def test_wall_clock_boundary_is_not_exceeded_at_exactly_the_limit(clocked):
    oda, clock = clocked
    oda.create('w2', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    clock.t += 60.0
    oda.advance('w2', 'OBSERVE', make_evidence(['r']))
    assert oda.get('w2')['state'] == 'OBSERVE'


def test_late_checkpoint_keeps_an_earned_verdict(clocked):
    oda, clock = clocked
    oda.create('w3', 'h', 'b', {'max_steps': 10, 'max_wall_seconds': 60})
    for s in ('OBSERVE', 'ORIENT', 'DECIDE', 'ACT', 'VERIFY'):
        oda.advance('w3', s, make_evidence(['r']))
    oda.advance('w3', 'REJECT', make_evidence(['r']))
    clock.t += 3600
    oda.advance('w3', 'CHECKPOINT', make_evidence(['r']))
    info = oda.get('w3')
    assert info['state'] == 'CHECKPOINT' and info['verdict'] == 'REJECT' and info['reason'] is None


def test_step_budget_still_reported_as_budget_when_both_limits_hit(clocked):
    oda, clock = clocked
    oda.create('w4', 'h', 'b', {'max_steps': 1, 'max_wall_seconds': 1})
    oda.advance('w4', 'OBSERVE', make_evidence(['r']))
    clock.t += 5
    with pytest.raises(OODAError, match='step budget'):
        oda.advance('w4', 'ORIENT', make_evidence(['r']))
    assert oda.get('w4')['reason'] == 'budget'
