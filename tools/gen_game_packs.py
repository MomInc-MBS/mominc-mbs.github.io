"""Inventory the bytes needed by each game, including assets selected later in play.

Run after editing website assets: python tools/gen_game_packs.py
Uses Git's blob inventory so a sparse checkout can regenerate without downloading models.
Working files override Git, so run before committing. No timestamps or build dependency.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import posixpath
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EXT = {'.html', '.js', '.mjs', '.css', '.json', '.png', '.jpg', '.jpeg', '.webp',
       '.svg', '.gif', '.mp4', '.webm', '.mp3', '.wav', '.glb', '.obj', '.mtl',
       '.ttf', '.woff', '.woff2'}
TEXT = {'.html', '.js', '.mjs', '.css', '.json', '.mtl'}
SLUGS = ['mominc', 'girlfriend', 'lilboyfriend', 'corgi', 'djscratch', 'fuel', 'goon', 'war-room', 'armie', 'handborne']


def build(refresh=False):
    inventory = {}
    previous = {}
    if refresh:
        # A code-only repair can retain the existing dependency lists in a sparse
        # checkout. Do not use this mode when adding/removing asset references.
        for slug in SLUGS:
            previous[slug] = json.loads((ROOT / 'tv/game-packs' / f'{slug}.json').read_text())
            for asset in previous[slug]['assets']:
                path = asset['url'].lstrip('/')
                record = (asset['revision'], asset['bytes'])
                if path in inventory and inventory[path] != record:
                    raise ValueError(f'Conflicting asset revisions: {path}')
                inventory[path] = record
    else:
        for line in subprocess.check_output(['git', 'ls-tree', '-r', '-l', 'HEAD'], cwd=ROOT, text=True).splitlines():
            info, path = line.split('\t')
            _, kind, sha, size = info.split()
            if kind == 'blob':
                inventory[path] = (sha, int(size))
    # Root-level scripts were previously read only from HEAD, leaving the worker
    # one commit behind even when manifests were generated before committing.
    for f in ROOT.iterdir():
        if f.is_file() and f.suffix in EXT:
            b = f.read_bytes()
            inventory[f.name] = (hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest(), len(b))
    for base in ['tv', 'games', 'play', 'gala', 'handborne', 'arcade']:
        for f in (ROOT / base).rglob('*'):
            if f.is_file() and f.suffix in EXT and 'game-packs' not in f.parts:
                b = f.read_bytes()
                inventory[f.relative_to(ROOT).as_posix()] = (hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest(), len(b))

    def usable(path):
        return (path != 'game-assets-sw.js' and Path(path).suffix in EXT and not any(x in path.split('/') for x in ['source', '_next', '.vite', 'downloads', 'game-packs'])
                and not path.endswith('.map') and '_runtime-probe' not in path and '_goon-quarantined' not in path)

    files = {p for p in inventory if usable(p)}
    by_name = {}
    for path in sorted(files):
        by_name.setdefault(Path(path).name, []).append(path)
    texts = {}

    def read(path):
        if path not in texts:
            f = ROOT / path
            texts[path] = f.read_text() if f.exists() else subprocess.check_output(['git', 'show', 'HEAD:' + path], cwd=ROOT).decode()
        return texts[path]

    def under(prefix):
        return {p for p in files if p.startswith(prefix)}

    shared = {p for p in files if p.startswith('tv/') and p.count('/') == 1 and Path(p).suffix in {'.js', '.css'}}
    shared |= {'tv/index.html', 'tv/assets/mom-inc-mark.png'}
    vendor = under('tv/assets/armie-intro/vendor/')
    output = ROOT / 'tv/game-packs'
    output.mkdir(exist_ok=True)
    def write(slug, selected, fonts):
        assets = [{'url': '/' + p, 'revision': inventory[p][0], 'bytes': inventory[p][1]} for p in sorted(selected)]
        manifest = {'schema': 1, 'game': slug, 'assets': assets, 'fontStyles': sorted(fonts)}
        manifest['version'] = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()[:20]
        (output / f'{slug}.json').write_text(json.dumps(manifest, indent=2) + '\n')
        unique = {a['revision']: a['bytes'] for a in assets}
        print(f'{slug}: {len(assets)} files, {sum(unique.values()) / 1048576:.1f} MiB (shared files download once)')

    for slug in SLUGS:
        if refresh:
            selected = {a['url'].lstrip('/') for a in previous[slug]['assets'] if usable(a['url'].lstrip('/'))}
            write(slug, selected, previous[slug]['fontStyles'])
            continue
        selected = set(shared)
        selected |= {p for p in files if p in {f'tv/channels/{slug}.html', f'tv/channels/{slug}.js',
                                              f'games/{slug}/index.html', f'play/{slug}/index.html', f'tv/assets/marks/{slug}.png'}}
        if slug in {'djscratch', 'fuel', 'corgi', 'lilboyfriend', 'armie', 'goon', 'war-room'}:
            selected |= vendor
        if slug == 'armie':
            # Every family/style is available before Armie's character selector appears.
            selected |= {p for p in under('tv/assets/armie-intro/') if '/myr5/' not in p}
            selected |= under('tv/assets/armie-intro/myr5/models/') | under('tv/assets/armie-intro/myr5/styles/')
            selected |= under('tv/assets/armie-intro/myr5/animation/styles/')
            selected |= {'tv/assets/armie-intro/myr5/index.html', 'tv/assets/armie-intro/myr5/animation/index.html'}
            selected |= {p for p in under('handborne/models/') if re.search(r'family-(20|21|22)\.glb$', p)}
        if slug == 'handborne':
            selected |= {'handborne/index.html', 'handborne/decisions.js', 'handborne/companion.mjs', 'tv/assets/helping-hand-badge.png'}
            selected |= under('handborne/models/') | under('handborne/previews/') | under('handborne/fonts/')
        if slug == 'goon':
            selected |= {p for p in under('gala/') if not any(x in p for x in ['war-room', 'terminal', 'hologram'])}
            selected.add('tv/games/goon/index.html')
        if slug == 'war-room':
            selected |= {p for p in under('gala/') if p not in {'gala/index.html', 'gala/music.html'}}
            selected |= {'tv/channels/goon.html', 'tv/games/goon/war-room.html', 'play/war-room/index.html'}
            selected.add('tv/assets/armie-intro/myr5/models/myr5.glb')
        if slug == 'fuel':
            selected |= under('arcade/tub-flight/')
        if slug == 'corgi':
            selected |= {p for p in files if re.fullmatch(r'tv/assets/school-drawing-[123]\.png', p)}

        # Literal references plus explicit dynamic catalogs above. HTML navigation links
        # do not pull other games into this pack. Fragments resolve assets against /tv/.
        queue = list(selected)
        fonts = set()
        while queue:
            path = queue.pop()
            if Path(path).suffix not in TEXT:
                continue
            # Inline illustration data is already counted in its HTML blob. Strip
            # it before scanning references (and never rescan a megabyte token).
            source = re.sub(r'data:[^,\s\"\']+,[^\s\"\'<>]+', '', read(path))
            source = re.sub(r'/\*.*?\*/|^\s*//[^\n]*', '', source, flags=re.S | re.M)
            fonts.update(html.unescape(u) for u in re.findall(r'https://fonts\.googleapis\.com/[^\s\"\'<>]+', source))
            refs = set(re.findall(r'(?<![\w./@-])[\w./@-]{1,240}\.(?:js|mjs|css|json|png|jpg|jpeg|webp|svg|gif|mp4|webm|mp3|wav|glb|obj|mtl|ttf|woff2?)\b', source))
            for ref in refs:
                if Path(path).suffix in {'.js', '.mjs', '.json'} and Path(ref).suffix in {'.js', '.mjs'} and '/' not in ref:
                    # Questionnaire answers cite source filenames. They are prose,
                    # not imports, and must not download the other channel's game.
                    continue
                candidates = [ref.lstrip('/')] if ref.startswith('/') else [
                    posixpath.normpath(posixpath.join(posixpath.dirname(path), ref)),
                    posixpath.normpath(posixpath.join('tv', ref)),
                    posixpath.normpath(posixpath.join('tv/assets', ref))]
                if '/' not in ref and Path(ref).suffix not in TEXT:
                    candidates += by_name.get(ref, [])
                for candidate in candidates:
                    if candidate in files and candidate not in selected:
                        selected.add(candidate)
                        queue.append(candidate)
                        break
        write(slug, selected, fonts)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Refresh bytes only; retain existing asset membership (code-only repairs).')
    build(refresh=parser.parse_args().refresh)
