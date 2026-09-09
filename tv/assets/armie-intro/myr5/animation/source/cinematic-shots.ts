export const SHOTS = {
 opening: {duration:4800, gesture:'awaken', frames:[[-1.7,1.6,7.7,1.65],[-.6,2.25,7.2,1.82],[0,2.65,8.9,1.95]]},
 home: {duration:2400, gesture:'greet', frames:[[.55,2.4,9.5,1.9],[.24,2.5,9.1,1.95],[0,2.65,8.9,1.95]]},
 pre: {duration:3300, gesture:'ready', frames:[[.85,2.35,8.5,1.87],[.2,2.15,7.5,1.87],[0,2.65,8.9,1.95]]},
 post: {duration:3800, gesture:'victory', frames:[[-.6,2.1,7.4,2.1],[.25,2.35,8.1,2.1],[0,2.1,5.8,2.25]]}
} as const;
export type Cinematic=keyof typeof SHOTS;
export function sampleShot(kind:Cinematic,elapsed:number){
 const s=SHOTS[kind],u=Math.max(0,Math.min(1,elapsed/s.duration)),segment=Math.min(1,Math.floor(u*2));
 const t=u*2-segment,e=t*t*(3-2*t),a=s.frames[segment],b=s.frames[segment+1];
 return a.map((v,i)=>v+(b[i]-v)*e);
}
