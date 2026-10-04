/* Dr Girlfriend: a 2D layered-paper production line. No WebGL, camera, raycasts or CDN.
   Research tubes and mode-aware goggles feed independently randomized paper prototypes.
   All listeners and delayed paper transitions belong to ctx. */
import { PAPER_SHAPES, PAPER_PALETTES, createPaperBatch, renderPaperCoach } from './girlfriend-roster.js';

const TUBES = [
  { who: "Sentience juice",     topic: "Robotics and autonomous hands", cite: "Piazza et al. 2019, Ann Rev Control",     col: 0xc46a2f, variant: "darkstone" },
  { who: "Mother’s love",    topic: "Canine nutrition",              cite: "AAFCO Dog Food Nutrient Profile",         col: 0x8a9a3a, variant: "straw-wood" },
  { who: "Dog loyalty", topic: "Chronic stress",                cite: "Gutierrez Nunez et al. 2025, IJMS",       col: 0xc4402f, variant: "newsprint" },
  { who: "Small juice",  topic: "Living in small spaces",        cite: "NLIHC, Out of Reach 2025",                col: 0x3a7a9a, variant: "blankpaper" },
  { who: "Womanly wit",    topic: "Training load and recovery",    cite: "Qin et al. 2025, BMC Sports Med Rehab",   col: 0xb0872f, variant: "palestone" },
  { who: "MBS Fuel",       topic: "Stimulants and dosage",         cite: "FDA: 400mg/day caffeine ceiling",         col: 0x9a3a7a, variant: "purple" }
];

// A paper prototype is chosen once per batch, independently of research pour order.
const CORRECTIONS = [
  { belief: 'Short walks do not count as exercise.', correction: 'Even short bouts of activity count toward your weekly total.', source: 'CDC activity guidelines', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
  { belief: 'Exercise is useless unless I hit the full weekly target.', correction: 'Some activity offers benefits even before you reach the recommended target.', source: 'CDC activity guidelines', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
  { belief: 'Walking never counts as aerobic exercise.', correction: 'Brisk walking is one way to get moderate aerobic activity.', source: 'CDC activity guidelines', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
  { belief: 'Cardio replaces all strength training.', correction: 'Adult guidelines include both aerobic activity and muscle strengthening.', source: 'CDC activity guidelines', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
  { belief: 'Muscle turns into fat when training stops.', correction: 'Muscle and fat are different tissues; one does not transform into the other.', source: 'ACE fitness myths', url: 'https://www.acefitness.org/resources/everyone/blog/6913/breaking-down-fitness-myths-and-misconceptions/' },
  { belief: 'Crunches burn fat specifically from my stomach.', correction: 'Training one body part does not selectively remove fat from that area.', source: 'ACE fitness myths', url: 'https://www.acefitness.org/about-ace/press-room/press-releases/319/ace-lists-most-common-fitness-myths/' }
];
function creatureCard(batch) {
  if(batch.special)return '<b>MYR5 · ORIGINAL PURPLE · MASTER PATTERN</b><i>Six research tubes, poured from left to right.</i><u>Original coach unlocked. Dr Girlfriend will stand and lower the goggles after dispatch.</u><small>MYR5 is the current generation. Other pour orders manufacture earlier prototypes.</small>';
  return '<b>MYR' + batch.version + ' · ' + batch.shapeName + ' / ' + batch.paletteName + '</b>' +
    '<i>MODEL BELIEVED: “' + batch.myth.belief + '”</i>' +
    '<u>UPGRADE APPLIED: ' + batch.myth.correction + '</u>' +
    '<small>Earlier prototype corrected. MYR5 is the current generation. <a href="' + batch.myth.url + '" target="_blank" rel="noopener">' + batch.myth.source + '</a></small>';
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
  "version": "dg-hints-2.0",
  "snapshot": "2026-09-09",
  "items": [
    {
      "id": "fuel",
      "ch": "DRINKS · MBS FUEL",
      "hint": "Fill the tub before you try to seal it. The label is the last step.",
      "steps": [
        "Add exactly eight scoops, with no more than two of any ingredient.",
        "Continue to flavor, pick one, then press Mix three times.",
        "Choose all three name parts and a label color. Seal the tub to finish."
      ],
      "source": "fuel.js: renderBatch, nextButton and submitBtn handlers"
    },
    {
      "id": "goon",
      "ch": "EXTRA · GOON",
      "hint": "Finish your character to unlock Goon, then merge the Gala tiles toward 2048.",
      "steps": [
        "Finish your character in the dressing room to unlock the Goon page. Choose Enter the Gala to play the original game.",
        "Swipe or use the direction buttons to merge matching numbered tiles. Keep your highest tile in one corner and leave room for new tiles.",
        "Reach 2048 to clear the Gala. The separate War Room opens after your full run and MYR5 app clearance."
      ],
      "source": "goon.html controls; channel-manifest.json goon finish and active=false"
    },
    {
      "id": "lilboyfriend",
      "ch": "CH 1 · LIL BOYFRIEND",
      "hint": "The far door changes the museum. The ending is back where you entered.",
      "steps": [
        "Enter the museum and walk to the far end. Inspect the exhibits along the way.",
        "Face the door and choose Put the glass in the hole. Let the purple flash finish.",
        "Turn back and follow the hall to the entrance. Reaching the entrance triggers the final scene and records the finished page."
      ],
      "source": "lilboyfriend.js: attemptInsert, fireConnect and startStomp"
    },
    {
      "id": "djscratch",
      "ch": "CH 2 · DJ SCRATCH",
      "hint": "Follow the lit control. Its number matters more than scratching the record.",
      "steps": [
        "Open the Music Desk game and turn on the deck.",
        "In order, set BASS to 8, TREBLE to 3, VOLUME to 7 and TEMPO to 9. Finish all four lights to release the signal.",
        "Copy the four settings printed after the signal into the thumb drive, in that order. Submit them to reveal the phonograph."
      ],
      "source": "djscratch.js: SEQUENCE, TARGETS, registerTouch, captureKnobCode and codeForm"
    },
    {
      "id": "corgi",
      "ch": "CH 3 · CORTISOL CORGI",
      "hint": "Three pages open the next door. The school has more to collect.",
      "steps": [
        "Enter the hunt. Walk to each office desk and collect all three reports.",
        "Go through the door at the end of the hall. In the school, press F or tap Flashlight; switch it off to recharge.",
        "Collect all three school pages to unlock the file and finish the public game. In the live version, collect three pages in each of its three school levels."
      ],
      "source": "corgi.js: LEVELS, collect, markLevelComplete and leaveCut"
    },
    {
      "id": "girlfriend",
      "ch": "CH 4 · DR GIRLFRIEND",
      "hint": "The correct MYR5 is a recipe. Pour the tubes in their displayed order.",
      "steps": [
        "Pour tubes 1 through 6, left to right: Sentience juice, Mother’s love, Dog loyalty, Small juice, Womanly wit, MBS Fuel.",
        "Mould the coach. Close the build report, then pack the finished unit.",
        "Take the goggles. If the batch was poured in another order, choose Mix another coach and repeat the correct recipe."
      ],
      "source": "girlfriend.js: TUBES, makeLine.correct, mouldCoach, pack and goggles"
    },
    {
      "id": "hand",
      "ch": "DJ SCRATCH · THE HELPING HAND AD",
      "hint": "The offer waits for four finished games. Orange eyes alone do not finish every game.",
      "steps": [
        "Finish Fuel, Lil Boyfriend, DJ Scratch and Cortisol Corgi. The Helping Hand ad opens after the fourth finished page.",
        "Closing the ad hides it for ten seconds. It returns when you change channels or return to the site tab, until your hand is finished. You can also reopen it under MOM’s Now Playing cards or at DJ Scratch.",
        "Choose Build my hand. Make five different changes in the hand builder and follow its Coach Armie link. Your finished hand goes with you."
      ],
      "source": "network-flow.js: REQUIRED, pagesReady, decision, handProfile and showAd"
    },
    {
      "id": "armie",
      "ch": "CH 5 · COACH ARMIE",
      "hint": "Bring your finished hand. Read the signs, and use the rear view when you need time.",
      "steps": [
        "Unlock the Helping Hand offer, finish your hand, then enter Coach Armie. Pick your movement style and skill.",
        "In the two-lane runs, move around walls and jump over cracks or fallen stones. Follow the turn shown ahead. For TAP NOW, make nine taps; the first starts the timer if you enabled it.",
        "At the three marked junctions, choose left, right, then left. Answer each question using its clue; the feedback explains mistakes. Looking back pauses the timed tapping.",
        "After the last hall, finish the lab scene and customize your MYR5. Use the finished coach when you are ready."
      ],
      "source": "armie.html: routes, startRun, tap, rear view, feedback and startLab; maze-ui.mjs controls"
    },
    {
      "id": "mominc",
      "ch": "HOME · MOM INC",
      "hint": "Her rescue film has been edited. The first large MYR5 is hiding the original.",
      "steps": [
        "Earn the signals from Fuel, Lil Boyfriend, DJ Scratch, Cortisol Corgi and Dr Girlfriend.",
        "Return to MOM and click the first large MYR5. The invasion film replaces the rescue loop directly beneath him.",
        "Compare the order: the original shows healthy planets before the fleet arrives. The AI inspection game below is separate from this reveal."
      ],
      "source": "mominc.js: canShowRealVideo and revealRealVideo; mbs-channels.js active set"
    },
    {
      "id": "sag",
      "ch": "SAG SNIFFER",
      "hint": "MOM is still setting the table. This page is coming soon and is not required for any unlock.",
      "steps": [],
      "source": "No playable Sag channel in the current network manifest"
    }
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
    variant() { return L.last >= 0 ? TUBES[L.last].variant : null; },

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
function dressGoggles(dg) {
  const body = dg.querySelector("#dgVisBody");
  if (!body) return;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pages = HINTS.items.map(h => '<details><summary>' + escape(h.ch) + '</summary><p>' + escape(h.hint) + '</p>' +
    (h.steps.length ? '<details><summary>Show the solution</summary>' + h.steps.map((step,i) => '<p>' + (i+1) + '. ' + escape(step) + '</p>').join('') + '</details>' : '') + '</details>').join('');
  body.innerHTML = '<h2>KNOWLEDGE IS POWER</h2><p class="sub">THE GOGGLES · PAGE HINTS &amp; SOLUTIONS</p>' +
    '<p>Your goggles now work on every page. After five seconds without input, a gentle orange border marks the next action. Finish a page and the next unfinished page lights up.</p><p>Pick a page below for a hint, or open its solution for the steps.</p>' + pages +
    '<details><summary>Scan obsolete coach instructions</summary>' + CORRECTIONS.map(r => '<details><summary>' + r.belief + '</summary><p>DETECTED: ' + r.belief + '</p><p>CORRECTION: ' + r.correction + '</p></details>').join('') + '</details>' +
    '<p class="foot">I can show you the way. You still have to walk it.</p>';
}


export default {
  mount(root, ctx) {
    const dg = root.matches('.dg') ? root : root.querySelector('.dg');
    if (!dg) return;
    const get = id => dg.querySelector('#'+id);
    const L = makeLine(); L.reset(); // A newly mounted game is a fresh batch.
    const stage=get('dgStage'), dock=get('dgDock'), props=get('dgTubeProps');
    const vis=get('dgVis'), say=get('dgNudge'), unit=get('dgPaperUnit');
    let busy=false, returnFocus=null, batch=null;
    let labAudio=null,labMuted=false,beat=0;
    function labTone(freq,dur,gain,type='sine',end=freq){if(!labAudio||labMuted)return;const t=labAudio.currentTime,o=labAudio.createOscillator(),v=labAudio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+dur);v.gain.setValueAtTime(gain,t);v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v).connect(labAudio.destination);o.start();o.stop(t+dur);o.onended=()=>{o.disconnect();v.disconnect();};}
    function labStart(){if(labAudio)return;try{labAudio=ctx.audio(new AudioContext());labAudio.resume();}catch{return;}ctx.interval(()=>{const notes=[110,110,146.83,130.81,110,164.81,146.83,130.81];labTone(notes[beat%8],.32,.012,'sawtooth');if(beat%2===0)labTone(65,.1,.025,'triangle',35);if(beat%4===0)labTone(55,.7,.008);beat++;},330);}
    function labEffect(kind){labStart();if(kind==='pour'){[0,1,2,3,4].forEach(i=>ctx.timeout(()=>labTone(220+i*62,.13,.045,'sine',100+i*35),i*80));}if(kind==='mould'){labTone(65,1.5,.075,'sawtooth',36);ctx.timeout(()=>labTone(100,.16,.1,'triangle',30),700);}if(kind==='pack'){labTone(150,.2,.06,'triangle',45);ctx.timeout(()=>labTone(95,2.1,.045,'sawtooth',170),200);}}

    dressGoggles(dg);
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
    const mould=action('Mould',()=>{
      if(busy||L.phase!=='mould')return;
      labEffect('mould');batch=createPaperBatch();
      batch.special=L.order.length===TUBES.length&&L.order.every((index,position)=>index===position);
      if(batch.special){batch.shapeId='myr5';batch.paletteId=0;batch.eyes=1;batch.version='5.00';}
      stage.dataset.special=batch.special?'original':'prototype';
      const shape=PAPER_SHAPES.find(s=>s.id===batch.shapeId), palette=PAPER_PALETTES.find(p=>p.id===batch.paletteId);
      batch.shapeName=shape.label;batch.paletteName=palette.name;
      batch.myth=CORRECTIONS[Math.floor(Math.random()*CORRECTIONS.length)];
      unit.setAttribute('viewBox','0 0 200 240');unit.innerHTML=renderPaperCoach(batch);
      unit.setAttribute('aria-label','MYR'+batch.version+' paper '+batch.shapeName+', '+batch.paletteName+', '+batch.eyes+' eyes');
      get('dgUnitRecord').innerHTML=creatureCard(batch);
      get('dgBatchRecord').innerHTML=creatureCard(batch);
      get('dgPaperBox').querySelector('span').textContent='MYR'+batch.version+' / DISPATCH';
      L.to('pack');transition('moulding',1600);
    });
    const pack=action('Pack',()=>{
      if(busy||L.phase!=='pack')return;
      labEffect('pack');const box=get('dgPaperBox');box.classList.add('is-open');
      transition('packing',1500,()=>{
        L.to('grab');transition('shipping',1800,()=>{
          if(ctx.mbs?.wave)ctx.mbs.wave({after:0});
          if(batch.special){
            stage.dataset.pose='standing';
            transition('lowering',1400,()=>{
              stage.dataset.pose='walking';
              transition('walking',1800,()=>{stage.dataset.pose='departed';});
            });
          }
        });
      });
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
        ctx.timeout(()=>{box.classList.add('is-packed');render();},850);
        ctx.timeout(()=>{box.classList.remove('is-open');box.classList.add('is-sealed');},1300);
      }
    });
    const goggles=action('Take goggles',()=>{
      if(busy||!['grab','goggles'].includes(L.phase))return;
      L.to('goggles');awardGoggles();render();returnFocus=goggles;vis.hidden=false;vis.classList.add('on');
      dock.inert=true;props.inert=true;get('dgVisX').focus();
    });
    const another=action('Make another coach',()=>{
      if(busy||!['grab','goggles'].includes(L.phase))return;
      closeGoggles();L.reset();batch=null;unit.innerHTML='';
      delete stage.dataset.special;delete stage.dataset.pose;
      get('dgPaperBox').classList.remove('is-open','is-packed','is-sealed');
      get('dgBatchRecord').innerHTML='';get('dgUnitRecord').innerHTML='';render();tubeButtons[0].focus();
    });
    function awardGoggles(){
      if(!batch?.special||L.phase!=='goggles')return;
      const reward=JSON.stringify({version:1,acquiredAt:Date.now(),recipe:L.order.slice()});
      try{localStorage.setItem('mbs-goggles-v1',reward);}catch{try{sessionStorage.setItem('mbs-goggles-v1',reward);}catch{}}
      ctx.mbs?.unlock?.('girlfriend');
      ctx.mbs?.complete?.('girlfriend',{terminal:'goggles'});
      window.dispatchEvent(new Event('mbs:goggles-earned'));
    }
    get('dgVisX').dataset.guideNext='';
    ctx.on(get('dgPaperGoggles'),'click',()=>goggles.click());
    ctx.on(get('dgPaperGoggles'),'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goggles.click();}});
    function closeGoggles(){vis.hidden=true;vis.classList.remove('on');dock.inert=false;props.inert=false;returnFocus?.focus();}
    ctx.on(get('dgVisX'),'click',closeGoggles);
    ctx.on(vis,'keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closeGoggles();}
      if(e.key==='Tab'){const stops=[...vis.querySelectorAll('button,summary,a[href]')];const first=stops[0],last=stops[stops.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    function transition(name,duration=700,done){
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){
        if(name==='packing'){get('dgPaperBox').classList.remove('is-open');get('dgPaperBox').classList.add('is-packed','is-sealed');}
        duration=name==='pouring'?0:400;
      }
      busy=true;stage.dataset.motion=name;render();
      ctx.timeout(()=>{busy=false;delete stage.dataset.motion;render();done?.();},duration);
    }
    function pour(i){if(busy||!L.pour(i))return;labEffect('pour');transition('pouring');}
    function render(){
      for(const b of [...propButtons,mould,pack,goggles,another])b.removeAttribute('data-guide-next');
      const next=L.phase==='pour'?propButtons.find((_,i)=>!L.has(i)):L.phase==='mould'?mould:L.phase==='pack'?pack:L.phase==='grab'?goggles:null;
      if(next&&!busy)next.dataset.guideNext='';
      stage.dataset.phase=L.phase;
      tubeButtons.forEach((b,i)=>{b.hidden=L.has(i);b.disabled=busy||L.phase!=='pour';});
      propButtons.forEach((b,i)=>{b.classList.toggle('spent',L.has(i));b.disabled=busy||L.has(i)||L.phase!=='pour';});
      mould.hidden=L.phase!=='mould';pack.hidden=L.phase!=='pack';goggles.hidden=!['grab','goggles'].includes(L.phase);
      another.hidden=!['grab','goggles'].includes(L.phase);
      [mould,pack,goggles,another].forEach(b=>b.disabled=busy);
      get('dgProgress').textContent=L.poured+' / 6';
      get('dgPaperFill').style.height=(L.poured/6*73)+'%';
      unit.toggleAttribute('hidden',L.phase!=='pack'||get('dgPaperBox').classList.contains('is-packed'));
      get('dgPaperBox').hidden=!['packing','shipping'].includes(stage.dataset.motion);
      get('dgPaperMould').hidden=stage.dataset.motion!=='moulding';
      get('dgPaperMixer').hidden=!['pour','mould'].includes(L.phase);
      get('dgPaperGoggles').toggleAttribute('hidden',(busy&&!['lowering','walking'].includes(stage.dataset.motion))||!['grab','goggles'].includes(L.phase));
      say.textContent=busy ? ({pouring:'Pouring the research.',moulding:'Pressing a paper coach onto the belt.',packing:'Folding the carton around the coach. Sealing the flaps.',shipping:'Dispatching the sealed batch.',lowering:'Original pattern accepted. Dr Girlfriend stands and lowers the goggles.',walking:'Dr Girlfriend leaves the floor. The goggles are yours.'}[stage.dataset.motion]) :
        ({pour:(6-L.poured)+' tubes remain. Choose one.',mould:'The mixture is ready. Mould it.',pack:batch?.special?'Original purple MYR5 formed. Pack the master pattern.':batch?'MYR'+batch.version+' formed. Pack this paper coach.':'One unit formed. Pack it.',grab:'Batch dispatched. Take the goggles.',goggles:'The goggles are yours.'}[L.phase]);
      get('dgUnitDetails').hidden=!['pack','grab','goggles'].includes(L.phase);
      get('dgBatchRecord').hidden=!batch;
    }
    render();

    window.__dg={paper:true,flat:false,get phase(){return L.phase;},get poured(){return L.poured;},get order(){return L.order.slice();},get lastVariant(){return L.variant();},get batch(){return batch?structuredClone(batch):null;},get rosterCount(){return PAPER_SHAPES.length;}};
  },
  unmount(){try{delete window.__dg;}catch{window.__dg=undefined;}}
};
