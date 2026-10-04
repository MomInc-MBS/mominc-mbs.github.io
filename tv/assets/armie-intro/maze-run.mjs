// Shared deterministic rules: three lanes, three full-width trap designs and one 90 degree turn.
import {routeFor} from './ship-routes.mjs?v=chase-5';
export const LANES = [-1.25, 0, 1.25];
export const TRAPS = ['grid', 'platform', 'pit'];
export const TURN_AT = 36;
export const LENGTH = 102;
export const PIT_LENGTH = 7;
// Trap slots: [before turn x2] + [after turn x4 or x5]; slot 1 is right before the turn, so never a pit there.
const SLOTS = {6:[12,24,48,60,72,84], 7:[11,23,46,56,66,76,86]};
function rng(seed){let a=(seed*2654435761+1013904223)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function courseFor(seed = 0) {
  const r=rng(seed),count=r()<.5?6:7,types=[...TRAPS];
  while(types.length<count)types.push(TRAPS[Math.floor(r()*3)]);
  for(let i=types.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[types[i],types[j]]=[types[j],types[i]];}
  if(types[1]==='pit'){const j=types.findIndex((t,i)=>i>1&&t!=='pit');[types[1],types[j]]=[types[j],types[1]];}
  const events=SLOTS[count].map((at,i)=>types[i]==='pit'?{type:'pit',at,length:PIT_LENGTH}:{type:types[i],at});
  events.splice(2,0,{type:'turn',at:TURN_AT,direction:seed%2?'right':'left'});
  return events;
}
export function createRun(seed = 0, assisted = false, boost = 0) {
  return {seed, assisted, boost:Math.max(0,Math.min(1,boost)), distance:0, time:0, lane:1, jumpTime:0, height:0, slideTime:0, duck:0, turn:null, exit:null, exitProgress:0, paused:false, status:'running', events:courseFor(seed).map(e=>({...e, cleared:false}))};
}
export function runSpeed(run){return 4.8+2.4*run.boost*Math.max(0,1-run.distance/36);}
export function upcoming(run) { return run.events.find(e=>!e.cleared) || null; }
export function input(run, action) {
  if(run.status==='choosing'&&!run.paused){
    const exit={left:0,jump:1,straight:1,right:2}[action];
    if(exit!==undefined){run.exit=exit;run.exitProgress=0;run.status='exiting';}return;
  }
  if(run.status !== 'running' || run.paused) return;
  if(action === 'jump') { if(run.jumpTime === 0 && run.slideTime === 0) run.jumpTime = .96; return; }
  if(action === 'slide') { if(run.jumpTime === 0 && run.slideTime === 0) run.slideTime = .96; return; }
  if(action !== 'left' && action !== 'right') return;
  const next=upcoming(run);
  if(next?.type==='turn' && next.at-run.distance <= 11) run.turn=action;
  else run.lane=Math.max(0,Math.min(LANES.length-1,run.lane+(action==='left'?-1:1)));
}
export function safe(run, event) {
  if(event.type==='turn') return run.turn===event.direction;
  if(event.type==='grid') return run.duck>.8 && run.height<.1;
  if(event.type==='platform') return run.height>.65;
  return run.lane!==1; // pit: only the two wall ledges hold you
}
export function step(run, delta) {
  if(run.paused||!['running','exiting'].includes(run.status))return;
  const dt=Math.max(0,Math.min(delta,.05));
  run.time+=dt;
  if(run.status==='exiting'){
    run.exitProgress=Math.min(1,run.exitProgress+dt/1.25);
    if(run.exitProgress>=1){run.status=run.exit===routeFor(run.seed).correct?'complete':'hit';if(run.status==='hit')run.hit='exit';}return;
  }
  run.jumpTime=Math.max(0,run.jumpTime-dt);
  run.slideTime=Math.max(0,run.slideTime-dt);
  run.duck=run.slideTime>0?Math.min(1,(.96-run.slideTime)/.1,run.slideTime/.12):0;
  run.height=run.jumpTime>0?Math.sin((1-run.jumpTime/.96)*Math.PI)*1.35:0;
  const next=upcoming(run), speed=runSpeed(run);
  const waiting=run.assisted && next && next.at-run.distance<=.8 && !safe(run,next);
  if(!waiting) run.distance=Math.min(LENGTH,run.distance+speed*dt);
  // The pit is checked on every step while you are over it, not only at its lip.
  if(next && run.distance>=next.at) {
    if(!safe(run,next)) {next.cleared=true;run.status='hit';run.hit=next.type;return;}
    if(run.distance>=next.at+(next.length||0)){next.cleared=true;if(next.type==='turn') run.turn=null;}
  }
  if(run.distance>=LENGTH){run.status='choosing';run.height=0;run.duck=0;}
}
// MOM Inc propaganda only: never tells the player what to do.
const PROPAGANDA = {
  grid:'MOM INC · THE LIGHT IS WARM',
  platform:'MOM INC · REST HERE, BABY',
  pit:'MOM INC · NO ONE LEAVES MOM',
  turn:'MOM INC · ALL HALLS LEAD HOME',
};
export function hint(run) {
  if(run.paused) return '';
  if(run.status==='choosing')return 'MOM INC · EVERY DOOR IS LOVE';
  if(run.status==='exiting')return 'MOM SEES EVERYTHING';
  const e=upcoming(run), left=e?e.at-run.distance:100;
  if(!e) return 'MOM INC · YOU ARE ALREADY HERS';
  if(left>11) return 'MOM INC LOVES YOU';
  return PROPAGANDA[e.type];
}
// World route turns a real 90 degrees, then continues down the next corridor.
export function pathAt(distance, seed) {
  const sign=seed%2?1:-1, d=Math.max(0,distance);
  return d<=TURN_AT?{x:0,z:-d,yaw:0}:{x:sign*(d-TURN_AT),z:-TURN_AT,yaw:-sign*Math.PI/2};
}
