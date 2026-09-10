/* One quiet next-action hint, shared by every page and its same-origin game frames. */
(() => {
 'use strict';
 let owner=window;try{if(top.location.origin===location.origin)owner=top;}catch{}
 if(owner!==window){
  const attach=()=>owner.MBS_GUIDE?.attach(document);
  if(owner.MBS_GUIDE)attach();else owner.addEventListener('mbs:guide-ready',attach,{once:true});
  return;
 }
 if(window.MBS_GUIDE)return;
 const DELAY=5000,GOGGLES='mbs-goggles-v1',docs=new Map(),frames=new WeakSet(),providers=new Map();
 let timer=0,target=null,lastActivity=Date.now(),stopped=false,loadingProgress=false;
 function loadProgress(){
  if(loadingProgress||window.MBS_STATE&&window.MBS_CHANNELS)return;loadingProgress=true;
  const state=()=>{if(window.MBS_STATE){changed();return;}const script=document.createElement('script');script.src='/tv/state.js';script.onload=changed;document.head.append(script);};
  if(window.MBS_CHANNELS)state();else{const script=document.createElement('script');script.src='/tv/mbs-channels.js';script.onload=state;document.head.append(script);}
 }
 function earned(){
  for(const name of ['localStorage','sessionStorage'])try{
   const storage=window[name],reward=JSON.parse(storage.getItem(GOGGLES));
   if(reward?.version===1&&Number.isSafeInteger(reward.acquiredAt)&&reward.acquiredAt>0&&Array.isArray(reward.recipe)&&reward.recipe.length===6&&reward.recipe.every((n,i)=>n===i))return true;
   const line=JSON.parse(storage.getItem('mbs-dg-line'));
   if(line?.v===2&&line.phase==='goggles'&&Array.isArray(line.poured)&&line.poured.length===6&&line.poured.every((n,i)=>n===i)){
    try{storage.setItem(GOGGLES,JSON.stringify({version:1,acquiredAt:Date.now(),recipe:line.poured}));}catch{}
    return true;
   }
  }catch{}
  return false;
 }
 const css=`.mbs-idle-glow{outline:1px solid #ff961f!important;outline-offset:3px;animation:mbs-idle-breathe 3s ease-in-out infinite!important}
 @keyframes mbs-idle-breathe{0%,100%{box-shadow:0 0 3px 1px #ff961f26}50%{box-shadow:0 0 8px 2px #ff961f50}}
 .mbs-next-page{display:inline-flex;align-items:center;min-height:40px;margin:8px;padding:7px 12px;border:1px solid #adba98;border-radius:4px;background:#17242deF;color:#e8f4d5;text-decoration:none;font:14px/1.4 Tahoma,Arial,sans-serif;z-index:1001}
 .mbs-next-page-floating{position:fixed;bottom:12px;left:12px;max-width:calc(100vw - 50px)}
 @media(prefers-reduced-motion:reduce){.mbs-idle-glow{animation:none!important;box-shadow:0 0 5px 1px #ff961f40!important}}`;
 function available(el){
  if(!el?.isConnected||el.disabled||el.getAttribute('aria-disabled')==='true'||el.closest('[hidden],[inert],[aria-hidden="true"]'))return false;
  if(el.tagName==='A'&&(!el.getAttribute('href')||el.getAttribute('href')==='#'))return false;
  const closed=el.closest('details:not([open])');if(closed&&!el.closest('summary'))return false;
  const view=el.ownerDocument.defaultView;if(!view||view.document.hidden)return false;
  if(view!==window){const frame=view.frameElement;if(!frame||!frame.isConnected||!available(frame))return false;}
  const style=view.getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&style.pointerEvents!=='none'&&el.getClientRects().length>0;
 }
 function first(root,selectors){
  for(const selector of selectors)for(const el of root.querySelectorAll(selector))if(available(el))return el;
  return null;
 }
 function currentPage(doc){
  const loc=doc.defaultView.location,path=loc.pathname;
  if(path.includes('/gala/terminal'))return 'terminal';
  if(path.includes('/gala/')&&!path.includes('/tv/games/'))return 'character';
  if(path.includes('/handborne'))return 'hand';
  return new URLSearchParams(loc.search).get('ch')||doc.documentElement.dataset.game||doc.body?.dataset.slug||path.match(/\/(?:play|games)\/([^/]+)/)?.[1]||'mominc';
 }
 function donePages(doc){
  try{return doc.defaultView.MBS_STATE?.completedPages()||window.MBS_STATE?.completedPages()||[];}catch{return [];}
 }
 function nextPage(doc,current){
  const win=doc.defaultView,done=new Set(donePages(doc)),manifest=win.MBS_CHANNELS||window.MBS_CHANNELS;
  const channels=(manifest?.channels||[]).filter(c=>c.game&&!c.suppressed&&!c.comingSoon&&(manifest.active||[]).includes(c.id));
  // Prefer the established story order, then any other active pages in the manifest.
  const order=['djscratch','goon','lilboyfriend','corgi',...channels.map(c=>c.id)];
  const next=order.map(id=>channels.find(c=>c.id===id)).find(c=>c&&c.id!==current&&!done.has(c.id));
  if(!next){doc.querySelector('[data-idle-next-page]')?.remove();return null;}
  const existing=first(doc,[`a.lcd-card[data-id="${next.id}"]`,`a[data-next-page="${next.id}"]`,`a[href="/tv/?ch=${next.id}"]`,`a[href="/games/${next.id}/"]`]);
  if(existing)return existing;
  let link=doc.querySelector('[data-idle-next-page]');
  if(!link){link=doc.createElement('a');link.dataset.idleNextPage='';link.className='mbs-next-page';const host=doc.querySelector('.rail,.masthead,.landing-nav');if(host)host.append(link);else{link.classList.add('mbs-next-page-floating');doc.body.append(link);}}
  const url='/tv/?ch='+next.id,text='Next: '+next.name;
  if(link.getAttribute('href')!==url)link.setAttribute('href',url);
  if(link.textContent!==text)link.textContent=text;
  link.hidden=false;link.dataset.nextPage=next.id;link.target='_top';return link;
 }
 function modalAction(doc){
  const dialog=[...doc.querySelectorAll('dialog[open],[role="dialog"][aria-modal="true"]')].reverse().find(available);
  if(!dialog)return null;
  for(const input of dialog.querySelectorAll('select[required],input[required],textarea[required]'))if(available(input)&&!input.checkValidity())return input;
  return first(dialog,['[data-guide-next]','[data-name-confirm]','button[type="submit"]','[data-run-checks] [data-done="false"] a','.war-result a','button:not([aria-label*="Close"]):not([id*="Close"]):not([class*="close"]):not([data-close])']);
 }
 function pageAction(doc){
  const custom=providers.get(doc)?.();if(available(custom))return custom;
  const modal=modalAction(doc);if(modal)return modal;
  const page=currentPage(doc),win=doc.defaultView,path=win.location.pathname;
  const explicit=first(doc,['[data-guide-next]:not([data-guide-next="false"])']);
  if(page==='character')return explicit||first(doc,['#join']);
  if(page==='terminal')return first(doc,['[data-run-checks] [data-done="false"] a','#joinRankings:not(:disabled)'])||explicit;
  const game=path.includes('/play/')||path.includes('/tv/games/');
  if(page==='goon'&&game){
   let scene=win.galaSceneInstance;try{scene ||= doc.querySelector('#ggGame')?.contentWindow.galaSceneInstance;}catch{}
   if(scene?.hasWon)return nextPage(doc,page);
   if(scene){const direction=['up','right','down','left'].find(d=>scene.hasLegalMoveInDirection(d));return direction?first(doc,[`.ggTap[data-dir="${direction}"]`]):null;}
  }else if(donePages(doc).includes(page))return nextPage(doc,page);
  if(explicit)return explicit;
  // Launchers are the next action on an uncompleted channel's information page.
  const launch=first(doc,['[data-network-launch] a','.network-launch a','#play[data-play]']);if(launch)return launch;
  const steps={
   djscratch:['#codeSubmit:not(:disabled)','#rack .ctrl.glow [role="slider"]','#rack .ctrl.glow button','#powerSwitch[aria-pressed="false"]','[data-name-confirm]','#dj-name-rename','#powerSwitch'],
   lilboyfriend:['#slotBtn','#caseFile3d','#lbReadClose','#bookSkip','#lbLook','#lbWalk'],
   corgi:['#ventBtn','#ccDeskSubmit','#ccCornerNext','#ccNext','#ccReadBtn'],
   girlfriend:['#dgPaperGoggles','#dgReportAgain'],
   fuel:['#submitBtn','#batchNext','[data-flavour]:not([aria-pressed="true"])']
  };
  const step=first(doc,steps[page]||[]);
  if(step){
   if(step.id==='codeSubmit'){const input=doc.getElementById('codeInput');if(input&&!input.value&&available(input))return input;}
   if(step.id==='ccDeskSubmit'){const input=doc.getElementById('ccDeskCode');if(input&&!input.value&&available(input))return input;}
   return step;
  }
  // Other site forms and customizers can opt in without changing the shared guide.
  const primary=first(doc,['[data-next-action]','[data-next]','button[type="submit"]']);if(primary&&!primary.closest('#profileForm,.profile-form,[data-optional]')&&!/delete|remove|reset|forget/i.test(primary.textContent))return primary;
  for(const el of doc.querySelectorAll('main button,main a,[role="main"] button')){
   if(available(el)&&/^(?:next\b|continue\b|finish\b|complete\b|start\b|enter\b|join\b)/i.test(el.textContent.trim())&&!/start over|restart|reset/i.test(el.textContent))return el;
  }
  return page==='mominc'?nextPage(doc,page):null;
 }
 function clear(){if(target){target.classList.remove('mbs-idle-glow');target.removeAttribute('data-idle-guided');target=null;}}
 function show(){
  timer=0;if(stopped||document.hidden||!earned()){clear();for(const doc of docs.keys()){const link=doc.querySelector('[data-idle-next-page]');if(link)link.hidden=true;}return;}
  let candidate=pageAction(document);
  if(!candidate)for(const doc of docs.keys())if(doc!==document){candidate=pageAction(doc);if(candidate)break;}
  if(candidate===target)return;clear();
  if(candidate){target=candidate;target.classList.add('mbs-idle-glow');target.setAttribute('data-idle-guided','true');}
 }
 function activity(){lastActivity=Date.now();clear();clearTimeout(timer);if(!stopped&&!document.hidden&&earned()){loadProgress();timer=setTimeout(show,DELAY);}}
 function changed(){if(!stopped&&Date.now()-lastActivity>=DELAY)show();}
 function attachFrame(frame){
  if(frames.has(frame))return;frames.add(frame);
  const load=()=>{try{if(frame.contentWindow.location.origin===location.origin)attach(frame.contentDocument);}catch{}};
  frame.addEventListener('load',load);load();
 }
 function attach(doc){
  if(!doc||docs.has(doc))return;
  const style=doc.createElement('style');style.dataset.idleGuideStyle='';style.textContent=css;doc.head.append(style);
  for(const type of ['pointerdown','pointermove','touchstart','keydown','input','change','wheel','scroll','focusin'])doc.addEventListener(type,activity,{capture:true,passive:true});
  const observer=new MutationObserver(()=>{doc.querySelectorAll('iframe').forEach(attachFrame);changed();});
  const observe=()=>{if(doc.body)observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled','aria-disabled','open','data-done','class']});};
  docs.set(doc,{observer,observe});observe();doc.querySelectorAll('iframe').forEach(attachFrame);
  doc.addEventListener('DOMContentLoaded',()=>{observe();doc.querySelectorAll('iframe').forEach(attachFrame);},{once:true});
  doc.addEventListener('visibilitychange',activity);
  for(const event of ['mbs:page-complete','mbs:gala-character-created','mbs-flow'])doc.defaultView.addEventListener(event,changed);
  doc.defaultView.addEventListener('mbs:goggles-earned',activity);
  doc.defaultView.addEventListener('storage',event=>{if(event.key===null||event.key===GOGGLES||event.key==='mbs-dg-line')activity();else changed();});
 }
 window.MBS_GUIDE={attach,earned,refresh:changed,register:(doc,resolve)=>{providers.set(doc,resolve);changed();return()=>providers.delete(doc);}};
 attach(document);window.dispatchEvent(new Event('mbs:guide-ready'));activity();
 window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer);clear();for(const {observer} of docs.values())observer.disconnect();});
 window.addEventListener('pageshow',()=>{stopped=false;for(const {observe} of docs.values())observe();activity();});
})();
