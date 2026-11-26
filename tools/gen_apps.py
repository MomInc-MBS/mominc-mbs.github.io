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
{style_link}{app_style}</head>
<body>
{gate}{ui}<script type="application/json" id="app-config">{config}</script>
<script type="application/mbs-script" data-mbs-type="module" data-mbs-src="/apps/shell.mjs"></script>
</body>
</html>
"""

UI = """<main id="menu">
<img class="mark" src="{icon192}" alt="" width="170" height="170">
<h1>{name}</h1>
<p class="tag">{description}</p>
{best_line}{note_line}<button id="start" type="button">Start</button>
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
<p id="ios-help" hidden>On iPhone use Safari. Home Screen apps keep their own {saved} and offline files.</p>
</section>
<button id="close-settings" class="alt" type="button">Back</button>
</main>
<section id="stage" hidden aria-label="{name}"><button id="back" class="alt" type="button">← Menu</button>{host}</section>
"""

# apps.json "win95": true -> the Fuel app's own Windows 95 program window (menu, settings, first-run notice). Same element ids as UI,
# so the shared shell wiring is untouched; the look lives in the app's own stylesheet (appStyle).
UI_W95 = """<main id="menu" class="w95">
<div class="w95-win">
<div class="w95-bar"><img src="{icon192}" alt="" width="16" height="16"><span>NITRO FUEL.EXE</span></div>
<div class="w95-body">
<h1>{name}</h1>
<p>{description}</p>
<p class="w95-best">Best pipes: <strong id="best">0</strong></p>
<button id="start" type="button">Start Game</button>
<button id="open-settings" type="button">Settings</button>
<p class="w95-tag">SPONSORED SOFTWARE &middot; 1995</p>
</div>
<p id="offline" class="w95-status" role="status">Saving for offline play…</p>
</div>
</main>
<main id="settings" class="w95" hidden>
<div class="w95-win">
<div class="w95-bar"><img src="{icon192}" alt="" width="16" height="16"><span>NITRO FUEL.EXE &middot; Settings</span></div>
<div class="w95-body">
<fieldset><legend>Sound</legend>
<label><input type="checkbox" id="set-sfx"> Sound effects</label>
<label>Effects volume <input type="range" id="set-sfx-vol" min="0" max="100"></label>
<label><input type="checkbox" id="set-music"> Music</label>
<label>Music volume <input type="range" id="set-music-vol" min="0" max="100"></label>
</fieldset>
<fieldset><legend>Intensity</legend>
<label><input type="radio" name="set-fx" value="classic"> Classic</label>
<label><input type="radio" name="set-fx" value="reduced"> Reduced Effects</label>
<p class="w95-hint">Reduced Effects removes decorative motion and strong colour tints. The game plays exactly the same.</p>
</fieldset>
<fieldset><legend>Best score</legend>
<button id="reset" type="button">Reset best</button>
<p id="reset-note" role="status"></p>
</fieldset>
<fieldset><legend>Install</legend>
<button id="install" type="button">Install app</button>
<p id="install-status" role="status"></p>
<ol id="install-steps"></ol>
<p id="ios-help" hidden>On iPhone use Safari. Home Screen apps keep their own {saved} and offline files.</p>
</fieldset>
</div>
<div class="w95-foot"><button id="close-settings" type="button">OK</button></div>
</div>
</main>
<div id="fx-notice" class="w95-modal" role="dialog" aria-modal="true" aria-labelledby="fx-title" hidden>
<div class="w95-win">
<div class="w95-bar"><img src="{icon192}" alt="" width="16" height="16"><span id="fx-title">NITRO FUEL.EXE &middot; Notice</span></div>
<div class="w95-body">
<p>This game gets more colourful and animated the further you fly. There is no flashing at any level. Pick how intense you want it. You can change it later in Settings.</p>
<button id="fx-classic" type="button">Classic</button>
<button id="fx-reduced" type="button">Reduced Effects</button>
</div>
</div>
</div>
<section id="stage" hidden aria-label="{name}"><button id="back" class="alt" type="button">&larr; Menu</button>{host}</section>
"""

GATE = """<main id="gate">
<img class="mark" src="{icon192}" alt="" width="170" height="170">
<h1>{name}</h1>
<p class="tag">{description}</p>
<p class="tag">This one is played from your home screen. Add it, then open it from there.</p>
<section class="panel">
<p><strong>How to add it</strong></p>
<button id="gate-install" type="button">Install app</button>
<p id="gate-status" role="status"></p>
<ol id="gate-steps"><li>iPhone: open this page in Safari, tap Share, then Add to Home Screen.</li><li>Android: open the ⋮ menu in Chrome, then tap Install app.</li></ol>
<p id="gate-ios" hidden>On iPhone use Safari. Home Screen apps keep their own saved run and offline files.</p>
</section>
<a class="btn" href="{finite}">Play the finite story in your browser</a>
</main>
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

RESET_HAND = """<section class="panel">
<p><strong>Your hand</strong></p>
<button id="reset" class="alt" type="button">Reset hand</button>
<p id="reset-note" role="status"></p>
</section>
"""

MODELS = """<section class="panel">
<p><strong>Extra models</strong></p>
<p>Extra models download when you choose them.</p>
<ul id="models"></ul>
</section>
"""


def load():
    catalogue = json.loads((ROOT / 'apps/apps.json').read_text(encoding='utf-8'))
    # An app that also has an APK keeps its apk record and carries its web app under "web".
    apps = [{**a, **a['web'], 'type': 'pwa'} if 'web' in a else a for a in catalogue['apps']]
    apps = [a for a in apps if a['type'] == 'pwa' and a['status'] == 'ready']
    ids = [a['id'] for a in catalogue['apps']]
    if len(set(ids)) != len(ids):
        raise SystemExit('duplicate app id in apps.json')
    for a in catalogue['apps']:   # external PWAs (e.g. Coach MYR5) live on another origin: listed, never given a local shell
        if a['type'] == 'external' and a['status'] == 'ready' and not a.get('href', '').startswith(('https://', '/')):
            raise SystemExit(f"{a['id']}: a ready external app needs an https or site-relative href")
    for a in apps:
        if not re.fullmatch(r'[a-z0-9-]+', a['id']) or a['pack'] != 'app-' + a['id']:
            raise SystemExit(f"bad id/pack for {a['id']}")
        entry = a['src'].split('?')[0].lstrip('/')
        if entry.endswith('/'):
            entry += 'index.html'   # iframe apps reuse an existing page
        needed = [entry] + ([a['style'].lstrip('/')] if a.get('style') else []) + [f"apps/{a['id']}/{i}" for i in a['icons']]
        needed += [a['appStyle'].lstrip('/')] if a.get('appStyle') else []
        needed += a.get('packFiles', []) + [f for o in a.get('optionalPacks', []) for f in o['files']]
        packs = [o['pack'] for o in a.get('optionalPacks', [])]
        if len(set(packs)) != len(packs) or any(not re.fullmatch(r'app-[a-z0-9-]+', x) or x == a['pack'] for x in packs):
            raise SystemExit(f"{a['id']}: bad optional pack ids")
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

APK_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{name} · Android download · MOM Inc</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://mominc.online/download/{id}/">
<style>
:root{{--bg:#2a0a44;--ink:#ffd36e;--accent:#e04b6a;--card:#3b1a5e}}
*{{box-sizing:border-box}}body{{margin:0;background:radial-gradient(120% 80% at 50% 0,#5a2a9a,#2a0a44 60%);color:#f5e9ff;font:16px/1.5 system-ui,sans-serif;min-height:100vh}}
main{{max-width:34rem;margin:0 auto;padding:24px 16px 48px}}
h1{{color:var(--ink);font-size:1.9rem;line-height:1.15;margin:.2em 0}}
.card{{background:var(--card);border:3px solid var(--ink);border-radius:10px;padding:16px 18px;margin:20px 0;box-shadow:5px 6px 0 #0006}}
.dl{{display:block;margin-top:12px;padding:14px;border-radius:8px;background:var(--accent);color:#fff;text-align:center;font-weight:700;text-decoration:none;min-height:44px}}
code{{overflow-wrap:anywhere;font-size:.8rem}}small,.meta{{color:#d6c2ee}}a{{color:var(--ink)}}
li{{margin:.4em 0}}
</style>
</head>
<body>
<main>
<p><a href="/games/goon/">&larr; Goon</a></p>
<h1>{name}</h1>
<p>{description}</p>
<div class="card">
<a class="dl" href="/{apk}" download>Download {file} ({size})</a>
<p class="meta">Version {version} &middot; {build} &middot; Android {minAndroid}+ &middot; package <code>{package}</code></p>
<p class="meta">SHA-256: <code>{sha}</code> (<a href="/{apk}.sha256">.sha256</a>)</p>
</div>
<h2>How it works</h2>
<ul>
<li>MOM has three heads now, drawn entirely in ASCII. She sits above your reminders and sinks to a strip of glasses as you scroll: violet at the first alert, amber at the second, red after that. She has no voice. Tap a button and she types what it does, usually with an opinion.</li>
<li>Add as many reminders as you like. Each one can repeat daily, on chosen weekdays, on set dates or every few days, skip the next one, and follow your phone's time zone or a fixed one.</li>
<li>Pick one of four intense sounds for each stage (tap &#9654; to hear it), plus volume ramp, vibration pattern, spoken title, torch and screen flash. Nothing is armed until you tap the check.</li>
<li>The first alert comes at the due time, then after 5 minutes, 3 minutes and 1 minute, then every 30 seconds until you finish the game (a win or no moves left) or use Settings to turn it off or change the time. Settings unlocks once the 30-second phase starts.</li>
<li>Finish by playing the 2048 board to the end: a real loss (no moves left) or a win dismisses the alarm. You do not need a 2048 tile. A full board that can still move does not count. Touching the board or moving tiles never silences the alarm. You can also add a QR code, NFC tag, shake or quick puzzle as another way out.</li>
<li>An emergency <strong>hold-to-stop</strong> always works, at any time. It ends that alarm as not done; the next one stays set.</li>
<li>It rings over the lock screen, works after a reboot before you unlock, and has a home-screen widget, a Quick Settings tile and shortcuts. It asks for each permission only when you turn on the thing that needs it.</li>
<li>No account. It goes online only to check for updates and, if you set one, to call your own smart-home link. Force Stop or uninstall switches it off, because Android says so.</li>
</ul>
<p><small>Install: open the downloaded file and allow installs from this source when Android asks. Already have an older version? This installs over it and keeps your alarms. This is a development build signed with a debug key, so it cannot update a future release build.</small></p>
</main>
</body>
</html>
"""

CARD_A, CARD_B = '<!-- apk-card:{id} -->', '<!-- /apk-card:{id} -->'
CARD = """<style>.apk-card.app-{id}{{display:block;max-width:420px;margin:28px auto 8px;padding:16px 18px;border:3px solid var(--ink);border-radius:10px;background:#fff9e6;color:#2a0a44;text-align:center;text-decoration:none;box-shadow:5px 6px 0 #3c355233}}.apk-card.app-{id} strong{{display:block;font:700 18px/1.3 system-ui,sans-serif}}.apk-card.app-{id} span{{display:block;margin-top:4px;font:14px/1.4 system-ui,sans-serif}}.apk-card.app-{id} em{{display:inline-block;margin-top:10px;padding:10px 22px;border-radius:6px;background:var(--accent);color:#fff;font:700 16px system-ui,sans-serif;font-style:normal}}</style>
<a class="apk-card app-{id}" href="/download/{id}/"><strong>{name} (Android)</strong><span>Version {version} &middot; {size} &middot; APK</span><em>Download</em></a>"""


def apk_records():
    catalogue = json.loads((ROOT / 'apps/apps.json').read_text(encoding='utf-8'))
    out = []
    for a in catalogue['apps']:
        if a['type'] != 'apk' or a['status'] != 'ready' or 'apk' not in a:  # LB record predates this (href only)
            continue
        apk = ROOT / a['apk']
        sha_file = ROOT / (a['apk'] + '.sha256')
        if not apk.is_file() or not sha_file.is_file():
            raise SystemExit(f"{a['id']}: missing apk or .sha256")
        import hashlib
        digest = hashlib.sha256(apk.read_bytes()).hexdigest()
        if sha_file.read_text(encoding='utf-8').split()[0] != digest:
            raise SystemExit(f"{a['id']}: .sha256 does not match the apk bytes")
        size = apk.stat().st_size
        out.append(dict(a, sha=digest, file=apk.name, size=f'{size / 1048576:.1f} MB'))
    return out


PLAY = '<svg class="g" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:36px;height:36px;fill:currentColor"><path d="M7 4l13 8-13 8z"/></svg>'
GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>'
BACK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'


def wordless(ui):
    """apps.json "wordless": true -> icon/digit-only menu (names move to aria-label / visually hidden; .vh lives in the app's CSS)."""
    swaps = [('<h1>', '<h1 class="vh">'), ('<p class="tag">', '<p class="tag vh">', 1),
             (re.compile(r'<p class="tag">[^<]*: <strong id="best">'), '<p class="tag num">&#9733; <strong id="best">'),
             ('<button id="start" type="button">Start</button>', f'<button id="start" type="button" aria-label="Start">{PLAY}</button>'),
             ('<button id="open-settings" class="alt" type="button">Settings</button>', f'<button id="open-settings" class="alt" type="button" aria-label="Settings">{GEAR}</button>'),
             ('<button id="back" class="alt" type="button">← Menu</button>', f'<button id="back" class="alt" type="button" aria-label="Menu">{BACK}</button>')]
    for old, new, *n in swaps:
        out = old.sub(new, ui, count=1) if hasattr(old, 'sub') else ui.replace(old, new, *(n or [1]))
        assert out != ui, f'wordless: no match for {old}'
        ui = out
    return ui


def write_apk(a):
    page = APK_PAGE.format(**{k: (escape(v) if isinstance(v, str) and k != 'apk' else v) for k, v in a.items()})
    out = ROOT / 'download' / a['id'] / 'index.html'
    out.write_text(page, encoding='utf-8', newline=chr(10))
    print(f"{a['id']}: wrote download/{a['id']}/index.html")
    # Card on the host page: a marked block, replaced in place so a second run changes nothing.
    host = ROOT / a['card']
    text = host.read_bytes().decode('utf-8')
    nl = chr(13) + chr(10) if chr(13) + chr(10) in text else chr(10)
    block = CARD_A.format(**a) + nl + CARD.format(**{k: escape(v) if isinstance(v, str) else v for k, v in a.items()}).replace(chr(10), nl) + nl + CARD_B.format(**a)
    start, end = CARD_A.format(**a), CARD_B.format(**a)
    if start in text:
        i, j = text.index(start), text.index(end) + len(end)
        text = text[:i] + block + text[j:]
    else:
        anchor = '<footer class="foot">'
        if anchor not in text:
            raise SystemExit(f"{a['card']}: no footer to place the card before")
        text = text.replace(anchor, block + nl + nl + '  ' + anchor, 1)
    host.write_bytes(text.encode('utf-8'))
    print(f"{a['id']}: card in {a['card']}")



def main():
    apps = load()
    scopes = [f"/apps/{a['id']}/" for a in apps]
    if len(set(scopes)) != len(scopes):
        raise SystemExit('duplicate app scope')
    for a in apps:
        out = ROOT / 'apps' / a['id']
        editor = a.get('mode') == 'editor'
        frame = a.get('mode') == 'iframe'
        if editor:
            # Optional model packs: sizes shown before the user chooses to download.
            models = [{'pack': o['pack'], 'label': o['label'], 'mb': round(sum((ROOT / f).stat().st_size for f in o['files']) / 1048576, 1),
                       **({'note': o['note']} if o.get('note') else {})} for o in a['optionalPacks']]
            cfg = {'name': a['name'], 'src': a['src'], 'style': a['style'], 'mode': 'editor', 'before': f"/apps/{a['id']}/export-fix.mjs", 'models': f"/apps/{a['id']}/models.mjs", 'optional': models, 'resetKeys': a['resetKeys']}
        elif frame:
            cfg = {'name': a['name'], 'src': a['src'], 'mode': 'iframe'}
        else:
            cfg = {'name': a['name'], 'src': a['src'], 'mount': a['mount'], 'options': a['options'], 'bestKey': a['bestKey']}
            if a.get('win95') and not a.get('settingsModule'):
                raise SystemExit(f"{a['id']}: win95 needs a settingsModule")
            if a.get('settingsModule'):
                cfg['settingsModule'] = a['settingsModule']
        config = json.dumps(cfg, sort_keys=True).replace('</', '<\/')
        panels = (RESET if 'reset-best' in a['settings'] else '') + (RESET_HAND if 'reset-hand' in a['settings'] else '') \
            + (MODELS if 'extra-models' in a['settings'] else '')
        icon = f"/apps/{a['id']}/{a['icons'][0]}"
        ui = UI.format(name=escape(a['name']), description=escape(a['description']), icon192=icon,
                       best_line='' if editor or frame else f'<p class="tag">{escape(a.get("bestLabel", "Best"))}: <strong id="best">0</strong></p>\n',
                       note_line=f'<p class="tag note">{escape(a["note"])}</p>\n' if a.get('note') else '',
                       reset_panel=panels, tilt_panel=TILT if 'tilt' in a['settings'] else '',
                       saved='saved hand' if editor else 'saved best',
                       host='<div id="host"><div id="root"></div></div>' if editor else '<div id="host"></div>')
        if a.get('win95'):
            ui = UI_W95.format(name=escape(a['name']), description=escape(a['description']), icon192=icon, saved='saved best', host='<div id="host"></div>')
        if a.get('wordless'):
            ui = wordless(ui)
        gate = ''
        if a.get('browserPlay') is False:
            # Download-only: a plain browser sees install steps and the finite story link; the play UI sits in an inert template
            # that the shell instantiates only for a standalone launch (display-mode is presentation, not security).
            gate = GATE.format(icon192=icon, name=escape(a['name']), description=escape(a['description']), finite=a['finite'])
            ui = '<template id="app-ui">\n' + ui + '</template>\n'
        page = PAGE.format(pack=a['pack'], name=escape(a['name']), short=escape(a['shortName']), theme=a['theme'],
                           description=escape(a['description']), icon192=icon,
                           style_link=f'<link rel="stylesheet" href="{a["style"]}">\n' if a.get('style') and not editor else '',
                           app_style=f'<link rel="stylesheet" href="{a["appStyle"]}">\n' if a.get('appStyle') else '',
                           gate=gate, ui=ui, config=config)
        (out / 'index.html').write_text(page, encoding='utf-8', newline='\n')
        (out / 'manifest.webmanifest').write_text(json.dumps(manifest(a), indent=2) + '\n', encoding='utf-8', newline='\n')
        print(f"{a['id']}: wrote apps/{a['id']}/index.html + manifest.webmanifest")
    for a in apk_records():
        write_apk(a)


if __name__ == '__main__':
    main()
