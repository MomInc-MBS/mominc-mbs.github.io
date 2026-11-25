# Locked holdout

Task generation lives in `hive.task_spec`; labels and per-case outputs are retained
only in the trusted local evaluator store, excluded from Git. The campaign marks
task IDs consumed in the repository-level `.hive/holdout-ledger` before dispatch.
They cannot be reused in another campaign. A resumed original campaign retains
its recorded evidence and frozen policy. Neither outputs nor labels train the
policy. This logical separation does not restrict the local filesystem owner.
