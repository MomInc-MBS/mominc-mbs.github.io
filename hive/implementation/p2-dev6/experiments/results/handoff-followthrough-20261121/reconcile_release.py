"""Reconcile the public baseline without inference or reading evaluator labels."""
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
import urllib.request
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
WORK = ROOT / '.hive/handoff-reconciliation'
BASE = 'https://mominc.online/hive/'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fetch(path):
    with urllib.request.urlopen(BASE + path, timeout=60) as response:
        return response.read()


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    pointer = json.loads(fetch('CURRENT_RELEASE.json'))
    releases = []
    for name in (pointer['publication_manifest'],
                 pointer['engineering_supplement']['publication_manifest']):
        raw = fetch(name)
        publication = json.loads(raw)
        payload = fetch(publication['download'])
        assert sha(payload) == publication['download_sha256'], name
        archive_path = WORK / Path(publication['download']).name
        archive_path.write_bytes(payload)
        with zipfile.ZipFile(archive_path) as archive:
            manifest = json.loads(archive.read('SNAPSHOT_MANIFEST.json'))
            for path, entry in manifest['files'].items():
                data = archive.read(path)
                assert sha(data) == entry['sha256'] and len(data) == entry['bytes'], path
            digest = hashlib.sha256()
            source_files = sorted(p for p in manifest['files'] if p.startswith('src/hive/') and p.endswith('.py'))
            for path in source_files:
                digest.update(path.removeprefix('src/hive/').encode())
                digest.update(archive.read(path))
            assert digest.hexdigest() == publication['runtime_source_sha256']
            assert manifest['source_commit'] == publication['source_commit'] and not manifest['tracked_dirty']
            # Compare committed source, independent of concurrent candidate edits.
            for path in source_files:
                committed = subprocess.check_output(['git', 'show', publication['source_commit'] + ':' + path], cwd=ROOT)
                assert committed == archive.read(path), path
        releases.append({'manifest': name, 'manifest_sha256': sha(raw),
                         'version': publication['runtime_version'],
                         'source_commit': manifest['source_commit'],
                         'runtime_sha256': digest.hexdigest(), 'download': publication['download'],
                         'zip_sha256': sha(payload), 'payload_files_verified': len(manifest['files']),
                         'committed_runtime_matches': True})
    ledgers = {}
    for name in ('integration-20261121', 'adaptive-v02-20261121'):
        root = ROOT / '.hive' / name
        with sqlite3.connect((root / 'hive.sqlite3').as_uri() + '?mode=ro', uri=True) as db:
            row = db.execute("SELECT value FROM kv WHERE key='budget'").fetchone()
        ledgers[name] = {'budget': json.loads(row[0]), 'STOP_present': (root / 'STOP').exists()}
    image = 'python@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535'
    inspect = json.loads(subprocess.check_output(['docker', 'image', 'inspect', image], text=True))[0]
    with urllib.request.urlopen('http://127.0.0.1:11434/api/tags', timeout=5) as response:
        tags = json.load(response)
    report = {'recorded_at': datetime.now(timezone.utc).isoformat(),
              'classification': 'release integrity; no task acceptance or inference',
              'live_url': BASE, 'canonical_pointer': pointer, 'releases': releases,
              'unexplained_identity_differences': 0, 'spent_ledgers': ledgers,
              'docker': {'requested_digest': image, 'image_id': inspect['Id'], 'repo_digests': inspect['RepoDigests']},
              'installed_models': [{'name': m['name'], 'digest': m['digest']} for m in tags['models']],
              'hive_model_calls': 0, 'new_authorized_model_calls': 0}
    (OUT / 'baseline-reconciliation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'release_versions': [r['version'] for r in releases],
                      'verified_files': [r['payload_files_verified'] for r in releases],
                      'differences': 0, 'model_calls': 0}))


if __name__ == '__main__':
    main()
