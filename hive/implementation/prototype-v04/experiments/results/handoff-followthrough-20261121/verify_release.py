"""Check the canonical latest engineering pointer, live pages and full ZIP bytes."""
import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import urllib.request
import zipfile

RUNTIME = '0d97faae0caae31f3918296dccaa21be5ba0ba7a1cec0c8ca5f880001d17320e'


def check(base):
    requests = []
    def read(relative):
        relative_path = PurePosixPath(relative)
        if relative_path.is_absolute() or '..' in relative_path.parts:
            raise ValueError('out-of-scope publication path')
        if base.startswith('https://'):
            request = urllib.request.Request(base.rstrip('/') + '/' + relative,
                headers={'User-Agent': 'HIVE-release-verifier/1', 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(request, timeout=45) as response:
                raw = response.read()
                requests.append({'path': relative, 'http_status': response.status,
                                 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
        else:
            raw = (Path(base) / relative).read_bytes()
        return raw

    pointer = json.loads(read('CURRENT_RELEASE.json'))
    latest = pointer['latest_verified']
    assert latest['note_id'] == 'P2SAFETY'
    publication = json.loads(read(latest['publication_manifest']))
    assert publication['runtime_version'] == '0.3.0.dev6'
    assert publication['runtime_source_sha256'] == publication['measured_runtime_source_sha256'] == RUNTIME
    assert publication['policy_deployed'] is False and publication['quality_gain'] is False
    assert publication['new_real_model_calls'] == 0
    snapshot = json.loads(read(publication['snapshot_manifest']))
    assert snapshot['tracked_dirty'] is False
    assert snapshot['source_commit'] == publication['source_commit']
    raw_zip = read(publication['download'])
    zip_hash = hashlib.sha256(raw_zip).hexdigest()
    assert zip_hash == publication['download_sha256']
    digest = hashlib.sha256()
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as archive:
        assert len(archive.namelist()) == len(set(archive.namelist()))
        assert set(archive.namelist()) == set(snapshot['files']) | {'SNAPSHOT_MANIFEST.json'}
        assert json.loads(archive.read('SNAPSHOT_MANIFEST.json')) == snapshot
        for name, entry in snapshot['files'].items():
            payload = archive.read(name)
            assert len(payload) == entry['bytes']
            assert hashlib.sha256(payload).hexdigest() == entry['sha256']
        for name in sorted(p for p in snapshot['files'] if p.startswith('src/hive/') and p.endswith('.py')):
            digest.update(name.removeprefix('src/hive/').encode())
            digest.update(archive.read(name))
    assert digest.hexdigest() == RUNTIME
    assert len(snapshot['files']) == publication['snapshot_file_count']
    for page in ('index.html', 'notes/STATUS/index.html', 'notes/RELEASES/index.html'):
        html = read(page).decode('utf-8')
        assert all(value in html for value in (publication['runtime_version'], RUNTIME, zip_hash))
    assert 'P2' in read('notes/P2SAFETY/index.html').decode('utf-8')
    return {'status': 'passed', 'base': base, 'verified_at': datetime.now(timezone.utc).isoformat(),
        'runtime_version': publication['runtime_version'], 'runtime_source_sha256': RUNTIME,
        'packaging_commit': publication['source_commit'], 'download': publication['download'],
        'download_sha256': zip_hash, 'payload_files_verified': len(snapshot['files']),
        'unexplained_identity_differences': 0, 'new_model_calls': 0, 'requests': requests}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True, help='local hive directory or https://mominc.online/hive/')
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('preserve existing verification receipts; use a new output path')
    try:
        result = check(args.base)
    except Exception as exc:
        result = {'status': 'failed', 'base': args.base, 'verified_at': datetime.now(timezone.utc).isoformat(),
                  'error': type(exc).__name__ + ': ' + str(exc)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['status'] == 'passed' else 1)
