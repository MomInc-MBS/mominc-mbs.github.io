// Shared deterministic rules: exactly two lanes and three reusable trap designs.
export const LANES = [-.9, .9];
export const TRAPS = ['crack', 'rubble', 'wall'];
export const LENGTH = 58;
export function courseFor(seed = 0) {
  const turn = seed % 2 ? 'right' : 'left';
  return [
    {type:'crack', at:13, lane:null},
    {type:'turn', at:28, direction:turn},
    {type:seed % 2 ? 'wall' : 'rubble', at:42, lane:seed % 2},
  ];
}
export function createRun(seed = 0, assisted = false) {
  return {seed, assisted, distance:0, time:0, lane:0, jumpTime:0, height:0, slideTime:0, duck:0, turn:null, paused:false, status:'running', events:courseFor(seed).map(e=>({...e, cleared:false}))};
}
export function upcoming(run) { return run.events.find(e=>!e.cleared) || null; }
export function input(run, action) {
  if(run.status !== 'running' || run.paused) return;
  if(action === 'jump') { if(run.jumpTime === 0 && run.slideTime === 0) run.jumpTime = .96; return; }
  if(action === 'slide') { if(run.jumpTime === 0 && run.slideTime === 0) run.slideTime = .96; return; }
  if(action !== 'left' && action !== 'right') return;
  const next=upcoming(run);
  if(next?.type==='turn' && next.at-run.distance <= 11) run.turn=action;
  else run.lane=action==='left'?0:1;
}
export function safe(run, event) {
  if(event.type==='turn') return run.turn===event.direction;
  if(event.type==='crack') return run.height>.5;
  return run.lane!==event.lane || event.type==='rubble' && run.height>.65 || event.type==='wall' && run.duck>.8 && run.height<.1;
}
export function step(run, delta) {
  if(run.status!=='running' || run.paused) return;
  const dt=Math.max(0,Math.min(delta,.05));
  run.time+=dt;
  run.jumpTime=Math.max(0,run.jumpTime-dt);
  run.slideTime=Math.max(0,run.slideTime-dt);
  run.duck=run.slideTime>0?Math.min(1,(.96-run.slideTime)/.1,run.slideTime/.12):0;
  run.height=run.jumpTime>0?Math.sin((1-run.jumpTime/.96)*Math.PI)*1.35:0;
  const next=upcoming(run), speed=4.8;
  const waiting=run.assisted && next && next.at-run.distance<=.8 && !safe(run,next);
  if(!waiting) run.distance=Math.min(LENGTH,run.distance+speed*dt);
  if(next && run.distance>=next.at) {
    next.cleared=true;
    if(!safe(run,next)) {run.status='hit';run.hit=next.type;return;}
    if(next.type==='turn') run.turn=null;
  }
  if(run.distance>=LENGTH) run.status='complete';
}
export function hint(run) {
  if(run.paused) return 'Run paused';
  const e=upcoming(run), left=e?e.at-run.distance:100;
  if(!e || left>11) return 'Keep running';
  if(e.type==='turn') return `${e.direction==='left'?'←':'→'} SWIPE ${e.direction.toUpperCase()} TO TURN${run.turn===e.direction?' · READY':''}`;
  if(e.type==='crack') return left<3?'SWIPE UP ↑ · JUMP NOW':'CRACK AHEAD · SWIPE UP ↑';
  if(e.type==='wall' && run.lane===e.lane)return left<3?'SWIPE DOWN ↓ · SLIDE NOW':'LOW WALL · SLIDE ↓ OR DODGE';
  if(run.lane!==e.lane)return 'OPEN LANE · KEEP RUNNING';
  return `FALLEN STONE · ${e.lane===0?'SWIPE RIGHT →':'← SWIPE LEFT'}`;
}
// World route turns a real 90 degrees, then continues down the next corridor.
export function pathAt(distance, seed) {
  const sign=seed%2?1:-1, d=Math.max(0,distance);
  return d<=28?{x:0,z:-d,yaw:0}:{x:sign*(d-28),z:-28,yaw:-sign*Math.PI/2};
}
