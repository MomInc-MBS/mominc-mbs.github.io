/* Shared server run clock. Fuel never contributes to clearance. */
(()=>{'use strict';if(window.MBS_RUN)return;try{if(parent!==window&&parent.location.origin===location.origin&&parent.MBS_RUN){window.MBS_RUN=parent.MBS_RUN;return;}}catch{}
 const KEY='mbs-gala-run-v1',API='https://myr5.mominc.online/api/gala',stages=['djscratch','goon','lilboyfriend','corgi','hand','armie'];let state=null,starting=null,flushing=null,error='';
 function saved(){try{const data=JSON.parse(localStorage.getItem(KEY));if(data?.version===1&&/^[0-9a-f-]{36}$/.test(data.id)&&/^[a-f0-9]{64}$/.test(data.token))return {...data,queue:Array.isArray(data.queue)?data.queue:[]};}catch{}return null;}state=saved();
 const lock=fn=>navigator.locks?.request?navigator.locks.request('mbs-gala-run',fn):fn();
 function notify(){
  window.dispatchEvent(new CustomEvent('mbs:run-update',{detail:{run:state,error}}));
  if(document.readyState==='loading')return;
  let note=document.getElementById('rankConnection');
  if(!error){if(note){clearTimeout(note._typeT);clearTimeout(note._fadeT);clearTimeout(note._goneT);note.hidden=true;delete note.dataset.text;}return;}
  if(!note){
   note=document.createElement('aside');
   note.id='rankConnection';
   note.setAttribute('role','status');
   note.setAttribute('aria-live','polite');
   // bottom banner, never the top tabs; pointer-events:none so it can never eat a tap
   note.style.cssText='position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);z-index:6500;max-width:88vw;pointer-events:none;color:#ff7f1a;text-shadow:0 1px 2px rgba(0,0,0,.8),0 0 8px currentColor,0 0 16px currentColor;font:13px/1.4 monospace;text-align:center;white-space:pre-wrap;opacity:1';
   document.body.append(note);
  }
  if(note.dataset.text===error)return; // each message plays once; it shows again only after the error clears and recurs
  note.dataset.text=error;
  note.setAttribute('aria-label',error); // full text for AT even while the visual copy is mid-type
  note.hidden=false;
  clearTimeout(note._typeT);clearTimeout(note._fadeT);clearTimeout(note._goneT);
  note.style.transition='none';note.style.opacity='1';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
   note.textContent=error;
  }else{
   note.textContent='';
   let i=0;const perChar=Math.min(28,4000/Math.max(error.length,1)); // ponytail: clamp so very long e.message text still finishes typing well before the fade starts
   const type=()=>{note.textContent=error.slice(0,++i);if(i<error.length)note._typeT=setTimeout(type,perChar);};
   type();
  }
  note._fadeT=setTimeout(()=>{note.style.transition='opacity 2000ms linear';note.style.opacity='0';},8000);
  note._goneT=setTimeout(()=>{note.hidden=true;note.style.transition='none';note.style.opacity='1';},10000);
 }
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{error='Device storage is unavailable. Keep this page open to save your run.';}notify();}
 async function request(path,method='GET',data){const r=await fetch(API+path,{method,headers:{...(state?.token?{Authorization:'Bearer '+state.token}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});const value=await r.json();if(!r.ok)throw Object.assign(Error(value.error||'The Gala terminal could not connect.'),{status:r.status});return value;}
 async function start(){if(state)return state;if(starting)return starting;starting=lock(async()=>{state=saved();if(state)return state;try{state={version:1,...await request('/runs','POST',{}),queue:[],completed:[]};error='';save();return state;}catch(e){error='Ranked clock not connected. Reconnect before your ranked run. '+e.message;notify();return null;}}).finally(()=>{starting=null;});return starting;}
 async function flush(){if(flushing)return flushing;flushing=(async()=>{if(!await start())return;await lock(async()=>{state=saved()||state;for(const item of [...state.queue]){try{const value=await request('/runs/'+state.id+'/checkpoint','POST',item);state={...state,...value,queue:state.queue.filter(x=>x.stage!==item.stage)};error='';save();}catch(e){error=e.message;notify();break;}}});})().finally(()=>{flushing=null;});return flushing;}
 async function checkpoint(stage){if(!stages.includes(stage))return;if(!await start()){error='This clearance needs a connected run clock. Reconnect and replay this game to rank it.';notify();return;}await lock(async()=>{state=saved()||state;if(state.completed?.includes(stage)||state.queue.some(x=>x.stage===stage))return;const item={stage};if(stage==='djscratch'){const dj=window.MBS_DJ?.read();if(!dj?.completedAt)return;item.base=dj.base;item.moniker=dj.moniker;}state.queue.push(item);save();});await flush();}
 async function refresh(){if(!await start())return null;return lock(async()=>{state=saved()||state;try{state={...state,...await request('/runs/'+state.id)};error='';save();return state;}catch(e){error=e.message;notify();throw e;}});}
 async function join(){await flush();return lock(async()=>{state=saved()||state;if(!state)throw Error('Connect your run first.');state={...state,...await request('/runs/'+state.id+'/join','POST',{confirm:true})};error='';save();return state;});}
 async function retag(moniker){await flush();return lock(async()=>{state=saved()||state;if(!state)throw Error('Connect your run first.');state={...state,...await request('/runs/'+state.id+'/moniker','POST',{moniker})};window.MBS_DJ?.retag(state.moniker);try{const look=JSON.parse(localStorage.getItem('mominc-avatar-v1'));if(look){look.name='PRISONER '+state.djName;localStorage.setItem('mominc-avatar-v1',JSON.stringify(look));}}catch{}error='';save();return state;});}
 function handoff(){if(!state)throw Error('Connect your ranked run first.');const data={version:1,id:state.id,token:state.token,dj:window.MBS_DJ?.read()||null};try{const look=JSON.parse(localStorage.getItem('mominc-avatar-v1'));if(look?.schema==='mominc-avatar')data.avatar=look;}catch{}return new URLSearchParams({gala:btoa(unescape(encodeURIComponent(JSON.stringify(data))))}).toString();}
 function time(ms){if(!Number.isFinite(ms)||ms<0)return '—';const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/3600)).padStart(2,'0')+':'+String(Math.floor(seconds/60)%60).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
 window.MBS_RUN={KEY,stages,start,checkpoint,flush,refresh,join,retag,handoff,time,read:()=>state,error:()=>error,leaderboard:()=>request('/leaderboard')};
 window.addEventListener('online',flush);window.addEventListener('mbs:page-complete',e=>{if(e.detail?.site!=='goon')checkpoint(e.detail?.site);});window.addEventListener('mbs-flow',()=>{if(window.MBS_FLOW?.armieReady())checkpoint('hand');});window.addEventListener('storage',e=>{if(e.key===KEY){state=saved()||state;notify();}});document.addEventListener('DOMContentLoaded',notify,{once:true});start().then(flush);
})();
