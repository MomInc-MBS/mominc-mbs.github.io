"""Generate each ready PWA's index.html and manifest.webmanifest from apps/apps.json.

Run: python tools/gen_apps.py   (then python tools/gen_game_packs.py)
Deterministic: a second run changes nothing. Rejects duplicate ids/scopes and missing assets.
"""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

PAGE = """<!doctype html>
<html lang="en" data-game="{pack}" data-loader="bar">
<head>
<script src="/tv/game-loader.js?v=1"></script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{name} · MOM Inc</title>
<meta name="theme-color" content="{theme}">
<meta name="description" content="{description}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{short}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="{icon192}">
<link rel="apple-touch-icon" href="{icon192}">
<link rel="stylesheet" href="/apps/shell.css">
<link rel="stylesheet" href="{style}">
</head>
<body>
<main id="menu">
<img class="mark" src="{icon192}" alt="" width="170" height="170">
<h1>{name}</h1>
<p class="tag">{description}</p>
<p class="tag">Best: <strong id="best">0</strong></p>
<button id="start" type="button">Start</button>
<button id="open-settings" class="alt" type="button">Settings</button>
<p id="offline" role="status">Saving for offline play…</p>
</main>
<main id="settings" hidden>
<h2>Settings</h2>
{reset_panel}{tilt_panel}<section class="panel">
<p><strong>Install</strong></p>
<button id="install" type="button">Install app</button>
<p id="install-status" role="status"></p>
<ol id="install-steps"></ol>
<p id="ios-help" hidden>On iPhone use Safari. Home Screen apps keep their own saved best and offline files.</p>
</section>
<button id="close-settings" class="alt" type="button">Back</button>
</main>
<section id="stage" hidden aria-label="{name}"><button id="back" class="alt" type="button">← Menu</button><div id="host"></div></section>
<script type="application/json" id="app-config">{config}</script>
<script type="application/mbs-script" data-mbs-type="module" data-mbs-src="/apps/shell.mjs"></script>
</body>
</html>
"""

RESET = """<section class="panel">
<p><strong>Best score</strong></p>
<button id="reset" class="alt" type="button">Reset best</button>
<p id="reset-note" role="status"></p>
</section>
"""


TILT = """<section class="panel" id="tilt-panel" hidden>
<p><strong>Steering</strong></p>
<button id="tilt" class="alt" type="button">Tilt steering: off</button>
<p id="tilt-note" role="status"></p>
</section>
"""


def load():
    catalogue = json.loads((ROOT / 'apps/apps.json').read_text(encoding='utf-8'))
    apps = [a for a in catalogue['apps'] if a['type'] == 'pwa' and a['status'] == 'ready']
    ids = [a['id'] for a in catalogue['apps']]
    if len(set(ids)) != len(ids):
        raise SystemExit('duplicate app id in apps.json')
    for a in apps:
        if not re.fullmatch(r'[a-z0-9-]+', a['id']) or a['pack'] != 'app-' + a['id']:
            raise SystemExit(f"bad id/pack for {a['id']}")
        needed = [a['src'].lstrip('/'), a['style'].lstrip('/')] + [f"apps/{a['id']}/{i}" for i in a['icons']]
        for path in needed:
            if not (ROOT / path).is_file():
                raise SystemExit(f"{a['id']}: missing required asset {path}")
    return apps


def manifest(a):
    scope = f"/apps/{a['id']}/"
    icons = [{'src': f'{scope}{i}', 'sizes': '192x192' if '192' in i else '512x512', 'type': 'image/png',
              'purpose': 'maskable' if 'maskable' in i else 'any'} for i in a['icons']]
    return {'id': scope, 'name': a['name'], 'short_name': a['shortName'], 'description': a['description'],
            'start_url': scope, 'scope': scope, 'display': 'standalone', 'orientation': a['orientation'],
            'background_color': '#1c0a3d', 'theme_color': a['theme'], 'icons': icons}


def main():
    apps = load()
    scopes = [f"/apps/{a['id']}/" for a in apps]
    if len(set(scopes)) != len(scopes):
        raise SystemExit('duplicate app scope')
    for a in apps:
        out = ROOT / 'apps' / a['id']
        config = json.dumps({'name': a['name'], 'src': a['src'], 'mount': a['mount'], 'options': a['options'], 'bestKey': a['bestKey']},
                            sort_keys=True).replace('</', '<\/')
        page = PAGE.format(pack=a['pack'], name=escape(a['name']), short=escape(a['shortName']), theme=a['theme'],
                           description=escape(a['description']), icon192=f"/apps/{a['id']}/{a['icons'][0]}",
                           style=a['style'], config=config,
                           reset_panel=RESET if 'reset-best' in a['settings'] else '',
                           tilt_panel=TILT if 'tilt' in a['settings'] else '')
        (out / 'index.html').write_text(page, encoding='utf-8', newline='\n')
        (out / 'manifest.webmanifest').write_text(json.dumps(manifest(a), indent=2) + '\n', encoding='utf-8', newline='\n')
        print(f"{a['id']}: wrote apps/{a['id']}/index.html + manifest.webmanifest")


if __name__ == '__main__':
    main()
