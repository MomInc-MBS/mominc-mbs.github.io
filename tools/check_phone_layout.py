from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p.goto('http://127.0.0.1:8898/gala/');p.wait_for_timeout(300);assert 'user-scalable=no' in p.locator('meta[name=viewport]').get_attribute('content');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');assert p.locator('#guest-name').evaluate('(e)=>getComputedStyle(e).fontSize')=='16px';print('PASS phone viewport and input sizing');b.close()
