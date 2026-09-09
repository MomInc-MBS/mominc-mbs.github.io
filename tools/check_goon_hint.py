from pathlib import Path
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1000,'height':800})
 source=Path('tv/games/goon/assets/index-W2w8AfON.js').read_text(encoding='utf8')+';window.__hintTestGame=Qi;'
 p.route('**/index-W2w8AfON.js',lambda r:r.fulfill(body=source,content_type='application/javascript'))
 p.goto('http://127.0.0.1:8898/play/goon/');f=p.frame_locator('#ggGame');expect(f.locator('canvas').first).to_be_visible();frame=p.locator('#ggGame').content_frame
 p.wait_for_timeout(1000)
 game=p.frames[1]
 game.wait_for_function('window.__hintTestGame?.scene.getScene("GalaScene")?.board?.length>0')
 game.evaluate('clearTimeout(window.__hintTestGame.scene.getScene("GalaScene").hintTimeoutId)')
 for direction in ['up','right','down','left']:
  game.evaluate('(d)=>window.__hintTestGame.scene.getScene("GalaScene").showHintArrow(d)',direction)
  expect(p.locator('.ggTap.is-hint')).to_have_count(1);expect(p.locator('.ggTap.is-hint')).to_have_attribute('data-dir',direction)
 expect(f.locator('#swipeHint')).to_have_count(0)
 game.evaluate('''()=>{const s=window.__hintTestGame.scene.getScene('GalaScene');s.board=[[1,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]];s.showHintArrow('down');s.lastMoveTime=-10000;}''')
 p.locator('.ggTap-down').click();expect(p.locator('.ggTap.is-hint')).to_have_count(0)
 p.evaluate("window.postMessage({type:'goon-direction-hint',direction:'left'},location.origin)");expect(p.locator('.ggTap.is-hint')).to_have_count(0)
 game.evaluate('window.__hintTestGame.scene.getScene("GalaScene").showHintArrow("up")');p.screenshot(path='tools/shots/goon-arrow-hint.png')
 game.evaluate('window.__hintTestGame.scene.getScene("GalaScene").showEndingCard(true)');expect(p.locator('.ggTap.is-hint')).to_have_count(0)
 print('PASS direction-only glow, move clearing, ending clearing, no gradient overlay, source validation');b.close()
