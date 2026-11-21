import math

import pytest

from hive.metric_engine import paired_summary, utility
from hive.review_gate import REQUIRED_FLAGS, evaluate
from hive.orchestrator import load_config


def evidence():
    return {**dict.fromkeys(REQUIRED_FLAGS, True), "author_id": "builder", "reviewer_id": "independent",
            "paired_summary": paired_summary([1] * 24, [0] * 24)}


def test_every_promotion_gate_is_required_and_cannot_be_outvoted():
    good = evidence()
    assert evaluate(good)["decision"] == "PROMOTE"
    for key in REQUIRED_FLAGS:
        absent = dict(good); absent.pop(key)
        assert evaluate(absent)["decision"] != "PROMOTE"
        failed = dict(good, **{key: False})
        assert evaluate(failed)["decision"] == "REJECT"
    assert evaluate(dict(good, reviewer_id="builder"))["decision"] == "REJECT"
    assert evaluate(dict(good, paired_summary=paired_summary([1] * 24, [1] * 24)))["decision"] == "REJECT"


def test_utility_is_monotonic_in_quality_with_fixed_costs():
    values = [utility(q / 20, 0, 10, 20) for q in range(21)]
    assert all(a < b for a, b in zip(values, values[1:]))
    assert math.isclose(values[-1] - values[0], 1.0)


def test_nonfinite_and_negative_budgets_rejected(tmp_path):
    for value in (0, -1, float("inf"), True):
        path = tmp_path / "bad.json"
        path.write_text('{"max_wall_s":' + ("true" if value is True else str(value).replace("inf", "Infinity")) + '}')
        with pytest.raises(ValueError):
            load_config(path)
