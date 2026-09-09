import * as T from 'three';
import type {CreatureRig} from './rig';
export const GESTURES={
 idle:{label:'At ease',duration:7,loop:true},listening:{label:'Listening',duration:4,loop:true},thinking:{label:'Thinking',duration:5,loop:true},speaking:{label:'Speaking',duration:3.6,loop:true},
 greet:{label:'Hello',duration:2.6,loop:false},agree:{label:'Yes / understood',duration:1.9,loop:false},correct:{label:'Gentle correction',duration:2.4,loop:false},encourage:{label:'Encouragement',duration:2.8,loop:false},celebrate:{label:'Celebrate',duration:3.2,loop:false},rest:{label:'Take a breath',duration:5,loop:true},laugh:{label:'Giant laugh',duration:3.4,loop:false},swipe:{label:'Platform sweep',duration:1.8,loop:false}
 ,awaken:{label:'Pod awakening',duration:4.8,loop:false},ready:{label:'Ready to train',duration:3.3,loop:false},victory:{label:'Effort earned',duration:3.8,loop:false}
} as const;
export type Gesture=keyof typeof GESTURES;
export function gestureForCue(key:string){return ({count:'agree',complete:'celebrate',ready:'greet',tracking:'correct',setup:'listening',time:'encourage'} as Record<string,Gesture>)[key]||'speaking';}
export function samplePose(id:Gesture,t:number){
 const d=GESTURES[id].duration,u=t/d,s=Math.sin(u*Math.PI*2),envelope=Math.sin(Math.PI*u)**2;
 const p={headX:0,headY:0,headZ:0,bodyX:0,bodyZ:0,bodyY:0,leftX:0,leftZ:0,rightX:0,rightZ:0,breath:0};
 if(id==='idle'){p.headY=.045*s;p.headZ=.018*Math.sin(u*Math.PI*4);p.breath=.009*s;p.leftX=.02*s;p.rightX=-.015*s;}
 if(id==='listening'){p.headZ=-.085*(.5-.5*Math.cos(u*Math.PI*2));p.headX=.03*s;}
 if(id==='thinking'){p.headY=.10*s;p.headZ=.055*(1-Math.cos(u*Math.PI*2));p.rightX=-.06*s;}
 if(id==='speaking'){p.headX=.035*s;p.headZ=.02*Math.sin(u*Math.PI*4);p.rightX=.13*s;p.rightZ=.07*(1-Math.cos(u*Math.PI*2));p.leftX=-.06*s;}
 if(id==='greet'){p.rightZ=.27*envelope;p.rightX=.2*Math.sin(u*Math.PI*8)*envelope;p.headZ=-.06*envelope;}
 if(id==='agree'){p.headX=.15*Math.sin(u*Math.PI*4)*envelope;p.rightZ=.05*envelope;}
 if(id==='correct'){p.headY=.16*Math.sin(u*Math.PI*4)*envelope;p.rightZ=.12*envelope;}
 if(id==='encourage'){p.headX=.10*Math.sin(u*Math.PI*4)*envelope;p.leftZ=-.15*envelope;p.rightZ=.18*envelope;p.bodyZ=.02*s*envelope;}
 if(id==='celebrate'){p.leftZ=-.45*envelope;p.rightZ=.33*envelope;p.headZ=.06*s*envelope;p.bodyY=.08*envelope*(.5+.5*Math.sin(u*Math.PI*6));}
 if(id==='rest'){p.breath=.015*s;p.headX=.025*s;p.leftX=.025*s;}
 if(id==='laugh'){const chuckle=Math.sin(u*Math.PI*14)*envelope;p.headX=-.2*envelope+.12*chuckle;p.headZ=.08*chuckle;p.bodyX=-.05*envelope;p.bodyY=.055*chuckle;p.leftZ=-.18*envelope;p.rightZ=.2*envelope;p.breath=.045*Math.abs(chuckle);}
 if(id==='swipe'){const sweep=Math.sin(u*Math.PI)*Math.sin(u*Math.PI);p.bodyZ=-.12*sweep;p.headY=.22*Math.sin(u*Math.PI*2)*sweep;p.rightZ=1.15*Math.sin(u*Math.PI*2)*sweep;p.rightX=-.65*sweep;p.leftZ=-.16*sweep;p.bodyY=-.06*sweep;}
 if(id==='awaken'){p.headX=.24*(1-u)*envelope;p.headY=-.14*Math.sin(u*Math.PI*2)*envelope;p.bodyY=.08*envelope;p.leftZ=-.17*envelope;p.rightZ=.27*envelope;p.breath=.028*envelope;}
 if(id==='ready'){p.headX=.16*Math.sin(u*Math.PI*2)*envelope;p.leftZ=-.36*envelope;p.rightZ=.42*envelope;p.leftX=-.24*envelope;p.rightX=-.32*envelope;p.bodyY=-.045*envelope;p.breath=.018*envelope;}
 if(id==='victory'){p.leftZ=-.65*envelope;p.rightZ=.68*envelope;p.headX=-.12*envelope;p.headZ=.08*Math.sin(u*Math.PI*2)*envelope;p.bodyY=.09*envelope;p.breath=.026*envelope;}
 return p;
}
export function createClips(rig:CreatureRig){
 return Object.entries(GESTURES).map(([name,meta])=>{
  const count=Math.ceil(meta.duration*24),times=Array.from({length:count+1},(_,i)=>meta.duration*i/count);
  const pose=times.map(t=>samplePose(name as Gesture,t)),tracks:T.KeyframeTrack[]=[];
  const rotations:Record<string,(p:ReturnType<typeof samplePose>)=>number[]>={HeadMotion:p=>[p.headX,p.headY,p.headZ],BodyMotion:p=>[p.bodyX,0,p.bodyZ],ArmLeft:p=>[p.leftX,0,p.leftZ],ArmRight:p=>[p.rightX,0,p.rightZ]};
  for(const [node,get] of Object.entries(rotations)){tracks.push(new T.QuaternionKeyframeTrack(node+'.quaternion',times,pose.flatMap(p=>{const [x,y,z]=get(p);return new T.Quaternion().setFromEuler(new T.Euler(x,y,z)).toArray();})));}
  tracks.push(new T.VectorKeyframeTrack('BodyMotion.position',times,pose.flatMap(p=>[0,rig.rest.BodyMotion.position.y+p.bodyY,0])));
  tracks.push(new T.VectorKeyframeTrack('BodyMotion.scale',times,pose.flatMap(p=>[1+p.breath*.3,1+p.breath,1+p.breath*.3])));
  for(const node of Object.keys(rig.nodes).filter(n=>n.startsWith('EyeBlink'))){const mid=meta.duration*.55;tracks.push(new T.VectorKeyframeTrack(node+'.scale',[0,mid,mid+.10,mid+.23,meta.duration],[1,1,1,1,1,1,1,.06,1,1,1,1,1,1,1]));}
  return new T.AnimationClip(name,meta.duration,tracks);
 });
}
export class MotionController {
 rig:CreatureRig;mixer:T.AnimationMixer;clips:T.AnimationClip[];current:Gesture='idle';action:T.AnimationAction;ambient=true;reduced=false;paused=false;amount=.65;clock=0;nextBlink=3.4;blinkStart=-100;
 actions=new Map<Gesture,T.AnimationAction>();
 constructor(rig:CreatureRig){this.rig=rig;this.clips=createClips(rig);this.mixer=new T.AnimationMixer(rig.root);for(const clip of this.clips){const action=this.mixer.clipAction(clip);const id=clip.name as Gesture;action.setLoop(GESTURES[id].loop?T.LoopRepeat:T.LoopOnce,GESTURES[id].loop?Infinity:1);action.clampWhenFinished=!GESTURES[id].loop;this.actions.set(id,action);}this.action=this.actions.get('idle')!;this.action.play();this.mixer.addEventListener('finished',()=>this.play('idle'));}
 play(id:Gesture){if(!Object.hasOwn(GESTURES,id))return;if(this.current===id&&GESTURES[id].loop)return;const next=this.actions.get(id)!;for(const action of this.actions.values())if(action!==this.action&&action!==next)action.stop();if(next===this.action)next.reset().play();else{this.action.fadeOut(.22);next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.22).play();}this.action=next;this.current=id;}
 update(dt:number){
  if(this.paused)return;dt=Math.min(.05,Math.max(0,dt));this.clock+=dt;this.mixer.update(dt);
  // Scale the finished mixed pose from rest, so editor changes never accumulate.
  const strength=this.reduced?0:(this.current==='idle'&&!this.ambient?0:this.amount);
  for(const [name,node] of Object.entries(this.rig.nodes)){const rest=this.rig.rest[name];if(name.startsWith('EyeBlink'))continue;const position=node.position.clone(),scale=node.scale.clone();node.quaternion.slerpQuaternions(rest.quaternion,node.quaternion.clone(),strength);node.position.copy(rest.position).lerp(position,strength);node.scale.copy(rest.scale).lerp(scale,strength);}
  if(this.clock>=this.nextBlink){this.blinkStart=this.clock;this.nextBlink=this.clock+3.8+Math.random()*2.5;}
  const phase=(this.clock-this.blinkStart)/.23,blink=!this.reduced&&this.ambient&&phase>=0&&phase<=1?Math.sin(phase*Math.PI)**2:0;
  for(const [name,node] of Object.entries(this.rig.nodes))if(name.startsWith('EyeBlink'))node.scale.y=1-.94*blink;
 }
 neutral(){this.mixer.stopAllAction();for(const [name,node] of Object.entries(this.rig.nodes)){const r=this.rig.rest[name];node.position.copy(r.position);node.scale.copy(r.scale);node.quaternion.copy(r.quaternion);}}
 dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.rig.root);}
}
