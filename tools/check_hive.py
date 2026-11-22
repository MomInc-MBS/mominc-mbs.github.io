"""Validate generated HIVE links, source preservation, search and typed graph."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import sys
import zipfile
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'hive'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []
        self.anchors = set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.anchors.add(a['id'])
        if tag == 'a' and 'href' in a:
            self.links.append(a['href'])
        if tag in ('script', 'img') and 'src' in a:
            self.links.append(a['src'])
        if tag == 'link' and a.get('rel') in ('stylesheet', 'icon'):
            self.links.append(a['href'])


def main():
    errors = []
    updates = json.loads((OUT / 'updates/index.json').read_text(encoding='utf-8'))
    release = json.loads((OUT / 'CURRENT_RELEASE.json').read_text(encoding='utf-8'))
    publication = json.loads((OUT / release['publication_manifest']).read_text(encoding='utf-8'))
    readiness = json.loads((OUT / publication['readiness_report']).read_text(encoding='utf-8'))
    release_zip = OUT / release['download']
    if release['release_id'] != updates.get('latest_implementation_id') or release['version'] != publication['runtime_version']:
        errors.append('Canonical release pointer ID/version differs from publication metadata')
    if release['status'] != publication['status'] or release['runtime_source_sha256'] != publication['runtime_source_sha256'] or release['runtime_source_sha256'] != publication['measured_runtime_source_sha256']:
        errors.append('Canonical release pointer status/runtime hash differs from publication manifest')
    if release['download_sha256'] != publication['download_sha256'] or not release_zip.is_file() or hashlib.sha256(release_zip.read_bytes()).hexdigest() != release['download_sha256']:
        errors.append('Canonical release pointer download hash mismatch')
    if (release['level_a'], release['level_a_attempted'], release['level_a_accepted'], release['level_b'], release['candidate_promotion']) != ('NOT_ACCEPTED', 0, 0, 'UNTESTED', False):
        errors.append('Canonical release pointer acceptance/promotion status changed')
    if readiness.get('source_sha256') and readiness['source_sha256'] != release['runtime_source_sha256']:
        errors.append('Readiness runtime hash differs from canonical release pointer')
    supplement = release.get('engineering_supplement')
    if supplement:
        supplement_ids = {n['id'] for n in json.loads((OUT / 'graph.json').read_text(encoding='utf-8')).get('nodes', [])}
        supplement_manifest = OUT / supplement.get('publication_manifest', '')
        if set(supplement) != {'note_id', 'publication_manifest'} or supplement.get('note_id') not in supplement_ids or not supplement_manifest.is_file():
            errors.append('Engineering supplement pointer must name a published note and manifest')
        else:
            extra = json.loads(supplement_manifest.read_text(encoding='utf-8'))
            extra_zip = OUT / extra['download']
            snapshot_path = OUT / extra['snapshot_manifest']
            snapshot = json.loads(snapshot_path.read_text(encoding='utf-8'))
            if (extra['runtime_source_sha256'] != extra['measured_runtime_source_sha256']
                    or extra['source_commit'] != snapshot['source_commit'] or snapshot['tracked_dirty']
                    or extra['snapshot_file_count'] != len(snapshot['files'])
                    or hashlib.sha256(extra_zip.read_bytes()).hexdigest() != extra['download_sha256']):
                errors.append('Engineering supplement publication identity mismatch')
            if extra['policy_deployed'] or extra['quality_gain'] or extra['new_real_model_calls'] != 0:
                errors.append('Objective supplement must retain its measured non-promotion scope')
            with zipfile.ZipFile(extra_zip) as archive:
                for path, entry in snapshot['files'].items():
                    local = snapshot_path.parent / path
                    raw = local.read_bytes()
                    if len(raw) != entry['bytes'] or hashlib.sha256(raw).hexdigest() != entry['sha256'] or archive.read(path) != raw:
                        errors.append('Engineering supplement payload mismatch: ' + path)
    with zipfile.ZipFile(release_zip) as z:
        project = next((n for n in z.namelist() if n.endswith('/pyproject.toml') or n == 'pyproject.toml'), None)
        if not project or not re.search(r'^version\s*=\s*["\']' + re.escape(release['version']) + r'["\']', z.read(project).decode('utf-8', 'replace'), re.M):
            errors.append('Packaged runtime version differs from canonical release pointer')
    expected_pages = 286 + len(updates['entries'])
    docs = {p: Page(p.read_text(encoding='utf-8')) for p in OUT.rglob('*.html')}
    checked = 0
    for p, page in docs.items():
        for href in page.links:
            u = urlsplit(href)
            if u.scheme or u.netloc:
                continue
            if u.path.startswith('/hive/'):
                target = ROOT / unquote(u.path.lstrip('/'))
            elif href.startswith('#'):
                target = p
            else:
                # Non-HIVE navigation belongs to the existing website.
                continue
            if u.path.endswith('/'):
                target = target / 'index.html'
            if not target.exists():
                errors.append(f'{p.relative_to(ROOT)}: missing {href}')
            elif u.fragment and target in docs and unquote(u.fragment) not in docs[target].anchors:
                errors.append(f'{p.relative_to(ROOT)}: missing anchor {href}')
            checked += 1
    graph = json.loads((OUT / 'graph.json').read_text(encoding='utf-8'))
    index = json.loads((OUT / 'search-index.json').read_text(encoding='utf-8'))
    ids = {n['id'] for n in graph['nodes']}
    if ids != {n['id'] for n in index} or len(ids) != expected_pages:
        errors.append('Search and graph IDs differ or canonical pages are missing')
    for page_path in (OUT / 'index.html', OUT / 'notes/STATUS/index.html', OUT / 'notes/RELEASES/index.html'):
        page_text = page_path.read_text(encoding='utf-8')
        for expected in (release['version'], release['status'], release['runtime_source_sha256'], release['download_sha256'], '/hive/' + release['download']):
            if expected not in page_text:
                errors.append(f'Generated release page drift: {page_path.relative_to(ROOT)} missing {expected}')
    build_manifest = json.loads((OUT / 'build-manifest.json').read_text(encoding='utf-8'))
    if build_manifest.get('current_release') != release or build_manifest.get('latest_implementation_id') != release['release_id']:
        errors.append('Generated build manifest differs from canonical release pointer')
    for entry in updates['entries']:
        source = OUT / entry['path']
        if hashlib.sha256(source.read_bytes()).hexdigest() != entry['sha256']:
            errors.append('Supplied update bytes changed: ' + entry['path'])
    if updates['current_coder_id'] not in ids:
        errors.append('Current coder directions are missing')
    if updates['latest_research_id'] not in ids:
        errors.append('Latest research update is missing')
    for node_id in ('STATUS', 'RUNS', 'CAPABILITIES', 'LEARNING', 'LEDGER', 'GAPS', 'RELEASES', 'GAPPLAN'):
        if node_id not in ids:
            errors.append('Empirical evidence page missing: ' + node_id)
    evidence = OUT / 'evidence/caption-pilot-1'
    artifacts = json.loads((evidence / 'artifact-manifest.json').read_text(encoding='utf-8'))
    for relative, checksum in artifacts.items():
        path = (evidence / relative).resolve()
        if not path.is_relative_to(evidence.resolve()) or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != checksum:
            errors.append('Pilot artifact digest mismatch: ' + relative)
    experiment = json.loads((evidence / 'EXPERIMENT_REGISTRY.json').read_text(encoding='utf-8'))
    if experiment['decision'] != 'rejected' or experiment['deployed_version'] is not None:
        errors.append('This published pilot must retain its actual rejection and undeployed state')
    for n in graph['nodes']:
        if not (OUT / 'notes' / n['id'] / 'index.html').is_file():
            errors.append(f'Graph page missing: {n["id"]}')
    for e in graph['edges']:
        if e['source'] not in ids or e['target'] not in ids or not e.get('relation'):
            errors.append(f'Invalid graph edge: {e["id"]}')
    original = OUT / 'downloads/HIVE_Framework_Research_Vault.zip'
    manifest = json.loads((OUT / 'build-manifest.json').read_text())
    if hashlib.sha256(original.read_bytes()).hexdigest() != manifest['source_zip_sha256']:
        errors.append('Original ZIP digest mismatch')
    preserved = 0
    with zipfile.ZipFile(original) as z:
        for f in z.infolist():
            if f.is_dir() or '/.obsidian/' in f.filename:
                continue
            rel = '/'.join(f.filename.split('/')[1:])
            target = OUT / 'vault' / rel
            if not target.is_file() or target.read_bytes() != z.read(f):
                errors.append(f'Supplied source bytes changed: {rel}')
            if rel.startswith('90_Archive/Originals/'):
                preserved += 1
    if preserved != 19:
        errors.append(f'Expected 19 originals, found {preserved}')
    result = dict(ok=not errors, html_pages=len(docs), local_links_checked=checked,
                  searchable_pages=len(index), graph_edges=len(graph['edges']),
                  preserved_originals=preserved, errors=errors)
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == '__main__':
    sys.exit(main())
