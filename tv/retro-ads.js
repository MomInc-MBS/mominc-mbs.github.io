/* Fictional in-page sponsors. One dismissible placement at a time. */
(()=>{'use strict';
 if(window.MBS_ADS)return;try{if(parent!==window&&parent.location.origin===location.origin&&parent.MBS_ADS)return;}catch{}
 const sponsors=[
  {id:'djscratch',title:'YOUR NAME. OUR FREQUENCY.',copy:'Three parts. Three characters. One very permanent DJ identity.',cta:'Enter the music desk',href:'/play/djscratch/',image:'/tv/assets/myr5-sticker-3.png'},
  {id:'lilboyfriend',title:'HE HAS BEEN WAITING.',copy:'Lil Boyfriend has left something open for you. Be a good guest.',cta:'Visit Lil Boyfriend',href:'/play/lilboyfriend/',image:'/tv/assets/myr5-sticker-2.png'},
  {id:'corgi',title:'SCHOOL IS STILL IN SESSION.',copy:'Cortisol Corgi has a few things for you to find. Attendance is mandatory.',cta:'Back to school',href:'/play/corgi/',image:'/tv/assets/cortisol-corgi-badge.png'},
  {id:'goon',title:'A SEAT AT THE GOON GALA.',copy:'Reach 2048. Leave your mark on the floor. Earn your ranking clearance.',cta:'Enter the Gala',href:'/play/goon/',image:'/tv/assets/myr5-sticker-4.png'},
  {id:'fuel',title:'pssstt feeling sleepy?',copy:'Keep the tub afloat through eight pipes. Catch a scoop at every one.',cta:'Play for Goon Fuel',href:'/arcade/tub-flight/',image:'/tv/assets/myr5-creature.png'}
 ];
 const styles=['corner','bottom','side','button','game'];let active=null,timer=0,cycle=0,game=null,dialog=null,disposed=false,adCountdown=0,gameCountdown=0;
 const eligible=()=>!window.MBS_FLOW?.pagesReady()&&!/^\/(handborne|download|gala\/terminal|arcade)\//.test(location.pathname)&&!location.pathname.includes('armie');
 const available=()=>{const done=new Set(window.MBS_STATE?.completedPages()||[]);try{if(localStorage.getItem('mbs-gala-completed-v1'))done.add('goon');}catch{}return sponsors.filter(s=>!done.has(s.id));};
 const occupied=()=>!!document.querySelector('dialog[open], [aria-modal="true"]');
 function schedule(){clearTimeout(timer);if(!disposed&&eligible())timer=setTimeout(show,14000+Math.random()*7000);}
 function close(){clearInterval(adCountdown);active?.remove();active=null;schedule();}
 function lockClose(button,host){const until=Date.now()+5000;button.disabled=true;const label=document.createElement('span');label.className='sponsor-wait';label.setAttribute('role','status');button.before(label);const tick=()=>{const seconds=Math.max(0,Math.ceil((until-Date.now())/1000));label.textContent=seconds?'Close in '+seconds+'s':'You may close this ad';button.disabled=seconds>0;if(!seconds)clearInterval(id);};const id=setInterval(tick,250);tick();host?.addEventListener('cancel',event=>{if(Date.now()<until)event.preventDefault();});return id;}
 async function play(){try{sessionStorage.setItem('mbs-fuel-entry-v1','ad');}catch{}close();if(dialog?.open)return;dialog=document.createElement('dialog');dialog.className='sponsor-arcade';dialog.innerHTML='<form method="dialog"><button aria-label="Close Tub Flight">×</button></form><div data-arcade></div>';document.body.append(dialog);dialog.addEventListener('close',()=>{clearInterval(gameCountdown);game?.dispose();game=null;dialog.remove();dialog=null;schedule();});dialog.showModal();gameCountdown=lockClose(dialog.querySelector('button'),dialog);try{const {mountTubFlight}=await import('/arcade/tub-flight/game.mjs');if(dialog?.open)game=mountTubFlight(dialog.querySelector('[data-arcade]'),{autoFuel:true});}catch{if(dialog)dialog.querySelector('[data-arcade]').innerHTML='<p>The sponsor lost its signal.</p><a href="/arcade/tub-flight/">Open Tub Flight →</a>';}}
 function show(mode){clearTimeout(timer);if(active||!eligible()||document.hidden||occupied()){schedule();return;}
  const choices=available();if(!choices.length)return;let style=typeof mode==='string'?mode:styles[Math.floor(cycle/2)%styles.length],sponsor=cycle%2===0?sponsors[4]:choices.filter(s=>s.id!=='fuel')[Math.floor(cycle/2)%Math.max(1,choices.length-1)]||sponsors[4];cycle++;
  active=document.createElement('aside');active.className='retro-sponsor sponsor-'+style;active.setAttribute('aria-label','Advertisement');
  active.innerHTML='<div class="sponsor-cap"><span>ADVERTISEMENT · MOM NETWORK</span><button type="button" aria-label="Close advertisement">×</button></div><img alt=""><div class="sponsor-content"><small>PAID FOR BY YOUR ATTENTION</small><h2></h2><p></p><a class="sponsor-cta"></a></div>';
  active.querySelector('img').src=sponsor.image;active.querySelector('h2').textContent=sponsor.title;active.querySelector('p').textContent=sponsor.copy;const link=active.querySelector('a');link.href=sponsor.href;link.textContent=style==='game'?'INSERT ZERO COINS · PLAY ↑':sponsor.cta+' →';active.querySelector('button').onclick=close;
  if(sponsor.id==='fuel'){active.dataset.sponsor='fuel';link.onclick=e=>{e.preventDefault();play();};active.querySelector('img').style.cursor='pointer';active.querySelector('img').onclick=play;adCountdown=lockClose(active.querySelector('button'));}
  if(style==='button'){const button=[...document.querySelectorAll('main a,main button,.rail a')].find(el=>{const r=el.getBoundingClientRect();return r.width>80&&r.top>80&&r.bottom<innerHeight-60;});if(button){const rect=button.getBoundingClientRect();active.style.top=Math.max(60,Math.min(innerHeight-240,rect.top-160))+'px';}else active.className='retro-sponsor sponsor-side';}
  document.body.append(active);timer=setTimeout(()=>{close();},16000);
 }
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/tv/retro-ads.css';document.head.append(sheet);const arcadeCSS=document.createElement('link');arcadeCSS.rel='stylesheet';arcadeCSS.href='/arcade/tub-flight/style.css';document.head.append(arcadeCSS);
 let scrollReady=true;window.addEventListener('scroll',()=>{if(scrollReady&&scrollY>220&&!active&&!occupied()){scrollReady=false;show('button');}},{passive:true});
 const update=()=>{if(!eligible()){clearTimeout(timer);clearInterval(adCountdown);active?.remove();active=null;dialog?.close();}else if(!active)schedule();};
 window.addEventListener('mbs:page-complete',update);window.addEventListener('mbs-flow',update);window.addEventListener('storage',update);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);game?.pause();}else schedule();});
 window.addEventListener('pagehide',()=>{disposed=true;clearTimeout(timer);clearInterval(adCountdown);clearInterval(gameCountdown);active?.remove();game?.dispose();dialog?.remove();});window.addEventListener('pageshow',()=>{disposed=false;if(!active)schedule();});
 window.MBS_ADS={close,show,available};show('corner');
})();
