import '../fuel-gate.js';
import {defaultLabel,cleanLabel,cleanDraft,batchSignature,paintLabel,TEMPLATES,SHAPES,PATTERNS,FONTS,ICONS} from './fuel-label.mjs';
const THREE_URL='/tv/assets/armie-intro/vendor/three.module.js',DRAFT_KEY='mbs-fuel-studio-v1';
const COLORS=[0xffea00,0x45dfff,0xc8ff00,0xff2e88,0x9870e7,0xffae4a];
const FLAV_COL=[0xc8ff00,0x45dfff,0xffea00,0xff2e88,0xff5a1e,0xa8d400,0x7a2fc4,0xff5fa3];
let gl=null,session=null;const exportURLs=new Set();
function disposeScene(g){
  if(!g)return;const geometries=new Set(),materials=new Set(),textures=new Set();
  g.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m);});
  materials.forEach(m=>{for(const k of['map','alphaMap','normalMap','roughnessMap','emissiveMap'])if(m[k])textures.add(m[k]);m.dispose();});
  textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());g.renderer.dispose();g.renderer.forceContextLoss();
}
export default {
mount(root,ctx){
  const mine=session={},fu=root.matches('#fu')?root:root.querySelector('#fu');if(!fu)return;
  const byId=id=>fu.querySelector('#'+id),on=(id,event,handler)=>{const el=byId(id);if(el)ctx.on(el,event,handler);};
  const rows=[...fu.querySelectorAll('.srow[data-supp]')],flavours=[...fu.querySelectorAll('.flv')];
  const keys=rows.map(r=>r.dataset.supp),flavorNames=flavours.map(f=>f.dataset.flavour),names=['nameA','nameB','nameC'].map(byId);
  const status=byId('batchStatus'),draftStatus=byId('draftStatus'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scoops=[],flavour=null,mixTurns=0,phase='fill',label=defaultLabel(),busy=false,mixing=false,review=false,reviewTab='summary',labelTab='shape',labelPage=0,flavorPage=0;
  let sealed=null,artImage=null,artToken=0,uploadToken=0,artLoading=false,textureDirty=true,sceneUpdate=null,dispense=null,angleTarget=0,lastPhase='fill';
  const designHistory=[],name=()=>label.title.trim()||names.map(n=>n.value).join(' '),identity=()=>batchSignature(scoops,flavour,names.map(n=>n.value),label);
  const complete=()=>scoops.length===8&&!!flavour&&mixTurns===3;
  const data=()=>({version:1,scoops:[...scoops],flavour,mixTurns,phase,label:cleanLabel(label),words:names.map(n=>n.value),sealedIdentity:sealed});
  let restored=null;try{restored=cleanDraft(JSON.parse(localStorage.getItem(DRAFT_KEY)),keys,flavorNames);}catch{/* optional storage */}
  if(restored){({scoops,flavour,mixTurns,phase,label}=restored);names.forEach((n,i)=>{if([...n.options].some(o=>o.value===restored.words[i]))n.value=restored.words[i];});sealed=restored.sealedIdentity;if(phase==='done'&&!sealed)sealed=identity();}
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(data()));if(draftStatus)draftStatus.textContent='Draft saved on this device.';}catch{if(draftStatus)draftStatus.textContent='Storage unavailable. Download your design to keep it.';}}
  function syncRows(){rows.forEach(r=>{const n=scoops.filter(k=>k===r.dataset.supp).length;r.dataset.level=n===2?'strong':n===1?'weak':'none';r.querySelectorAll('.lvl').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.level===r.dataset.level)));});flavours.forEach(f=>{const yes=f.dataset.flavour===flavour;f.classList.toggle('sel',yes);f.setAttribute('aria-checked',String(yes));});}
  function invalidateMix(){mixTurns=0;byId('result').hidden=true;}
  function loadArt(){
    if(!label.artData){artToken++;artImage=null;artLoading=false;textureDirty=true;return;}if(artImage?.src===label.artData)return;
    artImage=null;artLoading=true;textureDirty=true;
    const token=++artToken,img=new Image();img.onload=()=>{if(session!==mine||token!==artToken)return;artImage=img;artLoading=false;textureDirty=true;render(false);};img.onerror=()=>{if(session===mine&&token===artToken){artImage=null;artLoading=false;textureDirty=true;status.textContent='Artwork could not be opened. Choose another image.';render(false);}};img.src=label.artData;
  }
  function editDesign(fn){if(phase!=='label'||busy)return;designHistory.push(cleanLabel(label));if(designHistory.length>30)designHistory.shift();fn();label=cleanLabel(label);textureDirty=true;syncLabelControls();loadArt();render();}
  const labelCanvas=document.createElement('canvas');labelCanvas.width=768;labelCanvas.height=400;
  function updateLabel(){if(!textureDirty)return;paintLabel(labelCanvas,label,name(),artImage);const p=byId('fuelLabelPreview');if(p){p.width=768;p.height=400;p.getContext('2d')?.drawImage(labelCanvas,0,0);}textureDirty=false;if(gl?.labelTexture)gl.labelTexture.needsUpdate=true;}
  // Original frozen cost assumptions. Game scoops are not a supplement recipe.
  const ASSUMPTIONS={version:'fuel-cost-1.0',snapshot:'2026-09-07',currency:'USD',basis:"Estimated bulk supplement-grade pricing, carried forward unchanged from this channel's first build. Frozen figures, not a live quote, and not sourced from a named supplier.",excluded:['labour, blending and filling','shipping, freight and duties','tooling, minimum order quantities and wastage','testing, certification and insurance','payment fees, returns and marketing'],ingredients:{caffeine:{kg:12,weak:.10,strong:.30},theanine:{kg:45,weak:.10,strong:.20},glutamine:{kg:9,weak:2.5,strong:5},citrulline:{kg:18,weak:3,strong:6},creatine:{kg:6,weak:3,strong:5},electrolytes:{kg:5,weak:.5,strong:1.5}},flavour:{kg:30,dose:.6},packaging:.85,servingsPerContainer:30,retailPrice:54.99};
  const levelLabel=r=>r.dataset.level==='strong'?'2 GAME SCOOPS':r.dataset.level==='weak'?'1 GAME SCOOP':'NONE';
  const scoopCost=()=>rows.reduce((sum,r)=>{const c=ASSUMPTIONS.ingredients[r.dataset.supp];return sum+(c&&r.dataset.level!=='none'?c[r.dataset.level]/1000*c.kg:0);},0)+(flavour?.length?ASSUMPTIONS.flavour.dose/1000*ASSUMPTIONS.flavour.kg:0);
  const containerCost=()=>scoopCost()*30+.85;
  const lines=()=>[...rows.map(r=>`${r.querySelector('.name').textContent}: ${levelLabel(r)}`),`Flavour: ${flavour||'not set'}`,`Name: ${name()}`,`Cost per scoop (est.): $${scoopCost().toFixed(4)}`,`Cost per container (est., 30 servings): $${containerCost().toFixed(2)}`];
  function renderSummary(){
    const can=byId('canLabel');can.replaceChildren();for(const text of[...rows.map(r=>`${r.querySelector('.name').textContent}: ${levelLabel(r)}`),`FLAVOUR: ${flavour||'NOT SET'}`,`NAME: ${name()}`]){const s=document.createElement('span');s.textContent=text;can.append(s);}can.classList.toggle('full',complete());
    byId('costBar').textContent=`COST/SCOOP (est.): $${scoopCost().toFixed(4)} · COST/CONTAINER (est., 30 sv): $${containerCost().toFixed(2)} · MBS FUEL RETAIL: $54.99`;
    const body=[`My ${name()} stack:`,...lines(),`Label: ${label.shape}, ${label.pattern}, ${label.font}; ${label.primary} / ${label.secondary}`,label.artData?'Personal artwork is on my device. I can attach my downloaded design separately.':'','Nothing was sent by the site. I am sending this myself. This drink is untested and does not exist yet.'].filter(Boolean).join('\n');
    byId('mailLink').href=`mailto:${ctx.mbs?.MAIL||''}?subject=${encodeURIComponent('My '+name()+' stack')}&body=${encodeURIComponent(body)}`;
  }
  function renderAssumptions(){const body=byId('assumpBody');body.replaceChildren();const text=rows.map(r=>{const c=ASSUMPTIONS.ingredients[r.dataset.supp];return `${r.querySelector('.name').textContent}: $${c.kg.toFixed(2)}/kg · WEAK ${c.weak} g/scoop · STRONG ${c.strong} g/scoop`;});text.push('FLAVOUR: $30.00/kg · 0.6 g/scoop','PACKAGING: $0.85 PER CONTAINER · 30 SCOOPS PER CONTAINER','SCOOP = SUM OF (g/scoop ÷ 1000 × $/kg), SET LEVELS ONLY. CONTAINER = SCOOP × 30 + PACKAGING.','MBS FUEL RETAIL: $54.99 USD',`RECORD ${ASSUMPTIONS.version}, SNAPSHOT ${ASSUMPTIONS.snapshot}. ${ASSUMPTIONS.basis}`,`NOT COUNTED: ${ASSUMPTIONS.excluded.join('; ')}. A real container costs more than the figure above.`);for(const line of text){const s=document.createElement('span');s.textContent=line;body.append(s);}}
  const ingredientPanel=byId('batchIngredients'),flavorPanel=byId('batchFlavors');ingredientPanel.replaceChildren();flavorPanel.replaceChildren();
  rows.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.dataset.index=i;b.style.setProperty('--ingredient-color','#'+COLORS[i].toString(16).padStart(6,'0'));ctx.on(b,'click',()=>addScoop(i));ingredientPanel.append(b);});
  flavours.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.textContent=f.dataset.flavour;ctx.on(b,'click',()=>chooseFlavor(i));flavorPanel.append(b);});
  function animateAddition(color,done,ingredient=false){busy=true;render(false);if(dispense&&!reduced)dispense(color,done,ingredient);else{done();busy=false;render();}}
  function addScoop(i){const key=keys[i];if(phase!=='fill'||busy||scoops.length>=8||scoops.filter(k=>k===key).length>=2)return;const info=byId('ingredientInfo');if(info)info.textContent=rows[i].querySelector('.real')?.textContent||'';animateAddition(COLORS[i],()=>{scoops.push(key);invalidateMix();status.textContent=`${rows[i].querySelector('.name').textContent} added. ${scoops.length} of 8 scoops.`;},true);}
  function chooseFlavor(i){if(phase!=='flavor'||busy||mixing)return;if(flavour===flavorNames[i]){status.textContent='Flavor selected. Press Mix to blend.';return;}animateAddition(FLAV_COL[i],()=>{flavour=flavorNames[i];invalidateMix();status.textContent=flavour+' injected. Mix your batch.';});}
  const labelFields={labelShape:'shape',labelTitle:'title',labelSubtitle:'subtitle',labelFont:'font',labelPattern:'pattern',labelIcon:'icon',labelPrimary:'primary',labelSecondary:'secondary',labelInk:'ink',labelArtScale:'artScale',labelArtX:'artX',labelArtY:'artY'};
  const lockFields={labelLockName:'name',labelLockColors:'colors',labelLockArt:'art',labelLockShape:'shape'};
  function syncLabelControls(){for(const[id,k]of Object.entries({labelTemplate:'template',...labelFields})){const el=byId(id);if(el)el.value=label[k];}for(const[id,k]of Object.entries(lockFields)){const el=byId(id);if(el)el.checked=label.locks[k];}}
  function populate(id,values){const el=byId(id);if(!el)return;el.replaceChildren();for(const v of values){const o=document.createElement('option');o.value=v;o.textContent=v.toUpperCase();el.append(o);}}
  populate('labelTemplate',Object.keys(TEMPLATES));populate('labelShape',SHAPES);populate('labelPattern',PATTERNS);populate('labelFont',FONTS);populate('labelIcon',ICONS);
  for(const[id,k]of Object.entries(labelFields))on(id,'input',e=>editDesign(()=>{label[k]=['artScale','artX','artY'].includes(k)?Number(e.target.value):e.target.value;}));
  on('labelTemplate','change',e=>editDesign(()=>{label={...label,template:e.target.value,...TEMPLATES[e.target.value]};}));
  for(const[id,k]of Object.entries(lockFields))on(id,'change',e=>{label.locks[k]=e.target.checked;saveDraft();});
  const tabs=[...fu.querySelectorAll('[data-label-tab]')];tabs.forEach((b,i)=>{ctx.on(b,'click',()=>{labelTab=b.dataset.labelTab;labelPage=0;render(false);});ctx.on(b,'keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;labelTab=tabs[n].dataset.labelTab;labelPage=0;render(false);tabs[n].focus();});});
  on('labelPagePrev','click',()=>{labelPage=Math.max(0,labelPage-1);render(false);});
  on('labelPageNext','click',()=>{labelPage++;render(false);});
  names.forEach(n=>ctx.on(n,'change',()=>{if(phase!=='label')return;textureDirty=true;render();}));
  on('labelUndo','click',()=>{if(phase!=='label'||!designHistory.length)return;label=designHistory.pop();textureDirty=true;syncLabelControls();loadArt();render();});
  on('labelRemix','click',()=>editDesign(()=>{const ts=Object.keys(TEMPLATES),t=ts[Math.floor(Math.random()*ts.length)],s=TEMPLATES[t];label.template=t;if(!label.locks.colors)for(const k of['primary','secondary','ink','pattern','font'])label[k]=s[k];if(!label.locks.shape)label.shape=SHAPES[Math.floor(Math.random()*SHAPES.length)];if(!label.locks.art&&!label.artData)label.icon=ICONS[Math.floor(Math.random()*(ICONS.length-1))];if(!label.locks.name)label.subtitle=['MY OWN KIND OF ENERGY','BUILT DIFFERENT','SMALL BATCH. BIG MOOD.','MADE BY ME'][Math.floor(Math.random()*4)];}));
  on('labelArtRemove','click',()=>editDesign(()=>{label.artData='';label.artScale=1;label.artX=label.artY=0;}));
  on('labelUpload','change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file||phase!=='label')return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024){status.textContent='Choose a PNG, JPEG or WebP under 12 MB.';return;}
    const token=++uploadToken;busy=true;render(false);const url=URL.createObjectURL(file);
    try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});if(session!==mine||token!==uploadToken)return;if(img.width*img.height>40000000)throw Error('Choose a smaller image.');
      const c=document.createElement('canvas'),factor=Math.min(1,640/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*factor));c.height=Math.max(1,Math.round(img.height*factor));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      let encoded=c.toDataURL('image/webp',.82);if(encoded.length>350000)encoded=c.toDataURL('image/jpeg',.65);if(encoded.length>350000)throw Error('This artwork has too much detail. Choose a smaller image.');
      busy=false;editDesign(()=>{label.artData=encoded;label.artScale=1;label.artX=label.artY=0;});status.textContent='Artwork added. Adjust its size and crop.';
    }catch(error){if(session===mine){busy=false;status.textContent=error.message||'That image could not be opened.';render(false);}}finally{URL.revokeObjectURL(url);}
  });
  function download(filename,type,content){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');exportURLs.add(url);a.href=url;a.download=filename;a.click();ctx.timeout(()=>{URL.revokeObjectURL(url);exportURLs.delete(url);},1000);}
  on('labelExport','click',()=>download('my-mbs-fuel-design.json','application/json',JSON.stringify(data(),null,2)));
  on('labelPng','click',()=>{if(artLoading)return;updateLabel();labelCanvas.toBlob(blob=>{if(!blob||session!==mine)return;const url=URL.createObjectURL(blob),a=document.createElement('a');exportURLs.add(url);a.href=url;a.download='my-mbs-fuel-label.png';a.click();ctx.timeout(()=>{URL.revokeObjectURL(url);exportURLs.delete(url);},1000);});});
  on('labelImport','change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file||file.size>500000||busy)return;const token=++uploadToken;busy=true;render(false);try{const d=cleanDraft(JSON.parse(await file.text()),keys,flavorNames);if(!d)throw Error();if(session!==mine||token!==uploadToken)return;({scoops,flavour,mixTurns,label}=d);phase=d.phase==='done'?'label':d.phase;names.forEach((n,i)=>{if([...n.options].some(o=>o.value===d.words[i]))n.value=d.words[i];});designHistory.length=0;byId('result').hidden=true;textureDirty=true;syncLabelControls();loadArt();review=false;status.textContent='Your design is ready.';}catch{if(session===mine)status.textContent='Choose a valid Fuel design JSON file.';}finally{if(session===mine&&token===uploadToken){busy=false;render();}}});
  on('batchUndo','click',()=>{if(phase!=='fill'||busy||!scoops.length)return;scoops.pop();invalidateMix();status.textContent='Last scoop removed.';render();});
  on('batchNext','click',()=>{if(busy||mixing)return;if(phase==='fill'&&scoops.length===8){phase='flavor';status.textContent='Choose a flavor, then mix three times.';render();}else if(phase==='flavor'&&flavour){if(mixTurns===3){phase='label';render();return;}mixing=true;render(false);ctx.timeout(()=>{if(session!==mine)return;mixTurns++;mixing=false;if(mixTurns===3){phase='label';angleTarget=0;status.textContent='Blend ready. Make your label personal.';}else status.textContent=`${mixTurns} of 3 mixes complete.`;render();},reduced?0:600);}});
  on('batchBack','click',()=>{if(busy||mixing)return;if(phase==='done'){phase='label';review=false;status.textContent='Edit your design. Seal again to save a changed batch.';}else if(review){review=false;render(false);return;}else if(phase==='label'){phase='flavor';status.textContent='Change flavor if you like. Your artwork stays saved.';}else if(phase==='flavor'){phase='fill';status.textContent='Undo a scoop to change ingredients. Your artwork stays saved.';}render();});
  on('batchReview','click',()=>{if(phase==='done'){phase='label';review=false;render();}else{review=!review;render(false);}});
  const reviewTabs=['summary','cost','notes','save'];
  fu.querySelectorAll('[data-review-tab]').forEach(b=>ctx.on(b,'click',()=>{reviewTab=b.dataset.reviewTab;render(false);}));
  on('reviewPagePrev','click',()=>{reviewTab=reviewTabs[Math.max(0,reviewTabs.indexOf(reviewTab)-1)];render(false);});
  on('reviewPageNext','click',()=>{reviewTab=reviewTabs[Math.min(reviewTabs.length-1,reviewTabs.indexOf(reviewTab)+1)];render(false);});
  on('batchReset','click',()=>{if(busy||mixing)return;scoops=[];flavour=null;mixTurns=0;phase='fill';sealed=null;review=false;reviewTab='summary';labelTab='shape';labelPage=0;flavorPage=0;label=defaultLabel();artImage=null;artLoading=false;artToken++;uploadToken++;designHistory.length=0;names.forEach(n=>n.selectedIndex=0);textureDirty=true;byId('result').hidden=true;syncLabelControls();status.textContent='Fresh jar. Choose your first ingredient.';render();});
  on('flavorPrev','click',()=>{flavorPage=Math.max(0,flavorPage-1);render(false);});on('flavorNext','click',()=>{flavorPage=Math.min(Math.ceil(flavours.length/4)-1,flavorPage+1);render(false);});
  on('submitBtn','click',()=>{if(phase!=='label'||busy||artLoading||!complete())return;const fp=identity();if(sealed===fp)return;sealed=fp;phase='done';review=true;saveDraft();
    const payload={stack:lines(),name:name(),design:cleanLabel(label),scoops:[...scoops],signature:fp};
    ctx.mbs?.form?.('fuel',payload);
    // Fuel is optional, but its finished design still belongs in the local Files collection.
    if(!window.MBS_CHANNELS?.forms?.includes('fuel'))ctx.state?.saveForm?.('fuel',payload);
    ctx.mbs?.complete?.('fuel',{terminal:'seal'});ctx.mbs?.unlock?.('fuel');ctx.mbs?.wave?.();
    reviewTab='save';byId('result').hidden=false;
    const savedHere=ctx.state?.read?.().submissions?.fuel?.signature===fp;
    byId('resultNote').textContent=`${name()} sealed. ${savedHere?'Saved on this device. Nothing was sent.':'Storage unavailable. Download your design to keep it.'}`;status.textContent='Sealed. Download your label or email the recipe yourself.';render();});
  rows.forEach((r,i)=>r.querySelectorAll('.lvl').forEach(b=>ctx.on(b,'click',()=>{if(phase!=='fill'||busy)return;const n=b.dataset.level==='strong'?2:b.dataset.level==='weak'?1:0,others=scoops.filter(k=>k!==keys[i]);if(others.length+n>8)return;scoops=[...others,...Array(n).fill(keys[i])];invalidateMix();render();})));
  flavours.forEach((f,i)=>ctx.on(f,'click',()=>chooseFlavor(i)));
  function render(persist=true){
    syncRows();fu.dataset.batch=phase;fu.dataset.review=String(review);fu.dataset.mixing=String(mixing);
    fu.querySelectorAll('[data-step]').forEach(s=>{if(s.dataset.step===phase)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current');});
    byId('batchTitle').textContent=review?'YOUR BATCH':{fill:'FILL YOUR JAR',flavor:'FLAVOR & MIX',label:'MAKE IT YOURS',done:'BATCH COMPLETE'}[phase];
    byId('batchHelp').textContent=review?'Your formula, design and cost record.':{fill:'Eight scoops. Up to two of each ingredient.',flavor:'Choose a flavor. Mix three times.',label:'Choose a look, then make it personal.',done:'Your own MBS FUEL, sealed and saved.'}[phase];
    for(const[id,yes]of Object.entries({trayFill:phase==='fill'&&!review,trayFlavor:phase==='flavor'&&!review,trayLabel:phase==='label'&&!review,trayReview:review||phase==='done'})){const el=byId(id);if(el)el.hidden=!yes;}
    byId('batchFill').value=scoops.length;byId('batchCount').textContent=`${scoops.length} / 8 scoops`;
    [...ingredientPanel.children].forEach((b,i)=>{const n=scoops.filter(k=>k===keys[i]).length;b.textContent=`${rows[i].querySelector('.name').textContent} · ${n}/2`;b.disabled=busy||n===2||scoops.length>=8;b.setAttribute('aria-label',`${rows[i].querySelector('.name').textContent}, ${n} of 2 scoops. Add one scoop`);});
    [...flavorPanel.children].forEach((b,i)=>{b.hidden=Math.floor(i/4)!==flavorPage;b.disabled=busy||mixing;b.setAttribute('aria-pressed',String(flavorNames[i]===flavour));});
    const pages=Math.ceil(flavours.length/4);if(byId('flavorPage'))byId('flavorPage').textContent=`${flavorPage+1} of ${pages}`;if(byId('flavorPrev'))byId('flavorPrev').disabled=flavorPage===0;if(byId('flavorNext'))byId('flavorNext').disabled=flavorPage===pages-1;
    const next=byId('batchNext');next.hidden=review||phase==='label'||phase==='done';next.textContent=phase==='fill'?'NEXT: FLAVOR':mixing?'MIXING…':mixTurns===3?'NEXT: LABEL':`MIX · ${mixTurns}/3`;next.disabled=busy||mixing||(phase==='fill'?scoops.length!==8:!flavour);
    byId('batchUndo').hidden=phase!=='fill'||review;byId('batchUndo').disabled=busy||!scoops.length;
    const back=byId('batchBack');if(back){back.hidden=phase==='fill'&&!review;back.disabled=busy||mixing;back.textContent=phase==='done'?'EDIT LABEL':review?'CLOSE REVIEW':'BACK';}
    byId('batchReset').disabled=busy||mixing;const rev=byId('batchReview');if(rev){rev.disabled=busy||mixing;rev.textContent=phase==='done'?'EDIT LABEL':review?'BUILDER':'REVIEW';rev.setAttribute('aria-expanded',String(review));}
    byId('result').hidden=sealed!==identity();
    const submit=byId('submitBtn');submit.hidden=phase!=='label'||review;submit.disabled=busy||artLoading||!complete()||sealed===identity();submit.textContent=sealed===identity()?'BATCH SAVED':'APPLY LABEL & SEAL';
    fu.querySelectorAll('[data-label-panel]').forEach(p=>p.hidden=p.dataset.labelPanel!==labelTab);tabs.forEach(b=>{const yes=b.dataset.labelTab===labelTab;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
    const pagesInTab=[...fu.querySelectorAll(`[data-label-panel="${labelTab}"] [data-label-page]`)];labelPage=Math.min(labelPage,Math.max(0,pagesInTab.length-1));
    pagesInTab.forEach((p,i)=>p.hidden=i!==labelPage);
    if(byId('labelPageNav'))byId('labelPageNav').hidden=pagesInTab.length<=1;
    if(byId('labelPageCount'))byId('labelPageCount').textContent=`${labelPage+1} of ${pagesInTab.length}`;
    if(byId('labelPagePrev'))byId('labelPagePrev').disabled=labelPage===0;
    if(byId('labelPageNext'))byId('labelPageNext').disabled=labelPage>=pagesInTab.length-1;
    fu.querySelectorAll('[data-review-page]').forEach(p=>p.hidden=p.dataset.reviewPage!==reviewTab);
    fu.querySelectorAll('[data-review-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reviewTab===reviewTab)));
    if(byId('reviewPageCount'))byId('reviewPageCount').textContent=`${reviewTabs.indexOf(reviewTab)+1} of ${reviewTabs.length}`;
    if(byId('reviewPagePrev'))byId('reviewPagePrev').disabled=reviewTab==='summary';
    if(byId('reviewPageNext'))byId('reviewPageNext').disabled=reviewTab==='save';
    if(byId('labelUndo'))byId('labelUndo').disabled=!designHistory.length||busy;if(byId('labelArtRemove'))byId('labelArtRemove').disabled=!label.artData||busy;if(byId('labelUpload'))byId('labelUpload').disabled=busy;if(byId('labelPng'))byId('labelPng').disabled=artLoading||busy;
    byId('fuFlavTag').textContent=flavour||'CHOOSE YOUR FLAVOR';const nudge=byId('fuNudge');if(nudge)nudge.textContent=busy?'DISPENSING…':mixing?'BLENDING…':{fill:'Watch your jar fill.',flavor:'A flavor all your own.',label:'Your label. Your style.',done:'MADE BY YOU.'}[phase];
    const face=byId('fuFace');if(face){face.querySelector('b').textContent=phase==='label'||phase==='done'?name():'YOUR MIX';face.querySelector('i').textContent=`${scoops.length}/8 SCOOPS${flavour?' · '+flavour:''}`;}
    updateLabel();renderSummary();if(sceneUpdate)sceneUpdate();if(phase==='label'&&lastPhase!=='label')angleTarget=0;lastPhase=phase;if(persist)saveDraft();
  }
  function fitStation(){const screen=fu.closest('.screen')||fu.parentElement,r=screen.getBoundingClientRect(),bottom=Math.min(r.bottom,window.visualViewport?visualViewport.offsetTop+visualViewport.height:innerHeight);fu.style.setProperty('--fuel-height',Math.max(260,bottom-Math.max(r.top,0))+'px');fu.classList.toggle('fuel-typing',!!window.visualViewport&&visualViewport.height<innerHeight*.78);}
  ctx.observe(new ResizeObserver(fitStation),fu.closest('.screen')||fu.parentElement);ctx.on(window,'resize',fitStation);if(window.visualViewport){ctx.on(visualViewport,'resize',fitStation);ctx.on(visualViewport,'scroll',fitStation);}
  fitStation();syncLabelControls();renderAssumptions();loadArt();render();if(restored)status.textContent=phase==='done'?'Your sealed batch was restored. Edit it or start another.':'Your unfinished batch was restored.';
  if(phase==='done'){byId('result').hidden=false;byId('resultNote').textContent='Your sealed batch is saved on this device. Nothing was sent.';}
  const fallback=byId('fuFallback');
  function fallbackColor(key){
    const a=COLORS[keys.indexOf(key)],b=flavour?FLAV_COL[flavorNames.indexOf(flavour)]:a,t=mixTurns/3*.65;
    const channel=shift=>Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t);
    return '#'+((channel(16)<<16)|(channel(8)<<8)|channel(0)).toString(16).padStart(6,'0');
  }
  function paintFallback(){if(!fallback)return;fallback.width=640;fallback.height=500;const c=fallback.getContext('2d');c.clearRect(0,0,640,500);c.strokeStyle='#d5eeff';c.lineWidth=5;c.fillStyle='rgba(210,239,255,.09)';c.beginPath();c.roundRect(180,110,280,340,30);c.fill();c.stroke();c.save();c.beginPath();c.roundRect(189,118,262,324,22);c.clip();scoops.forEach((k,i)=>{c.fillStyle=fallbackColor(k);c.fillRect(190,418-i*32,260,32);});c.restore();c.fillStyle='#d5eeff';c.fillRect(305,0,30,88);c.beginPath();c.moveTo(300,80);c.lineTo(340,80);c.lineTo(329,103);c.lineTo(311,103);c.fill();if(phase==='label'||phase==='done'){updateLabel();c.drawImage(labelCanvas,183,230,274,145);}if(phase==='done'){c.fillStyle='#20142a';c.fillRect(171,100,298,22);}}
  sceneUpdate=paintFallback;paintFallback();
  const stage=byId('fuStage'),canvas=byId('fuCanvas');let glOK=false;try{const p=document.createElement('canvas'),g=p.getContext('webgl2')||p.getContext('webgl');glOK=!!g;g?.getExtension('WEBGL_lose_context')?.loseContext();}catch{}
  if(!glOK||!stage||!canvas)return;
  import(/* @vite-ignore */ THREE_URL).then(THREE=>{
    if(session!==mine)return;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x171329,0);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,40);gl={scene,renderer};scene.add(new THREE.HemisphereLight(0xe7f4ff,0x34223f,2.1));
    const keyLight=new THREE.DirectionalLight(0xffe8d4,3.1);keyLight.position.set(-4,6,5);scene.add(keyLight);const rimLight=new THREE.DirectionalLight(0x9ddfff,2.8);rimLight.position.set(4,4,-3);scene.add(rimLight);
    const group=new THREE.Group();scene.add(group);const mesh=(geometry,material,parent=group)=>{const m=new THREE.Mesh(geometry,material);parent.add(m);return m;};
    const clear=new THREE.MeshPhysicalMaterial({color:0xe2f4ff,transparent:true,opacity:.16,roughness:.16,metalness:.04,clearcoat:1,depthWrite:false,side:THREE.FrontSide});
    const highlight=new THREE.MeshPhysicalMaterial({color:0xb9d5df,transparent:true,opacity:.68,roughness:.18,metalness:.18,depthWrite:false});
    const profile=[[.98,.07],[1.055,.09],[1.095,.16],[1.10,.26],[1.10,2.28],[1.085,2.39],[1.02,2.46],[1.00,2.56]];
    const shell=mesh(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),96),clear);shell.name='clear-jar-shell';shell.renderOrder=3;
    const base=mesh(new THREE.CylinderGeometry(1.055,1.025,.10,80),highlight);base.position.y=.08;
    for(const y of[2.47,2.53]){const rim=mesh(new THREE.TorusGeometry(1.015,.025,10,80),highlight);rim.rotation.x=Math.PI/2;rim.position.y=y;}
    const baseRing=mesh(new THREE.TorusGeometry(1.055,.028,10,80),highlight);baseRing.rotation.x=Math.PI/2;baseRing.position.y=.14;
    const powder=()=>new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92});
    const portions=Array.from({length:8},(_,i)=>{const m=mesh(new THREE.CylinderGeometry(1.035,1.035,.249,64),powder());m.position.y=.24+i*.25;m.name='powder-portion-'+i;return m;});
    const surface=mesh(new THREE.SphereGeometry(1.033,48,16,0,Math.PI*2,0,Math.PI/2),powder());surface.scale.y=.045;
    const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());gl.labelTexture=texture;
    const sleeve=mesh(new THREE.CylinderGeometry(1.113,1.113,1.28,96,1,true,-1.08,2.16),new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.05,roughness:.52,depthWrite:true,side:THREE.FrontSide}));sleeve.position.y=1.28;sleeve.name='personal-label';sleeve.renderOrder=4;
    const lid=mesh(new THREE.CylinderGeometry(1.10,1.12,.18,80),new THREE.MeshPhysicalMaterial({color:0x20142a,roughness:.3,metalness:.12,clearcoat:.65}));lid.position.y=2.61;lid.name='sealed-lid';
    const lidInset=mesh(new THREE.CircleGeometry(.94,80),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.55}));lidInset.position.y=2.707;lidInset.rotation.x=-Math.PI/2;
    const pedestal=mesh(new THREE.CylinderGeometry(1.32,1.43,.16,80),new THREE.MeshStandardMaterial({color:0x4c355b,roughness:.35,metalness:.3}),scene);pedestal.position.y=-.03;
    const ring=mesh(new THREE.TorusGeometry(1.35,.016,8,80),new THREE.MeshBasicMaterial({color:0xc8ff00}),scene);ring.rotation.x=Math.PI/2;ring.position.y=.04;
    const tubeMat=new THREE.MeshPhysicalMaterial({color:0xcbdbe2,roughness:.24,metalness:.7});
    const tube=mesh(new THREE.CylinderGeometry(.12,.12,2.2,32),tubeMat,scene);tube.position.set(0,4.16,0);tube.name='overhead-dispensing-tube';
    const nozzle=mesh(new THREE.CylinderGeometry(.16,.08,.28,32),tubeMat,scene);nozzle.position.set(0,2.99,0);
    const outlet=mesh(new THREE.CircleGeometry(.079,24),new THREE.MeshBasicMaterial({color:0x171329}),scene);outlet.rotation.x=Math.PI/2;outlet.position.y=2.849;
    const collar=mesh(new THREE.TorusGeometry(.13,.026,10,32),new THREE.MeshStandardMaterial({color:0xc8ff00,roughness:.3}),scene);collar.rotation.x=Math.PI/2;collar.position.y=3.22;
    const streamMat=new THREE.MeshBasicMaterial({color:0xffea00}),stream=mesh(new THREE.CylinderGeometry(.034,.05,1,12),streamMat,scene);stream.visible=false;stream.name='ingredient-stream';
    const particleGeo=new THREE.SphereGeometry(.023,6,4),particles=Array.from({length:32},()=>{const m=mesh(particleGeo,streamMat,scene);m.visible=false;return m;});
    let animation=null,rotation=0,lastTime=0,hover=0,sleeveWrap=false;
    function updateScene(){const blend=flavour?new THREE.Color(FLAV_COL[flavorNames.indexOf(flavour)]):null;portions.forEach((m,i)=>{m.visible=i<scoops.length;if(m.visible){const color=new THREE.Color(COLORS[keys.indexOf(scoops[i])]);if(blend)color.lerp(blend,mixTurns/3*.65);m.material.color.copy(color);}});surface.visible=scoops.length>0;surface.position.y=.365+(scoops.length-1)*.25;if(surface.visible)surface.material.color.copy(portions[scoops.length-1].material.color);sleeve.visible=phase==='label'||phase==='done';
      const wrap=label.shape==='wrap';if(wrap!==sleeveWrap){sleeve.geometry.dispose();sleeve.geometry=new THREE.CylinderGeometry(1.113,1.113,1.28,96,1,true,wrap?-Math.PI:-1.08,wrap?Math.PI*2:2.16);sleeveWrap=wrap;}
      lid.visible=lidInset.visible=phase==='done';tube.visible=nozzle.visible=outlet.visible=collar.visible=phase!=='done';updateLabel();}
    sceneUpdate=updateScene;dispense=(color,done,ingredient)=>{animation={start:performance.now(),done,ingredient,color};streamMat.color.set(color);};
    function resize(){const w=stage.clientWidth||320,h=stage.clientHeight||280;renderer.setSize(w,h,false);camera.aspect=w/h;const distance=Math.max(6.7,5.5/camera.aspect);camera.position.set(0,2.8+distance*.16,distance);camera.lookAt(0,1.72,0);camera.updateProjectionMatrix();}
    ctx.observe(new ResizeObserver(resize),stage);resize();on('fuRotL','click',()=>angleTarget-=Math.PI/6);on('fuRotR','click',()=>angleTarget+=Math.PI/6);
    canvas.tabIndex=0;ctx.on(canvas,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();angleTarget+=(e.key==='ArrowRight'?1:-1)*Math.PI/6;}});
    ctx.on(canvas,'pointermove',e=>{if(e.pointerType==='touch'||busy)return;const r=canvas.getBoundingClientRect();hover=((e.clientX-r.left)/r.width-.5)*.7;});ctx.on(canvas,'pointerleave',()=>hover=0);
    ctx.on(canvas,'webglcontextlost',e=>{e.preventDefault();if(session!==mine)return;fu.classList.remove('has3d');sceneUpdate=paintFallback;dispense=null;if(animation){animation.done();animation=null;busy=false;}render();});
    function frame(now){if(session!==mine)return;const dt=Math.min(.05,(now-lastTime)/1000||.016);lastTime=now;if(!reduced&&hover&&!busy)angleTarget+=hover*dt;rotation+=(angleTarget-rotation)*(reduced?1:Math.min(1,dt*9));group.rotation.y=rotation;if(mixing&&!reduced)group.rotation.y+=Math.sin(now*.023)*.09;
      if(animation){const progress=Math.min(1,(now-animation.start)/650),growth=Math.max(0,(progress-.12)/.88),oldTop=scoops.length?.365+(scoops.length-1)*.25:.115,endY=oldTop+(animation.ingredient?.25*growth:0),height=2.84-endY;
        if(animation.ingredient){const next=portions[scoops.length];next.visible=growth>0;next.scale.y=Math.max(.001,growth);next.position.y=oldTop+.125*growth;next.material.color.set(animation.color);surface.visible=growth>0;surface.position.y=endY;surface.material.color.set(animation.color);}
        stream.visible=true;stream.scale.y=height;stream.position.y=endY+height/2;particles.forEach((p,i)=>{p.visible=true;const travel=(progress*3+i/32)%1;p.position.set(Math.sin(i*8)*.075,endY+height*(1-travel),Math.cos(i*4)*.06);});if(progress===1){const done=animation.done;animation=null;stream.visible=false;particles.forEach(p=>p.visible=false);portions.forEach((p,i)=>{p.scale.y=1;p.position.y=.24+i*.25;});done();busy=false;render();}}
      renderer.render(scene,camera);ctx.frame(frame);
    }
    fu.classList.add('has3d');updateScene();resize();ctx.frame(frame);
  }).catch(error=>{if(session!==mine)return;disposeScene(gl);gl=null;fu.classList.remove('has3d');dispense=null;sceneUpdate=paintFallback;paintFallback();console.warn('[fuel] using 2D station',error);});
},
unmount(){session=null;for(const url of exportURLs)URL.revokeObjectURL(url);exportURLs.clear();const g=gl;gl=null;disposeScene(g);}
};
