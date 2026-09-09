from pathlib import Path
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1100,'height':850});errors=[];p.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
 p.goto('http://127.0.0.1:8898/play/djscratch/');p.locator('#powerSwitch').click()
 for key,target in [('bass',8),('treble',3),('volume',7),('tempo',9)]:
  control=p.locator('[data-key="'+key+'"].knobface,[data-key="'+key+'"].slidertrack');initial=int(control.get_attribute('aria-valuenow'));score=p.locator('#scoreNum').inner_text()
  for i in range((target-initial)%11):
   control.click();expect(control).to_have_attribute('aria-valuenow',str((initial+i+1)%11))
   if (initial+i+1)%11!=target:expect(p.locator('#scoreNum')).to_have_text(score)
 expect(p.locator('#dj')).to_have_class(__import__('re').compile('set-complete'));print('PASS DJ repeated clicks and target values',flush=True)
 p.evaluate("localStorage.setItem('mbs-corgi-school-v3',JSON.stringify({public:{found:[[true,true,true],[false,false,false],[false,false,false]],level:0,unlocked:0},live:null}))")
 p.goto('http://127.0.0.1:8898/play/corgi/');p.wait_for_function('window.__corgi',timeout=45000);expect(p.locator('#ccFlashBtn')).to_be_hidden();p.keyboard.press('f');expect(p.locator('#ccFlashBtn')).to_have_attribute('aria-pressed','false')
 p.evaluate('__corgi.player.x=45.8;__corgi.player.z=0');expect(p.locator('#ccTransition')).to_be_visible(timeout=5000);p.wait_for_timeout(1500);p.screenshot(path='tools/shots/corgi-breakroom.png')
 expect(p.get_by_role('button',name='TURN ON THE FLASHLIGHT',exact=True)).to_be_visible(timeout=12000);assert p.evaluate('__corgi.level')==1;p.screenshot(path='tools/shots/corgi-school-wake.png');p.get_by_role('button',name='TURN ON THE FLASHLIGHT',exact=True).click();expect(p.locator('#ccTransition')).to_be_hidden();expect(p.locator('#ccFlashBtn')).to_be_visible();expect(p.locator('#ccFlashBtn')).to_have_attribute('aria-pressed','true');p.wait_for_timeout(2000);assert p.evaluate('__corgi.battery')>97
 print('PASS breakroom transition, school loaded, flashlight instruction, office off and long charge',flush=True)
 assert not errors,errors
 m=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True).new_page();m.goto('http://127.0.0.1:8898/gala/');m.wait_for_timeout(300);assert 'user-scalable=no' in m.locator('meta[name=viewport]').get_attribute('content');assert m.evaluate('document.documentElement.scrollWidth<=innerWidth');assert m.locator('#guest-name').evaluate('(e)=>getComputedStyle(e).fontSize')=='16px';print('PASS phone viewport and input sizing',flush=True);b.close()
