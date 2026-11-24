"""Paper factory: real input, fresh instances, no GPU/CDN dependency, mobile and teardown."""
import functools,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)
with sync_playwright() as pw:
    b=pw.chromium.launch()
    p=b.new_page(viewport={'width':844,'height':390},reduced_motion='reduce')
    errors=[];requests=[]
    p.on('pageerror',lambda e:errors.append(str(e)))
    p.on('request',lambda r:requests.append(r.url))
    p.add_init_script("""window.__gpu=0; const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/i.test(type)){window.__gpu++;throw new Error('No GPU allowed');}return original.call(this,type,...args);};""")
    p.goto(base+'/play/girlfriend/')
    expect(p.locator('#dgTubeProps button')).to_have_count(6)
    assert not any('three' in url or 'jsdelivr' in url for url in requests)
    assert p.evaluate('window.__gpu')==0
    assert p.locator('#dgStage canvas').count()==0
    p.get_by_role('button',name='Pour Sentience juice research',exact=True).click()
    p.get_by_role('button',name='Mother’s love',exact=True).press('Enter')
    p.reload()
    expect(p.locator('#dgProgress')).to_have_text('0 / 6')
    assert p.evaluate('window.__dg.order')==[]
    for name in ['Sentience juice','Mother’s love','Dog loyalty','Small juice','Womanly wit','MBS Fuel']:
        p.get_by_role('button',name=name,exact=True).click()
    expect(p.get_by_role('button',name='Mould',exact=True)).to_be_enabled()
    p.get_by_role('button',name='Mould',exact=True).click()
    expect(p.locator('#dgPaperUnit')).to_be_visible()
    assert p.evaluate('window.__dg.lastVariant')=='purple'
    expect(p.locator('#dgPaperUnit')).to_be_visible()
    p.get_by_role('button',name='Pack',exact=True).click()
    p.get_by_role('button',name='Take goggles',exact=True).click()
    expect(p.locator('#dgVisBody')).to_contain_text('KNOWLEDGE IS POWER')
    p.locator('#dgVisX').press('Escape')
    expect(p.locator('#dgVis')).to_be_hidden()
    p.set_viewport_size({'width':390,'height':844})
    expect(p.locator('.rotate-notice')).to_have_count(0)   # TV3: no hard portrait block any more
    expect(p.get_by_role('button',name='Take goggles',exact=True)).to_be_visible()
    assert p.evaluate('window.__dg.poured')==6
    for w,h in [(320,568),(390,844),(667,375),(844,390),(1280,800)]:
        p.set_viewport_size({'width':w,'height':h})
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        doctor=p.locator('.dg-paper-doctor').bounding_box()
        stage=p.locator('#dgStage').bounding_box()
        assert doctor['y']<stage['y'], 'Character stays cropped above shoulders'
    p.reload()
    expect(p.locator('#dgProgress')).to_have_text('0 / 6')
    # Ordinary (non-original) Coach: Pack starts one on-page jumping round; Exit/death returns to the first tube.
    for name in ['Mother’s love','Sentience juice','Dog loyalty','Small juice','Womanly wit','MBS Fuel']:
        p.get_by_role('button',name=name,exact=True).click()
    p.get_by_role('button',name='Mould',exact=True).click()
    assert p.evaluate('window.__dg.batch.special')==False
    p.get_by_role('button',name='Pack',exact=True).click()
    expect(p.locator('#dgStage .dg-jump canvas')).to_have_count(1)
    assert p.evaluate('window.__dg.jumping')
    p.get_by_role('button',name='Exit to the pyramid').click()
    expect(p.locator('#dgStage canvas')).to_have_count(0)
    assert p.evaluate('window.__dg.poured')==0 and p.evaluate('window.__dg.phase')=='pour' and not p.evaluate('window.__dg.jumping')
    expect(p.locator('#dgNudge')).to_have_text('Make a new coach.')
    p.goto(base+'/tv/?ch=girlfriend')
    p.wait_for_function('()=>window.__dg?.paper')
    p.evaluate('()=>window.MBS_CH.unmount()')
    assert p.evaluate('typeof window.__dg')=='undefined'
    assert not errors, errors
    print('PASS: ordinary-coach jump round and exit; paper props and keyboard input; fresh-instance reset and all phases; locked goggles; rotation; five viewport sizes; no GPU or three.js; unmount')
    b.close()
server.shutdown()
