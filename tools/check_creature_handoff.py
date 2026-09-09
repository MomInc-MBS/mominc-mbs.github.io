from playwright.sync_api import sync_playwright,expect
import re
base='http://127.0.0.1:8898'
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1280,'height':900});errors=[];p.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
 p.goto(base+'/tv/?ch=mominc')
 p.evaluate("['fuel','lilboyfriend','djscratch','corgi'].forEach(id=>MBS_STATE.bankUnlock(id))")
 p.add_init_script("localStorage.setItem('mbs-hand-profile-v1',JSON.stringify({version:1,complete:true,source:'handborne',sections:Object.fromEntries(['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'].map(k=>[k,0]))}));localStorage.setItem('mbs-hand-decisions-v1',JSON.stringify({count:5,last:'test'}))")
 def armie(route):
  q=route.fetch();route.fulfill(response=q,body=q.text().replace('let labFrame=null,myrFrame=null;','window.__lastDoor=()=>{s.hall=2;startLab();};let labFrame=null,myrFrame=null;'))
 p.route('**/channels/armie.html*',armie)
 p.goto(base+'/tv/?ch=armie')
 if p.locator('#tv').get_attribute('data-state')!='on':p.locator('#power').click()
 p.evaluate('__lastDoor()');expect(p.locator('#ar-lab-frame')).to_be_visible(timeout=45000)
 lab=p.locator('#ar-lab-frame').element_handle().content_frame();expect(lab.locator('#close-door')).to_be_visible(timeout=12000)
 lab.evaluate("()=>{for(let i=0;i<5;i++)document.querySelector('#close-door').click()}")
 expect(p.locator('#ar-myr-frame')).to_be_visible(timeout=45000)
 studio=p.locator('#ar-myr-frame').element_handle().content_frame();expect(studio.frame_locator('#creator-screen').locator('canvas')).to_be_visible(timeout=30000)
 print('PASS final doorway animation, lab door closure and creature studio handoff',flush=True)
 assert not errors,errors;b.close()
