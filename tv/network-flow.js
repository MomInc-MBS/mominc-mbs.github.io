/* Device-local story progression. These gates do not grant server entitlements. */
(()=>{'use strict';
 const KEY='mbs-hand-decisions-v1', REQUIRED=['lilboyfriend','djscratch','corgi','goon'];
 const read=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return {count:Number.isInteger(s?.count)?Math.max(0,Math.min(5,s.count)):0,last:typeof s?.last==='string'?s.last:''};}catch{return {count:0,last:''};}};
 const GALA_ENTRY='mbs-gala-character-created-v1';
 function galaReady(){
  for(const key of [GALA_ENTRY,'mbs-gala-completed-v1'])for(const storageName of ['localStorage','sessionStorage'])try{
   const at=Number(window[storageName].getItem(key));if(Number.isSafeInteger(at)&&at>0)return true;
  }catch{}
  return false;
 }
 function recoverGalaFinish(){if(galaReady())window.MBS_STATE?.completePage('goon');}
 const PROFILE_KEY='mbs-hand-profile-v1';
 const regions=['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'];
 const pagesReady=()=>{const done=window.MBS_STATE?.completedPages()||[];return REQUIRED.every(id=>done.includes(id));};
 const validHand=p=>!!(p&&p.version===1&&p.source==='handborne'&&p.complete===true&&regions.every(k=>Number.isInteger(p.sections?.[k])&&p.sections[k]>=0&&p.sections[k]<23));
 function recipe(){for(const key of ['handborne-recipe-v4','handborne-recipe-v3','handborne-recipe-v2','handborne-recipe-v1'])try{const r=JSON.parse(localStorage.getItem(key));if(profile(r))return r;}catch{}return null;}
 function profile(r){if(!r?.sections)return null;const s=r.sections,p={version:1,source:'handborne',complete:true,sections:{nails:s.nails,fingertips:s.fingertips,middle_sections:s.middle_sections??s.fingers,knuckles:s.knuckles??s.fingers,palm:s.palm,back_of_hand:s.back_of_hand,wrist:s.wrist},pose:r.pose||'relaxed',nailShape:r.nailShape,scalePattern:r.scalePattern};return validHand(p)?p:null;}
 function saveHand(r){const p=profile(r);if(!p)return null;try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p));return validHand(JSON.parse(localStorage.getItem(PROFILE_KEY)))?p:null;}catch{return null;}}
 function handProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY));if(validHand(p))return p;}catch{}return read().count===5?saveHand(recipe()):null;}
 const armieReady=()=>pagesReady()&&!!handProfile();
 function decision(signature){if(!pagesReady()||!signature)return false;const s=read();if(s.last===signature)return false;try{localStorage.setItem(KEY,JSON.stringify({count:Math.min(5,s.count+1),last:signature}));window.dispatchEvent(new Event('mbs-flow'));return true;}catch{return false;}}
 window.MBS_FLOW={pagesReady,armieReady,decision,read,validHand,recipe,profile,saveHand,handProfile};
 function showAd(){if(!pagesReady())return;if(!document.querySelector('#tv')){location.assign('/tv/?ch=djscratch&ad=hand');return;}window.dispatchEvent(new Event('mbs:hand-offer'));}
 // Old school runs banked Corgi's secret but never recorded the finished page.
 // Repair only complete saved runs; a secret by itself is not a completion.
 function recoverSchoolFinish(){
  let saved;try{saved=JSON.parse(localStorage.getItem('mbs-corgi-school-v3'));}catch{return;}
  const finished=(run,count)=>Array.isArray(run?.found)&&run.found.length>=count&&run.found.slice(0,count).every(row=>Array.isArray(row)&&row.length===3&&row.every(value=>value===true));
   const publicFinished=finished(saved?.public,2)&&(!saved.public.dreamPhase||saved.public.dreamPhase==='done');
   if(publicFinished||finished(saved?.live,3))window.MBS_STATE?.completePage('corgi');
 }
 function paint(){
  const gala=galaReady();
  for(const page of document.querySelectorAll('#gn, body.g-goon')){
   page.toggleAttribute('data-gala-unlocked',gala);
   const launch=page.querySelector('.network-launch a'),note=page.querySelector('[data-gala-entry-note]');
   if(launch){const url=gala?'/play/goon/':'/gala/';if(launch.getAttribute('href')!==url)launch.setAttribute('href',url);if(launch.hasAttribute('data-play'))launch.dataset.play=url;
    const label=launch.querySelector('span'),text=gala?'▶ ENTER THE GALA':'▶ CREATE YOUR GOON';if(label&&label.textContent!==text)label.textContent=text;}
   if(note){const text=gala?'Character complete. Goon is unlocked. Join the original Gala.':'Finish your character to unlock the rest of this page.';if(note.textContent!==text)note.textContent=text;}
   let war=page.querySelector('[data-war-room-launch]');
   if(!war&&note){war=document.createElement('a');war.dataset.warRoomLaunch='';war.className='gala-war-link';war.href='/play/war-room/';war.textContent='Enter the War Room →';war.hidden=true;note.after(war);}
   if(war){const run=window.MBS_RUN?.read();war.hidden=!(gala&&run?.completedAt&&run?.installedAt);}
  }
  document.querySelectorAll('[data-hand-ad]').forEach(button=>{button.hidden=!pagesReady();});
  const ready=armieReady();document.querySelectorAll('[data-id="armie"], [data-armie-link]').forEach(el=>{el.classList.toggle('armie-ready',ready);el.classList.toggle('armie-dark',!ready);el.setAttribute('aria-disabled',String(!ready));if(el.tagName==='A'){if(ready)el.href='/games/armie/';else el.removeAttribute('href');}el.title=ready?'Coach Armie · Gym Class 95':'Unlock through DJ Scratch’s hand advertisement';const name=el.querySelector('.lcd-name');if(name)name.textContent='COACH ARMIE';});
  const dj=document.querySelector('#dj')||document.body.dataset.slug==='djscratch'||document.documentElement.dataset.game==='djscratch';
  if(dj){let offer=document.querySelector('#hand-offer-link');if(!offer){offer=document.createElement('button');offer.id='hand-offer-link';offer.className='hand-offer-link';offer.textContent='Your Helping Hand offer';offer.onclick=showAd;const target=document.querySelector('.rail')||document.querySelector('main')||document.querySelector('#dj .head')||document.body;target.append(offer);}offer.hidden=!pagesReady();
   let armie=document.querySelector('#dj-armie-link');if(!armie){armie=document.createElement('a');armie.id='dj-armie-link';armie.dataset.armieLink='';armie.textContent='Enter Coach Armie Gym Class 95';armie.setAttribute('aria-label','I love you. Do you love me? Enter Coach Armie Gym Class 95');armie.className='dj-armie-link';offer.after(armie);}armie.hidden=!ready;
   if(document.documentElement.dataset.game==='djscratch'){
    const edge=document.querySelector('#dj #deck');
    if(edge){let sides=document.querySelector('.dj-booth-sides');if(!sides){sides=document.createElement('div');sides.className='dj-booth-sides';sides.innerHTML='<aside class="dj-speaker-bank" aria-label="Three upward-facing MOM Inc speakers">'+[0,1,2].map(i=>'<div class="dj-floor-speaker" style="--speaker:'+i+'"><div class="dj-speaker-face"><i class="dj-speaker-screw screw-a"></i><i class="dj-speaker-screw screw-b"></i><div class="dj-woofer"><i></i></div><img class="dj-speaker-brand" src="/tv/assets/mom-inc-mark.png" alt=""><i class="dj-speaker-screw screw-c"></i><i class="dj-speaker-screw screw-d"></i></div></div>').join('')+'</aside>';edge.prepend(sides);}offer.hidden=!pagesReady()||ready;}
   }
   if(ready){armie.href='/games/armie/';armie.classList.add('armie-ready');}
  }
 }
 function start(){
  if(document.querySelector('#tv')){const ads=document.createElement('script');ads.src='/tv/retro-ads.js?v=neon-tv-2';document.head.append(ads);}
  recoverSchoolFinish();
  recoverGalaFinish();
  paint();
  document.addEventListener('click',event=>{if(event.target.closest('[data-hand-ad]'))showAd();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){recoverSchoolFinish();recoverGalaFinish();paint();}});
  window.addEventListener('pageshow',()=>{recoverGalaFinish();paint();});
  window.addEventListener('mbs:gala-character-created',()=>{recoverGalaFinish();paint();});
  window.addEventListener('mbs:page-complete',paint);
  window.addEventListener('mbs:run-update',paint);
  window.addEventListener('storage',()=>{recoverSchoolFinish();recoverGalaFinish();paint();});window.addEventListener('mbs-flow',paint);
  // Mounting a channel changes its links, but never schedules an advertisement.
  const observer=new MutationObserver(()=>{observer.disconnect();paint();observer.observe(document.body,{childList:true,subtree:true});});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>observer.disconnect());
  window.addEventListener('pageshow',()=>observer.observe(document.body,{childList:true,subtree:true}));
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
