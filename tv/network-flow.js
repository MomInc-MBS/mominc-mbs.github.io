/* Device-local story progression. These gates do not grant server entitlements. */
(()=>{'use strict';
 const KEY='mbs-hand-decisions-v1', REQUIRED=['fuel','lilboyfriend','djscratch','corgi'];
 const read=()=>{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return {count:Number.isInteger(s?.count)?Math.max(0,Math.min(5,s.count)):0,last:typeof s?.last==='string'?s.last:''};}catch{return {count:0,last:''};}};
 const pagesReady=()=>REQUIRED.every(id=>window.MBS_STATE?.unlockedActive().includes(id));
 const armieReady=()=>pagesReady()&&read().count===5;
 function decision(signature){if(!pagesReady()||!signature)return false;const s=read();if(s.last===signature)return false;try{localStorage.setItem(KEY,JSON.stringify({count:Math.min(5,s.count+1),last:signature}));window.dispatchEvent(new Event('mbs-flow'));return true;}catch{return false;}}
 window.MBS_FLOW={pagesReady,armieReady,decision,read};
 let ad=null,lastFocus=null,seen=false,pagesWereReady=pagesReady();
 function showAd(){if(ad?.open||!pagesReady())return;lastFocus=document.activeElement;
  if(!ad){ad=document.createElement('dialog');ad.className='hand-ad';ad.innerHTML='<form method="dialog"><button class="ad-close" aria-label="Close advertisement">×</button></form><p class="ad-ribbon">A MESSAGE FROM OUR SPONSOR</p><img src="/tv/assets/helping-hand-badge.png" alt="The Helping Hand"><h2>BUY A HELPING HAND!</h2><p>One hand. Every task. Yours to assemble.</p><a class="ad-buy" href="/handborne/">Build my hand</a><small>Fictional offer. No payment required.</small>';document.body.append(ad);ad.addEventListener('close',()=>lastFocus?.focus());}
  ad.showModal();seen=true;
 }
 function paint(){
  const ready=armieReady();document.querySelectorAll('[data-id="armie"], [data-armie-link]').forEach(el=>{el.classList.toggle('armie-ready',ready);el.classList.toggle('armie-dark',!ready);el.setAttribute('aria-disabled',String(!ready));if(el.tagName==='A'){if(ready)el.href='/games/armie/';else el.removeAttribute('href');}el.title=ready?'Coach Armie · Gym Class 95':'Unlock through DJ Scratch’s hand advertisement';const name=el.querySelector('.lcd-name');if(name)name.textContent='COACH ARMIE';});
  const dj=document.querySelector('#dj')||document.body.dataset.slug==='djscratch'||document.documentElement.dataset.game==='djscratch';
  if(dj){let offer=document.querySelector('#hand-offer-link');if(!offer){offer=document.createElement('button');offer.id='hand-offer-link';offer.className='hand-offer-link';offer.textContent='Your Helping Hand offer';offer.onclick=showAd;const target=document.querySelector('.rail')||document.querySelector('main')||document.querySelector('#dj .head')||document.body;target.append(offer);}offer.hidden=!pagesReady();
   let armie=document.querySelector('#dj-armie-link');if(!armie){armie=document.createElement('a');armie.id='dj-armie-link';armie.dataset.armieLink='';armie.textContent='Enter Coach Armie Gym Class 95';armie.setAttribute('aria-label','I love you. Do you love me? Enter Coach Armie Gym Class 95');armie.className='dj-armie-link';offer.after(armie);}armie.hidden=!ready;
   if(document.documentElement.dataset.game==='djscratch'){
    const edge=document.querySelector('#dj #deck');
    if(edge){let sides=document.querySelector('.dj-booth-sides');if(!sides){sides=document.createElement('div');sides.className='dj-booth-sides';sides.innerHTML='<aside class="dj-speaker-bank" aria-label="Three upward-facing MOM Inc speakers">'+[0,1,2].map(i=>'<div class="dj-floor-speaker" style="--speaker:'+i+'"><div class="dj-speaker-face"><i class="dj-speaker-screw screw-a"></i><i class="dj-speaker-screw screw-b"></i><div class="dj-woofer"><i></i></div><img class="dj-speaker-brand" src="/tv/assets/mom-inc-mark.png" alt=""><i class="dj-speaker-screw screw-c"></i><i class="dj-speaker-screw screw-d"></i></div></div>').join('')+'</aside>';edge.prepend(sides);}offer.hidden=!pagesReady()||ready;}
   }
   if(ready){armie.href='/games/armie/';armie.classList.add('armie-ready');}
   if(pagesReady()&&!seen&&!ready)showAd();
  }
  if(pagesReady()&&!pagesWereReady&&!seen&&!ready)showAd();pagesWereReady=pagesReady();
 }
 function start(){paint();setInterval(()=>{if(!document.hidden)paint();},700);window.addEventListener('storage',paint);window.addEventListener('mbs-flow',paint);}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
