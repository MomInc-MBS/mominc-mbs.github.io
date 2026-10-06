import {DEFAULT_SELECTION,type RegionId,styleFor} from './catalog';
import type {Selection} from './recipe';
const owned=new Set<number>();
export const isHandStyleUnlocked=(id:number)=>id<63||owned.has(id);
export const assertHandStylesUnlocked=(sections:Selection)=>{for(const id of Object.values(sections))if(!isHandStyleUnlocked(id))throw Error(styleFor(id).name+' is locked. Earn its texture and color in Coach packs.');};
export const availableHandSections=(sections:Selection):Selection=>Object.fromEntries(Object.entries(sections).map(([region,id])=>[region,isHandStyleUnlocked(id)?id:DEFAULT_SELECTION[region as RegionId]])) as Selection;
export function subscribeHandUnlocks(changed:()=>void){
 const origin='https://myr5.mominc.online',frame=document.createElement('iframe');
 frame.src=origin+'/handborne/unlocks.html';frame.hidden=true;frame.title='Coach material ownership';
 const request=()=>frame.contentWindow?.postMessage({type:'handborne:unlock-request'},origin);
 const receive=(event:MessageEvent)=>{if(event.origin!==origin||event.source!==frame.contentWindow||event.data?.type!=='handborne:unlock-state'||!Array.isArray(event.data.styles))return;
  owned.clear();for(const id of event.data.styles)if(Number.isInteger(id)&&id>=63&&id<=74)owned.add(id);changed();};
 frame.addEventListener('load',request);window.addEventListener('message',receive);window.addEventListener('focus',request);document.body.appendChild(frame);
 return()=>{window.removeEventListener('message',receive);window.removeEventListener('focus',request);frame.remove();owned.clear();};
}
