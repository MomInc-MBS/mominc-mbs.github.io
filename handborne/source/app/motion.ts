import { POSES } from './poses.ts';
export const POSE_INTERVAL_MS=15_000;
export const nextPoseId=(id:string)=>POSES[(POSES.findIndex(p=>p.id===id)+1)%POSES.length].id;
export function specimenMotion(seconds:number){
  return {position:[.0018*Math.sin(seconds*.57),.0028*Math.sin(seconds*.79),.0012*Math.sin(seconds*.43)] as [number,number,number],rotation:[.018*Math.sin(seconds*.41),.035*Math.sin(seconds*.32),.014*Math.sin(seconds*.53)] as [number,number,number]};
}
export function schedulePoseCycle(advance:()=>void,schedule=globalThis.setTimeout,cancel=globalThis.clearTimeout){
  let stopped=false,timer:ReturnType<typeof setTimeout>;
  const tick=()=>{if(stopped)return;advance();if(!stopped)timer=schedule(tick,POSE_INTERVAL_MS);};
  timer=schedule(tick,POSE_INTERVAL_MS);
  return()=>{stopped=true;cancel(timer);};
}
