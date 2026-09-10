import {CreatureViewer} from './viewer';
import {LatestPreview} from './latest-preview';
import {GESTURES,type Gesture} from './motion';
import {REGIONS,LABELS,STYLES,PICKER_STYLES,EYE_LAYOUTS,PUPILS,COACHES,RECIPE_KEY,MOTION_KEY,MAX_IMPORT_BYTES,fresh,importCreature,loadRecipe,motionSettings} from './profile';
import {SITUATIONS,getCoach,type Situation} from './creator/coaching';
import type {Design,Region} from './creator/design';
export {CreatureViewer,GESTURES,importCreature};
const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
const $=(id:string)=>document.getElementById(id)!;
const SHORT:Record<Region,string>={head:'Crown',eye:'Eyes',collar:'Collar',body:'Body',arms:'Hands',feet:'Feet'};
let recipe:Design=fresh(),undo:Design[]=[],redo:Design[]=[],selected:Region='head',ready=false,activeRange:string|null=null;
let settings=motionSettings(null),initialError='';
try{recipe=loadRecipe(localStorage);settings=motionSettings(localStorage.getItem(MOTION_KEY));}catch{initialError='Your saved coach could not be read. Load a recipe in Files to restore it.';}
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
const base=document.body.dataset.modelBase?new URL(document.body.dataset.modelBase,location.href).href:new URL('../',import.meta.url).href;
let viewer:CreatureViewer|undefined;
function tell(text:string){$('creatureStatus').textContent=text;}
function coachPreview(){const coach=getCoach(recipe.coach);$('coachTone').textContent=coach.tone;$('coachLine').textContent=coach.lines[($('coachSituation') as HTMLSelectElement).value as Situation||'start'];}
function sync(){
 for(const key of ['eyeLayout','fingers','toes','eye','pupil','coach','fur','iris','pupilSize','detail']){const input=$(key) as HTMLInputElement;input.value=String(recipe[key as keyof Design]);const out=document.getElementById(key+'Value');if(out)out.textContent=Number(input.value).toFixed(2);}
 for(const b of document.querySelectorAll<HTMLButtonElement>('[data-region]')){b.setAttribute('aria-pressed',String(b.dataset.region===selected));b.querySelector('i')!.style.background=STYLES[recipe.styles[b.dataset.region as Region]].primary;}
 for(const b of document.querySelectorAll<HTMLButtonElement>('[data-style]'))b.setAttribute('aria-pressed',String(Number(b.dataset.style)===recipe.styles[selected]));
 $('partLabel').textContent=LABELS[selected];$('styleLabel').textContent=STYLES[recipe.styles[selected]].name;
 ($('undo') as HTMLButtonElement).disabled=!undo.length;($('redo') as HTMLButtonElement).disabled=!redo.length;coachPreview();
}
const queue=new LatestPreview<{recipe:Design;message:string}>(async job=>{if(!viewer)throw Error('3D is unavailable.');if(!await viewer.setRecipe(job.recipe))throw Error('Preview was interrupted.');},(job,error)=>{
 if(error){tell('Could not update the preview. '+(error instanceof Error?error.message:String(error)));return;}
 ready=true;($('exportGLB') as HTMLButtonElement).disabled=false;tell(job.message);
});
function render(message:string,persist=false){
 ready=false;($('exportGLB') as HTMLButtonElement).disabled=true;sync();
 if(persist)try{localStorage.setItem(RECIPE_KEY,JSON.stringify(recipe));window.dispatchEvent(new CustomEvent('myr5:recipe',{detail:recipe}));message='Saved on this device';}catch{message='Storage unavailable. Download your recipe in Files to keep this design.';}
 tell('Updating preview…');queue.request({recipe,message});
}
function commit(next:Design,rangeId:string|null=null){
 if(JSON.stringify(next)===JSON.stringify(recipe))return;
 if(!rangeId||activeRange!==rangeId){undo.push(recipe);undo=undo.slice(-40);}activeRange=rangeId;redo=[];recipe=next;render('Coach updated',true);
}
function options(id:string,entries:ReadonlyArray<readonly [unknown,string]>){for(const [value,label] of entries){const o=document.createElement('option');o.value=String(value);o.textContent=label;$(id).append(o);}}
options('eyeLayout',Object.entries(EYE_LAYOUTS).map(([key,value])=>[key,value.label]));options('pupil',PUPILS);options('coach',COACHES.map(c=>[c.id,c.name]));options('coachSituation',SITUATIONS);
for(const [id,min,max] of [['fingers',2,6],['toes',1,6]] as const)options(id,Array.from({length:max-min+1},(_,i)=>[i+min,String(i+min)]));
$('coachSituation').addEventListener('change',coachPreview);
function focusPart(region:Region){selected=region;sync();viewer?.focusRegion(region);}
for(const region of REGIONS){const b=document.createElement('button'),dot=document.createElement('i');dot.setAttribute('aria-hidden','true');b.append(dot,SHORT[region]);b.title=LABELS[region];b.dataset.region=region;b.onclick=()=>focusPart(region);$('parts').append(b);}
for(const [id,region] of Object.entries({eyeLayout:'eye',eye:'eye',pupil:'eye',iris:'eye',pupilSize:'eye',fingers:'arms',toes:'feet',fur:'collar',detail:'body'}))$(id).addEventListener('focus',()=>focusPart(region as Region));
PICKER_STYLES.forEach(style=>{const index=style.id;const b=document.createElement('button');b.dataset.style=String(index);const img=document.createElement('img');img.src=new URL(`./styles/${String(index).padStart(2,'0')}.png`,location.href).href;img.alt='';img.loading='lazy';const label=document.createElement('span');label.textContent=style.name;b.append(img,label);b.onclick=()=>{focusPart(selected);commit({...recipe,styles:{...recipe.styles,[selected]:index}});};$('styles').append(b);});
Object.entries(GESTURES).forEach(([id,gesture])=>{const b=document.createElement('button');b.textContent=gesture.label;b.dataset.gesture=id;b.setAttribute('aria-pressed',String(id==='idle'));b.onclick=()=>{viewer?.play(id as Gesture);$('motionLabel').textContent=gesture.label;};$('gestures').append(b);});
for(const id of ['eyeLayout','fingers','toes','eye','pupil','coach'])$(id).addEventListener('change',()=>{const input=$(id) as HTMLInputElement;commit({...recipe,[id]:['fingers','toes'].includes(id)?Number(input.value):input.value});});
for(const id of ['fur','iris','pupilSize','detail']){
 const input=$(id) as HTMLInputElement;
 input.addEventListener('input',()=>commit({...recipe,[id]:Number(input.value)},id));
 for(const event of ['change','blur','pointercancel'])input.addEventListener(event,()=>{activeRange=null;});
}
const tabs=[...document.querySelectorAll<HTMLButtonElement>('[data-menu]')];
function openMenu(tab:HTMLButtonElement){activeRange=null;for(const b of tabs){const active=b===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$(b.getAttribute('aria-controls')!).hidden=!active;}if(tab.dataset.menu==='face')focusPart('eye');else if(tab.dataset.menu==='body')focusPart('body');else if(tab.dataset.menu==='materials')focusPart(selected);(document.querySelector('.console-scroll') as HTMLElement).scrollTop=0;}
tabs.forEach((b,index)=>{b.onclick=()=>openMenu(b);b.onkeydown=event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();openMenu(tabs[next]);tabs[next].focus();};});
$('applyAll').onclick=()=>commit({...recipe,styles:Object.fromEntries(REGIONS.map(r=>[r,recipe.styles[selected]])) as Design['styles']});
$('undo').onclick=()=>{if(!undo.length)return;activeRange=null;redo.push(recipe);recipe=undo.pop()!;render('Undo applied',true);};
$('redo').onclick=()=>{if(!redo.length)return;activeRange=null;undo.push(recipe);recipe=redo.pop()!;render('Redo applied',true);};
$('original').onclick=()=>commit(fresh());
$('importFile').addEventListener('change',async event=>{const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>MAX_IMPORT_BYTES)throw Error('Choose a MYR5 recipe smaller than 64 KB.');commit(importCreature(await file.text()));}catch(error){tell((error as Error).message);}finally{input.value='';}});
$('exportRecipe').onclick=()=>download(new Blob([JSON.stringify(recipe,null,2)],{type:'application/json'}),'myr5-recipe.json');
$('exportGLB').onclick=async()=>{if(!ready||!viewer)return;try{tell('Preparing your animated model…');download(await viewer.exportGLB(),'myr5-animated.glb');tell('Animated model downloaded');}catch(error){tell((error as Error).message);}};
$('front').onclick=()=>viewer?.resetView();
$('back').onclick=()=>{if(!viewer)return;viewer.resetView();viewer.camera.position.set(0,2.65,-8.9);viewer.orbit.update();};
$('pauseMotion').onclick=()=>{if(!viewer)return;viewer.setPaused(!viewer.paused);$('pauseMotion').textContent=viewer.paused?'Play motion':'Pause motion';$('pauseMotion').setAttribute('aria-pressed',String(viewer.paused));};
function applyMotion(){viewer?.setSettings({...settings,reduced:settings.reduced||systemMotion.matches});}
($('amount') as HTMLInputElement).value=String(settings.amount);$('amountValue').textContent=settings.amount.toFixed(2);($('ambient') as HTMLInputElement).checked=settings.ambient;($('reduced') as HTMLInputElement).checked=settings.reduced;
function changeMotion(){settings={amount:Number(($('amount') as HTMLInputElement).value),ambient:($('ambient') as HTMLInputElement).checked,reduced:($('reduced') as HTMLInputElement).checked};$('amountValue').textContent=settings.amount.toFixed(2);applyMotion();try{localStorage.setItem(MOTION_KEY,JSON.stringify(settings));}catch{tell('Motion changed for this visit. Storage is unavailable.');}}
$('amount').addEventListener('input',changeMotion);for(const id of ['ambient','reduced'])$(id).addEventListener('change',changeMotion);
systemMotion.addEventListener('change',applyMotion);
window.addEventListener('storage',event=>{if(event.key===RECIPE_KEY&&event.newValue){try{recipe=importCreature(event.newValue);undo=[];redo=[];activeRange=null;render('Coach updated from another app tab');}catch{tell('An invalid coach update was ignored.');}}});
const motionIndicator=setInterval(()=>{const current=viewer?.motion?.current;if(!current)return;$('motionLabel').textContent=GESTURES[current].label;document.querySelectorAll<HTMLButtonElement>('[data-gesture]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gesture===current)));},250);
window.addEventListener('pagehide',()=>{clearInterval(motionIndicator);queue.dispose();viewer?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
try{viewer=new CreatureViewer($('creatureStage'),base);applyMotion();viewer.focusRegion(selected);render(initialError||'Your coach is ready');(window as any).myr5Companion={get recipe(){return recipe;},get viewer(){return viewer;},get ready(){return ready;},importRecipe:(raw:string)=>commit(importCreature(raw))};}
catch(error){tell('3D could not start. '+(error as Error).message);}
