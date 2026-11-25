"""Export tracked public source and evidence without private evaluator stores.

Run after committing for a clean release. The manifest names HEAD and records
whether tracked worktree/index changes exist; hashes describe the actual exported
bytes. Untracked files are never included. This path allowlist and secret-filename
denylist do not replace reviewing tracked public files for embedded credentials.
The manifest hashes payload files, excluding itself. ZIP metadata is fixed and
members are stored uncompressed for reproducible bytes across zlib versions.
"""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import zipfile


MANIFEST_NAME = 'SNAPSHOT_MANIFEST.json'
ROOT_FILES = frozenset({
    'README.md', 'pyproject.toml', 'package.json', 'package-lock.json',
    'npm-shrinkwrap.json', 'e2e.config.mts', 'e2e.config.ts', 'e2e.config.js',
    '.gitignore', '.gitattributes', '.env.example', 'AGENTS.md',
})
PUBLIC_PREFIXES = ('src/', 'tests/', 'scripts/', 'configs/', 'docs/', 'schemas/',
                   'benchmarks/', 'experiments/results/', 'experiments/manifests/',
                   'experiments/plans/', 'experiments/pressure/contracts/',
                   'experiments/pressure/fixtures/dev/', 'experiments/pressure/generators/',
                   'experiments/pressure/arms/')
PUBLIC_BUILD_FILES = frozenset({'build/readiness-baseline.json', 'build/readiness-report.json',
                              'build/readiness-report.md', 'build/coverage-matrix.csv',
                              'build/evidence-index.json', 'build/one-shot-integration-diff.md',
                              # Operator Prototype runtime needs: the M2 oracle and pinned manifest (no private generator/data)
                              'evaluator/m2/oracle.py', 'build/m2/evaluation_manifest.json',
                              # C3 discovery: proposer-side approval (the evaluator's private acceptance cases live in .hive/c3-private, never tracked)
                              'build/c-series/c3_inference_approval.json'})
PUBLIC_PRESSURE_FILES = frozenset(
    [f'experiments/pressure/fixtures/H{i:02}.json' for i in range(1, 12)] +
    ['experiments/pressure/campaigns/real-development.template.json',
     'experiments/pressure/campaigns/operator-approval.template.json',
     'experiments/pressure/campaigns/real-preregistration.required.json',
     'experiments/pressure/campaigns/paired-development.example.json',
     'experiments/pressure/campaigns/paired-config.template.json',
     'experiments/pressure/campaigns/paired-real.template.json'])
EXCLUDED_PARTS = frozenset({
    '.git', '.hive', 'node_modules', '__pycache__', '.pytest_cache', '.mypy_cache',
    '.ruff_cache', '.cache', '.hypothesis', '.tox', '.nox', '.venv', 'venv',
    '.e2e', 'private', 'secrets',
})
SECRET_SUFFIXES = frozenset({'.pem', '.key', '.p12', '.pfx', '.sqlite', '.sqlite3', '.db', '.pyc', '.pyo'})


def _git(repository, *arguments):
    result = subprocess.run(['git', *arguments], cwd=repository, capture_output=True)
    if result.returncode:
        raise ValueError('git command failed: ' + result.stderr.decode('utf-8', errors='replace').strip())
    return result.stdout


def _public(path):
    parts = PurePosixPath(path).parts
    if (not parts or PurePosixPath(path).is_absolute() or '..' in parts
            or '\\' in path or ':' in path):
        raise ValueError('unsafe tracked path')
    lower_parts = tuple(part.casefold() for part in parts)
    if any(part in EXCLUDED_PARTS for part in lower_parts):
        return False
    name = lower_parts[-1]
    if path != '.env.example' and (name == '.env' or name.startswith('.env.')):
        return False
    if (PurePosixPath(name).suffix in SECRET_SUFFIXES or
            name in {'secrets.json', 'secret.json', 'credentials.json', 'credentials',
                     'id_rsa', 'id_ed25519', 'id_ecdsa'}):
        return False
    return (path in ROOT_FILES or path in PUBLIC_BUILD_FILES or path in PUBLIC_PRESSURE_FILES
            or path.startswith(PUBLIC_PREFIXES)
            or path.startswith('evaluator/c3/') or path.startswith('build/prototype-v04/public/') or path.startswith('build/operator/'))


def export_snapshot(repository, destination, zip_path):
    """Write a new snapshot and deterministic ZIP; never delete existing output.

    Raises ValueError for unsafe paths, nonempty destinations, existing ZIPs,
    missing/symlinked tracked payload files, and Git failures. All source payload
    validation happens before creating outputs. Returned data is the manifest.
    """
    repository = Path(repository).resolve()
    root = Path(_git(repository, 'rev-parse', '--show-toplevel').decode('utf-8').strip()).resolve()
    if root != repository:
        raise ValueError('repository must be the Git repository root')
    raw_destination, raw_zip = Path(destination), Path(zip_path)
    if raw_destination.is_symlink() or raw_zip.is_symlink():
        raise ValueError('output paths must not be symlinks')
    destination, zip_path = raw_destination.resolve(), raw_zip.resolve()
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise ValueError('destination must be absent or an empty directory')
    if zip_path.exists():
        raise ValueError('ZIP output already exists')
    if zip_path == destination or destination in zip_path.parents:
        raise ValueError('ZIP output must be outside the snapshot destination')
    commit = _git(repository, 'rev-parse', 'HEAD').decode('ascii').strip()
    tracked = _git(repository, 'ls-files', '-z').decode('utf-8').split('\0')
    tracked = [path for path in tracked if path]
    if len(set(tracked)) != len(tracked):
        raise ValueError('duplicate tracked paths; resolve index conflicts first')
    payload = {}
    for path in sorted(tracked):
        if not _public(path):
            continue
        source = repository.joinpath(*PurePosixPath(path).parts)
        if any(parent.is_symlink() for parent in (source, *source.parents)
               if parent != repository and repository in parent.parents):
            raise ValueError('tracked payload symlinks are not supported: ' + path)
        if not source.is_file() or not source.resolve().is_relative_to(repository):
            raise ValueError('tracked payload must be an existing file inside repository: ' + path)
        payload[path] = source.read_bytes()
    if not payload:
        raise ValueError('no tracked public payload files found')
    status = _git(repository, 'status', '--porcelain=v1', '--untracked-files=no')
    manifest = {
        'version': 1,
        'source_commit': commit,
        'tracked_dirty': bool(status.strip()),
        'source': 'git-tracked working-tree bytes; untracked and private paths excluded',
        'files': {path: {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
                  for path, data in payload.items()},
    }
    manifest_bytes = (json.dumps(manifest, sort_keys=True, indent=2) + '\n').encode('utf-8')
    payload[MANIFEST_NAME] = manifest_bytes
    destination.mkdir(parents=True, exist_ok=True)
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    for path, data in payload.items():
        target = destination.joinpath(*PurePosixPath(path).parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as stream:
            stream.write(data)
    with zipfile.ZipFile(zip_path, 'x', compression=zipfile.ZIP_STORED) as archive:
        for path, data in sorted(payload.items()):
            info = zipfile.ZipInfo(path, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_STORED
            archive.writestr(info, data)
    return manifest


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--destination', type=Path, required=True)
    parser.add_argument('--zip', dest='zip_path', type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        manifest = export_snapshot(args.repository, args.destination, args.zip_path)
    except (ValueError, OSError) as exc:
        parser.exit(1, f'Export refused: {exc}\n')
    print(json.dumps({'source_commit': manifest['source_commit'],
                      'tracked_dirty': manifest['tracked_dirty'],
                      'files': len(manifest['files']),
                      'destination': str(args.destination.resolve()),
                      'zip': str(args.zip_path.resolve())}, sort_keys=True))


if __name__ == '__main__':
    main()
