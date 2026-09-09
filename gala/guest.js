/* The player's portrait performs independently of the table and its input. */
(()=>{
 'use strict';
 const KEY='mominc-avatar-v1',motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const stage=document.createElement('div');stage.className='gala-player';stage.hidden=true;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const link=document.createElement('a');link.href='/gala/';link.target='_top';stage.append(canvas,link);document.body.append(stage);
 let performance=null,elapsed=0,last=0,request=0;
 function load(){
  let look=null;try{const raw=localStorage.getItem(KEY)||sessionStorage.getItem(KEY);if(raw)look=GalaAvatar.normalize(JSON.parse(raw));}catch{}
  stage.hidden=!look;performance=look?GalaPerformance.create(look):null;elapsed=0;last=0;
  if(look){link.textContent=look.name||'Your Gala guest';link.setAttribute('aria-label','Change your Gala character: '+link.textContent);performance.paint(canvas,0,true);}
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
 window.addEventListener('pagehide',()=>{if(request)cancelAnimationFrame(request);request=0;});window.addEventListener('pageshow',schedule);load();
})();
