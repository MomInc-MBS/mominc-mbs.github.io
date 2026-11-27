# HIVE prototype ee175b5: launch

Archive `HIVE_Prototype_ee175b5.zip`, sha256 `ce13bb46baff0d8d8dfd7bf5dc287608a160b1af479916fb5e9547775327a0f0`.
It is a `git archive` of commit `ee175b5` with no stores, keys or private evaluation data.

**Requirements**
- Windows 11.
- Python 3.11 with Pillow.
- Docker Desktop running, for the pinned `python:3.11-slim` executor.
- `ssh-keygen`, only for signed admission (key in `%USERPROFILE%\.hive-admission`).
- LM Studio with `openai/gpt-oss-20b`, only to acquire new capabilities. Retained execution makes 0 model calls.

**Steps**
1. Unzip anywhere and `cd HIVE_Prototype_ee175b5`.
2. `set PYTHONPATH=%CD%\src`, then `set HIVE_REAL_DOCKER=1`.
   The installed `hive` package on this PC points at old code, so PYTHONPATH is required.
3. Fresh store: `python -m hive --store C:\path\store operator cap list`. It lists the inactive m2 rows, and the registry starts empty.
4. Goal on a raw site release: run from the inputs folder.
   `python -m hive --store STORE operator goal "Check the references in this site snapshot against its files and list the broken links." e3fcce6 e3fcce6.scope.json --allowed-root C:\hive-work\demo\g1-inputs`
5. Release change goal: `... operator goal "<text>" OLD OLD.scope.json NEW NEW.scope.json --allowed-root ROOT --deliverable release_change_report`

**Lifecycle**
- Store-scoped revoke: `python scripts\hive_admission.py revoke --store S --cap CAP --version N --reason R`.
- Emergency revoke across stores: add `--global`.
- Rollback: `python scripts\hive_admission.py rollback --store S --cap CAP`. This needs an admitted earlier version; none exists in the demo store.

**Proven in a clean folder** (`HIVE_Prototype_ee175b5.json`)
- Fresh store list: exit 0.
- Goal e3fcce6 on a copy of the demo store: VERIFIED and byte-identical to the sealed evaluator answer, 0 model calls.
  The run reused that store's retained step results, so it used 0 container runs.
