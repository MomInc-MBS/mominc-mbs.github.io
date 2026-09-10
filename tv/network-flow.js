/* Device-local story progression. These gates do not grant server entitlements. */
(()=>{'use strict';
 const KEY='mbs-hand-decisions-v1', REQUIRED=['lilboyfriend','djscratch','corgi'];
 const read=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return {count:Number.isInteger(s?.count)?Math.max(0,Math.min(5,s.count)):0,last:typeof s?.last==='string'?s.last:''};}catch{return {count:0,last:''};}};
 const AD_KEY='mbs-hand-ad-shown-v1', PROFILE_KEY='mbs-hand-profile-v1';
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
 let ad=null,lastFocus=null,adTimer=null;
 const markAdSeen=()=>{try{localStorage.setItem(AD_KEY,'1');}catch{}};
 const automaticAdEligible=()=>pagesReady()&&!armieReady()&&!location.pathname.startsWith('/handborne');
 function clearAdTimer(){if(adTimer!==null){clearTimeout(adTimer);adTimer=null;}}
 function scheduleAdReturn(){clearAdTimer();if(automaticAdEligible())adTimer=setTimeout(()=>{adTimer=null;maybeShowAd();},10000);}
 function showAd(){if(ad?.open||!pagesReady())return;clearAdTimer();lastFocus=document.activeElement;
  if(!ad){ad=document.createElement('dialog');ad.className='hand-ad';ad.innerHTML='<form method="dialog"><button class="ad-close" aria-label="Close advertisement">×</button></form><p class="ad-ribbon">DJ SCRATCH · A MESSAGE FROM OUR SPONSOR</p><img src="/tv/assets/helping-hand-badge.png" alt="The Helping Hand"><h2>BUY A HELPING HAND!</h2><p>It DJs. It cleans. It obeys. One hand. Every task. Yours to assemble.</p><a class="ad-buy" href="/handborne/">Build my hand</a><small>Fictional offer. No payment required.</small>';document.body.append(ad);ad.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();scheduleAdReturn();});}
  ad.showModal();markAdSeen();
 }
 function maybeShowAd(){if(!document.hidden&&automaticAdEligible())showAd();}
 // Old school runs banked Corgi's secret but never recorded the finished page.
 // Repair only complete saved runs; a secret by itself is not a completion.
 function recoverSchoolFinish(){
  let saved;try{saved=JSON.parse(localStorage.getItem('mbs-corgi-school-v3'));}catch{return;}
  const finished=(run,count)=>Array.isArray(run?.found)&&run.found.length>=count&&run.found.slice(0,count).every(row=>Array.isArray(row)&&row.length===3&&row.every(value=>value===true));
   const publicFinished=finished(saved?.public,2)&&(!saved.public.dreamPhase||saved.public.dreamPhase==='done');
   if(publicFinished||finished(saved?.live,3))window.MBS_STATE?.completePage('corgi');
 }
 function paint(){
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
  recoverSchoolFinish();
  paint();
  // The sponsor returns on channel arrival and after ten seconds closed, until the hand is finished.
  maybeShowAd();
  document.addEventListener('click',event=>{if(event.target.closest('[data-hand-ad]'))showAd();});
  document.addEventListener('visibilitychange',()=>{clearAdTimer();if(!document.hidden){recoverSchoolFinish();paint();maybeShowAd();}});
  window.addEventListener('pagehide',clearAdTimer);
  window.addEventListener('pageshow',()=>{paint();maybeShowAd();});
  window.addEventListener('mbs:page-complete',()=>{paint();maybeShowAd();});
  window.addEventListener('storage',()=>{recoverSchoolFinish();paint();if(adTimer===null)maybeShowAd();});window.addEventListener('mbs-flow',paint);
  // Mounting a channel changes its links, but never schedules an advertisement.
  const observer=new MutationObserver(()=>{observer.disconnect();paint();observer.observe(document.body,{childList:true,subtree:true});});
  observer.observe(document.body,{childList:true,subtree:true});
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
