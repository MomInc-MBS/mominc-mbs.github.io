"""Character-specific reading surfaces, available without game or completion state.
Voice references: MOM Inc.md, MOM Intro.md, Supporting Cast.md and page specs in
D:/MIcroMillionaire/02 - Micro Millionaire. Public photographs are existing assets.
"""
def page_title(slug, fallback):
    return {'djscratch':'The Helping Hand','corgi':'Cortisol Corgi',
            'girlfriend':'The Literacy Desk'}.get(slug,fallback)

def brand_markup(slug):
    marks={'lilboyfriend':('marks/lilboyfriend.png','Lil Boyfriend · Residential Compression Program'),
           'djscratch':('helping-hand-badge.png','The Helping Hand'),
           'corgi':('cortisol-corgi-badge.png','Cortisol Corgi'),
           'girlfriend':('dr-girlfriend-mark.png','Dr Girlfriend · The Literacy Desk'),
           'armie':('marks/armie.png','Coach Armie'), 'sag':('marks/sag.png','Sag Sniffer')}
    if slug=='fuel':
        return '<div class="brand-logo fuel-wordmark" role="img" aria-label="MBS Fuel">MBS FUEL</div>'
    if slug not in marks:return ''
    src,alt=marks[slug]
    return '<img class="brand-logo" src="../../tv/assets/'+src+'" alt="'+alt+'" width="140" height="140">'

def profile_title(slug):
    return {'lilboyfriend':'Your living arrangements','djscratch':'Your music desk notes',
            'corgi':'FILE YOUR DESK NOTES','girlfriend':'Your research notebook',
            'fuel':'Your formula notes'}.get(slug,'Your coach notes')

def information_markup(slug):
    content={
      'lilboyfriend':'''<h2>Do you suffer from<br><em>Chronic Housing?</em></h2><p>You have roommates at the age your parents had a house.</p><div class="home-strip"><figure><img src="../../tv/assets/lilbf-teepee-cozy.jpg" alt="A tiny home made from a notebook" loading="lazy"><figcaption>A little shelter.</figcaption></figure><figure><img src="../../tv/assets/lilbf-shoebox-cozy.jpg" alt="A tiny living room inside a shoebox" loading="lazy"><figcaption>A little freedom.</figcaption></figure><figure><img src="../../tv/assets/lilbf-masonjar-cozy.jpg" alt="A miniature garden home inside a mason jar" loading="lazy"><figcaption>All taken care of.</figcaption></figure></div><details><summary>Program information</summary><p>MOM says homes cost too much. Her fix is to live small.</p><a href="../../tv/?ch=lilboyfriend">Read the full Living Small channel</a></details>''',
      'djscratch':'''<h2>One hand.<br>Every task.<br>Zero complaints.</h2><div class="hand-demo"><img src="../../tv/assets/hand-dishes.jpg" alt="The Helping Hand washing dishes" loading="lazy"><div><p>It spins your records.</p><p>It does your dishes.</p><p>It never asks for anything.</p></div></div><div class="restored-demos"><figure><img src="../../tv/assets/hand-laundry.jpg" alt="The Helping Hand folding laundry" loading="lazy"><figcaption>It folds the laundry.</figcaption></figure><figure><img src="../../tv/assets/hand-nuke.jpg" alt="The Helping Hand with a theatrical prop device" loading="lazy"><figcaption>Military grade.</figcaption></figure></div><details><summary>See the Helping Hand</summary><p>Turn on the music desk. Move the four lit knobs. Unlock every page to see the hand ad. Make five picks in the designer to meet Coach Armie.</p><a href="../../tv/?ch=djscratch">Visit the full Helping Hand advert</a></details>''',
      'corgi':'''<h2>REPORTS.<br>DEADLINES.<br>MORE REPORTS.</h2><div class="news-brief"><b>OFFICE BULLETIN</b><p>Find three pages. Open the back door.</p><p class="news-stamp">THE SCHOOL IS WAITING</p></div><details><summary>READ THE BRIEF</summary><p>Find three office pages to open the back door. Then find the colored pages in the dark school.</p><a href="../../tv/?ch=corgi">Open the full news desk</a></details>''',
      'girlfriend':'''<h2>Before the first pour.</h2><p>Read the source. Check the claim.</p><dl class="research-index"><div><dt>DJ Scratch</dt><dd>Robots and helping hands</dd></div><div><dt>Sag Sniffer</dt><dd>Dog food</dd></div><div><dt>Cortisol Corgi</dt><dd>Long-term stress</dd></div><div><dt>Lil Boyfriend</dt><dd>Living in small spaces</dd></div><div><dt>Coach Armie</dt><dd>How hard to train, and rest</dd></div><div><dt>MBS Fuel</dt><dd>Caffeine and how much to take</dd></div></dl><details><summary>Sources and notes</summary><ul><li>Piazza et al., 2019: robotics and autonomous hands.</li><li>AAFCO: Dog Food Nutrient Profiles.</li><li>Gutierrez Nunez et al., 2025: chronic stress.</li><li>NLIHC: Out of Reach 2025.</li><li>Qin et al., 2025: training load and recovery.</li><li>FDA: Spilling the Beans on caffeine.</li></ul><p>Mix twelve old coaches. Each one has a workout myth to bust. Pour left to right. Mold and pack to find the goggles.</p><a href="../../tv/?ch=girlfriend">Open the full research channel</a></details>''',
      'fuel':'''<h2>BUILT AROUND<br>YOUR NAME.</h2><div class="formula-label"><b>FORMULA CONTENTS</b><p>Caffeine · L-theanine · L-glutamine<br>L-citrulline · Creatine · Electrolytes</p></div><details><summary>Read before mixing</summary><p>This is a game. It makes a make-believe label. It is not advice on what to take.</p><a href="../../tv/?ch=fuel">Read the full Fuel channel</a></details>'''
    }
    if slug not in content: return ''
    return '<section class="character-information" id="information" aria-label="Channel information">'+content[slug]+'</section>'
