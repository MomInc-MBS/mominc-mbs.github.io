import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import zipfile

import pytest


SCRIPT = Path(__file__).resolve().parents[2] / 'scripts' / 'export_snapshot.py'
SPEC = importlib.util.spec_from_file_location('hive_export_snapshot', SCRIPT)
exporter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(exporter)


def git(repository, *arguments):
    return subprocess.run(['git', *arguments], cwd=repository, check=True,
                          capture_output=True).stdout


@pytest.fixture
def repository(tmp_path):
    repository = tmp_path / 'repo'
    repository.mkdir()
    git(repository, 'init')
    files = {
        'README.md': b'# Public snapshot\n',
        'pyproject.toml': b'[project]\nname = "hive-test"\n',
        'package.json': b'{}\n',
        'e2e.config.mts': b'export default {};\n',
        'experiments/pressure/fixtures/H01.json': b'{"synthetic":true}\n',
        'experiments/pressure/campaigns/operator-approval.template.json': b'{"approved":false}\n',
        'experiments/pressure/campaigns/actual-approval.json': b'{"approved":true,"private":true}\n',
        '.env.example': b'API_KEY=replace-me\n',
        '.gitignore': b'__pycache__/\n',
        '.gitattributes': b'*.py -text\n',
        'AGENTS.md': b'Public project rules.\n',
        'src/hive/example.py': b'print("public")\r\n',
        'tests/unit/test_example.py': b'assert True\n',
        'scripts/example.py': b'pass\n',
        'configs/local.json': b'{}\n',
        'docs/state.md': b'Public limitations.\n',
        'benchmarks/development/example.json': b'{}\n',
        'experiments/results/report.json': b'{"aggregate": true}\n',
        'experiments/manifests/run.json': b'{"public": true}\n',
        'experiments/plans/draft.json': b'{"status":"draft","gold":false}\n',
        '.hive/private.sqlite': b'private evaluator',
        'experiments/private/holdout.json': b'private labels',
        'experiments/results/private/holdout.json': b'private nested labels',
        'node_modules/dependency/index.js': b'not distributable',
        'src/hive/__pycache__/example.pyc': b'cached code',
        'docs/.cache/output.txt': b'cache',
        'configs/.env': b'API_KEY=secret',
        'configs/.env.production': b'API_KEY=secret',
        'configs/secrets.json': b'{"token":"secret"}',
        'configs/credentials.json': b'{"token":"secret"}',
        'docs/key.pem': b'private key',
        'unrelated/private.txt': b'outside public allowlist',
    }
    for path, data in files.items():
        target = repository / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    git(repository, 'add', '--force', '.')
    git(repository, '-c', 'user.name=Snapshot Test', '-c', 'user.email=snapshot@example.invalid',
        'commit', '-m', 'representative tracked source')
    # A public-looking untracked result must never be exported.
    (repository / 'experiments/results/untracked.json').write_text('secret untracked output')
    (repository / 'src/hive/untracked.py').write_text('untracked = True')
    return repository


def test_export_includes_only_tracked_public_files_and_hashes_exact_bytes(repository, tmp_path):
    destination, archive_path = tmp_path / 'snapshot', tmp_path / 'snapshot.zip'
    manifest = exporter.export_snapshot(repository, destination, archive_path)
    assert manifest['source_commit'] == git(repository, 'rev-parse', 'HEAD').decode().strip()
    assert manifest['tracked_dirty'] is False
    expected = {'README.md', 'pyproject.toml', 'package.json', 'e2e.config.mts',
                '.env.example', '.gitignore', '.gitattributes', 'AGENTS.md',
                'src/hive/example.py', 'tests/unit/test_example.py', 'scripts/example.py',
                'configs/local.json', 'docs/state.md', 'benchmarks/development/example.json',
                'experiments/results/report.json', 'experiments/manifests/run.json',
                'experiments/plans/draft.json', 'experiments/pressure/fixtures/H01.json',
                'experiments/pressure/campaigns/operator-approval.template.json'}
    assert set(manifest['files']) == expected
    assert json.loads((destination / exporter.MANIFEST_NAME).read_bytes()) == manifest
    with zipfile.ZipFile(archive_path) as archive:
        assert set(archive.namelist()) == expected | {exporter.MANIFEST_NAME}
        assert archive.namelist() == sorted(archive.namelist())
        for path, evidence in manifest['files'].items():
            data = archive.read(path)
            assert data == (destination / path).read_bytes() == (repository / path).read_bytes()
            assert hashlib.sha256(data).hexdigest() == evidence['sha256']
            assert len(data) == evidence['bytes']
        assert archive.read(exporter.MANIFEST_NAME) == (destination / exporter.MANIFEST_NAME).read_bytes()
        assert all(member.date_time == (1980, 1, 1, 0, 0, 0) for member in archive.infolist())


def test_exports_are_byte_identical_despite_output_path_and_file_timestamps(repository, tmp_path):
    first, second = tmp_path / 'a.zip', tmp_path / 'b.zip'
    exporter.export_snapshot(repository, tmp_path / 'a', first)
    source = repository / 'README.md'
    import os
    os.utime(source, (1000000000, 1000000000))
    exporter.export_snapshot(repository, tmp_path / 'b', second)
    assert first.read_bytes() == second.read_bytes()


def test_dirty_tracked_bytes_are_hashed_and_disclosed(repository, tmp_path):
    (repository / 'README.md').write_bytes(b'Uncommitted public change.\n')
    manifest = exporter.export_snapshot(repository, tmp_path / 'snapshot', tmp_path / 'snapshot.zip')
    assert manifest['tracked_dirty'] is True
    assert manifest['files']['README.md']['sha256'] == hashlib.sha256(b'Uncommitted public change.\n').hexdigest()


def test_nonempty_destination_is_preserved(repository, tmp_path):
    destination = tmp_path / 'existing'
    destination.mkdir()
    sentinel = destination / 'keep.txt'
    sentinel.write_bytes(b'must survive')
    with pytest.raises(ValueError, match='empty'):
        exporter.export_snapshot(repository, destination, tmp_path / 'never.zip')
    assert sentinel.read_bytes() == b'must survive'
    assert list(destination.iterdir()) == [sentinel]
    assert not (tmp_path / 'never.zip').exists()


def test_existing_zip_is_preserved_and_destination_not_created(repository, tmp_path):
    archive = tmp_path / 'existing.zip'
    archive.write_bytes(b'keep existing ZIP')
    with pytest.raises(ValueError, match='already exists'):
        exporter.export_snapshot(repository, tmp_path / 'not-created', archive)
    assert archive.read_bytes() == b'keep existing ZIP'
    assert not (tmp_path / 'not-created').exists()


def test_zip_inside_destination_is_refused(repository, tmp_path):
    destination = tmp_path / 'snapshot'
    with pytest.raises(ValueError, match='outside'):
        exporter.export_snapshot(repository, destination, destination / 'snapshot.zip')
    assert not destination.exists()


def test_missing_tracked_file_fails_before_writing_outputs(repository, tmp_path):
    (repository / 'README.md').unlink()
    with pytest.raises(ValueError, match='existing file'):
        exporter.export_snapshot(repository, tmp_path / 'snapshot', tmp_path / 'snapshot.zip')
    assert not (tmp_path / 'snapshot').exists()
    assert not (tmp_path / 'snapshot.zip').exists()


def test_cli_exports_snapshot_and_reports_commit(repository, tmp_path):
    result = subprocess.run([sys.executable, str(SCRIPT), '--repository', str(repository),
                             '--destination', str(tmp_path / 'snapshot'),
                             '--zip', str(tmp_path / 'snapshot.zip')],
                            check=True, capture_output=True, text=True)
    result = json.loads(result.stdout)
    assert result['source_commit'] == git(repository, 'rev-parse', 'HEAD').decode().strip()
    assert result['tracked_dirty'] is False
    assert result['files'] == 19


def test_empty_existing_destination_is_allowed(repository, tmp_path):
    destination = tmp_path / 'empty'
    destination.mkdir()
    exporter.export_snapshot(repository, destination, tmp_path / 'snapshot.zip')
    assert (destination / exporter.MANIFEST_NAME).is_file()


def test_tracked_source_symlink_cannot_copy_an_external_secret(repository, tmp_path):
    external = tmp_path / 'external-secret.txt'
    external.write_bytes(b'private outside repository')
    source = repository / 'docs/state.md'
    source.unlink()
    try:
        source.symlink_to(external)
    except OSError:
        pytest.skip('creating symlinks is unavailable in this Windows session')
    with pytest.raises(ValueError, match='symlinks'):
        exporter.export_snapshot(repository, tmp_path / 'snapshot', tmp_path / 'snapshot.zip')
    assert not (tmp_path / 'snapshot').exists()


def test_cli_refuses_nonempty_destination_with_clear_error(repository, tmp_path):
    destination = tmp_path / 'existing'
    destination.mkdir()
    (destination / 'sentinel').write_bytes(b'keep')
    result = subprocess.run([sys.executable, str(SCRIPT), '--repository', str(repository),
                             '--destination', str(destination), '--zip', str(tmp_path / 'never.zip')],
                            capture_output=True, text=True)
    assert result.returncode == 1
    assert 'Export refused: destination must be absent or an empty directory' in result.stderr
    assert (destination / 'sentinel').read_bytes() == b'keep'
    assert not (tmp_path / 'never.zip').exists()
