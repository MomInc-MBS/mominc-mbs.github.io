from playwright.sync_api import sync_playwright,expect
from pathlib import Path
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1440,'height':1000});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8898/tv/assets/armie-intro/myr5/index.html')
 p.wait_for_url('**/creature-tv.html');p.wait_for_function("document.documentElement.dataset.studioReady==='true'",timeout=60000)
 expect(p.locator('.cabinet')).to_be_visible();expect(p.locator('.phosphor')).to_be_visible()
 assert p.locator('.phosphor').evaluate("(e)=>getComputedStyle(e).pointerEvents")=='none'
 inner=p.locator('#creator-screen').element_handle().content_frame()
 expect(inner.get_by_role('button',name='Remix',exact=True)).to_be_visible()
 inner.get_by_role('button',name='Remix',exact=True).click()
 p.screenshot(path='tools/shots/creature-tv-desktop.png')
 p.locator('#pictureBtn').click();expect(p.locator('#tv')).to_have_attribute('data-picture','clear')
 p.locator('#power').click();expect(p.locator('#tv')).to_have_attribute('data-state','off')
 p.locator('#power').click();expect(p.locator('#tv')).to_have_attribute('data-state','on')
 p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(1200)
 box=p.locator('#creator-screen').bounding_box();assert box['width']>300 and box['height']>600,box
 inner.locator('canvas').scroll_into_view_if_needed();expect(inner.locator('canvas')).to_be_visible()
 p.screenshot(path='tools/shots/creature-tv-mobile.png')
 assert not errors,errors
 print('PASS original TV cabinet, whole studio inside CRT, usable Remix, clear picture, power and mobile sizing',flush=True)
 b.close()
