import { DEFAULT_SELECTION, REGIONS, STYLES, type RegionId } from './catalog.ts';
import { DEFAULT_POSE, POSES, validatePose } from './poses.ts';
import { DEFAULT_NAIL_SHAPE, NAIL_SHAPES, validateNailShape } from './nails.ts';
import { SCALE_PATTERNS, validateScalePattern } from './scale-patterns.ts';

export type Selection = Record<RegionId, number>;
export type HandDesign = {sections:Selection;pose:string;nailShape:string;scalePattern?:string};
const legacyRegions=['nails','fingertips','middle_sections','knuckles','palm','back_of_hand','wrist'];
const nailIds=[DEFAULT_NAIL_SHAPE,...NAIL_SHAPES.map(s=>s.id)];
const two=(n:number)=>String(n).padStart(2,'0');
export const recipeCode=(sections:Selection)=>'HB3-'+REGIONS.map(r=>two(sections[r.id]+1)).join('-')+'-01-01';
export function designCode(design:HandDesign){
  const core=recipeCode(design.sections).split('-').slice(0,7).join('-')+'-'+two(POSES.findIndex(p=>p.id===validatePose(design.pose))+1)+'-'+two(nailIds.indexOf(validateNailShape(design.nailShape))+1);
  const pattern=validateScalePattern(design.scalePattern??'none');
  return pattern==='none'?core:core.replace('HB3-','HB4-')+'-'+two(SCALE_PATTERNS.findIndex(s=>s.id===pattern)+1);
}
export function validateSelection(value: unknown): Selection {
  if (!value || typeof value !== 'object') throw new Error('A recipe must contain all six sections.');
  const source = value as Record<string, unknown>;
  if (Object.keys(source).length !== 6) throw new Error('A recipe needs exactly six sections.');
  const result = {} as Selection;
  for (const { id } of REGIONS) {
    if (typeof source[id] !== 'number' || !Number.isInteger(source[id]) || source[id] < 0 || source[id] >= STYLES.length) throw new Error(`Invalid style for ${id}. Choose 1–${STYLES.length}.`);
    result[id] = source[id] as number;
  }
  return result;
}
function migrateLegacy(value:unknown):Selection {
  if(!value||typeof value!=='object'||Object.keys(value).length!==7)throw new Error('Older recipes need seven original sections.');
  const v=value as Record<string,unknown>;
  for(const id of legacyRegions)if(typeof v[id]!=='number'||!Number.isInteger(v[id])||(v[id] as number)<0||(v[id] as number)>19)throw new Error('Invalid legacy style.');
  // The old finger-shaft choice now styles the joined finger/knuckle surface.
  return validateSelection({nails:v.nails,fingertips:v.fingertips,fingers:v.middle_sections,palm:v.palm,back_of_hand:v.back_of_hand,wrist:v.wrist});
}
export function parseDesign(text:string):HandDesign {
  const input=text.trim();
  if(input.startsWith('HB3-')||input.startsWith('HB4-')){
    const scales=input.startsWith('HB4-');
    if(!(scales?/^HB4(?:-\d{2}){9}$/:/^HB3(?:-\d{2}){8}$/).test(input))throw new Error('Invalid recipe: six styles, a pose, nails and (HB4) scales are required.');
    const v=input.split('-').slice(1).map(Number);
    if(!POSES[v[6]-1]||!nailIds[v[7]-1])throw new Error('Invalid pose or nail shape in recipe.');
    const pattern=scales?validateScalePattern(SCALE_PATTERNS[v[8]-1]?.id):'none';
    return {sections:validateSelection(Object.fromEntries(REGIONS.map((r,i)=>[r.id,v[i]-1]))),pose:POSES[v[6]-1].id,nailShape:nailIds[v[7]-1],...(pattern==='none'?{}:{scalePattern:pattern})};
  }
  if(input.startsWith('HB1-')||input.startsWith('HB2-')){
    const v=input.split('-'),version=v.shift();
    if(v.length!==(version==='HB1'?7:8)||v.some(n=>!/^(0[1-9]|1[0-9]|20)$/.test(n)))throw new Error('Invalid older recipe code.');
    return {sections:migrateLegacy(Object.fromEntries(legacyRegions.map((r,i)=>[r,Number(v[i])-1]))),pose:version==='HB1'?DEFAULT_POSE:POSES[Number(v[7])-1].id,nailShape:DEFAULT_NAIL_SHAPE};
  }
  let parsed:{version:number;sections:unknown;pose?:unknown;nailShape?:unknown;scalePattern?:unknown};
  try{parsed=JSON.parse(input);}catch{throw new Error('Paste a Handborne recipe code or recipe JSON.');}
  if(!parsed||![1,2,3,4].includes(parsed.version))throw new Error('Unsupported recipe version.');
  const pattern=parsed.version===4?validateScalePattern(parsed.scalePattern??'none'):'none';
  return {sections:parsed.version>=3?validateSelection(parsed.sections):migrateLegacy(parsed.sections),pose:parsed.version===1?DEFAULT_POSE:validatePose(parsed.pose),nailShape:parsed.version>=3?validateNailShape(parsed.nailShape):DEFAULT_NAIL_SHAPE,...(pattern==='none'?{}:{scalePattern:pattern})};
}
export function parseRecipe(text:string):Selection{return parseDesign(text).sections;}
export function randomize(sections: Selection, locks: RegionId[], seed: number): Selection {
  let state = seed >>> 0;
  const next = { ...sections };
  for (const { id } of REGIONS) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    if (!locks.includes(id)) next[id] = (sections[id] + 1 + (state % (STYLES.length-1))) % STYLES.length;
  }
  return next;
}
export const emptyLocks: RegionId[] = [];
export const initialSelection: Selection = { ...DEFAULT_SELECTION };
