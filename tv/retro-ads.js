/* Fictional sponsors belong to the powered television, including their arcade. */
(()=>{'use strict';
 if(window.MBS_ADS)return;
 const tv=document.querySelector('#tv'),glass=tv?.querySelector('.glass'),screen=tv?.querySelector('#screen');
 if(!glass||!screen)return;
 const layer=document.createElement('div');layer.className='tv-ad-layer';layer.hidden=true;glass.append(layer);
 const styles=['corner','bottom','side','button','game'];
 const headlines={corner:'pssstt feeling sleepy?',bottom:'YOUR NEXT SCOOP IS AIRBORNE.',side:'KEEP. IT. UP.',button:'THIS BUTTON NEEDS FUEL.',game:'TUB FLIGHT'};
 let active=null,kind=null,game=null,timer=null,countdown=null,cycle=0,generation=0,disposed=false,wasOn=false,previousKind=null,manualHand=false,lastFocus=null;
 const powered=()=>!disposed&&!document.hidden&&tv.dataset.state==='on';
 const sponsor=()=>window.MBS_FLOW?.pagesReady()?(window.MBS_FLOW.armieReady()?null:'hand'):'fuel';
 const occupied=()=>!!document.querySelector('dialog[open], [aria-modal="true"]');
 const available=()=>sponsor()==='fuel'?['fuel']:sponsor()==='hand'?['hand']:[];
 function clearTimer(){if(timer!==null)clearTimeout(timer);timer=null;}
 function clearCountdown(){if(countdown)clearInterval(countdown.id);countdown=null;}
 function tickCountdown(){if(!countdown)return;const now=Date.now();if(countdown.running)countdown.remaining=Math.max(0,countdown.remaining-(now-countdown.at));countdown.at=now;countdown.running=powered();const seconds=Math.ceil(countdown.remaining/1000);countdown.label.textContent=seconds?'Close in '+seconds+'s':'You may close this ad';countdown.button.disabled=seconds>0;if(!seconds)clearInterval(countdown.id);}
 function lockClose(button){clearCountdown();const label=document.createElement('span');label.className='sponsor-wait';label.setAttribute('role','status');button.before(label);countdown={button,label,remaining:5000,at:Date.now(),running:powered(),id:setInterval(tickCountdown,250)};tickCountdown();}
 function remove(){clearTimer();clearCountdown();generation++;game?.dispose();game=null;active?.remove();active=null;kind=null;manualHand=false;}
 function schedule(){if(timer!==null||!powered()||!sponsor())return;timer=setTimeout(()=>{timer=null;show();},sponsor()==='hand'?10000:14000+Math.random()*7000);}
 function close(){tickCountdown();if(countdown?.remaining>0)return;const restore=active?.contains(document.activeElement);remove();if(restore&&powered()){if(lastFocus?.isConnected)lastFocus.focus();else screen.focus();}schedule();}
 function placeButton(){if(!active?.classList.contains('sponsor-button'))return;const bounds=glass.getBoundingClientRect();const target=[...screen.querySelectorAll('a,button')].find(el=>{const r=el.getBoundingClientRect();return r.width>80&&r.top>=bounds.top&&r.bottom<=bounds.bottom;});const r=target?.getBoundingClientRect(),ad=active.getBoundingClientRect();active.style.left=Math.max(8,Math.min(bounds.width-ad.width-8,r?r.left-bounds.left:(bounds.width-ad.width)/2))+'px';active.style.top=Math.max(8,Math.min(bounds.height-ad.height-8,r?r.top-bounds.top-80:bounds.height*.35))+'px';}
 function attach(node,type){lastFocus=document.activeElement;active=node;kind=type;layer.append(node);layer.hidden=!powered();}
 async function play(focus=true){if(!powered()||sponsor()!=='fuel')return;try{sessionStorage.setItem('mbs-fuel-entry-v1','ad');}catch{}remove();
  const overlay=document.createElement('div');overlay.className='tv-ad-overlay';overlay.dataset.sponsor='fuel';overlay.innerHTML='<section class="sponsor-arcade" role="dialog" aria-labelledby="sponsor-arcade-title"><div class="sponsor-cap"><span id="sponsor-arcade-title">GOON FUEL · TUB FLIGHT</span><button type="button" aria-label="Close Tub Flight">×</button></div><div data-arcade><p role="status">Tuning in Tub Flight…</p></div></section>';attach(overlay,'fuel');const button=overlay.querySelector('button');button.onclick=close;lockClose(button);const version=generation;
  try{const {mountTubFlight}=await import('/arcade/tub-flight/game.mjs?v=neon-tv-2');if(version!==generation||active!==overlay)return;game=mountTubFlight(overlay.querySelector('[data-arcade]'),{autoFuel:true});if(!powered())game.pause();else if(focus)overlay.querySelector('canvas')?.focus();}
  catch{if(version===generation&&active===overlay)overlay.querySelector('[data-arcade]').innerHTML='<p>The sponsor lost its signal.</p><a href="/arcade/tub-flight/">Open Tub Flight →</a>';}
 }
 function show(mode,manual=false){clearTimer();if(active||!powered()||occupied()){schedule();return;}const type=manual&&window.MBS_FLOW?.pagesReady()?'hand':sponsor();if(!type)return;
  const ad=document.createElement('aside');ad.setAttribute('aria-label',type==='fuel'?'Goon Fuel advertisement':'DJ Scratch Helping Hand advertisement');ad.dataset.sponsor=type;
  if(type==='hand'){
   ad.className='retro-sponsor sponsor-hand';ad.innerHTML='<div class="sponsor-cap"><span>DJ SCRATCH · SPONSOR MESSAGE</span><button type="button" aria-label="Close advertisement">×</button></div><div class="sponsor-content"><img src="/tv/assets/helping-hand-badge.png" alt="The Helping Hand"><h2>BUY A HELPING HAND!</h2><p>It DJs. It cleans. It obeys. One hand. Every task. Yours to assemble.</p><a class="sponsor-cta" href="/handborne/">Build my hand →</a><small>Fictional offer. No payment required.</small></div>';attach(ad,'hand');manualHand=manual;
  }else{
   const style=styles.includes(mode)?mode:styles[cycle%styles.length];cycle++;
   if(style==='game'){play(false);return;}
   ad.className='retro-sponsor sponsor-'+style;ad.innerHTML='<div class="sponsor-cap"><span>ADVERTISEMENT · GOON FUEL</span><button type="button" aria-label="Close advertisement">×</button></div><div class="sponsor-content"><button class="sponsor-art" type="button" aria-label="Play Tub Flight"><span class="sponsor-burst" aria-hidden="true"></span><span class="sponsor-tub" aria-hidden="true"><span class="sponsor-lid"></span><b>GOON<br>FUEL</b><small>UNTESTED</small></span><span class="sponsor-bolt" aria-hidden="true">ϟ</span></button><small class="sponsor-kicker">UNTESTED / UNBREWED</small><h2></h2><p>Eight pipes. Eight scoops. Keep the tub up and mix your own Fuel.</p><a class="sponsor-cta" href="/arcade/tub-flight/"></a></div><div class="sponsor-ticker" aria-hidden="true">⚡ GOON FUEL ⚡ INSERT ZERO COINS ⚡ GOON FUEL ⚡</div>';
   ad.querySelector('h2').textContent=headlines[style];ad.querySelector('a').textContent=style==='game'?'PLAY TUB FLIGHT ↑':'PLAY FOR GOON FUEL →';ad.querySelector('a').onclick=event=>{event.preventDefault();play();};ad.querySelector('.sponsor-art').onclick=play;attach(ad,'fuel');lockClose(ad.querySelector('.sponsor-cap button'));placeButton();timer=setTimeout(()=>{timer=null;close();},16000);
  }
  ad.querySelector('.sponsor-cap button').onclick=close;
 }
 function showHand(){if(!window.MBS_FLOW?.pagesReady()||!powered())return;remove();show(undefined,true);}
 function sync(){tickCountdown();const on=powered();layer.hidden=!on;
  if(!on){clearTimer();game?.pause();wasOn=false;return;}
  const next=sponsor(),changed=next!==previousKind;previousKind=next;
  if(active&&kind!==(manualHand&&window.MBS_FLOW?.pagesReady()?'hand':next))remove();
  if(!wasOn||changed){clearTimer();if(!active)show();}else if(!active)schedule();
  // Restart a placement's lifetime on power restoration, without losing an arcade run.
  if(active?.matches('.retro-sponsor[data-sponsor="fuel"]')&&timer===null)timer=setTimeout(()=>{timer=null;close();},16000);
  wasOn=true;
 }
 layer.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
 let scrollReady=true;screen.addEventListener('scroll',()=>{if(scrollReady&&screen.scrollTop>220&&!active&&powered()&&sponsor()==='fuel'&&!occupied()){scrollReady=false;show('button');}},{passive:true});
 const observer=new MutationObserver(sync);observer.observe(tv,{attributes:true,attributeFilter:['data-state']});
 window.addEventListener('resize',placeButton);if(window.ResizeObserver)new ResizeObserver(placeButton).observe(glass);
 window.addEventListener('mbs:page-complete',sync);window.addEventListener('mbs-flow',sync);window.addEventListener('storage',sync);window.addEventListener('mbs:hand-offer',showHand);
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pagehide',()=>{disposed=true;remove();layer.hidden=true;wasOn=false;});window.addEventListener('pageshow',()=>{disposed=false;sync();});
 window.MBS_ADS={close,show,showHand,available};sync();if(new URLSearchParams(location.search).get('ad')==='hand')showHand();
})();
