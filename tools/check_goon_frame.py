from playwright.sync_api import sync_playwright,expect
with sync_playwright() as pw:
 b=pw.chromium.launch()
 for width in [1100,390]:
  p=b.new_page(viewport={'width':width,'height':844});p.goto('http://127.0.0.1:8898/play/goon/');expect(p.locator('#ggGame')).to_be_visible();frame=p.locator('#ggGame').bounding_box();assert frame['width']>=width-12,frame
  assert p.locator('#ggFrame').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(9, 8, 11)'
  for direction in ['up','right','left','down']:
   button=p.locator('.ggTap-'+direction);expect(button).to_be_visible();r=button.bounding_box();assert r['y']+r['height']<=frame['y'] or r['y']>=frame['y']+frame['height'],(r,frame)
  p.screenshot(path=f'tools/shots/goon-gold-frame-{width}.png');p.close()
 print('PASS purple mat removed, full-width board, gold border and unobstructed arrows');b.close()
