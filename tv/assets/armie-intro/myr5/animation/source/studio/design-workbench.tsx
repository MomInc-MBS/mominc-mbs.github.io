'use client';
import {useEffect,useRef,useState} from 'react';
import {Undo2,Redo2,Lock,Unlock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {AlienViewer,type ViewerHandle} from './alien-viewer';
import {CoachingPanel} from './coaching-panel';
import {EYE_LAYOUTS,type EyeLayout} from './eye-layouts';
import {PUPILS,type PupilShape} from './pupils';
import {fresh,parseRecipe,STYLES,REGIONS,LABELS,type Region,type Design} from './design';
type History={past:Design[];now:Design;future:Design[]};
const SHORT:Record<Region,string>={head:'Crown',eye:'Eyes',collar:'Collar',body:'Body',arms:'Hands',feet:'Feet'};
export default function Home(){
 const [h,setH]=useState<History>({past:[],now:fresh(),future:[]});
 const [selected,setSelected]=useState<Region>('head'),[locks,setLocks]=useState<Region[]>([]);
 const [tab,setTab]=useState('materials'),[holo,setHolo]=useState(false),[parts,setParts]=useState(false),[playing,setPlaying]=useState(false),[ready,setReady]=useState(false),[restored,setRestored]=useState(false),[message,setMessage]=useState('Loading your coach…'),[busy,setBusy]=useState(false);
 const viewer=useRef<ViewerHandle>(null),upload=useRef<HTMLInputElement>(null),dragStart=useRef<Design|null>(null);
 const design=h.now,style=STYLES[design.styles[selected]];
 const commit=(next:Design)=>{dragStart.current=null;setH(old=>JSON.stringify(next)===JSON.stringify(old.now)?old:{past:[...old.past,old.now].slice(-60),now:next,future:[]});};
 // A continuous slider gesture is one undo step, including keyboard changes.
 const slide=(next:Design)=>{const first=!dragStart.current;if(first)dragStart.current=design;setH(old=>JSON.stringify(next)===JSON.stringify(old.now)?old:{past:first?[...old.past,old.now].slice(-60):old.past,now:next,future:[]});};
 const finishSlide=()=>{dragStart.current=null;};
 useEffect(()=>{try{const saved=localStorage.getItem('myr5-recipe-v1');if(saved)setH({past:[],now:parseRecipe(saved),future:[]});}catch{setMessage('Saved design could not be read. You can load a recipe in Files.');}setRestored(true);},[]);
 useEffect(()=>{if(restored)try{localStorage.setItem('myr5-recipe-v1',JSON.stringify(design));setMessage('Saved on this device');}catch{setMessage('Storage unavailable. Download a recipe in Files to keep your design.');}},[design,restored]);
 const pick=(id:number)=>commit({...design,styles:{...design.styles,[selected]:(id+20)%20}});
 const apply=()=>commit({...design,styles:Object.fromEntries(REGIONS.map(r=>[r,locks.includes(r)?design.styles[r]:design.styles[selected]])) as Design['styles']});
 const remix=()=>{if(locks.length===REGIONS.length){setMessage('Unlock a part to remix.');return;}const nums=crypto.getRandomValues(new Uint32Array(6));commit({...design,styles:Object.fromEntries(REGIONS.map((r,i)=>[r,locks.includes(r)?design.styles[r]:nums[i]%20])) as Design['styles']});};
 const save=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(design,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='myr5-recipe.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
 async function exportFile(format:'glb'|'obj'|'png'){if(!ready||busy)return;setBusy(true);try{await viewer.current?.exportFile(format);setMessage('Download ready');}catch(e){setMessage(e instanceof Error?e.message:'Export failed.');}finally{setBusy(false);}}
 function range(key:'fur'|'iris'|'pupilSize'|'detail'|'fingers'|'toes',label:string,min:number,max:number,step=.05){return <label className="range-field" key={key} htmlFor={key}>{label}<output>{step===1?design[key]:design[key].toFixed(2)}</output><input id={key} type="range" min={min} max={max} step={step} value={design[key]} onChange={e=>slide({...design,[key]:+e.target.value})} onPointerUp={finishSlide} onPointerCancel={finishSlide} onKeyUp={finishSlide} onBlur={finishSlide}/></label>;}
 function chooseTab(value:unknown){finishSlide();setTab(String(value));if(value==='face')setSelected('eye');}
 return <main className="editor-shell">
  <header className="editor-header"><a className="editor-brand" href="/tv/?ch=armie" target="_top" aria-label="Return to Coach Armie">MOM<span>INC.</span></a><div className="editor-title"><small>MYR5 / CUSTOM SHOP</small><h1>Design your coach</h1></div><div className="header-actions"><Button aria-label="Undo" disabled={!h.past.length} onClick={()=>{finishSlide();setH(o=>({past:o.past.slice(0,-1),now:o.past.at(-1)!,future:[o.now,...o.future]}));}}><Undo2/></Button><Button aria-label="Redo" disabled={!h.future.length} onClick={()=>{finishSlide();setH(o=>({past:[...o.past,o.now],now:o.future[0],future:o.future.slice(1)}));}}><Redo2/></Button><a className="button return-link" href="/animation/index.html">Animate ↗</a></div></header>
  <div className="editor-workspace">
   <section className="preview-bay" aria-label="Live coach preview">
    <div className="preview-readout"><span className="live-light">LIVE PREVIEW</span><span>{SHORT[selected]} / {style.name}</span></div>
    <div className="preview-stage"><AlienViewer ref={viewer} design={design} selected={selected} hologram={holo} parts={parts} playing={playing} onPick={r=>{setSelected(r);setTab('materials');}} onReady={()=>setReady(true)}/></div>
    <div className="preview-toolbar"><div className="view-buttons"><Button onClick={()=>{setPlaying(false);viewer.current?.front();}}>Front</Button><Button onClick={()=>{setPlaying(false);viewer.current?.back();}}>Back</Button><Button aria-pressed={playing} onClick={()=>setPlaying(p=>!p)}>Rotate</Button><Button aria-pressed={parts} onClick={()=>setParts(p=>!p)}>Parts</Button><Button aria-pressed={holo} onClick={()=>setHolo(p=>!p)}>Hologram</Button></div><span className="preview-hint">Drag to turn · pinch to zoom · tap a part</span></div>
   </section>
   <section className="design-console" aria-label="Coach design controls">
    <Tabs value={tab} onValueChange={chooseTab} className="console-tabs"><TabsList className="menu-tabs" aria-label="Customizer menus">{[['materials','Materials'],['face','Face'],['body','Body'],['coach','Coach'],['files','Files']].map(([id,label])=><TabsTrigger key={id} value={id}>{label}</TabsTrigger>)}</TabsList>
     <div className="console-scroll">
      <TabsContent value="materials"><div className="part-rail" aria-label="Creature parts">{REGIONS.map(r=><button key={r} aria-pressed={selected===r} onClick={()=>setSelected(r)}><i style={{background:STYLES[design.styles[r]].primary}}/>{SHORT[r]}{locks.includes(r)&&<Lock aria-label="Locked" size={12}/>}</button>)}</div>
       <div className="panel-heading"><div><small>{LABELS[selected]}</small><h2>{style.name}</h2></div><Button className="lock-part" aria-label={(locks.includes(selected)?'Unlock ':'Lock ')+LABELS[selected]} aria-pressed={locks.includes(selected)} onClick={()=>setLocks(x=>x.includes(selected)?x.filter(v=>v!==selected):[...x,selected])}>{locks.includes(selected)?<Lock/>:<Unlock/>}</Button></div>
       <div className="material-grid" aria-label="Surface styles">{STYLES.map((s,i)=><button key={s.name} aria-pressed={design.styles[selected]===i} onClick={()=>pick(i)}><img src={`/styles/${String(i).padStart(2,'0')}.png`} alt="" loading="lazy"/><span>{s.name}</span></button>)}</div>
       <div className="panel-actions"><Button onClick={apply}>Apply to unlocked parts</Button><Button onClick={remix}>Remix</Button></div><p className="help">Lock a part to keep its material when you remix.</p>
      </TabsContent>
      <TabsContent value="face"><div className="panel-heading"><div><small>SHAPE & EXPRESSION</small><h2>Face</h2></div></div><div className="field-grid"><label>Eye arrangement<select id="eye-layout" value={design.eyeLayout} onChange={e=>commit({...design,eyeLayout:e.target.value as EyeLayout})}>{Object.entries(EYE_LAYOUTS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label><label>Expression<select value={design.eye} onChange={e=>commit({...design,eye:e.target.value as Design['eye']})}><option value="open">Curious</option><option value="sleepy">Unimpressed</option><option value="wide">Wide awake</option></select></label><label>Pupil shape<select value={design.pupil} onChange={e=>commit({...design,pupil:e.target.value as PupilShape})}>{PUPILS.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div><div className="range-stack">{range('iris','Iris size',.7,1.25)}{range('pupilSize','Pupil size',.6,1.15)}</div><p className="help">Use Back or drag the coach to inspect eyes behind the head.</p></TabsContent>
      <TabsContent value="body"><div className="panel-heading"><div><small>FORM & TEXTURE</small><h2>Body</h2></div></div><div className="range-stack">{range('fingers','Digits per hand',2,6,1)}{range('toes','Toes per foot',1,6,1)}{range('fur','Collar fluff',.65,1.4)}{range('detail','Surface detail',.5,1.5)}</div><p className="help">Digits include the thumb. Materials are changed one part at a time in Materials.</p></TabsContent>
      <TabsContent value="coach"><div className="panel-heading"><div><small>PERSONALITY</small><h2>How your coach responds</h2></div></div><CoachingPanel value={design.coach} onChange={coach=>commit({...design,coach})}/></TabsContent>
      <TabsContent value="files"><div className="panel-heading"><div><small>SAVE & TRANSFER</small><h2>Your designs</h2></div></div><div className="file-actions"><Button className="primary" onClick={save}>Download editable recipe</Button><Button onClick={()=>upload.current?.click()}>Load recipe</Button><Button disabled={busy||!ready} onClick={()=>exportFile('png')}>Save preview image</Button><Button disabled={busy||!ready} onClick={()=>exportFile('glb')}>Download 3D model · GLB</Button><Button disabled={busy||!ready} onClick={()=>exportFile('obj')}>Download geometry · OBJ</Button><Button onClick={()=>commit(fresh())}>Restore original coach</Button></div><p className="help">Recipes stay editable. GLB keeps materials; OBJ saves geometry. Undo can restore your previous design.</p></TabsContent>
     </div>
    </Tabs>
    <div className="console-status" role="status">{message}</div>
   </section>
  </div>
  <input hidden ref={upload} type="file" accept=".json,application/json" onChange={async e=>{const input=e.target,file=input.files?.[0];if(!file)return;try{if(file.size>20000)throw Error('Choose a MYR5 recipe smaller than 20 KB.');commit(parseRecipe(await file.text()));}catch(err){setMessage(err instanceof Error?err.message:'Invalid recipe.');}input.value='';}}/>
 </main>;
}
