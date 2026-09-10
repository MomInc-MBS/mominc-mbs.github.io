/* The player's portrait performs independently of the table and its input. */
(()=>{
 'use strict';
 const KEY='mominc-avatar-v1',motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const stage=document.createElement('div');stage.className='gala-player';stage.hidden=true;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const link=document.createElement('a');link.href=window.MBS_DJ?.read()?.completedAt?'/gala/':'/play/djscratch/';link.target='_top';stage.append(canvas,link);document.body.append(stage);
 const special=document.createElement('button');special.type='button';special.className='gala-guest-special';special.hidden=true;stage.append(special);
 let performance=null,elapsed=0,last=0,request=0;
 function abilityState(){const M=window.GalaWeaponMotion,w=performance?.weapon,ability=M&&w?M.abilityFor(w):null;special.hidden=!ability;if(!ability)return;const remaining=M.remaining();special.disabled=remaining>0;special.textContent=remaining?`${ability.name} · ${Math.ceil(remaining/1000)}s`:ability.name;}
 special.addEventListener('click',async()=>{const M=window.GalaWeaponMotion,w=performance?.weapon;if(!M||!w)return;special.disabled=true;const result=await M.activate(w);if(result.ok){performance.triggerSpecial();performance.paint(canvas,elapsed,!!motion?.matches);}abilityState();});
 const cooldownTick=setInterval(()=>{if(!document.hidden&&!stage.hidden){abilityState();if(motion?.matches&&performance)performance.paint(canvas,elapsed,true);}},250);
 function load(){
  let look=null;try{const raw=localStorage.getItem(KEY)||sessionStorage.getItem(KEY);if(raw)look=GalaAvatar.normalize(JSON.parse(raw));}catch{}
  stage.hidden=!look;performance=look?GalaPerformance.create(look):null;elapsed=0;last=0;
  if(look){link.textContent=window.MBS_DJ?.display()||'Anonymous guest';link.setAttribute('aria-label','Change your Gala character: '+link.textContent);performance.paint(canvas,0,true);}
  schedule();
 }
 function frame(now){
  request=0;if(!performance||document.hidden||motion?.matches)return;
  if(!last)last=now;const delta=now-last;
  if(delta>=40){elapsed+=Math.min(delta,100);last=now;performance.paint(canvas,elapsed);}
  request=requestAnimationFrame(frame);
 }
 function schedule(){
  if(request)cancelAnimationFrame(request);request=0;last=0;if(!performance)return;
  if(motion?.matches){performance.paint(canvas,0,true);return;}
  if(!document.hidden)request=requestAnimationFrame(frame);
 }
 window.addEventListener('storage',event=>{if(event.key===null||event.key===KEY||event.key===window.GalaProgress?.KEY)load();});
 window.addEventListener('mominc-avatar-change',load);document.addEventListener('visibilitychange',schedule);
 motion?.addEventListener?.('change',schedule);
 window.addEventListener('pagehide',()=>{if(request)cancelAnimationFrame(request);request=0;clearInterval(cooldownTick);});window.addEventListener('pageshow',schedule);load();
})();
