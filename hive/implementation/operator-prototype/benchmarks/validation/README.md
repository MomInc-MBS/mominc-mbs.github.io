# Validation tasks

Generated deterministically by `hive.task_spec.load_tasks("validation")` with a
split-specific seed salt. The campaign freezes its policy before validation and
does not learn from validation outputs. Aggregate scores are exported under
`experiments/results`; full evaluator evidence stays in the local `.hive` store.
