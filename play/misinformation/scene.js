import {bandIndex,BANDS,STATION,KM_PER_POINT} from './engine.js';
export function sceneFrame({distance,hits,phase,rounds,score,history=[]}) {
 const layer=bandIndex(distance);
 const clamp=value=>Math.max(0,Math.min(1,value));
 // Awarded score is monotonic even when practice distance reaches its cap.
 // Visual advance is scenery/chase motion, never extra fuel or displayed km.
 const progress=Math.max(clamp(distance/STATION),Number.isFinite(score)?clamp(score*KM_PER_POINT/STATION):0);
 const motion=Number.isFinite(rounds)?Math.max(0,Math.floor(rounds)):history.length;
 const roundAdvance=.18*(1-Math.exp(-motion/18));
 const journey=progress+(1-progress)*roundAdvance;
 const player=phase==='escaped'?80:40+32*journey;
 const pressure=8*(1-Math.exp(-motion/24));
 const gap=phase==='dead'?2:Math.max(6,24-pressure-hits*5+8*progress);
 const last=history.at(-1);
 return {layer,x:(layer%2)*100,y:Math.floor(layer/2)/3*100,player,pursuer:player-gap,motion,
  outcome:last?.skipped?'pass':last?.correct===false?'hit':last?.correct?'verified':'idle',
  status:phase==='dead'?'MOM CAUGHT YOUR SIGNAL':phase==='escaped'?'MOTHER STATION REACHED':hits===2?'MOM IS RIGHT BEHIND YOU':hits===1?'MOM IS CLOSING IN':'MOM IS ON YOUR TRAIL'};
}
export function mobileSceneFrame({player,pursuer}) {
 // Rotate the full scene's upward route into a compact horizontal flight lane.
 // The station is fixed beyond every live/practice position.
 return {player:8+player/80*76,pursuer:8+pursuer/80*76,station:88};
}
function paintMotion(scene,f,state){
 const previous=scene.dataset.motionOrdinal;
 scene.dataset.layer=String(f.layer);scene.dataset.hits=String(state.hits);scene.dataset.phase=state.phase;
 scene.dataset.motionOrdinal=String(f.motion);scene.dataset.motionOutcome=f.outcome;
 if(previous!==String(f.motion)){
  scene.classList.remove('flight-step');
  // Initial mount/reload does not replay a completed answer. Hint, archive,
  // and scoreboard rerenders do not retrigger either. Reset returns to zero.
  if(previous!==undefined&&f.motion>Number(previous)&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   void scene.offsetWidth;
   scene.classList.add('flight-step');
  }
 }
}
export function renderScene(state) {
 const f=sceneFrame(state),scene=document.querySelector('#space-scene');
 if(!scene)return;
 paintMotion(scene,f,state);
 scene.style.setProperty('--space-x',`${f.x}%`);scene.style.setProperty('--space-y',`${f.y}%`);
 document.querySelector('#rocket').style.bottom=`${f.player}%`;
 document.querySelector('#pursuer').style.bottom=`${f.pursuer}%`;
 document.querySelector('#chase-status').textContent=f.status;
 for(const marker of document.querySelectorAll('.depth-chart [data-layer]')){
  const n=Number(marker.dataset.layer);marker.classList.toggle('active',n===f.layer);marker.classList.toggle('reached',n<f.layer);
  if(n===f.layer)marker.setAttribute('aria-current','step');else marker.removeAttribute('aria-current');
 }
 const mini=document.querySelector('#mobile-chase');
 if(mini){
  const lane=mobileSceneFrame(f);paintMotion(mini,f,state);
  mini.style.setProperty('--space-x',`${f.x}%`);mini.style.setProperty('--space-y',`${f.y}%`);
  mini.style.setProperty('--mini-player-x',`${lane.player}%`);
  mini.style.setProperty('--mini-mom-x',`${lane.pursuer}%`);
  mini.style.setProperty('--mini-station-x',`${lane.station}%`);
  mini.querySelector('.mobile-chase-label').textContent=`${BANDS[f.layer].toUpperCase()} / SIGNAL ${String(f.motion).padStart(3,'0')} / HULL ${3-state.hits}`;
  mini.setAttribute('aria-label',`Live saucer chase: ${BANDS[f.layer]}. ${f.status}. ${3-state.hits} hull hits remaining.`);
 }
}
