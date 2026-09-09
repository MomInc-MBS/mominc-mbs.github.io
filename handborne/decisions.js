/* Bridge for the preserved local editor: only actual, user-triggered design changes count.
   Pose animation, reloads, viewing parts and exports do not advance the five decisions. */
(()=>{'use strict';let timer,bar;
 function recipe(){for(const key of ['handborne-recipe-v4','handborne-recipe-v3','handborne-recipe-v2'])try{const s=JSON.parse(localStorage.getItem(key));if(s?.sections)return s;}catch{}return null;}
 const signature=r=>r?JSON.stringify({sections:r.sections,nailShape:r.nailShape,scalePattern:r.scalePattern}):'';
 function profile(r){const s=r.sections;return {version:1,source:'handborne',complete:true,sections:{nails:s.nails,fingertips:s.fingertips,middle_sections:s.middle_sections??s.fingers,knuckles:s.knuckles??s.fingers,palm:s.palm,back_of_hand:s.back_of_hand,wrist:s.wrist},pose:r.pose||'relaxed'};}
 function sync(){const count=MBS_FLOW.read().count,ready=MBS_FLOW.armieReady(),r=recipe();if(ready&&r)localStorage.setItem('mbs-hand-profile-v1',JSON.stringify(profile(r)));bar.querySelector('span').textContent=ready?'Coach Armie is ready. Your hand is coming with you.':`YOUR HAND · ${count} / 5 DECISIONS`;const a=bar.querySelector('a');a.hidden=!ready;}
 function mount(){const wall=document.createElement('aside');wall.id='hand-love-wall';wall.setAttribute('aria-label','I love you. Do you love me?');wall.innerHTML='<img src="/tv/assets/clay-coach-invite.png" alt="I love you. Do you love me?">';document.body.append(wall);bar=document.createElement('aside');bar.id='hand-progress';bar.innerHTML='<span role="status"></span><a href="/games/armie/" hidden>Enter Gym Class 95</a>';bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#202a57;color:#ffe39a;padding:12px 20px;display:flex;justify-content:center;gap:24px;font:700 15px Arial';bar.querySelector('a').style.cssText='color:#fff3a0';document.body.append(bar);sync();
  for(const ev of ['pointerdown','keydown','change'])document.addEventListener(ev,e=>{if(!e.isTrusted||bar.contains(e.target))return;const before=signature(recipe());clearTimeout(timer);timer=setTimeout(()=>{const after=signature(recipe());if(before&&after&&before!==after)MBS_FLOW.decision(after);sync();},350);},true);
  window.addEventListener('mbs-flow',sync);
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,900),{once:true}):setTimeout(mount,900);
})();
