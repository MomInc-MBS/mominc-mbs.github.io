"""Phone-viewport proof for the opening-office actions: python tools/shot_corgi_lobby.py http://localhost:PORT OUTDIR
Serve a `git archive HEAD` copy. Teleports the dog next to each prop through the existing window.__corgi probe."""
import sys, os, math
from playwright.sync_api import sync_playwright
base, out = sys.argv[1].rstrip('/'), sys.argv[2]; os.makedirs(out, exist_ok=True)
res = []
def check(n, ok, note=''): res.append(ok); print(('PASS ' if ok else 'FAIL ') + n, note)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(base + '/play/corgi/'); pg.wait_for_function('window.__corgi && window.__corgi.level === 0', timeout=90000); pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{out}/1-walk.png')
    x0 = pg.evaluate('window.__corgi.player.x'); pg.keyboard.down('w'); pg.wait_for_timeout(900); pg.keyboard.up('w')
    check('walk immediately (keyboard)', pg.evaluate('window.__corgi.player.x') > x0 + 0.5)
    listeners = pg.evaluate('document.querySelectorAll(".cc-use").length')
    props = lambda kind: pg.evaluate("(k) => window.__corgi.monster.parent.children.filter(c => c.userData.prop === k).map(c => [c.position.x, c.position.z])", kind)
    def stand_near(x, z, label):
        for dx, dz in [(0, 1.1), (0, -1.1), (1.1, 0), (-1.1, 0), (0.8, 0.8), (-0.8, -0.8), (0.8, -0.8), (-0.8, 0.8)]:
            px, pz = x + dx, z + dz; yaw = math.atan2(-(x - px), -(z - pz))
            pg.evaluate('([a,b,y]) => { const p = window.__corgi.player; p.x = a; p.z = b; p.yaw = y; p.pitch = 0; }', [px, pz, yaw])
            pg.wait_for_timeout(350)
            if pg.locator('.cc-use').is_visible() and label in pg.locator('.cc-use').inner_text().upper(): return True
        return False
    for kind, label, shot, line in [('coffee', 'SIP COFFEE', '2-coffee', 'Productivity tastes wonderful.'), ('desk', 'STAMP FILE', '3-stamp', 'Filed.')]:
        pts = props(kind); ok = False
        for x, z in pts:
            if stand_near(x, z, label): ok = True; break
        check(f'{kind}: prompt button near prop', ok, len(pts))
        if not ok: continue
        n0 = pg.evaluate('document.querySelectorAll("canvas").length')
        pg.locator('.cc-use').click(); pg.evaluate("document.querySelector('.cc-lobby-fx').getAnimations().forEach(a => { a.pause(); a.currentTime = 300; })"); print(pg.evaluate("(()=>{const e=document.querySelector('.cc-lobby-fx');const s=getComputedStyle(e);return [e.className,e.textContent,s.opacity,s.color]})()")); pg.screenshot(path=f'{out}/{shot}.png')
        check(f'{kind}: line shown', line in pg.locator('.cc-lobby-line').inner_text())
        pg.wait_for_timeout(1400)
        if kind == 'desk':
            decals = lambda: pg.evaluate("window.__corgi.monster.parent.children.filter(c => c.material && c.material.map && c.geometry.type === 'PlaneGeometry' && c.rotation.x < -1.5 && c.position.y > .6 && c.position.y < .7).length")
            pg.evaluate('window.__corgi.player.pitch = 0.6'); pg.wait_for_timeout(500); pg.screenshot(path=f'{out}/3b-stamp-mark.png'); pg.evaluate('window.__corgi.player.pitch = 0')
            d1 = decals(); pg.locator('.cc-use').click(); pg.wait_for_timeout(1400); pg.locator('.cc-use').click(); pg.wait_for_timeout(1400)
            check('stamp: visible mark, repeats reuse one decal', d1 == 1 and decals() == 1, (d1, decals()))
    # boss: place him near the dog (he is visible only on haunts; reuse the existing mesh)
    ok = False
    # the office boss haunts the corridor on his own schedule: stand in the hall facing down it and wait for him to come within reach
    pg.evaluate('() => { const p = window.__corgi.player; p.x = 14; p.z = 0; p.yaw = -Math.PI / 2; }')
    for _ in range(80):
        pg.wait_for_timeout(250); pg.screenshot(path=f'{out}/4-boss.png')   # keyboard path (E): same action as the button
        if pg.locator('.cc-use').is_visible() and 'SAY HI' in pg.locator('.cc-use').inner_text():
            pg.keyboard.press('e'); pg.wait_for_timeout(250); pg.screenshot(path=f'{out}/4-boss.png'); break
    ok = 'initiative' in pg.locator('.cc-lobby-line').inner_text()
    check('boss line', ok)
    # newspapers unchanged: three reports, reading still works, no duplicate button/objects after repeats
    check('three real reports intact', pg.evaluate('window.__corgi.pages.length') == 3)
    check('one use button, no duplicates', pg.locator('.cc-use').count() == 1 == listeners)
    pg.keyboard.press('r'); pg.wait_for_timeout(500)
    check('paper viewer opens and hides the action button', pg.locator('#ccBookStage').is_visible() and not pg.locator('.cc-use').is_visible())
    pg.screenshot(path=f'{out}/5-paper.png')
    check('no page errors', not errs, errs[:3])
    b.close()
print(sum(res), '/', len(res)); sys.exit(0 if all(res) else 1)
