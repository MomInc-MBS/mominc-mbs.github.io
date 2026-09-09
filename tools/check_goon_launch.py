from playwright.sync_api import sync_playwright,expect
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1440,'height':1000});p.add_init_script("sessionStorage.setItem('mbs-on','1')")
 p.goto('http://127.0.0.1:8898/tv/?ch=goon');v=p.locator('[data-network-launch] video');expect(v).to_be_visible();p.wait_for_function('document.querySelector("[data-network-launch] video").readyState>=2');expect(p.locator('#ggFrame')).to_be_hidden();assert p.locator('#ggGame').get_attribute('src') is None
 with p.expect_popup() as popup:p.locator('[data-network-launch] a').click()
 g=popup.value;g.wait_for_url('**/play/goon/');expect(g.frame_locator('#ggGame').locator('canvas')).to_be_visible();frame=g.locator('#ggFrame').bounding_box();assert frame['width']>1350,frame
 g.locator('.exit').click();g.wait_for_url('**/tv/?ch=goon')
 p.goto('http://127.0.0.1:8898/games/goon/');expect(p.locator('.network-launch video')).to_be_visible();expect(p.locator('#play')).to_have_attribute('target','_blank')
 p.set_viewport_size({'width':390,'height':844});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 print('PASS preview playback, no embedded game, separate full-width game, return route and mobile fit')
 b.close()
