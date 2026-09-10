'use client';
import {EYE_LAYOUTS,type EyeLayout} from './eye-layouts';
import type {Design} from './design';
export function AnatomyPanel({design,onChange}:{design:Design;onChange:(d:Design)=>void}){
 const count=EYE_LAYOUTS[design.eyeLayout].eyes.length;
 const layouts=(Object.keys(EYE_LAYOUTS) as EyeLayout[]).filter(k=>EYE_LAYOUTS[k].eyes.length===count);
 return <fieldset className="expression-controls"><legend>ANATOMY</legend>
  <label htmlFor="finger-count">Digits per hand <output>{design.fingers}</output></label><input id="finger-count" type="range" min="2" max="6" step="1" value={design.fingers} onChange={e=>onChange({...design,fingers:+e.target.value})}/><p className="small-note">Includes the thumb on each hand.</p>
  <label htmlFor="toe-count">Toes per foot <output>{design.toes}</output></label><input id="toe-count" type="range" min="1" max="6" step="1" value={design.toes} onChange={e=>onChange({...design,toes:+e.target.value})}/>
  <label htmlFor="eye-count">Eyes <output>{count}</output></label><input id="eye-count" type="range" min="1" max="4" step="1" value={count} onChange={e=>onChange({...design,eyeLayout:(['single','horizontal','triangle','spider'] as const)[+e.target.value-1]})}/>
  {count>1&&<><label htmlFor="eye-layout">Eye arrangement</label><select id="eye-layout" value={design.eyeLayout} onChange={e=>onChange({...design,eyeLayout:e.target.value as EyeLayout})}>{layouts.map(k=><option key={k} value={k}>{EYE_LAYOUTS[k].label}</option>)}</select></>}
  {(design.eyeLayout==='frontBack'||design.eyeLayout==='around')&&<p className="small-note">Rotate MYR5 to see the eyes at the back.</p>}
 </fieldset>;
}
