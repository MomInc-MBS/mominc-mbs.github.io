import {CreatureViewer} from './viewer';
import {GESTURES,gestureForCue,type Gesture} from './motion';
import {loadRecipe,RECIPE_KEY,MOTION_KEY,motionSettings,importCreature} from './profile';
import type {Cinematic} from './cinematic-shots';
const base=new URL('../',import.meta.url).href;
const view=document.getElementById('view');
if(view){
 const card=document.createElement('aside');card.className='myr5-companion-card';card.setAttribute('aria-label','Your MYR5 coach');
 const stage=document.createElement('div');stage.className='myr5-companion-stage';
 const edit=document.createElement('a');edit.href=new URL('index.html',base).href;edit.textContent='Customize MYR5';edit.className='myr5-customize';
 const status=document.createElement('span');status.className='myr5-companion-status';status.textContent='Waking up…';status.setAttribute('role','status');
 const hide=document.createElement('button');hide.className='myr5-hide';hide.textContent='Hide creature';hide.setAttribute('aria-expanded','true');
 card.append(stage,status,edit,hide);view.append(card);
 let viewer:CreatureViewer|null=null,lastCaption='',lastCueAt=0,holdUntil=0,epoch=0,closed=false,shown=true,voiceActive=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function settings(){let s=motionSettings(null);try{s=motionSettings(localStorage.getItem(MOTION_KEY));}catch{}viewer?.setSettings({...s,reduced:s.reduced||reduced.matches});}
 async function initialize(){const run=++epoch;try{viewer=new CreatureViewer(stage,base,false);settings();let recipe;try{recipe=loadRecipe(localStorage);}catch{status.textContent='Saved creature unavailable';throw Error('Import your recipe in Customize MYR5.');}await viewer.setRecipe(recipe);if(run!==epoch||closed)return;status.textContent='MYR5';const giant=document.body.dataset.screen==='rest';viewer.setStage(giant?'encounter':'pod');viewer.play(giant?'laugh':'greet');holdUntil=performance.now()+(giant?3700:2800);}catch(error){status.textContent=(error as Error).message;}}
 function play(id:Gesture,duration=GESTURES[id]?.duration*1000+300){if(!shown||viewer?.cinematicKind||!Object.hasOwn(GESTURES,id))return;viewer?.play(id);holdUntil=performance.now()+duration;}
 // Live cue keys are explicit; user-authored text never becomes executable data.
 const cue=(event:Event)=>{const d=(event as CustomEvent).detail;if(!d||typeof d.key!=='string')return;lastCueAt=performance.now();play(gestureForCue(d.key));};
 window.addEventListener('myr5:cue',cue);
 const response=(event:Event)=>{const detail=(event as CustomEvent).detail,state=detail?.state;const map:Record<string,Gesture>={listening:'listening',thinking:'thinking',speaking:'speaking',idle:'idle'};if(!Object.hasOwn(map,state))return;voiceActive=state==='speaking';if(state==='speaking'&&performance.now()<holdUntil&&viewer?.motion?.current!=='speaking')return;if(state==='idle'&&viewer?.motion?.current!=='speaking'&&performance.now()<holdUntil)return;play(map[state],state==='idle'?0:15000);};
 window.addEventListener('myr5:response',response);
 // Captions from existing controls also prompt a speaking pose. The explicit
 // cue takes precedence, and repeated caption text does not restart gestures.
 const caption=document.getElementById('coachCaption');const observer=new MutationObserver(()=>{const text=caption?.textContent||'';if(text&&text!==lastCaption){lastCaption=text;if(performance.now()-lastCueAt>120&&performance.now()>holdUntil)play('speaking',Math.min(14000,1200+text.length*80));}});if(caption)observer.observe(caption,{childList:true,characterData:true,subtree:true});
 const timer=setInterval(()=>{if(closed||!viewer?.motion||!shown||document.hidden)return;const state=(window as any).myr5TestState;if(performance.now()>holdUntil){const next=voiceActive?'speaking':state?.phase==='tracking'?'listening':'idle';if(viewer.motion.current!==next)viewer.play(next);}const label=GESTURES[viewer.motion.current].label;if(status.textContent!==label)status.textContent=label;},300);
 const storage=async(event:StorageEvent)=>{if(event.key===MOTION_KEY)settings();if(event.key===RECIPE_KEY&&event.newValue){try{status.textContent='Updating…';await viewer?.setRecipe(importCreature(event.newValue));status.textContent='MYR5';}catch{status.textContent='Creature update failed';}}};window.addEventListener('storage',storage);reduced.addEventListener('change',settings);
 hide.onclick=()=>{shown=!shown;stage.hidden=!shown;status.hidden=!shown;viewer?.setPaused(!shown);hide.textContent=shown?'Hide creature':'Show creature';hide.setAttribute('aria-expanded',String(shown));};
 document.getElementById('start')?.addEventListener('click',()=>play('greet'));document.getElementById('stop')?.addEventListener('click',()=>play('rest',5000));
 window.addEventListener('pagehide',()=>{closed=true;epoch++;clearInterval(timer);observer.disconnect();viewer?.dispose();window.removeEventListener('myr5:cue',cue);window.removeEventListener('myr5:response',response);window.removeEventListener('storage',storage);reduced.removeEventListener('change',settings);},{once:true});
 (window as any).myr5Creature={play,stage:(value:'pod'|'encounter')=>viewer?.setStage(value),cinematic:(kind:Cinematic|null,elapsed=0)=>{viewer?.cinematic(kind,elapsed);holdUntil=performance.now()+(kind?10000:500);},stats:()=>({...viewer?.stats(),stage:viewer?.stage,cinematic:viewer?.cinematicKind,handsVersion:2})};initialize();
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
}
