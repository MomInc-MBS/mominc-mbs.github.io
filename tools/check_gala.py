from playwright.sync_api import sync_playwright,expect
import json
with sync_playwright() as pw:
 b=pw.chromium.launch();p=b.new_page(viewport={'width':1440,'height':1100});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8898/gala/');expect(p.locator('#sections button')).to_have_count(16);expect(p.locator('#options button')).to_have_count(10)
 unique=p.evaluate('''()=>GalaAvatar.sections.map(s=>{const hashes=new Set();for(let i=0;i<10;i++){const look=structuredClone(GalaAvatar.defaultLook);look.parts[s.id]=i;const c=document.createElement('canvas');GalaAvatar.draw(c,look);hashes.add(c.toDataURL());}return [s.id,hashes.size]})''');print(unique,flush=True);assert all(n==10 for _,n in unique),unique
 p.screenshot(path='tools/shots/gala-desktop.png',full_page=True)
 p.get_by_role('button',name='Vexling',exact=True).click();p.locator('#guest-name').fill('Lady Quasar');p.locator('#save').click();expect(p.locator('#looks button')).to_have_count(1)
 p.reload();expect(p.locator('#guest-name')).to_have_value('Lady Quasar');assert p.evaluate("JSON.parse(localStorage.getItem('mominc-avatar-v1')).parts.body")==1
 p.locator('#random').click();after=p.locator('#avatar').evaluate('(e)=>e.toDataURL()');p.locator('#undo').click();assert p.locator('#avatar').evaluate('(e)=>e.toDataURL()')!=after;p.locator('#redo').click();assert p.locator('#avatar').evaluate('(e)=>e.toDataURL()')==after
 with p.expect_download() as dl:p.locator('#export').click()
 dl.value.save_as('tools/shots/avatar-look.json');p.locator('#import').set_input_files('tools/shots/avatar-look.json');expect(p.locator('#status')).to_contain_text('Imported')
 with p.expect_download() as dl:p.locator('#png').click()
 dl.value.save_as('tools/shots/avatar-portrait.png')
 p.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schema":"mominc-avatar","version":1,"parts":{}}'});expect(p.locator('#status')).to_contain_text('unknown')
 p.set_viewport_size({'width':390,'height':844});p.evaluate('scrollTo(0,0)');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');p.screenshot(path='tools/shots/gala-mobile.png',full_page=True)
 p.locator('#join').click();p.wait_for_url('**/play/goon/');expect(p.frame_locator('#ggGame').locator('a[aria-label^="Change your gala avatar"]')).to_be_visible();expect(p.frame_locator('#ggGame').locator('canvas').first).to_be_visible()
 assert not errors,errors
 print('PASS all 160 distinct options, persistence, undo/redo, export/import, PNG, mobile and gala avatar',flush=True);b.close()
