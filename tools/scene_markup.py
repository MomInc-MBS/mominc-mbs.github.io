"""Small authored scene illustrations. No gameplay or locked assets run on a landing page."""
from pathlib import Path
from html import escape
from character_pages import brand_markup, page_title

def scene_markup(slug):
    scenes={
      'lilboyfriend': '<div class="museum-wall"><i class="picture picture-one"></i><i class="picture picture-two"></i><i class="picture picture-three"></i><b class="museum-bench"></b><span class="scene-caption">PLEASE LOOK CLOSER</span></div>',
      'djscratch': '<div class="studio-sign">ON AIR <i></i></div><div class="turntable"><i class="vinyl"></i><i class="tonearm"></i><b class="deck-label">MBS / SIDE A</b><div class="eq"><i></i><i></i><i></i><i></i><i></i></div></div>',
      'corgi': '<div class="office-light"></div><div class="office-door"><span>HEAD OFFICE</span><i></i></div><div class="office-paper paper-a"></div><div class="office-paper paper-b"></div><div class="office-paper paper-c"></div><div class="office-clock"></div>',
      'girlfriend': '<div class="factory-poster"></div><div class="factory-tubes"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="factory-belt"></div><div class="factory-lamp"></div>',
      'fuel': '<div class="fuel-orbit"></div><div class="fuel-tub"><span>MBS FUEL</span><b>YOUR<br>STACK.</b><small>FICTIONAL / UNTESTED</small></div><div class="fuel-scoop"></div><div class="fuel-powder"></div>',
    }
    if slug not in scenes: return ''
    return '<div class="world world-'+slug+'"><div class="world-light"></div>'+scenes[slug]+'<div class="world-grain"></div></div>'

def write_catalog(root,reg):
    cards=[]
    for g in reg['games']:
        if g.get('status')=='coming_soon': continue
        s=g['slug']; p=g['palette']
        cards.append(f'''<li class="game-card g-{s}" style="--accent:{p['accent']}"><a href="{s}/">
          <div class="card-scene" aria-hidden="true">{scene_markup(s)}</div>
          <div class="card-copy">{brand_markup(s).replace("../../tv/", "../tv/")}<span class="eyebrow">{escape(g['genre'])}</span><h2>{escape(page_title(s,g['title']))}</h2>
          <p>{escape(g['premise'])}</p><span class="card-cta">{escape(g['cta'])} <span aria-hidden="true">↗</span></span></div></a>
          <span class="done" data-slug="{s}" hidden>DISCOVERED</span></li>''')
    page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Choose your channel | MBS Games</title><meta name="description" content="MOM has arranged your recreation. Five free public games.">
    <link rel="canonical" href="https://mominc.online/games/"><meta property="og:title" content="Choose your channel | MBS Games">
    <meta property="og:description" content="A broadcast. A family. A home. Free public games from MBS.">
    <meta property="og:image" content="https://mominc.online/tv/assets/mom-inc-mark.png">
    <link rel="stylesheet" href="../tv/landing.css"><link rel="stylesheet" href="../tv/identity.css"></head><body class="catalog"><main>
    <nav class="landing-nav"><a href="../tv/">MBS / Television</a><a href="../files/">Your files</a></nav>
    <header class="catalog-head"><p class="eyebrow">MOM INC. RECREATION DEPARTMENT</p><h1>Make yourself<br><em>at home.</em></h1><p>A broadcast. A family. A home.</p></header>
    <ul class="game-grid">'''+''.join(cards)+'''</ul>
    <aside class="future"><span class="lock-symbol" aria-hidden="true">⌁</span><div><h2>Your next transmission is under review.</h2><p>Horror editions unlock later. Hand, Armie and MYR5 customizers need codes from the live shows.</p><span class="lock-state">LOCKED / COMING SOON</span></div></aside>
    <footer class="foot"><a href="../tv/">Tune in</a><a href="../files/">Your files</a><p class="fine">MOM Inc is fiction. Public games are free.</p></footer>
    </main><script src="../tv/state.js"></script><script src="../tv/mbs-channels.js"></script><script>
    (()=>{const done=window.MBS_STATE?.unlockedActive()||[];document.querySelectorAll('[data-slug]').forEach(el=>{el.hidden=!done.includes(el.dataset.slug);});})();
    </script></body></html>'''
    Path(root,'games/index.html').write_text(page,encoding='utf-8')
