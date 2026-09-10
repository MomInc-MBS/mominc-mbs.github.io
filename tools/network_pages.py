"""The network's front door and gated hand-to-Armie route; no game catalog."""
from pathlib import Path
import re

def launch_markup(g):
    slug=g['slug']
    if slug not in ('lilboyfriend','corgi','djscratch','goon'):return ''
    if slug=='goon':return '<section class="network-launch" aria-label="Play Goon"><a href="../../gala/" target="_blank" rel="noopener"><video src="../../tv/assets/goon-preview.webm" poster="../../tv/assets/goon-game-still.png" autoplay muted loop playsinline aria-label="The Goon Gala preview"></video><span>▶ JOIN THE GALA</span></a></section>'
    return f'''<section class="network-launch" aria-label="Play {g['title']}"><a href="../../play/{slug}/" target="_blank" rel="noopener"><img src="../../tv/assets/{slug}-game-still.png" alt="{g['title']} game still"><span>▶ {g['cta']}</span></a></section>'''

def write_network_routes(root):
    root=Path(root)
    (root/'games/sag/index.html').write_text('<!doctype html><meta http-equiv="refresh" content="0;url=../../tv/?ch=mominc"><title>MOM INC</title>',encoding='utf-8')
    (root/'games/index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../tv/?ch=mominc"><title>MOM INC</title><a href="../tv/?ch=mominc">Return to MOM INC</a></html>''',encoding='utf-8')
    (root/'games/armie/index.html').write_text('''<!doctype html><html lang="en"><head><script src="/tv/game-loader.js?v=1"></script><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gym Class 95 · Coach Armie</title><meta property="og:title" content="Gym Class 95 · Coach Armie"><meta property="og:image" content="https://mominc.online/tv/assets/marks/armie.png"><meta property="og:image:width" content="360"><meta property="og:image:height" content="360"><meta name="twitter:image" content="https://mominc.online/tv/assets/marks/armie.png"><link rel="stylesheet" href="../../tv/network-flow.css"><style>html,body{margin:0;height:100%;background:#bfe0ff;font:16px Tahoma,Arial}#gym{border:0;width:100%;height:100%;display:block}#gate{max-width:600px;margin:80px auto;padding:30px;background:#e4d9b8;border:4px outset #fff4d0}#gate a{color:#163675;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border:2px outset #fff4d0}</style><script src="../../tv/mbs-channels.js"></script><script src="../../tv/state.js"></script><script src="../../tv/network-flow.js"></script><script src="/tv/phone-layout.js" defer></script></head><body><section id="gate"><h1>GYM CLASS 95</h1><p>Coach is waiting for your hand. The Music Desk has the offer.</p><a href="../djscratch/">Visit DJ Scratch</a></section><script>if(MBS_FLOW.armieReady()){sessionStorage.setItem('mbs-on','1');location.replace('../../tv/?ch=armie'+location.hash);}</script></body></html>''',encoding='utf-8')
    for slug in ('lilboyfriend','corgi','djscratch','goon'):
        landing=root/f'games/{slug}/index.html'
        page=landing.read_text(encoding='utf-8')
        page=re.sub(r'<a class="cta" id="play"[\s\S]*?</a>','',page)
        page=page.replace(f'<a href="../../play/{slug}/"',f'<a id="play" class="cta-still" data-play="../../play/{slug}/" href="../../play/{slug}/"',1)
        landing.write_text(page,encoding='utf-8')
        file=root/f'tv/channels/{slug}.html'
        s=file.read_text(encoding='utf-8')
        s=re.sub(r'<section data-corgi-editorial[\s\S]*?</section>','',s)
        if slug=='corgi':
            editorial=(root/'tv/corgi-editorial.html').read_text(encoding='utf-8')
            s=s.replace('<div class="meter"',editorial+'<div class="meter"',1)
        play=root/f'play/{slug}/index.html'
        play.write_text(play.read_text(encoding='utf-8').replace(f'../games/{slug}/',f'./?ch={slug}'),encoding='utf-8')
        s=re.sub(r'<section data-network-launch[\s\S]*?</section>','',s)
        panel=f'''<section data-network-launch class="network-launch"><a href="../play/{slug}/" target="_blank" rel="noopener"><img src="assets/{slug}-game-still.png" alt="{slug} game still"><span>▶ PLAY</span></a></section>'''
        s=re.sub(r'(<article\b[^>]*>)',lambda m:m[1]+panel,s,count=1)
        if slug=='goon':
            s=s.replace('../play/goon/','../gala/').replace('<span>▶ PLAY</span>','<span>▶ JOIN THE GALA</span>')
            s=s.replace('<img src="assets/goon-game-still.png" alt="goon game still">','<video src="assets/goon-preview.webm" poster="assets/goon-game-still.png" autoplay muted loop playsinline aria-label="The Goon Gala preview"></video>')
        if slug=='lilboyfriend':
            s=s.replace('<img src="assets/lilboyfriend-game-still.png" alt="lilboyfriend game still">','<video src="assets/lilboyfriend-preview.webm" poster="assets/lilboyfriend-game-still.png" autoplay muted loop playsinline aria-label="Lil Boyfriend museum preview"></video>')
            lp=landing.read_text(encoding='utf-8')
            lp=re.sub(r'<img src="../../tv/assets/lilboyfriend-game-still.png"[^>]*>','<video src="../../tv/assets/lilboyfriend-preview.webm" poster="../../tv/assets/lilboyfriend-game-still.png" autoplay muted loop playsinline aria-label="Lil Boyfriend museum preview"></video>',lp)
            landing.write_text(lp,encoding='utf-8')
        if slug=='goon':
            lp=landing.read_text(encoding='utf-8').replace('../../play/goon/','../../gala/')
            if 'id="play"' not in lp:lp=lp.replace('<a href="../../gala/"','<a id="play" class="cta-still" data-play="../../gala/" href="../../gala/"',1)
            landing.write_text(lp,encoding='utf-8')
        file.write_text(s,encoding='utf-8')
    for page in (root/'games').glob('*/index.html'):
        page.write_text('\n'.join(line.rstrip() for line in page.read_text(encoding='utf-8').replace('Explore Ch 0 &middot;','Explore &middot;').splitlines())+'\n',encoding='utf-8')
