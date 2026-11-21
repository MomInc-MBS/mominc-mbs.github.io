"""Benchmark protocol and cautious scope statement.

Development, validation, and holdout use separate deterministic seeds and
non-overlapping generated instances. All task families keep the same generating
rule distribution except adaptation: its locked holdout has five demonstrations
instead of three. That difficulty shift is metadata on evaluator tasks only and
is omitted from model request views.
"""
from hive.task_spec import CATEGORIES, SPLITS, load_tasks

CEILING = (
    "Synthetic tasks measure narrow exact behaviors only; they do not establish "
    "general intelligence, durable learning, or broad real-world competence."
)
