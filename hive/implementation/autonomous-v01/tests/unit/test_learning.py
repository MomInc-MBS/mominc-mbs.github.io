import json
import math
import pytest
from hive.learning_policy import Policy
from hive.metric_engine import utility, paired_summary
from hive.review_gate import evaluate, REQUIRED_FLAGS
from hive.candidate_generator import propose


def evidence():
    return {**{k: True for k in REQUIRED_FLAGS}, 'author_id': 'builder', 'reviewer_id': 'reviewer', 'paired_summary': paired_summary([1] * 24, [0] * 24)}


def test_feedback_changes_routing_and_is_category_scoped():
    p = Policy('greedy')
    assert p.choose('math', ['local_direct', 'tool']) == 'local_direct'
    p.observe('math', 'local_direct', 0, -1)
    p.observe('math', 'tool', 1, 1)
    assert p.choose('math', ['local_direct', 'tool']) == 'tool'
    assert p.choose('code', ['local_direct', 'tool']) == 'local_direct'


@pytest.mark.parametrize('mode', Policy.MODES)
def test_restart_deterministic(mode):
    p = Policy(mode)
    for _ in range(7):
        r = p.choose('math', ['a', 'b'])
        p.observe('math', r, int(r == 'b'), float(r == 'b'))
    restored = Policy(state=json.loads(json.dumps(p.snapshot())))
    assert [p.choose('math', ['a', 'b']) for _ in range(30)] == [restored.choose('math', ['a', 'b']) for _ in range(30)]


def test_only_development_trains():
    p = Policy()
    before = p.snapshot()
    for split in ['validation', 'holdout']:
        assert p.observe('math', 'a', 1, 1, split=split) is False
    assert p.observe('math', 'a', 0, -1, valid=False) is False
    assert p.snapshot() == before
    assert p.choose('math', {'bad': False, 'good': True}) == 'good'
    with pytest.raises(ValueError):
        p.choose('math', [])


def test_ucb_explores_and_metrics_are_seeded():
    p = Policy()
    assert p.choose('x', ['a', 'b']) == 'a'
    p.observe('x', 'a', 1, 1)
    assert p.choose('x', ['a', 'b']) == 'b'
    assert utility(1, 0, 120, 128) == pytest.approx(.9)
    assert paired_summary([1, 0, 1], [0, 0, 0]) == paired_summary([1, 0, 1], [0, 0, 0])
    for a, b in [([], []), ([1], [0, 1]), ([math.nan], [0])]:
        with pytest.raises(ValueError):
            paired_summary(a, b)


def test_gate_hard_failures_override_positive_metric():
    assert evaluate(evidence())['decision'] == 'PROMOTE'
    for flag in REQUIRED_FLAGS:
        e = evidence()
        e[flag] = False
        assert evaluate(e)['decision'] == 'REJECT'
        del e[flag]
        assert evaluate(e)['decision'] == 'QUARANTINE'
    e = evidence()
    e['reviewer_id'] = e['author_id']
    assert evaluate(e)['decision'] == 'REJECT'
    assert evaluate({})['decision'] == 'QUARANTINE'


def test_gate_uncertainty_and_malformed():
    for summary in [paired_summary([1] * 23, [0] * 23), {'n': 24, 'delta': math.nan}, None]:
        e = evidence()
        e['paired_summary'] = summary
        assert evaluate(e)['decision'] == 'QUARANTINE'
    e = evidence()
    e['paired_summary'] = paired_summary([0] * 24, [0] * 24)
    assert evaluate(e)['decision'] == 'REJECT'
    assert propose(None, {})['model_weight_training'] is False
