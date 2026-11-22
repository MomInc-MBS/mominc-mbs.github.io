from pathlib import Path
from hive import orchestrator


def test_extracted_source_does_not_claim_parent_repository_identity(monkeypatch):
    root = Path(orchestrator.__file__).resolve().parents[2]
    monkeypatch.setattr(orchestrator.subprocess, 'check_output', lambda *args, **kwargs: str(root.parent))
    identity = orchestrator.code_version()
    assert identity['commit'] == 'unversioned'
    assert len(identity['source_sha256']) == 64
