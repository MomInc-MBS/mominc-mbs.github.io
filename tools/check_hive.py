"""Validate generated HIVE links, source preservation, search and typed graph."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import sys
import zipfile

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
    for entry in updates['entries']:
        source = OUT / entry['path']
        if hashlib.sha256(source.read_bytes()).hexdigest() != entry['sha256']:
            errors.append('Supplied update bytes changed: ' + entry['path'])
    if updates['current_coder_id'] not in ids:
        errors.append('Current coder directions are missing')
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
