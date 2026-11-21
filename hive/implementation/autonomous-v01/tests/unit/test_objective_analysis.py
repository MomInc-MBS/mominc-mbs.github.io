import copy
import pytest
from hive.objective_analysis import compare_objectives, prior_sensitivity


def row(route, quality=1, unsupported=0, latency_s=1, tokens=1, valid=True):
    return dict(route=route, quality=quality, unsupported=unsupported, latency_s=latency_s, tokens=tokens, valid=valid)


def test_tied_correctness_utility_prefers_cheaper_and_excludes_dominated():
    result = compare_objectives([row('expensive', latency_s=10, tokens=100), row('cheap')])
    assert result['utility_selected'] == 'cheap'
    assert result['constrained_selected'] == 'cheap'
    assert result['lexicographic_selected'] == 'cheap'
    assert result['pareto'] == ['cheap']


def test_tradeoff_demonstrates_difference_without_gating():
    result = compare_objectives([row('correct', latency_s=3000, tokens=1000), row('wrong', quality=0)])
    assert result['utility_selected'] == 'wrong'
    assert result['lexicographic_selected'] == 'correct'
    assert result['constrained_selected'] == 'wrong'
    assert result['pareto'] == ['correct', 'wrong']


def test_invalid_never_wins_and_input_unchanged():
    observations = [row('invalid', valid=False), row('valid', quality=0)]
    before = copy.deepcopy(observations)
    result = compare_objectives(observations)
    assert result['utility_selected'] == result['lexicographic_selected'] == 'valid'
    assert result['invalid_excluded'] == 1
    assert observations == before
    assert compare_objectives([row('invalid', valid=False)])['pareto'] == []
    assert compare_objectives([])['utility_selected'] is None


def test_constraint_checks_each_observation_and_means():
    result = compare_objectives([row('a', tokens=256), row('a', tokens=0), row('b', quality=.5)])
    assert result['routes']['a']['tokens'] == 128
    assert result['routes']['a']['feasible'] is False
    assert result['constrained_selected'] == 'b'
    assert compare_objectives([row('a', unsupported=.1)])['constrained_selected'] is None


def test_deterministic_ties_and_bad_values():
    assert compare_objectives([row('z'), row('a')])['utility_selected'] == 'a'
    for observation in [row('a', quality=float('nan')), row('a', tokens=-1), row('a', valid=1), row('a', quality=2)]:
        with pytest.raises(ValueError):
            compare_objectives([observation])


def test_prior_sensitivity_is_explicit_and_only_estimates():
    result = prior_sensitivity(3, 1)
    assert result['observed_pass_rate'] == .75
    assert [r['posterior_mean'] for r in result['estimates']] == [.7, 4/6, 5/8]
    assert prior_sensitivity(0, 0)['observed_pass_rate'] is None
    assert all(r['posterior_mean'] == .5 for r in prior_sensitivity(0, 0)['estimates'])
    for args in [(-1, 1), (True, 1), (1.5, 1)]:
        with pytest.raises(ValueError):
            prior_sensitivity(*args)
