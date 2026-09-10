'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Dices, Download, RotateCcw, Undo2, Redo2, Lock, Unlock, Save, Layers3, Focus, Rotate3D, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_SELECTION, REGIONS, STYLES, type RegionId } from './catalog';
import { parseDesign, designCode, randomize, type Selection, type HandDesign } from './recipe';
import { DEFAULT_POSE, POSES } from './poses';
import { DEFAULT_NAIL_SHAPE, NAIL_SHAPES } from './nails';
import { nextPoseId, schedulePoseCycle } from './motion';
import { registerHandTools } from './web-tools';
import { HandViewer, type HandViewerHandle } from './hand-viewer';
import { AnatomyComparison, ANATOMY_STUDIES, SOFT_STUDIES } from './anatomy-comparison';
import { HAND_SHAPES, activeHandShape, selectHandShape, type ShapeScope } from './hand-shapes';
import { SCALE_PATTERNS } from './scale-patterns';

type History = {past:HandDesign[];present:HandDesign;future:HandDesign[]};
const number = (n:number) => String(n+1).padStart(2,'0');
export default function Home() {
  const [selectedRegion,setSelectedRegion]=useState<RegionId>('palm');
  const [tab,setTab]=useState('look'),[scope,setScope]=useState<'hand'|'part'>('hand');
  const [saved,setSaved]=useState(false),[embedded,setEmbedded]=useState(false);
  const chooseRegion=(region:RegionId)=>{setSelectedRegion(region);setScope('part');setTab('look');};
  const [shapeScope,setShapeScope]=useState<ShapeScope>('hand');
  const [history,setHistory]=useState<History>({past:[],present:{sections:{...DEFAULT_SELECTION},pose:DEFAULT_POSE,nailShape:DEFAULT_NAIL_SHAPE},future:[]});
  const [animate,setAnimate]=useState(false),[visible,setVisible]=useState(true),[cycleRevision,setCycleRevision]=useState(0);
  const [locks,setLocks]=useState<RegionId[]>([]);
  const [exploded,setExploded]=useState(false);
  const [dialog,setDialog]=useState<'export'|'recipe'|null>(null);
  const [recipeInput,setRecipeInput]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [restored,setRestored]=useState(false);
  const [readyCode,setReadyCode]=useState('');
  const [comparison,setComparison]=useState<'anatomy'|'soft'|null>(null),[gray,setGray]=useState(false);
  const viewer=useRef<HandViewerHandle>(null);
  const design=history.present,selection=design.sections;
  const code=designCode(design);
  const style=STYLES[selection[selectedRegion]];
  const selectedShape=activeHandShape(selection,shapeScope,selectedRegion);
  const shapeLocked=shapeScope==='hand'?locks.length===REGIONS.length:locks.includes(selectedRegion);
  const current=useRef(design);current.current=design;
  const pending=useRef<{code:string;resolve:()=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|null>(null);
  const commit=useCallback((sections:Selection,nextPose?:string,nextNailShape?:string,nextScalePattern?:string)=>{
    if(nextPose)setCycleRevision(v=>v+1);
    setHistory(h=>{const pattern=nextScalePattern??h.present.scalePattern??'none';const next={sections,pose:nextPose??h.present.pose,nailShape:nextNailShape??h.present.nailShape,...(pattern==='none'?{}:{scalePattern:pattern})};return designCode(h.present)===designCode(next)?h:{past:[...h.past,h.present].slice(-80),present:next,future:[]};});
  },[]);
  const setStyle=(region:RegionId,value:number)=>commit({...selection,[region]:Math.max(0,Math.min(STYLES.length-1,Math.round(value)))});
  const applyAll=(id:number)=>commit(Object.fromEntries(REGIONS.map(r=>[r.id,locks.includes(r.id)?selection[r.id]:id])) as Selection);
  const applyShape=(shapeId:string)=>{
    const next=selectHandShape(selection,shapeId,shapeScope,selectedRegion,locks);
    commit(next);setGray(false);
    if(locks.length&&shapeScope==='hand')setMessage('Shape applied. Locked sections were kept.');
  };
  const undo=()=>setHistory(h=>h.past.length?{past:h.past.slice(0,-1),present:h.past[h.past.length-1],future:[h.present,...h.future]}:h);
  const redo=()=>setHistory(h=>h.future.length?{past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)}:h);
  const roll=()=>{commit(randomize(selection,locks,crypto.getRandomValues(new Uint32Array(1))[0]));setMessage(locks.length===REGIONS.length?'Unlock a section to remix.':'A fresh mix. All yours.');};
  const onReady=useCallback((value:string)=>{
    setReadyCode(value);
    if(pending.current?.code===value){clearTimeout(pending.current.timer);pending.current.resolve();pending.current=null;}
  },[]);
  useEffect(()=>{
    let previous=current.current;
    try{const saved=localStorage.getItem('handborne-recipe-v4')??localStorage.getItem('handborne-recipe-v3')??localStorage.getItem('handborne-recipe-v2')??localStorage.getItem('handborne-recipe-v1');if(saved){previous=parseDesign(saved);setHistory({past:[],present:previous,future:[]});}}catch{}
    const query=new URLSearchParams(window.location.search),study=Number(query.get('anatomy'));
    const compare=query.get('compare');setComparison(compare==='anatomy'||compare==='soft'?compare:null);
    if(query.has('anatomy')&&[...ANATOMY_STUDIES,...SOFT_STUDIES].some(s=>s.id===study)){
      setHistory({past:[previous],present:{sections:Object.fromEntries(REGIONS.map(r=>[r.id,study])) as Selection,pose:DEFAULT_POSE,nailShape:DEFAULT_NAIL_SHAPE},future:[]});setGray(ANATOMY_STUDIES.some(s=>s.id===study));
    }
    setEmbedded(window.parent!==window);
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');setAnimate(false);
    const reduce=()=>{if(preference.matches)setAnimate(false);};preference.addEventListener('change',reduce);
    const visibility=()=>setVisible(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);
    setRestored(true);
    return()=>{preference.removeEventListener('change',reduce);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{if(!restored)return;try{localStorage.setItem('handborne-recipe-v4',JSON.stringify({version:4,...design}));setSaved(true);window.parent.postMessage({type:'handborne:changed'},window.location.origin);}catch{setSaved(false);setMessage('Device storage is full. Save a recipe to keep this hand.');}},[design,restored]);
  useEffect(()=>{const update=(event:StorageEvent)=>{if(event.key==='handborne-recipe-v4'&&event.newValue)try{const next=parseDesign(event.newValue);setHistory(h=>({...h,present:next}));}catch{}};window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);},[]);
  useEffect(()=>{
    if(!animate||!restored||!visible||dialog||busy||comparison)return;
    return schedulePoseCycle(()=>{if(!pending.current)setHistory(h=>({...h,present:{...h.present,pose:nextPoseId(h.present.pose)}}));});
  },[animate,restored,visible,dialog,busy,cycleRevision,comparison]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),5500);return()=>clearTimeout(timer);},[message]);
  useEffect(()=>{if(comparison)return;return registerHandTools(()=>current.current,async next=>{
    if(designCode(current.current)===designCode(next))return;
    if(pending.current){clearTimeout(pending.current.timer);pending.current.reject(new Error('Superseded by another recipe.'));}
    await new Promise<void>((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.current=null;reject(new Error('Hand loading timed out.'));},30000);
      pending.current={code:designCode(next),resolve,reject,timer};commit(next.sections,next.pose,next.nailShape,next.scalePattern??'none');
    });
  });},[commit,comparison]);
  async function exportFile(format:'glb'|'obj'|'png') {
    if(!viewer.current)return;setBusy(true);
    try{await viewer.current.exportFile(format);setMessage('Download ready.');}catch(error){setMessage(error instanceof Error?error.message:'Export failed.');}finally{setBusy(false);}
  }
  function saveRecipe(){
    const blob=new Blob([JSON.stringify({version:4,...design},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='handborne-recipe.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Recipe saved.');
  }
  function loadRecipe(){try{const next=parseDesign(recipeInput);commit(next.sections,next.pose,next.nailShape,next.scalePattern??'none');setDialog(null);setMessage('Your hand is back.');}catch(error){setMessage(error instanceof Error?error.message:'Invalid recipe.');}}

  if(comparison)return <AnatomyComparison variant={comparison} />;
  return <main className={'creator-shell design-studio'+(embedded?' embedded':'')}>
    <header className="topbar">
      <div className="brand-copy"><p>{embedded?'YOUR GALA AVATAR':'MOM INC. CUSTOM SHOP'}</p><h1>HELPING HAND<sup>™</sup></h1></div>
      <div className="top-actions">
        <Button variant="ghost" size="icon" aria-label="Undo" disabled={!history.past.length} onClick={undo}><Undo2 /></Button>
        <Button variant="ghost" size="icon" aria-label="Redo" disabled={!history.future.length} onClick={redo}><Redo2 /></Button>
        <Button variant="outline" onClick={roll}><Dices /><span>Remix</span></Button>
        <span className="save-indicator" role="status">{saved?'Saved on device':'Not saved yet'}</span>
      </div>
    </header>
    <section className="creator-grid">
      <section className="viewport-panel" aria-label="Live 3D hand preview">
        <div className="viewport-chrome"><Badge className="live-badge"><span className="live-dot" />{readyCode===code?'LIVE PREVIEW':'UPDATING…'}</Badge></div>
        <HandViewer ref={viewer} selection={selection} poseId={design.pose} nailShape={design.nailShape} scalePattern={design.scalePattern} animate={animate&&visible&&!dialog&&!busy} gray={gray} selectedRegion={selectedRegion} exploded={exploded} onSelectRegion={chooseRegion} onReady={onReady} />
        <div className="view-tools">
          <Button variant="outline" aria-label={animate?'Pause animation':'Play animation'} title={animate?'Pause animation':'Play animation'} size="icon" onClick={()=>setAnimate(v=>!v)}>{animate?<Pause />:<Play />}</Button>
          <Button variant="outline" aria-label="Reset camera" title="Reset camera" size="icon" onClick={()=>viewer.current?.resetView()}><Focus /></Button>
          <Button variant="outline" aria-label="View other side" title="View other side" size="icon" onClick={()=>viewer.current?.flipView()}><Rotate3D /></Button>
          <label className="explode-control">Parts<Switch aria-label="Separate hand parts" checked={exploded} onCheckedChange={setExploded} /></label>
        </div>
        <p className="orbit-hint">Drag to turn · Tap a part to edit</p>
      </section>
      <aside className="design-controls" aria-label="Hand design controls">
        <Tabs value={tab} onValueChange={value=>setTab(String(value))} className="design-tabs">
          <TabsList aria-label="Customize your hand">{[['look','Look'],['shape','Shape'],['details','Details'],['motion','Motion'],['files','Save']].map(([id,label])=><TabsTrigger key={id} value={id}>{label}</TabsTrigger>)}</TabsList>
          <div className="control-scroll">
            <TabsContent value="look">
              <div className="design-heading"><h2>Choose a look</h2><p>Style the whole hand or mix individual parts.</p></div>
              <div className="scope-switch"><Button variant="outline" aria-pressed={scope==='hand'} onClick={()=>setScope('hand')}>Whole hand</Button><Button variant="outline" aria-pressed={scope==='part'} onClick={()=>setScope('part')}>One part</Button></div>
              {scope==='part'&&<div className="part-target"><label htmlFor="part-target">Part<NativeSelect id="part-target" value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value as RegionId)}>{REGIONS.map(r=><NativeSelectOption key={r.id} value={r.id}>{r.label}</NativeSelectOption>)}</NativeSelect></label><Button variant="outline" size="icon" aria-label={(locks.includes(selectedRegion)?'Unlock ':'Lock ')+REGIONS.find(r=>r.id===selectedRegion)?.label} aria-pressed={locks.includes(selectedRegion)} onClick={()=>setLocks(list=>list.includes(selectedRegion)?list.filter(id=>id!==selectedRegion):[...list,selectedRegion])}>{locks.includes(selectedRegion)?<Lock />:<Unlock />}</Button></div>}
              <div className="style-grid" aria-label="Creature families">{STYLES.map(item=><button key={item.id} disabled={scope==='part'?locks.includes(selectedRegion):locks.length===REGIONS.length} aria-pressed={scope==='hand'?Object.values(selection).every(id=>id===item.id):style.id===item.id} className={(scope==='hand'?Object.values(selection).every(id=>id===item.id):style.id===item.id)?'is-active':''} onClick={()=>scope==='hand'?applyAll(item.id):setStyle(selectedRegion,item.id)}><img src={'/handborne/previews/family-'+String(item.id).padStart(2,'0')+'.png?v=5'} alt="" loading="lazy" /><span className="tile-label">{item.name}</span></button>)}</div>
              {!!locks.length&&<p className="control-note">{locks.length} locked {locks.length===1?'part stays':'parts stay'} when you remix or change the whole hand. <button onClick={()=>setLocks([])}>Unlock all</button></p>}
            </TabsContent>
            <TabsContent value="shape">
              <div className="design-heading"><h2>Hand shape</h2><p>Shape presets include their creature look.</p></div>
              <label className="shape-target" htmlFor="shape-target">Apply to<NativeSelect id="shape-target" value={shapeScope} onChange={e=>setShapeScope(e.target.value as ShapeScope)}><NativeSelectOption value="hand">Whole hand</NativeSelectOption><NativeSelectOption value="section">{REGIONS.find(r=>r.id===selectedRegion)?.label}</NativeSelectOption></NativeSelect></label>
              <div className="hand-shape-buttons">{HAND_SHAPES.map(shape=><Button key={shape.id} variant="outline" aria-pressed={selectedShape===shape.id} disabled={shapeLocked} onClick={()=>applyShape(shape.id)}>{shape.name}</Button>)}</div>
              <label className="gray-control">Plain gray preview<Switch checked={gray} onCheckedChange={setGray} aria-label="Show shape without textures" /></label>
            </TabsContent>
            <TabsContent value="details">
              <div className="design-heading"><h2>Nails & scales</h2><p>Change the small details of your hand.</p></div>
              <fieldset className="nail-shop"><legend>Nail shape</legend><div className="nail-shapes">{[{id:DEFAULT_NAIL_SHAPE,name:'Creature default'},...NAIL_SHAPES].map(shape=><button key={shape.id} aria-pressed={design.nailShape===shape.id} onClick={()=>commit(selection,undefined,shape.id)}>{shape.name}</button>)}</div></fieldset>
              <fieldset className="scale-shop"><legend>Raised scales</legend><div className="scale-buttons">{SCALE_PATTERNS.map(pattern=><Button key={pattern.id} variant="outline" aria-pressed={(design.scalePattern??'none')===pattern.id} onClick={()=>commit(selection,undefined,undefined,pattern.id)}><span className={'scale-icon scale-'+pattern.id} aria-hidden="true" />{pattern.name}</Button>)}</div></fieldset>
            </TabsContent>
            <TabsContent value="motion">
              <div className="design-heading"><h2>Try a gesture</h2><p>Hold a pose while you edit, or play the collection.</p></div>
              <label className="gray-control">Play gestures<Switch checked={animate} onCheckedChange={setAnimate} aria-label="Play gestures" /></label>
              <div className="pose-grid">{POSES.map(pose=><Button key={pose.id} variant="outline" aria-pressed={design.pose===pose.id} onClick={()=>{setAnimate(false);commit(selection,pose.id);}}>{pose.name}</Button>)}</div>
            </TabsContent>
            <TabsContent value="files">
              <div className="design-heading"><h2>Keep your hand</h2><p>Edits save on this device. Take a recipe to another device.</p></div>
              <div className="file-actions"><Button onClick={()=>{setRecipeInput(code);setDialog('recipe');}}><Save />Save or load recipe</Button><Button variant="outline" onClick={()=>setDialog('export')}><Download />Export hand</Button><Button variant="outline" onClick={()=>{commit({...DEFAULT_SELECTION},DEFAULT_POSE,DEFAULT_NAIL_SHAPE,'none');setLocks([]);setExploded(false);setMessage('Starter hand restored. Undo brings your design back.');}}><RotateCcw />Reset hand</Button></div>
            </TabsContent>
          </div>
        </Tabs>
      </aside>
    </section>

    <Dialog open={dialog!==null} onOpenChange={open=>{if(!open)setDialog(null);}}>
      <DialogContent className="creator-dialog">
        <DialogHeader><DialogTitle>{dialog==='export'?'Export your creature':'Save or load a recipe'}</DialogTitle>
          <DialogDescription>{dialog==='export'?'Take home this hand, just as it is. Or collect the complete creature library.':'Your recipe keeps all six parts, nail shape, scale texture and hand position. Saved on this device; older recipes still work.'}</DialogDescription></DialogHeader>
        {dialog==='export'?<div className="export-options">
          <Button disabled={busy||readyCode!==code} onClick={()=>exportFile('glb')}><Download /> Download hand · GLB</Button>
          <Button variant="outline" disabled={busy||readyCode!==code} onClick={()=>exportFile('obj')}><Download /> Download hand · OBJ + MTL</Button>
          <Button variant="outline" disabled={busy||readyCode!==code} onClick={()=>exportFile('png')}>Save preview · PNG</Button>
          <a className="library-download" href="https://mominc.online/handborne/downloads/handborne-sections.zip" download>Download all {STYLES.length*REGIONS.length} sections · OBJ + MTL</a>
          <a className="library-download" href="https://mominc.online/handborne/downloads/handborne-complete-hands.zip" download>Download all {STYLES.length} complete hands · GLB</a>
          <p className="export-note">Download hand includes your chosen scales and nails. The complete library contains the original base families. GLB includes detailed textures. GLB and OBJ bake the selected pose into the mesh; they do not include an animation skeleton. Curved section joins remain open surfaces, not a print-ready union.</p>
        </div>:<div className="recipe-editor">
          <label htmlFor="recipe-text">Recipe code or JSON</label>
          <Textarea id="recipe-text" value={recipeInput} onChange={e=>setRecipeInput(e.target.value)} rows={4} />
          <Button onClick={loadRecipe}>Load recipe</Button>
          <Button variant="outline" onClick={saveRecipe}>Download current recipe</Button>
          <Button variant="ghost" onClick={async()=>{try{await navigator.clipboard.writeText(code);setMessage('Recipe code copied.');}catch{setRecipeInput(code);setMessage('Select and copy the code from the field.');}}}>Copy current code</Button>
        </div>}
      </DialogContent>
    </Dialog>
    {message&&<div className="feedback-toast" role="status">{message}</div>}
  </main>;
}
