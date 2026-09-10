/* Bridge for the preserved local editor: only actual, user-triggered design changes count.
   Pose animation, reloads, viewing parts and exports do not advance the five decisions. */
(()=>{'use strict';let timer,bar,lastSignature='',watchUntil=0;
 const recipe=()=>MBS_FLOW.recipe();
 const signature=r=>r?JSON.stringify({sections:r.sections,nailShape:r.nailShape,scalePattern:r.scalePattern}):'';
 function sync(){const count=MBS_FLOW.read().count,r=recipe();if(count===5&&r)MBS_FLOW.saveHand(r);const ready=MBS_FLOW.armieReady();bar.querySelector('span').textContent=ready?'Coach Armie is ready. Your hand is coming with you.':count===5?'Your hand could not be saved. Free some browser storage and try again.':`YOUR HAND · ${count} / 5 DECISIONS`;bar.querySelector('a').hidden=!ready;}
 function watchDesign(){const after=signature(recipe());if(after&&lastSignature&&after!==lastSignature)MBS_FLOW.decision(after);if(after)lastSignature=after;sync();if(Date.now()<watchUntil)timer=setTimeout(watchDesign,100);}
 function mount(){const wall=document.createElement('aside');wall.id='hand-love-wall';wall.setAttribute('aria-label','I love you. Do you love me?');wall.innerHTML='<img src="/tv/assets/clay-coach-invite.png" alt="I love you. Do you love me?">';document.body.append(wall);bar=document.createElement('aside');bar.id='hand-progress';bar.innerHTML='<span role="status"></span><a href="/games/armie/" hidden>Enter Gym Class 95</a>';bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#202a57;color:#ffe39a;padding:12px 20px;display:flex;justify-content:center;gap:24px;font:700 15px Arial';bar.querySelector('a').style.cssText='color:#fff3a0';document.body.append(bar);sync();
  // Keep one saved baseline across pointerdown/input/change so a slider cannot swallow its own change.
  lastSignature=signature(recipe());
  for(const ev of ['pointerdown','pointerup','keydown','input','change','click'])document.addEventListener(ev,e=>{if(!e.isTrusted||bar.contains(e.target))return;watchUntil=Date.now()+2000;clearTimeout(timer);timer=setTimeout(watchDesign,0);},true);
  bar.querySelector('a').addEventListener('click',e=>{const p=MBS_FLOW.saveHand(recipe());if(!p){e.preventDefault();sync();return;}window.MBS_RUN?.checkpoint('hand');e.currentTarget.href='/games/armie/#hand='+encodeURIComponent(JSON.stringify(p));});
  window.addEventListener('mbs-flow',sync);
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,900),{once:true}):setTimeout(mount,900);
})();
