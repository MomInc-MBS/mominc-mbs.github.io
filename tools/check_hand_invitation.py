from playwright.sync_api import sync_playwright,expect
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1440,'height':1000})
 p.goto('http://127.0.0.1:8898/play/djscratch/');expect(p.locator('.dj-floor-speaker')).to_have_count(3);expect(p.locator('img[src*="clay-coach"]')).to_have_count(0)
 p.evaluate("['fuel','lilboyfriend','djscratch','corgi'].forEach(id=>MBS_STATE.bankUnlock(id))")
 p.goto('http://127.0.0.1:8898/handborne/');expect(p.locator('#hand-love-wall img')).to_be_visible();p.wait_for_timeout(1600)
 p.screenshot(path='tools/shots/hand-invitation.png')
 print(p.locator('#hand-love-wall img').bounding_box());print(p.locator('.creator-shell').bounding_box())
 expect(p.locator('canvas')).to_be_visible()
 p.get_by_role('button',name='Randomize unlocked sections',exact=True).click();p.wait_for_timeout(500)
 print(p.locator('#hand-progress').inner_text())
 p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(300);assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 print('PASS message moved, speakers preserved, hand canvas and controls working, mobile fits')
 b.close()
