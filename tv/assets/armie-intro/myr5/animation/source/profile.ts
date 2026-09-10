import {fresh,parseRecipe} from './creator/design';
export {fresh,REGIONS,LABELS,STYLES,PICKER_STYLES} from './creator/design';
export {EYE_LAYOUTS} from './creator/eye-layouts';
export {PUPILS} from './creator/pupils';
export {COACHES} from './creator/coaching';
export const RECIPE_KEY='myr5-recipe-v1';
export const MOTION_KEY='myr5-motion-v1';
export const MAX_IMPORT_BYTES=64*1024;
export function importCreature(raw:string){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_IMPORT_BYTES)throw Error('Choose a MYR5 recipe smaller than 64 KB.');
 try {
  const data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error();
  if(data.format!==undefined&&data.format!=='myr5-companion')throw Error();
  if(data.format==='myr5-companion'&&data.version!==1)throw Error();
  return parseRecipe(JSON.stringify(data.format==='myr5-companion'?data.recipe:data));
 } catch {throw Error('This is not a supported MYR5 recipe. Export “Save editable recipe · JSON” from the creature creator.');}
}
export function loadRecipe(storage:Storage){const raw=storage.getItem(RECIPE_KEY);return raw?importCreature(raw):fresh();}
export function exportCompanion(recipe:unknown){return JSON.stringify({format:'myr5-companion',version:1,rigVersion:1,recipe:importCreature(JSON.stringify(recipe))},null,2);}
export function motionSettings(raw:string|null){
 try {const d=JSON.parse(raw||'{}');return {amount:Number.isFinite(d?.amount)?Math.max(0,Math.min(1.5,d.amount)):0.65,reduced:typeof d?.reduced==='boolean'?d.reduced:false,ambient:d?.ambient!==false};}
 catch{return {amount:.65,reduced:false,ambient:true};}
}
