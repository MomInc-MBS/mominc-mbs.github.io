'use client';
import { HandViewer } from './hand-viewer';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { REGIONS } from './catalog';
import type { Selection } from './recipe';
export const ANATOMY_STUDIES=[
  {id:7,name:'Skeletal',description:'Open metacarpals, joint heads and slender bone shafts.'},
  {id:18,name:'Mechanical',description:'Segment housings, hinge pins and a palm chassis.'},
  {id:13,name:'Stone',description:'Broad palm slabs, faceted fingers and heavy knuckles.'},
];
export const SOFT_STUDIES=[
  {id:20,name:'Fluffy',description:'Curved fur strands, a soft undercoat and small round nails.'},
  {id:21,name:'Jelly',description:'Glossy lime jelly with a translucent body and trapped bubbles.'},
  {id:22,name:'Baby',description:'A smaller hand with short, plump fingers and soft wrist rolls.'},
];
export function AnatomyComparison({variant='anatomy'}:{variant?:'anatomy'|'soft'}){
  const soft=variant==='soft',studies=soft?SOFT_STUDIES:ANATOMY_STUDIES;
  const [gray,setGray]=useState(!soft);
  return <main className="anatomy-comparison">
    <header className="comparison-heading"><div><p>HELPING HAND / {soft?'SOFT FORMS':'ANATOMY STUDIES'}</p><h1>{soft?'Fluffy. Jelly. Little.':'Three different structures.'}</h1></div><a href="/handborne/">Back to customizer</a></header>
    <div className="comparison-options"><p className="comparison-note">Same camera and lighting. Drag to inspect{soft?' — the baby hand is smaller in real scale':''}.</p><label className="gray-control">Plain gray<Switch aria-label="Show all hands without colors or translucency" checked={gray} onCheckedChange={setGray} /></label></div>
    <div className="comparison-grid">{studies.map(study=><section className="comparison-card" key={study.id}>
      <div className="comparison-canvas"><HandViewer selection={Object.fromEntries(REGIONS.map(r=>[r.id,study.id])) as Selection} poseId="relaxed" nailShape="family" animate={false} gray={gray} selectedRegion="fingers" exploded={false} onSelectRegion={()=>{}} /></div>
      <div className="comparison-caption"><h2>{study.name}</h2><p>{study.description}</p><a href={'/handborne/?anatomy='+study.id}>Customize this hand →</a></div>
    </section>)}</div><a className="comparison-other" href={'/handborne/?compare='+(soft?'anatomy':'soft')}>{soft?'Compare skeletal, mechanical & stone':'Compare fluffy, jelly & baby'} →</a>
  </main>;
}
