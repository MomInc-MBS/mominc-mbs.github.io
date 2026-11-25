from pathlib import Path

import pytest

from hive.roles import RoleConfigError, RoleRegistry

CONFIG = Path(__file__).resolve().parents[1] / 'configs' / 'roles.yaml'


@pytest.fixture
def reg():
    return RoleRegistry.load(CONFIG)


def test_loads_all_five_roles_with_limits_and_no_spawn(reg):
    assert set(reg.roles) == {'builder', 'reviewer', 'research', 'diagnostic', 'verifier'}
    assert all(not reg.may_spawn(r) for r in reg.roles)
    assert reg.roles['builder'].max_input_tokens > 0 and reg.roles['builder'].max_output_tokens > 0


def test_allows_in_scope(reg):
    ok, why = reg.check('builder', 'write_file', 'src/hive/x.py')
    assert ok, why
    assert reg.check('builder', 'read_file', './src//hive\\x.py')[0]  # normalized


@pytest.mark.parametrize('role,tool,path', [
    ('nobody', 'read_file', 'src/a.py'),            # unknown role
    (None, 'read_file', 'src/a.py'),
    ('builder', 'shell', 'src/a.py'),               # unknown tool
    ('diagnostic', 'write_file', 'src/a.py'),       # tool not granted
    ('builder', 'read_file', 'secrets/key.txt'),    # outside globs
    ('builder', 'read_file', None),                 # fail closed on missing path
    ('builder', 'read_file', ''),
    ('builder', 'read_file', 'src/../secrets/k'),   # traversal
    ('builder', 'read_file', 'src\\..\\..\\k'),
    ('builder', 'read_file', '/etc/passwd'),        # absolute outside globs
    ('builder', 'read_file', '/src/a.py'),          # absolute never matches relative glob
    ('builder', 'read_file', 'C:\\src\\a.py'),
    ('builder', 'read_file', 'src/a\0.py'),
])
def test_denies(reg, role, tool, path):
    allowed, reason = reg.check(role, tool, path)
    assert allowed is False and reason


@pytest.mark.parametrize('role', ['reviewer', 'verifier'])
def test_reviewer_verifier_cannot_write_candidates(reg, role):
    assert reg.check(role, 'read_file', 'candidates/a/out.py')[0]          # reading is fine
    assert not reg.check(role, 'write_file', 'candidates/a/out.py')[0]
    assert not reg.check(role, 'write_file', 'CANDIDATES/a/out.py')[0]     # case variant
    assert not reg.check(role, 'write_file', 'candidates/./a/../b')[0]
    assert reg.check(role, 'write_file', 'reports/r.md')[0]                # reports are theirs


def test_builder_may_write_candidates(reg):
    assert reg.check('builder', 'write_file', 'candidates/a/out.py')[0]


def test_one_identity_one_role_per_task(reg):
    reg.assign('t1', 'agent-a', 'builder')
    reg.assign('t1', 'agent-a', 'builder')  # idempotent
    with pytest.raises(PermissionError):
        reg.assign('t1', 'agent-a', 'verifier')
    reg.assign('t2', 'agent-a', 'verifier')  # different task is fine
    with pytest.raises(PermissionError):
        reg.assign('t2', 'agent-a', 'builder')
    with pytest.raises(ValueError):
        reg.assign('t1', 'agent-b', 'root')


def test_bad_config_rejected(tmp_path):
    bad = tmp_path / 'r.yaml'
    for text in ['version: 2\n', 'version: 1\ncandidate_globs: []\nroles: {}\n',
                 'version: 1\ncandidate_globs: [c/**]\nroles: {root: {allowed_tools: [x]}}\n',
                 'version: 1\ncandidate_globs: [c/**]\nroles: {builder: {allowed_tools: [x], allowed_path_globs: ["../**"],'
                 ' max_input_tokens: 1, max_output_tokens: 1}}\n']:
        bad.write_text(text)
        with pytest.raises(RoleConfigError):
            RoleRegistry.load(bad)
