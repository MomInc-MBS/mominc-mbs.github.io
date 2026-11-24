"""Phone-viewport proof for the installed Corgi Endless app.

  python tools/shot_corgi_endless.py http://localhost:8934 OUTDIR

Serve a `git archive HEAD` copy (hash-checked packs fail on CRLF checkouts). Standalone is forced with a
Playwright init script that sets navigator.standalone: nothing in the product reads a query flag for this.
Writes: 1-browser-gate, 2-menu, 3-section, 4-offer, 5-replace, 6-settings, 7-wall, 8-section-after-exit PNGs, plus
resources.json (renderer.info per section) and a short pass/fail list on stdout.
"""
import json, sys, os
from playwright.sync_api import sync_playwright

base, out = sys.argv[1].rstrip('/'), sys.argv[2]
os.makedirs(out, exist_ok=True)
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
results = []
def check(name, ok, note=''):
    results.append((name, bool(ok), note)); print(('PASS ' if ok else 'FAIL ') + name + (' ' + str(note) if note else ''))

with sync_playwright() as p:
    browser = p.chromium.launch(args=ARGS)
    def ctx(standalone):
        c = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True,
                                service_workers='allow')
        if standalone:
            c.add_init_script("Object.defineProperty(navigator,'standalone',{get:()=>true})")
        return c

    # ---- the finite story is untouched: ?app=1&mode=endless is ignored, tone stays public, no endless store is created
    c = ctx(False); page = c.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(base + '/play/corgi/?app=1&mode=endless'); page.wait_for_function('window.__corgi && window.__corgi.level === 0', timeout=60000); page.wait_for_timeout(2500)
    check('story: public tone, no endless hook', page.evaluate("document.querySelector('#cc').dataset.mode") == 'public' and page.evaluate('!window.__corgi.endless'))
    check('story: no endless store written', page.evaluate("localStorage.getItem('corgi-endless-v1')") is None)
    check('story: three paper hearts and finite pages', page.evaluate('window.__corgi.lives') == 3 and page.evaluate('window.__corgi.pages.length') == 3)
    page.screenshot(path=f'{out}/0-story-unchanged.png'); check('story: no page errors', not errs, errs[:3]); c.close()

    # ---- ordinary browser visit: instructions + finite link, no Endless Play
    c = ctx(False); page = c.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(base + '/apps/corgi/'); page.wait_for_timeout(2500)
    check('browser: gate visible', page.locator('#gate').is_visible())
    check('browser: no Start button in DOM', page.locator('#start').count() == 0)
    check('browser: no play stage in DOM', page.locator('#stage').count() == 0 and page.locator('#host').count() == 0)
    check('browser: finite story link', page.locator('#gate a.btn').get_attribute('href') == '/play/corgi/')
    check('browser: install steps shown', page.locator('#gate-steps li').count() >= 2)
    page.screenshot(path=f'{out}/1-browser-gate.png'); c.close()

    # ---- installed (standalone) launch
    c = ctx(True); page = c.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.on('response', lambda r: errs.append('404 ' + r.url) if r.status == 404 else None)
    page.goto(base + '/apps/corgi/'); page.wait_for_selector('#menu:not([hidden])', timeout=60000)
    check('standalone: gate removed, menu has Start + Settings', page.locator('#gate').count() == 0 and page.locator('#start').is_visible() and page.locator('#open-settings').is_visible())
    page.wait_for_timeout(1500); page.screenshot(path=f'{out}/2-menu.png')
    page.click('#start'); page.wait_for_function('window.__corgi && window.__corgi.endless', timeout=60000)
    page.wait_for_timeout(2500)
    ES = lambda js: page.evaluate('() => { const e = window.__corgi.endless; return ' + js + '; }')
    check('endless engine selected (ctx.endless)', page.locator('#cc[data-endless], #cc').count() == 1 and ES('!!e.run'))
    page.screenshot(path=f'{out}/3-section.png')
    info = [ES('e.info()')]; resources = {'1': info[0]}

    # ---- collect a paper -> persisted offer, reload resumes the SAME offer
    ES('e.teleport(e.layout.objectives[0].approachPoint[0], e.layout.objectives[0].approachPoint[1])')
    page.wait_for_function('document.querySelector(".ce-ov")', timeout=15000)
    check('offer overlay shown', page.locator('.ce-card').count() == 3)
    titles = page.locator('.ce-card b').all_inner_texts()
    saved = page.evaluate("JSON.parse(localStorage.getItem('corgi-endless-v1')).run.pendingOffer.choices.map(c=>c.perk)")
    check('offer persisted before/while shown', len(saved) == 3, saved)
    page.screenshot(path=f'{out}/4-offer.png')
    page.reload(); page.wait_for_selector('#menu:not([hidden])', timeout=60000); page.click('#start')
    page.wait_for_selector('.ce-ov', timeout=60000)
    check('reload reopens the same offer (no reroll)', page.locator('.ce-card b').all_inner_texts() == titles)
    check('reload does not duplicate the paper', page.evaluate("JSON.parse(localStorage.getItem('corgi-endless-v1')).run.collected.length") == 1)
    page.locator('.ce-card').nth(0).click(); page.wait_for_timeout(600)
    check('pick commits once', page.evaluate("JSON.parse(localStorage.getItem('corgi-endless-v1')).run.slots.filter(Boolean).length") == 1)

    # ---- fill both slots, then a third new perk asks which slot to replace
    ES("(e.grant('zoomies', 5, 0), e.grant('wind', 2, 1), 1)")
    page.evaluate("() => { const e = window.__corgi.endless; }")
    # drive the real collect of paper 1 through the engine's own pickup
    ES('e.teleport(e.layout.objectives[1].approachPoint[0], e.layout.objectives[1].approachPoint[1])')
    page.wait_for_selector('.ce-ov', timeout=15000)
    new_card = page.locator('.ce-card', has_text='NEW')
    if new_card.count():
        new_card.first.click(); page.wait_for_timeout(300)
        check('replace screen asks which slot', page.locator('.ce-paper h2').inner_text().startswith('REPLACE'))
        page.screenshot(path=f'{out}/5-replace.png')
        page.locator('.ce-card').nth(1).click(); page.wait_for_timeout(500)
    else:
        page.locator('.ce-card').first.click(); page.wait_for_timeout(500)
    ms = page.locator('.ce-ov')
    if ms.count(): ms.locator('button').first.click(); page.wait_for_timeout(500)
    check('no overlay blocks play afterwards', page.locator('.ce-ov').count() == 0)

    # ---- third paper opens the exit; walking through it advances exactly one section
    ES('e.teleport(e.layout.objectives[2].approachPoint[0], e.layout.objectives[2].approachPoint[1])')
    page.wait_for_selector('.ce-ov', timeout=15000)
    page.locator('.ce-keep').click(); page.wait_for_timeout(1500)
    sec0 = ES('e.run.section')
    ES('e.teleport(e.layout.corridorLength - 2.5, 0)'); page.wait_for_function('window.__corgi.doorOpen', timeout=15000)
    check('exit opens after all three papers', True)
    ES('e.teleport(e.layout.corridorLength - 0.2, 0)')
    page.wait_for_function('window.__corgi.endless.run.section > ' + str(sec0), timeout=15000)
    page.wait_for_timeout(1500)
    check('exit advances exactly one section', ES('e.run.section') == sec0 + 1, ES('e.run.section'))
    page.screenshot(path=f'{out}/8-section-after-exit.png')

    # ---- protection is finite: Zoomies + Slippery; the pursuer never reads Zoomies; pausing neither spends nor refills it
    ES("(e.grant('zoomies', 5, 0), e.grant('slippery', 5, 1), 1)")
    check('Zoomies+Slippery effects', ES('[e.fx.speedMul, e.fx.graceMs, +e.fx.catchRange.toFixed(2)]') == [1.3, 750, 0.6])
    check('chaser speed ignores Zoomies', abs(page.evaluate('window.__corgi.chase.speed') - 2.5 * (0.25 + 0.35 * (ES('e.run.section') - 1) / 9)) < 1e-9, page.evaluate('window.__corgi.chase.speed'))
    ES('e.capture()'); page.wait_for_timeout(800)   # respawn fires at 700 ms and sets the window
    two = page.evaluate('''() => new Promise(res => { const e = window.__corgi.endless, a = e.protectUntil() - performance.now(); setTimeout(() => res([a, e.protectUntil() - performance.now(), e.protectUntil()]), 150); })''')
    check('protection window is finite, counts down, and is not renewed', two[1] < two[0] and two[0] <= 1350 + 50, [round(v) for v in two[:2]])

    # ---- ten successive sections: resource plateau + frame time
    series = []
    for n in range(2, 12):
        ES(f'e.setSection({n})'); page.wait_for_timeout(1800)
        i = ES('e.info()'); series.append((n, i))
        resources[str(n)] = i
    ft = page.evaluate("""() => new Promise(res => { const t = []; let last = performance.now(); let n = 0;
        const f = now => { t.push(now - last); last = now; if (++n < 90) requestAnimationFrame(f); else res(t.slice(10)); }; requestAnimationFrame(f); })""")
    resources['frame_ms_avg_after_section_11'] = sum(ft) / len(ft)
    # same layout rebuilt ten times must not grow at all; ten different layouts stay under one ceiling (layout size varies 3-5 areas)
    same = []
    for _ in range(10):
        ES('e.setSection(7)'); page.wait_for_timeout(900); same.append(ES('e.info()'))
    sg, st = [i['geometries'] for i in same], [i['textures'] for i in same]
    check('same section rebuilt x10: geometries flat', max(sg[2:]) - min(sg[2:]) <= 2, sg)
    check('same section rebuilt x10: textures flat', max(st[2:]) - min(st[2:]) <= 2, st)
    geos = [i['geometries'] for _, i in series]; texs = [i['textures'] for _, i in series]
    check('sections 2-11: no upward trend', sum(geos[5:]) / 5 <= 1.3 * sum(geos[:5]) / 5 and max(geos) < 220, geos)
    check('sections 2-11: textures bounded', max(texs) < 60, texs)
    check('light count bounded', all(i['lights'] <= 20 for _, i in series), [i['lights'] for _, i in series])
    json.dump(resources, open(f'{out}/resources.json', 'w'), indent=1)

    # ---- capture loses a heart; the last heart ends the run
    hearts0 = ES('e.run.hearts'); ES('e.capture()'); page.wait_for_timeout(1400)
    check('capture loses exactly one heart', ES('e.run.hearts') == hearts0 - 1, ES('e.run.hearts'))
    for _ in range(hearts0):
        if ES('e.run.status') == 'over': break
        ES('e.capture()'); page.wait_for_timeout(900)
    check('last heart ends the run', ES('e.run.status') == 'over' and page.locator('.ce-ov').count() == 1)
    page.screenshot(path=f'{out}/9-run-over.png')
    page.locator('.ce-go').click(); page.wait_for_timeout(1500)
    check('new run starts at section 1 with no powers', ES('[e.run.section, e.run.slots.filter(Boolean).length]') == [1, 0])
    check('best section survives the run', page.evaluate("JSON.parse(localStorage.getItem('corgi-endless-v1')).best.section") >= 2)

    # ---- settings + wall
    page.click('#back'); page.wait_for_selector('#menu:not([hidden])'); page.click('#open-settings')
    page.wait_for_selector('#sound'); page.screenshot(path=f'{out}/6-settings.png')
    check('settings: sound, look, reset run, wall', all(page.locator(s).count() == 1 for s in ['#sound', '#look', '#reset-run', '#open-wall']))
    page.click('#sound'); check('sound toggle persists', page.evaluate("JSON.parse(localStorage.getItem('corgi-endless-v1')).settings.sound") is False)
    page.click('#open-wall'); page.wait_for_selector('.wall'); page.screenshot(path=f'{out}/7-wall.png')
    check('wall shows ten pages', page.locator('.wall-page').count() == 10)
    page.click('.wall .alt')
    page.on('dialog', lambda d: d.accept())
    page.click('#reset-run'); page.wait_for_timeout(300)
    after = page.evaluate("JSON.parse(localStorage.getItem('corgi-endless-v1'))")
    check('reset run clears only the run', after['run'] is None and after['best']['section'] >= 2)
    check('no page errors', not [e for e in errs if 'favicon' not in e], errs[:5])
    # ---- look sensitivity really scales the drag
    page.click('#close-settings'); 
    def drag_yaw(look):
        page.evaluate("(v) => { const s = JSON.parse(localStorage.getItem('corgi-endless-v1')); s.settings.look = v; localStorage.setItem('corgi-endless-v1', JSON.stringify(s)); }", look)
        page.click('#start'); page.wait_for_function('window.__corgi && window.__corgi.endless', timeout=60000); page.wait_for_timeout(1500)
        y0 = page.evaluate('window.__corgi.player.yaw'); box = page.locator('.cc-viewport').bounding_box()
        x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 3
        page.mouse.move(x, y); page.mouse.down(); page.mouse.move(x + 100, y, steps=4); page.mouse.up()
        d = page.evaluate('window.__corgi.player.yaw') - y0
        page.click('#back'); page.wait_for_selector('#menu:not([hidden])'); return d
    d1, d2 = drag_yaw(1), drag_yaw(2)
    check('look sensitivity scales drag', abs(d1 + 0.55) < 0.02 and abs(d2 + 1.1) < 0.04, (round(d1, 3), round(d2, 3)))
    c.close(); browser.close()

failed = [r for r in results if not r[1]]
print(f'{len(results) - len(failed)}/{len(results)} passed'); sys.exit(1 if failed else 0)
