export const SCALE_PATTERNS = [
  {id:'none',name:'Off'},
  {id:'round',name:'Round'},
  {id:'diamond',name:'Diamond'},
  {id:'hex',name:'Hex'},
  {id:'shield',name:'Shield'},
] as const;
export type ScalePattern = typeof SCALE_PATTERNS[number]['id'];
export function validateScalePattern(value:unknown):ScalePattern {
  if(typeof value!=='string'||!SCALE_PATTERNS.some(s=>s.id===value))throw new Error('Choose Off, Round, Diamond, Hex or Shield scales.');
  return value as ScalePattern;
}
