import {bandIndex,STATION,LEVELS,levelIndex} from './engine.js';
export const JOURNEY_ART = ['01-office','02-vents','03-stairwell','04-rooftops','05-clouds','06-elevator','07-junkyard','08-port18','09-cafeteria','10-fold','11-origami','12-gym','13-wormhole','14-flatland','15-mirror','16-quilt','17-cable','18-nursery','19-edge','20-mothership'].map(name=>`assets/journey/${name}.svg`);
const DESCRIPTIONS=['The pyramid on the desk was your first warning.','The air ducts carry more than company gossip.','Every step is sponsored by your employer.','Her promises cover the skyline.','The clouds are only paper. Keep climbing.','Next floor: unauthorized outer space.','Broken satellites. The first tears in the paper.','Docking here would be a career-limiting move.','The soup is lunar. The contract is eternal.','The world mirrors. Colours invert. Fall up through the crease.','Every fold creates another way out.','Even the asteroids have mandatory wellness goals.','Take the exit that has not been invented yet.','The third dimension is currently out of office.','Same office. Wrong side of the glass.','Someone stitched the universe back together.','Follow the signal through the seams.','New stars. Same parental supervision.','You can see the hand that drew it all.','You made it to the desk behind the universe.'];
let crossingTimers=[];
function paintJourney(scene,mini,level){
 for(const surface of [scene,mini].filter(Boolean)){
  surface.style.setProperty('--journey-art',`url("${JOURNEY_ART[level]}")`);
  surface.dataset.displayLevel=String(level);surface.dataset.effect=LEVELS[level].effect;
 }
 const title=document.querySelector('#location-title');if(title)title.textContent=LEVELS[level].name;
 const description=document.querySelector('.location-caption p');if(description)description.textContent=DESCRIPTIONS[level];
}
export function sceneFrame({distance,hits,phase,rounds,score,history=[]}) {
 const layer=bandIndex(distance);
 const clamp=value=>Math.max(0,Math.min(1,value));
 // Awarded score is monotonic even when practice distance reaches its cap.
 // Visual advance is scenery/chase motion, never extra fuel or displayed km.
 const progress=clamp(distance/STATION);
 const motion=Number.isFinite(rounds)?Math.max(0,Math.floor(rounds)):history.length;
 const roundAdvance=.18*(1-Math.exp(-motion/18));
 const journey=progress+(1-progress)*roundAdvance;
 const player=phase==='escaped'?80:40+32*journey;
 const pressure=8*(1-Math.exp(-motion/24));
 const gap=phase==='dead'?2:Math.max(6,24-pressure-hits*5+8*progress);
 const last=history.at(-1);
 const level=levelIndex(distance);
 return {layer,level,art:JOURNEY_ART[level],effect:LEVELS[level].effect,x:(layer%2)*100,y:Math.floor(layer/2)/3*100,player,pursuer:player-gap,motion,
  outcome:last?.skipped?'pass':last?.correct===false?'hit':last?.correct?'verified':'idle',
  status:phase==='dead'?'MOM CAUGHT YOUR SIGNAL':phase==='escaped'?'MOTHERSHIP DESK REACHED':hits===2?'MOM IS RIGHT BEHIND YOU':hits===1?'MOM IS CLOSING IN':'MOM IS ON YOUR TRAIL'};
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
 const previousLevel=Number(scene.dataset.level??f.level);
 scene.dataset.level=String(f.level);scene.dataset.effect=f.effect;
 scene.style.setProperty('--journey-art',`url("${f.art}")`);
 scene.style.setProperty('--route-progress',`${state.distance/STATION*100}%`);
 const title=document.querySelector('#location-title');if(title)title.textContent=LEVELS[f.level].name;
 const stage=document.querySelector('#location-stage');if(stage)stage.textContent=f.level<6?'01 / GROUNDED':f.level<10?'02 / REALITY FOLDS':'03 / FULL DIMENSIONS';
 scene.style.setProperty('--space-x',`${f.x}%`);scene.style.setProperty('--space-y',`${f.y}%`);
 document.querySelector('#rocket').style.bottom=`${f.player}%`;
 document.querySelector('#pursuer').style.bottom=`${f.pursuer}%`;
 document.querySelector('#chase-status').textContent=f.status;
 for(const marker of document.querySelectorAll('[data-stop]')){
  const n=Number(marker.dataset.stop);marker.classList.toggle('active',n===f.level);marker.classList.toggle('reached',n<f.level);
  marker.classList.toggle('nearby',Math.abs(n-f.level)<=2);
  if(n===f.level)marker.setAttribute('aria-current','step');else marker.removeAttribute('aria-current');
 }
 const mini=document.querySelector('#mobile-chase');
 if(mini){
  const lane=mobileSceneFrame(f);paintMotion(mini,f,state);
  mini.dataset.level=String(f.level);mini.dataset.effect=f.effect;
  mini.style.setProperty('--journey-art',`url("${f.art}")`);
  mini.style.setProperty('--space-x',`${f.x}%`);mini.style.setProperty('--space-y',`${f.y}%`);
  mini.style.setProperty('--mini-player-x',`${lane.player}%`);
  mini.style.setProperty('--mini-mom-x',`${lane.pursuer}%`);
  mini.style.setProperty('--mini-station-x',`${lane.station}%`);
  mini.querySelector('.mobile-chase-label').textContent=`${String(f.level+1).padStart(2,'0')} / 20 · ${LEVELS[f.level].name.toUpperCase()}`;
  mini.setAttribute('aria-label',`Live saucer chase: level ${f.level+1}, ${LEVELS[f.level].name}. ${f.status}. ${3-state.hits} hull hits remaining.`);
 }
 for(const timer of crossingTimers)clearTimeout(timer);crossingTimers=[];
 paintJourney(scene,mini,f.level);
 // A rare answer may cross two stops. Show the intermediate world as well,
 // especially The Fold, rather than jumping over its dimension crossing.
 if(scene.ownerDocument&&f.level>previousLevel+1&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
  paintJourney(scene,mini,previousLevel+1);
  crossingTimers.push(setTimeout(()=>paintJourney(scene,mini,f.level),950));
 }
}
