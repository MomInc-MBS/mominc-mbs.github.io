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
        return '<div class="brand-logo fuel-wordmark" role="img" aria-label="MBS Fuel">MBS FUEL<span>UNTESTED / UNBREWED</span></div>'
    if slug not in marks:return ''
    src,alt=marks[slug]
    return '<img class="brand-logo" src="../../tv/assets/'+src+'" alt="'+alt+'" width="140" height="140">'

def profile_title(slug):
    return {'lilboyfriend':'Your living arrangements','djscratch':'Your music desk notes',
            'corgi':'FILE YOUR DESK NOTES','girlfriend':'Your research notebook',
            'fuel':'Your formula notes'}.get(slug,'Your optional coach notes')

def information_markup(slug):
    content={
      'lilboyfriend':'''<p class="page-kicker">Ask MOM if Living Small is right for you</p><h2>Do you suffer from<br><em>Chronic Housing?</em></h2><p>You have roommates at the age your parents had a house.</p><div class="home-strip"><figure><img src="../../tv/assets/lilbf-teepee-cozy.jpg" alt="A tiny home made from a notebook" loading="lazy"><figcaption>A little shelter.</figcaption></figure><figure><img src="../../tv/assets/lilbf-shoebox-cozy.jpg" alt="A tiny living room inside a shoebox" loading="lazy"><figcaption>A little freedom.</figcaption></figure><figure><img src="../../tv/assets/lilbf-masonjar-cozy.jpg" alt="A miniature garden home inside a mason jar" loading="lazy"><figcaption>All taken care of.</figcaption></figure></div><details><summary>Program information</summary><p>Residential Compression is MOM's fictional answer to unaffordable housing. The museum contains the housing exhibits; your questions are available below.</p><a href="../../tv/?ch=lilboyfriend">Read the full Living Small channel</a></details>''',
      'djscratch':'''<p class="page-kicker">AS SEEN ON MBS</p><h2>One hand.<br>Every task.<br>Zero complaints.</h2><div class="hand-demo"><img src="../../tv/assets/hand-dishes.jpg" alt="The Helping Hand washing dishes" loading="lazy"><div><p>It spins your records.</p><p>It does your dishes.</p><p>It never asks for anything.</p></div></div><div class="restored-demos"><figure><img src="../../tv/assets/hand-laundry.jpg" alt="The Helping Hand folding laundry" loading="lazy"><figcaption>It folds the laundry.</figcaption></figure><figure><img src="../../tv/assets/hand-nuke.jpg" alt="The Helping Hand with a theatrical prop device" loading="lazy"><figcaption>Military grade.*</figcaption></figure></div><p class="demo-footnote">*Fictional demonstration. Not certified for ordnance disposal.</p><details><summary>The Helping Hand demonstration</summary><p>Power the music desk, then move its four illuminated controls. Your hand advertisement arrives when every page is unlocked. Make five choices in the designer to meet Coach Armie.</p><a href="../../tv/?ch=djscratch">Visit the full Helping Hand advert</a></details>''',
      'corgi':'''<p class="page-kicker">NAUSEOUS IN THE MORNING</p><h2>REPORTS.<br>DEADLINES.<br>MORE REPORTS.</h2><div class="news-brief"><b>OFFICE BULLETIN</b><p>Three pages to recover. A back door to open.</p><p class="news-stamp">THE SCHOOL IS WAITING</p></div><details><summary>READ THE BRIEF</summary><p>Find the three office pages to open the back door. Inside the dark school, recover the colorful pages to unlock your file.</p><a href="../../tv/?ch=corgi">Open the full news desk</a></details>''',
      'girlfriend':'''<p class="page-kicker">LAB RECORD / SOURCE MATERIAL</p><h2>Before the first pour.</h2><p>Read a source. Question a claim. Keep your observations below.</p><dl class="research-index"><div><dt>DJ Scratch</dt><dd>Robotics and autonomous hands</dd></div><div><dt>Sag Sniffer</dt><dd>Canine nutrition</dd></div><div><dt>Cortisol Corgi</dt><dd>Chronic stress</dd></div><div><dt>Lil Boyfriend</dt><dd>Living in small spaces</dd></div><div><dt>Coach Armie</dt><dd>Training load and recovery</dd></div><div><dt>MBS Fuel</dt><dd>Stimulants and dosage</dd></div></dl><details><summary>Research references &amp; production notes</summary><ul><li>Piazza et al., 2019: robotics and autonomous hands.</li><li>AAFCO: Dog Food Nutrient Profiles.</li><li>Gutierrez Nunez et al., 2025: chronic stress.</li><li>NLIHC: Out of Reach 2025.</li><li>Qin et al., 2025: training load and recovery.</li><li>FDA: Spilling the Beans on caffeine.</li></ul><p>These are the source labels carried by the six public tubes. Twelve mixtures make twelve obsolete coaches, each with a workout myth to debunk. Pour left to right, mould and pack to reveal the goggles. Their broadcast hints remain restricted off air.</p><a href="../../tv/?ch=girlfriend">Open the full research channel</a></details>''',
      'fuel':'''<p class="page-kicker">MBS FUEL / LABEL PREVIEW</p><h2>BUILT AROUND<br>YOUR NAME.</h2><div class="formula-label"><b>FORMULA CONTENTS</b><p>Caffeine · L-theanine · L-glutamine<br>L-citrulline · Creatine · Electrolytes</p><strong>FICTIONAL. UNBREWED. NOT FOR SALE.</strong></div><details><summary>Read before mixing</summary><p>The builder makes a fictional label, not a supplement recommendation. Ingredient, flavour and naming controls are in the builder. Your notes are available below.</p><a href="../../tv/?ch=fuel">Read the full Fuel channel</a></details>'''
    }
    if slug not in content: return ''
    return '<section class="character-information" id="information" aria-label="Channel information">'+content[slug]+'</section>'
