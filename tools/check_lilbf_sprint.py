from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={"width":1100,"height":850});p.on('console',lambda m:print(m.type,m.text[:250],flush=True) if m.type=='error' else None);p.on('pageerror',lambda e:print('ERROR',e,flush=True))
 def hook(route):
  source=Path('tv/channels/lilboyfriend.js').read_text(encoding='utf8').replace('window.__lbBooted = performance.now();','window.__zapTest=()=>{ST.t=.98;fireLaser(onConnect);};window.__runState=()=>({t:ST.t,phase:ST.phase,stomp:!!stompAt});window.__runEnd=()=>{ST.t=.0005;};window.__lbBooted = performance.now();');route.fulfill(body=source,content_type='application/javascript')
 p.route('**/channels/lilboyfriend.js*',hook);p.goto('http://127.0.0.1:8898/play/lilboyfriend/');p.wait_for_timeout(8000);print('HOOK',p.evaluate('!!window.__zapTest'),flush=True);print(p.locator('body').inner_text()[:350],flush=True)
 assert p.evaluate('!!window.__zapTest');
 if p.evaluate('!!window.__zapTest'):
  p.evaluate('__zapTest()');p.wait_for_timeout(4000);first=p.evaluate('__runState()');p.wait_for_timeout(2500);last=p.evaluate('__runState()');assert last['t']<first['t']-.015,(first,last);print('PASS continuous sprint',flush=True);p.evaluate('__runEnd()');p.wait_for_timeout(4500);assert 'show' in p.locator('#epiPanel').get_attribute('class');print('PASS stomp ending',flush=True)
 p.screenshot(path='tools/shots/lilbf-run-test.png');b.close()
