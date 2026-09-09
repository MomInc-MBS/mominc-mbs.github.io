/* Dr Girlfriend: a 2D layered-paper production line. No WebGL, camera, raycasts or CDN.
   The original tube records, saved pour order, material mapping and mode-aware goggles
   are retained below. All listeners and delayed paper transitions belong to ctx. */
const TUBES = [
  { who: "Sentience juice",     topic: "Robotics and autonomous hands", cite: "Piazza et al. 2019, Ann Rev Control",     col: 0xc46a2f, variant: "darkstone" },
  { who: "Mother’s love",    topic: "Canine nutrition",              cite: "AAFCO Dog Food Nutrient Profile",         col: 0x8a9a3a, variant: "straw-wood" },
  { who: "Dog loyalty", topic: "Chronic stress",                cite: "Gutierrez Nunez et al. 2025, IJMS",       col: 0xc4402f, variant: "newsprint" },
  { who: "Small juice",  topic: "Living in small spaces",        cite: "NLIHC, Out of Reach 2025",                col: 0x3a7a9a, variant: "blankpaper" },
  { who: "Womanly wit",    topic: "Training load and recovery",    cite: "Qin et al. 2025, BMC Sports Med Rehab",   col: 0xb0872f, variant: "palestone" },
  { who: "MBS Fuel",       topic: "Stimulants and dosage",         cite: "FDA: 400mg/day caffeine ceiling",         col: 0x9a3a7a, variant: "purple" }
];

/* MYR5, AS SIX MATERIALS. Round 4 (Ian): the creature is no longer built from primitives - it is one of
   six real stills cut from "MYR5 morph - clay to wood, stone, papermache, paper" with the background
   removed. Six variants, six tubes, mapping is exact: whichever tube gets poured LAST decides which
   material the batch ships as. Each carries a definition, a random interim number under 5.0 ("cuz that's
   the interim we're at"), and one horrific, corporately-downplayed crime.

   THE TEXTURES ARE NOT ON THIS RECORD. They used to be (`c.tex = loader.load(...)`), which was safe only
   while this object was rebuilt per mount inside the closure. At module scope a Texture hung here would
   outlive the mount that made it and be handed, already disposed, to the next one. The data is shared;
   the GPU objects are built into a per-mount map beside the renderer that owns them. */
const CREATURES = {
  "purple":     { file: "myr5-purple.png",     w: 357, h: 427, name: "MYR5 &middot; PURPLE",
    def: "Our signature shade. Trusted by nobody, worn by everyone.",
    crime: "Filed as a routine viscosity test. It absorbed the tester. HR is calling that retention." },
  "darkstone":  { file: "myr5-darkstone.png",  w: 251, h: 432, name: "MYR5 &middot; DARKSTONE",
    def: "Load-bearing. Approved for outdoor use and quiet suffering.",
    crime: "Cracked twice in transit, both times over a different family's driveway. Warranty voided." },
  "straw-wood": { file: "myr5-straw-wood.png", w: 339, h: 432, name: "MYR5 &middot; STRAW-WOOD",
    def: "Warm to the touch. Smells faintly of a county fair that closed for a reason.",
    crime: "Caught fire near a school bus stop. The claim called it ambient enrichment." },
  "palestone":  { file: "myr5-palestone.png",  w: 346, h: 431, name: "MYR5 &middot; PALESTONE",
    def: "Museum finish. Looks expensive, costs nothing, means less.",
    crime: "Stood motionless in a lobby for six weeks before anyone noticed it wasn't decor." },
  "newsprint":  { file: "myr5-newsprint.png",  w: 355, h: 438, name: "MYR5 &middot; NEWSPRINT",
    def: "Prints yesterday's headlines, forever. It never learns a new one either.",
    crime: "The ink is not food-grade. Forty units shipped to a daycare regardless." },
  "blankpaper": { file: "myr5-blankpaper.png", w: 333, h: 430, name: "MYR5 &middot; BLANKPAPER",
    def: "No print, no opinion, no complaints filed and none accepted.",
    crime: "Missing from the shipping manifest a full year. Came back with a name and a mortgage." }
};

// Twelve authored recipes. Tube order is the character's show order for now.
const RECIPES = [
  {
    "id": 1,
    "order": [
      0,
      1,
      2,
      3,
      4,
      5
    ],
    "variant": "purple",
    "name": "The All-or-Nothing Coach",
    "myth": "A short workout does not count.",
    "fact": "Small amounts of activity count. You can spread activity across the week.",
    "source": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"
  },
  {
    "id": 2,
    "order": [
      1,
      2,
      3,
      4,
      5,
      0
    ],
    "variant": "darkstone",
    "name": "The Cardio-Only Coach",
    "myth": "Cardio replaces strength training.",
    "fact": "Aerobic activity and muscle-strengthening work provide complementary benefits.",
    "source": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"
  },
  {
    "id": 3,
    "order": [
      2,
      3,
      4,
      5,
      0,
      1
    ],
    "variant": "straw-wood",
    "name": "The Iron-Only Coach",
    "myth": "Only weights count as strength training.",
    "fact": "Body-weight exercises and resistance bands can strengthen muscles.",
    "source": "https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability"
  },
  {
    "id": 4,
    "order": [
      3,
      4,
      5,
      0,
      1,
      2
    ],
    "variant": "palestone",
    "name": "The Sprint-Only Coach",
    "myth": "Exercise only helps if it is intense.",
    "fact": "Moderate activity, including brisk walking, provides health benefits.",
    "source": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"
  },
  {
    "id": 5,
    "order": [
      4,
      5,
      0,
      1,
      2,
      3
    ],
    "variant": "newsprint",
    "name": "The Youth-Only Coach",
    "myth": "You are too old to get stronger.",
    "fact": "Strength training can help older adults maintain muscle and independence.",
    "source": "https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability"
  },
  {
    "id": 6,
    "order": [
      5,
      0,
      1,
      2,
      3,
      4
    ],
    "variant": "blankpaper",
    "name": "The One-Session Coach",
    "myth": "You must do all your weekly exercise in one session.",
    "fact": "Activity can be divided into smaller sessions throughout the week.",
    "source": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"
  },
  {
    "id": 7,
    "order": [
      0,
      5,
      4,
      3,
      2,
      1
    ],
    "variant": "purple",
    "name": "The Gym-Only Coach",
    "myth": "You need a gym to exercise.",
    "fact": "Walking, dancing and body-weight exercises can be done outside a gym.",
    "source": "https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability"
  },
  {
    "id": 8,
    "order": [
      1,
      0,
      5,
      4,
      3,
      2
    ],
    "variant": "darkstone",
    "name": "The Stretch-Only Coach",
    "myth": "Stretching replaces every other type of exercise.",
    "fact": "Flexibility work does not replace aerobic, strengthening and balance activities.",
    "source": "https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability"
  },
  {
    "id": 9,
    "order": [
      2,
      1,
      0,
      5,
      4,
      3
    ],
    "variant": "straw-wood",
    "name": "The Pain-Is-Progress Coach",
    "myth": "Stretching has to hurt to work.",
    "fact": "Stretch warm muscles gently; do not stretch so far that it hurts.",
    "source": "https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability"
  },
  {
    "id": 10,
    "order": [
      3,
      2,
      1,
      0,
      5,
      4
    ],
    "variant": "palestone",
    "name": "The Balance-Is-Luck Coach",
    "myth": "Balance cannot be trained.",
    "fact": "Balance exercises can improve steadiness and help prevent falls.",
    "source": "https://www.nia.nih.gov/health/four-types-exercise-can-improve-your-health-and-physical-ability"
  },
  {
    "id": 11,
    "order": [
      4,
      3,
      2,
      1,
      0,
      5
    ],
    "variant": "newsprint",
    "name": "The Mirror Coach",
    "myth": "If your weight stays the same, exercise did nothing.",
    "fact": "Activity can benefit sleep, mood, heart health and strength without weight loss.",
    "source": "https://www.cdc.gov/physical-activity-basics/benefits/"
  },
  {
    "id": 12,
    "order": [
      5,
      4,
      3,
      2,
      1,
      0
    ],
    "variant": "blankpaper",
    "name": "The Perfect-Week Coach",
    "myth": "Below the weekly target, there is no benefit.",
    "fact": "Some activity is better than none. Build up gradually from what you can do.",
    "source": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html"
  }
];
function recipeFor(order) {
 if(order.length!==6)return null;
 const exact=RECIPES.find(r=>r.order.every((n,i)=>n===order[i]));
 if(exact)return exact;
 // Every permutation has a reproducible build; authored sequences retain their named outcome.
 let rank=0;const remaining=[0,1,2,3,4,5];order.forEach((n,i)=>{rank=rank*(6-i)+remaining.indexOf(n);remaining.splice(remaining.indexOf(n),1);});
 return RECIPES[rank%RECIPES.length];
}
function creatureCard(recipe) {
 if(!recipe) return '<b>UNSTABLE BATCH</b><p>No coach formed. Recycle and try a different sequence.</p>';
 return '<h2>COACH BUILD REPORT</h2><b>MYR5 '+String(recipe.id).padStart(2,'0')+' · '+recipe.name+'</b><p>OBSOLETE COACH · '+CREATURES[recipe.variant].name+'</p><p><strong>Installed coaching instruction:</strong> '+recipe.myth+'</p><p><strong>Engineering correction:</strong> '+recipe.fact+'</p><p><strong>Disposition: OBSOLETE.</strong> This model repeats its installed instruction even when the evidence contradicts it. Its coaching logic cannot update. Remove from the gym floor; retain for research.</p><a href="'+recipe.source+'" target="_blank" rel="noopener">Read the evidence</a><details><summary>Batch notebook · 12 recipes</summary><p>Tube numbers, in pouring order.</p><ol>'+RECIPES.map(r=>'<li>'+r.name+': '+r.order.map(n=>n+1).join(' → ')+'</li>').join('')+'</ol></details>';
}

/* ---- THE GOGGLES' HINT RECORD (3.3 packet 2 / C074).

   The hint list used to be hand-authored markup in girlfriend.html with no version, no date and no
   statement of what it was checked against - and it had drifted into telling the visitor three things
   that are not true of this build. The site's own hint system was the least reliable thing on it:
     - DJ Scratch: "it answers on the third" described THREE SCRATCHES. That mechanic is retired; the
       unlock is the four-lamp follow game (djscratch.js:577-616), and breakThrough() is reached from
       finishGame(), never from a scratch count.
     - Sag Sniffer: "seven of those doors are business, the eighth is dinner". The wheel is FIVE doors
       (sag.html:4, which warns in as many words not to read the surplus ITEMS pool as the wheel) - and
       sag does not ship a play route at all.
     - Cortisol Corgi: "nothing to solve here yet". Corgi has had a page hunt, a book and a desk code
       since before this HEAD (corgi.js:551-562, :612).
     - Lil Boyfriend: "he gets smaller the further down you go". He does not. The shrink starts when the
       far end is done and runs on a wall clock through the walk BACK (lilboyfriend.js:226, :237-243).

   `version`/`snapshot`/`basis` are printed to the visitor with the list, the same shape fuel's cost
   record took in packet 1: the record in the source IS the provenance, and it is on screen rather than
   pointing at a document. `checked` is per entry and is printed too - an unprinted justification is how
   the last one rotted.

   ON-AIR STATUS IS NOT COPIED HERE. `hint` is only ever shown for a channel the network manifest says
   is on air; everything else gets `offAir`, read live from window.MBS_CHANNELS (generated from
   tv/channel-manifest.json by tools/gen_channels.py). So promoting a channel corrects its own goggles
   line, which is the recurrence the item asks to stop. goon is deliberately not listed: it was never in
   this list, its source is unresolved (3.G1), and adding a channel is a decision, not a correction. */
const HINTS = {
  version: "dg-hints-1.0",
  snapshot: "2026-09-07",
  basis: "Each line was read off the named channel's own source at this snapshot. On-air status is not stored here - it is read from the network manifest every time the lenses go on.",
  offAir: "Not on air yet. Nothing there opens, and I am not going to pretend otherwise.",
  // an off-air channel prints THIS as its evidence rather than its own `checked` line. The hint is
  // withheld, so the reasoning behind it has to be withheld too, or the goggles would give the channel
  // away in the footnote of the sentence refusing to give it away.
  offCheck: "tv/channel-manifest.json - coming_soon: the television slot exists, the play route does not.",
  items: [
    { id: "djscratch", ch: "DJ Scratch",
      hint: "Turn her on before anything else. Then stop reading the copy and follow the lights to the controls - all four of them, in her order, not yours.",
      checked: "djscratch.js:577-616 - the four-lamp follow game is what breaks the signal through now. Three scratches no longer do anything but count." },
    { id: "sag", ch: "Sag Sniffer",
      hint: "Four of those doors are business. The fifth is dinner, and it is locked.",
      checked: "sag.html:4 - five doors, four buyable then the locked fifth. The seven-item bank is a surplus pool, not the wheel." },
    { id: "lilboyfriend", ch: "Lil Boyfriend",
      hint: "The hall only runs one way. Do the one thing waiting at the far end - then understand that the walk back is on a clock the walk in was not.",
      checked: "lilboyfriend.js:226 and :237-243 - the far end is what fires; the walls close on a 37.5s wall clock that starts there, not on how far down you went." },
    { id: "armie", ch: "Coach Armie",
      hint: "Stop reading and breathe with him. Hold it longer than feels sensible.",
      checked: "armie.html - the held breath is the whole interaction, and it is longer than it looks." },
    { id: "fuel", ch: "MBS Fuel",
      hint: "Nothing seals until every field has an opinion. Indifference is not an answer, and it will tell you exactly which one you skipped.",
      checked: "fuel.js:227 - the seal fires only on a complete stack, and the refusal names the first missing choice." },
    { id: "corgi", ch: "Cortisol Corgi",
      hint: "Find three office pages. The back door leads into the school. Its colorful pages release the file.",
      checked: "corgi.js: office collection gates the back door; final school collection calls the unlock." },
    { id: "mominc", ch: "MOM Inc", node: false,
      hint: "Her own channel is the scoreboard, not a door. Nothing there opens anything here.",
      checked: "mbs-channels.js - mominc is not in the unlock set. It counts; it does not play." }
  ]
};

/* ---- THE SAVE FILE, AND WHY IT NOW CARRIES A PHASE (3.3 packet 2 / C072).

   v1 wrote `{poured:[...]}` and nothing else, and restoreProgress() replayed the tubes without ever
   touching `phase` - which is initialised "pour" and only advances to "mould" inside the SIXTH pour's
   animation callback. The save happens at the top of that pour, ~2.3s earlier. Reload in that window
   and every tube comes back poured, so pourTube() refuses; phase is still "pour", so mould() refuses.
   No reachable next action, in one refresh, on the ordinary path through the channel.

   Two things changed. The phase is saved with the tubes, at the stable boundaries only - never "busy",
   which is the name of a transition in flight and not a place to come back to. And the tube list is now
   the POUR ORDER rather than scene order: v1 wrote `tubes.filter(poured).map(idx)`, so a restored batch
   replayed the mix in tube order and could reveal a different material than the one the visitor
   actually earned. The last index in the list decides the material, so the order is load-bearing.

   v1 files are still read: their indices are usable as a set, their order is not trustworthy, and they
   claim no phase - so a complete v1 line lands on "mould", which is exactly the dead end being fixed. */
const LS_KEY = "mbs-dg-line";
const STABLE = ["pour", "mould", "pack", "grab", "goggles"];

function saveLine(L) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 2, phase: L.phase, poured: L.order.slice() })); } catch {}
}
function clearLine() { try { localStorage.removeItem(LS_KEY); } catch {} }

function makeLine() {
  const L = {
    phase: "pour",                                 // pour | busy | mould | pack | grab | goggles
    order: [],                                     // poured tube indices, IN POUR ORDER
    get poured() { return L.order.length; },
    get last() { return L.order.length ? L.order[L.order.length - 1] : -1; },
    has(i) { return L.order.indexOf(i) >= 0; },
    recipe() { return recipeFor(L.order); },
    correct() { return L.order.length===6 && L.order.every((n,i)=>n===i); },
    variant() { return L.recipe()?.variant || null; },

    // Every transition returns whether the machine actually moved, so a view never animates a step
    // that was refused. The room used to answer that question with a bare `return` inside the tween
    // chain; the flat station needs the same answer and cannot see the chain.
    pour(i) {
      if (L.phase !== "pour" || !TUBES[i] || L.has(i)) return false;
      L.order.push(i);
      if (L.order.length >= TUBES.length) L.phase = "mould";
      saveLine(L);
      return true;
    },
    to(p) {
      L.phase = p;
      if (STABLE.indexOf(p) >= 0) saveLine(L);     // "busy" is a transition in flight, never a save point
      return true;
    },
    reset() { L.order.length = 0; L.phase = "pour"; clearLine(); },

    // reads the save file into this machine. Returns whether anything was restored, so the view knows
    // to say so rather than opening on "six tubes on the line" over a half-finished batch.
    restore() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return false; }
      if (!s || !Array.isArray(s.poured)) return false;
      const seen = [];
      s.poured.forEach(i => { if (TUBES[i] && seen.indexOf(i) < 0) seen.push(i); });
      if (!seen.length) return false;
      L.order = seen;
      L.phase = seen.length < TUBES.length ? "pour"
              : (STABLE.indexOf(s.phase) >= 0 && s.phase !== "pour") ? s.phase
              : "mould";                            // a complete v1 line, or a save taken mid-sixth-pour
      return true;
    }
  };
  return L;
}

/* ---- THE GOGGLES' COPY, for both views (C073/C074).

   MODE-AWARE, and MBS.mode is a TONE switch, never an entitlement (Codex C6): ?mode=live is
   user-settable, so this only changes what the goggles SAY. Off-air they give nothing away at all.
   On-air the list is rendered from HINTS, filtered through the live manifest - never from markup, so
   there is one copy of every hint and it carries its own provenance. */
function dressGoggles(dg, live) {
  const body = dg.querySelector("#dgVisBody");
  if (!body) return;
  if (!live) {
    body.innerHTML =
      '<h2>COACH LOGIC SCANNER</h2>' +
      '<p class="sub">Optical overlay &middot; idle &middot; property of MOM Inc</p>' +
      '<p class="foot">Select a coach to scan its obsolete instruction.</p>'+RECIPES.map(r=>'<details><summary>'+r.name+'</summary><p>DETECTED: '+r.myth+'</p><p>CORRECTION: '+r.fact+'</p></details>').join('');
    return;
  }
  const roster = (window.MBS_CHANNELS && window.MBS_CHANNELS.channels) || [];
  const rows = HINTS.items.map(h => {
    const c = roster.find(x => x.id === h.id);
    const onAir = c ? !c.comingSoon : true;         // no manifest to read: say the hint rather than lie about the air
    const dim = !onAir || h.node === false;
    return '<li' + (dim ? ' class="none"' : '') + '><b>' + h.ch + '</b>' +
           '<span>' + (onAir ? h.hint : HINTS.offAir) +
           '<u>' + (onAir ? h.checked : HINTS.offCheck) + '</u></span></li>';
  }).join("");
  body.innerHTML =
    '<h2>KNOWLEDGE IS POWER</h2>' +
    '<p class="sub">Optical overlay &middot; property of MOM Inc &middot; do not remove from the floor</p>' +
    '<ul>' + rows + '</ul>' +
    '<p class="foot">I am not going to click it for you. That is the difference between knowing a thing ' +
    'and being told it.</p>' +
    '<p class="ver" id="dgVisVer">' + HINTS.version + ' &middot; checked ' + HINTS.snapshot +
    ' &middot; ' + HINTS.basis + '</p>';
}


export default {
  mount(root, ctx) {
    const dg = root.matches('.dg') ? root : root.querySelector('.dg');
    if (!dg) return;
    const get = id => dg.querySelector('#'+id);
    const L = makeLine(); L.reset(); // A newly mounted game is a fresh batch.
    const stage=get('dgStage'), dock=get('dgDock'), props=get('dgTubeProps');
    const vis=get('dgVis'), say=get('dgNudge'), unit=get('dgPaperUnit');
    let busy=false, returnFocus=null;
    let labAudio=null,labMuted=false,beat=0;
    function labTone(freq,dur,gain,type='sine',end=freq){if(!labAudio||labMuted)return;const t=labAudio.currentTime,o=labAudio.createOscillator(),v=labAudio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+dur);v.gain.setValueAtTime(gain,t);v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v).connect(labAudio.destination);o.start();o.stop(t+dur);o.onended=()=>{o.disconnect();v.disconnect();};}
    function labStart(){if(labAudio)return;try{labAudio=ctx.audio(new AudioContext());labAudio.resume();}catch{return;}ctx.interval(()=>{const notes=[110,110,146.83,130.81,110,164.81,146.83,130.81];labTone(notes[beat%8],.32,.012,'sawtooth');if(beat%2===0)labTone(65,.1,.025,'triangle',35);if(beat%4===0)labTone(55,.7,.008);beat++;},330);}
    function labEffect(kind){labStart();if(kind==='pour'){[0,1,2,3,4].forEach(i=>ctx.timeout(()=>labTone(220+i*62,.13,.045,'sine',100+i*35),i*80));}if(kind==='mould'){labTone(65,1.5,.075,'sawtooth',36);ctx.timeout(()=>labTone(100,.16,.1,'triangle',30),700);}if(kind==='pack'){labTone(150,.2,.06,'triangle',45);ctx.timeout(()=>labTone(95,2.1,.045,'sawtooth',170),200);}}

    dressGoggles(dg, !!ctx.isLive);
    const tubeButtons=[], propButtons=[];
    TUBES.forEach((t,i)=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=t.who;
      b.title=t.topic+' · '+t.cite; b.setAttribute('aria-description',b.title);
      ctx.on(b,'click',()=>pour(i)); dock.appendChild(b); tubeButtons.push(b);
      const prop=document.createElement('button'); prop.type='button'; prop.className='paper-tube';
      prop.style.setProperty('--liquid','#'+t.col.toString(16).padStart(6,'0'));
      prop.setAttribute('aria-label','Pour '+t.who+' research'); prop.title=b.title;
      prop.innerHTML='<span class="tube-cap"></span><span class="tube-liquid"></span><span class="tube-number">'+(i+1)+'</span>';
      ctx.on(prop,'click',()=>pour(i)); props.appendChild(prop); propButtons.push(prop);
    });
    function action(label,fn) { const b=document.createElement('button');b.type='button';b.textContent=label;ctx.on(b,'click',fn);dock.appendChild(b);return b; }
    action('Lab sound: on',()=>{labStart();labMuted=!labMuted;get('dgLabSound').textContent='Lab sound: '+(labMuted?'off':'on');}).id='dgLabSound';
    function mouldCoach(){
      if(busy||L.phase!=='mould')return; L.to('pack');labEffect('mould'); get('dgUnitRecord').innerHTML=creatureCard(L.recipe()); transition('moulding',()=>{if(L.correct()&&!matchMedia('(prefers-reduced-motion: reduce)').matches)ctx.timeout(showReport,2200);else showReport();});
      if(L.correct()){dg.classList.add('coach-unlocked');ctx.mbs?.unlock?.('girlfriend');ctx.mbs?.wave?.({after:900});}
    }
    const mould=action('Mould coach',mouldCoach);
    const pack=action('Pack',()=>{
      if(busy||L.phase!=='pack')return; L.to('grab');labEffect('pack'); transition('shipping');
      if(ctx.mbs?.wave)ctx.mbs.wave({after:900});
    });
    const recycle=action('Mix another coach',()=>{if(busy)return;L.reset();dg.classList.remove('coach-unlocked');get('dgUnitRecord').innerHTML='';render();});
    const goggles=action('Take goggles',()=>{
      if(busy||!L.correct()||!['grab','goggles'].includes(L.phase))return;
      L.to('goggles');render();returnFocus=goggles;vis.hidden=false;vis.classList.add('on');
      dock.inert=true;props.inert=true;get('dgVisX').focus();
    });
    function closeGoggles(){vis.hidden=true;vis.classList.remove('on');dock.inert=false;props.inert=false;returnFocus?.focus();}
    ctx.on(get('dgVisX'),'click',closeGoggles);
    ctx.on(vis,'keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closeGoggles();}
      if(e.key==='Tab'){const stops=[...vis.querySelectorAll('button,summary,a[href]')];const first=stops[0],last=stops[stops.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    const report=get('dgBuildReport');
    function showReport(){
      const r=L.recipe();get('dgReportBody').innerHTML='<img src="assets/'+CREATURES[r.variant].file+'" alt="'+r.name+'"><div>'+creatureCard(r)+'</div>';
      report.showModal();
    }
    ctx.on(get('dgReportClose'),'click',()=>{report.close();pack.focus();});
    ctx.on(get('dgPaperGoggles'),'click',()=>goggles.click());
    action('Read build report',()=>{if(L.recipe()&&!busy)showReport();}).id='dgReportAgain';
    function transition(name,after){
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){render();after?.();return;}
      busy=true;stage.dataset.motion=name;render();
      ctx.timeout(()=>{busy=false;delete stage.dataset.motion;render();after?.();},name==='moulding'?1700:name==='shipping'?2600:700);
    }
    function pour(i){if(busy||!L.pour(i))return;labEffect('pour');transition('pouring',()=>{if(L.phase==='mould')mouldCoach();});}
    function render(){
      stage.dataset.phase=L.phase;get('dgReportAgain').hidden=!['pack','grab','goggles'].includes(L.phase);
      tubeButtons.forEach((b,i)=>{b.hidden=L.has(i);b.disabled=busy||L.phase!=='pour';});
      propButtons.forEach((b,i)=>{b.classList.toggle('spent',L.has(i));b.disabled=busy||L.has(i)||L.phase!=='pour';});
      mould.hidden=L.phase!=='mould';pack.hidden=L.phase!=='pack';goggles.hidden=!L.correct()||!['grab','goggles'].includes(L.phase);recycle.hidden=!['pack','grab','goggles'].includes(L.phase);
      [mould,pack,goggles].forEach(b=>b.disabled=busy);
      get('dgProgress').textContent=L.poured+' / 6';
      get('dgPaperFill').style.height=(L.poured/6*73)+'%';
      const variant=L.variant(); if(variant){unit.src='assets/'+CREATURES[variant].file;unit.alt=L.recipe().name+' · '+variant;}
      unit.toggleAttribute('hidden',L.phase!=='pack'||!L.recipe());get('dgPaperBox').hidden=stage.dataset.motion!=='shipping';get('dgMouldPress').hidden=stage.dataset.motion!=='moulding';get('dgDrone').hidden=stage.dataset.motion!=='shipping';
      get('dgPaperMixer').hidden=!['pour','mould'].includes(L.phase);
      get('dgPaperGoggles').hidden=!L.correct()||!['grab','goggles'].includes(L.phase);
      say.textContent=busy ? ({pouring:'Pouring the research.',moulding:'Forming one unit.',shipping:'Dispatching the batch.'}[stage.dataset.motion]) :
        ({pour:(6-L.poured)+' tubes remain. Order changes the coach. Try left to right.',mould:'The mixture is ready. Mould it.',pack:'One unit formed. Pack it.',grab:L.correct()?'Correct show sequence. The goggles have appeared.':L.recipe()?'Obsolete coach dispatched. Try another mixture.':'Unstable batch discarded. Try another mixture.',goggles:'The goggles are yours.'}[L.phase]);
      get('dgUnitDetails').hidden=!['pack','grab','goggles'].includes(L.phase);get('dgUnitDetails').open=true;
    }
    if(['pack','grab','goggles'].includes(L.phase))get('dgUnitRecord').innerHTML=creatureCard(L.recipe());
    render();

    window.__dg={paper:true,flat:false,get phase(){return L.phase;},get poured(){return L.poured;},get order(){return L.order.slice();},get lastVariant(){return L.variant();},get recipe(){return L.recipe()?.id||null;},get gogglesEarned(){return L.correct();}};
  },
  unmount(){try{delete window.__dg;}catch{window.__dg=undefined;}}
};
