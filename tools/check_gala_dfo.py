"""Gala on the DFO rig: editor menus (species, armour, trim), v1 import migrates, crowd renders. Needs a static
server on 127.0.0.1:8898 (python -m http.server 8898). Writes tools/shots/gala-dfo-*.png."""
from playwright.sync_api import sync_playwright, expect
import json, os
os.makedirs('tools/shots', exist_ok=True)
V1 = {"schema": "mominc-avatar", "version": 1, "name": "Old Guest", "dye": 3,
      "parts": {"body": 4, "skin": 12, "face": 2, "hair": 13, "facial": 1, "headwear": 5, "neck": 2, "torso": 1, "shoulders": 6,
                "arms": 4, "hands": 1, "legs": 1, "feet": 3, "held": 4, "back": 5, "base": 2, "pet": 3}}
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for w, h, tag in [(390, 844, 'portrait'), (844, 390, 'landscape')]:
        p = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2); errors = []
        p.on('pageerror', lambda e: errors.append(str(e)))
        p.goto('http://127.0.0.1:8898/gala/')
        p.evaluate("v=>localStorage.setItem('mominc-avatar-v1',JSON.stringify(v))", V1)
        p.reload(); p.wait_for_function("window.GalaAvatar&&GalaAvatar.renderer==='dfo-rig-1'&&document.querySelector('#sections button')", timeout=30000)
        look = p.evaluate("GalaAvatar.normalize(JSON.parse(localStorage.getItem('mominc-avatar-v1')))")
        assert look['version'] == 2 and look['trim'] == 3 and all(look['parts'][k] == v for k, v in V1['parts'].items()), look
        p.wait_for_timeout(1500)
        def click(sel, i=0): p.evaluate("([s,i])=>document.querySelectorAll(s)[i].click()", [sel, i]); p.wait_for_timeout(250)
        menus = p.locator('#sections button').all_text_contents(); assert 'Armour' in menus, menus
        click('#sections button[data-menu=armour]'); assert p.locator('#options button').count() == 13
        click('#options button', 9); assert p.evaluate("JSON.parse(localStorage.getItem('mominc-avatar-v1')).parts.armor") == 9
        click('#sections button[data-menu=clothing]'); click('#subsections button[data-section=trim]'); click('#dyes button', 7)
        saved = p.evaluate("JSON.parse(localStorage.getItem('mominc-avatar-v1'))"); assert saved['trim'] == 7 and saved['dye'] == 3, saved
        click('#sections button[data-menu=appearance]'); click('#subsections button[data-section=tail]')
        assert p.locator('#options button').count() == 14
        p.screenshot(path=f'tools/shots/gala-dfo-editor-{tag}.png')
        assert not errors, errors
        p.close()
    p = b.new_page(viewport={'width': 390, 'height': 844}); errors = []; p.on('pageerror', lambda e: errors.append(str(e)))
    p.goto('http://127.0.0.1:8898/tv/games/goon/'); p.wait_for_timeout(6000)
    p.screenshot(path='tools/shots/gala-dfo-goon.png'); assert not errors, errors
    print('PASS gala DFO rig: v1 migrates, species/armour/trim menus save, goon party renders', flush=True)
    b.close()
