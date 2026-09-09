from playwright.sync_api import sync_playwright,expect
with sync_playwright() as pw:
 b=pw.chromium.launch()
 for width,height in [(1440,1000),(390,844)]:
  p=b.new_page(viewport={'width':width,'height':height});p.goto('http://127.0.0.1:8898/gala/');expect(p.locator('#avatar')).to_be_visible()
  for selector in ['#sections','#options']:
   rows=p.locator(selector).evaluate('(e)=>new Set([...e.children].map(b=>Math.round(b.getBoundingClientRect().top))).size');assert rows==2,(selector,rows)
  p.locator('[data-section="pet"]').click();expect(p.locator('#category-name')).to_have_text('Pet');expect(p.locator('#options button')).to_have_count(20);p.locator('#options button').nth(19).click();expect(p.locator('#options button').nth(19)).to_have_attribute('aria-pressed','true')
  box=p.locator('#avatar').bounding_box();assert box['y']>=0 and box['y']+box['height']<height-60,box
  choice=p.locator('#options button').nth(19).bounding_box();assert choice['y']>=box['y']+box['height'],(box,choice)
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  p.screenshot(path=f'tools/shots/gala-two-rows-{width}.png');p.close()
 print('PASS two rows, avatar stays visible while selecting last pet, desktop and phone fit');b.close()
