import {createRun,input,step,hint,LENGTH} from './maze-run.mjs';

export function mountRunner({root,onState,onHit,onComplete}) {
  let run=null,raf=0,last=0,gesture=null;
  const controls=document.createElement('div');controls.className='ar-run-controls';controls.hidden=true;
  controls.innerHTML='<div class="ar-run-guide" aria-live="polite"></div><div class="ar-run-buttons"><button type="button" data-run="left" aria-label="Move to left lane or turn left">← LEFT</button><button type="button" data-run="jump" aria-label="Jump over crack or fallen stone">JUMP ↑</button><button type="button" data-run="right" aria-label="Move to right lane or turn right">RIGHT →</button></div><p>Swipe ← → to move or turn · swipe ↑ to jump</p>';
  root.querySelector('.ar-layout').append(controls);
  const pauseButton=document.createElement('button');pauseButton.id='ar-run-pause';pauseButton.type='button';pauseButton.className='ar-maze-pause';pauseButton.hidden=true;pauseButton.textContent='Pause run';root.querySelector('.ar-layout').append(pauseButton);pauseButton.onclick=pause;
  const guide=controls.querySelector('.ar-run-guide');
  function announce(){
    if(!run)return;
    const message=hint(run);if(guide.textContent!==message)guide.textContent=message;
    const status=root.querySelector('#ar-run-message'),text=run.paused?'Coach can wait.':`${Math.round(run.distance/LENGTH*100)}% · ${run.lane===0?'LEFT':'RIGHT'} LANE`;if(status&&status.textContent!==text)status.textContent=text;
    const pause=root.querySelector('#ar-run-pause'),pauseText=run.paused?'Resume run':'Pause run';if(pause&&pause.textContent!==pauseText)pause.textContent=pauseText;
    controls.querySelectorAll('button').forEach(b=>b.disabled=run.paused);
  }
  function action(value){if(run){input(run,value);announce();onState();}}
  controls.addEventListener('pointerdown',e=>{const button=e.target.closest('[data-run]');if(button){e.preventDefault();action(button.dataset.run);}});
  controls.addEventListener('click',e=>{if(e.detail===0){const button=e.target.closest('[data-run]');if(button)action(button.dataset.run);}});
  function pause(){if(run?.status==='running'){run.paused=!run.paused;last=0;announce();onState();}}
  function key(e){if(!run||run.status!=='running'||e.repeat||e.altKey||e.metaKey||e.ctrlKey)return;
    const actionName={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump'}[e.key];
    if(actionName){if(e.key===' '&&e.target.closest('button'))return;e.preventDefault();action(actionName);}
    else if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();pause();}
  }
  const view=root.querySelector('.ar-view');
  view.addEventListener('pointerdown',e=>{if(!run||e.pointerType==='mouse')return;gesture={x:e.clientX,y:e.clientY,id:e.pointerId};view.setPointerCapture(e.pointerId);});
  view.addEventListener('pointerup',e=>{if(!gesture||e.pointerId!==gesture.id)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;action(Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'jump':null);});
  view.addEventListener('pointercancel',()=>{gesture=null;});
  function hidden(){if(document.hidden&&run&&!run.paused)pause();}
  document.addEventListener('keydown',key);document.addEventListener('visibilitychange',hidden);
  function tick(now){
    if(!root.isConnected){stop();document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hidden);return;}
    if(!run)return;
    const dt=last?(now-last)/1000:0;last=now;step(run,dt);announce();onState();
    if(run.status==='hit'){const hit=run.hit;stop();onHit(hit);return;}
    if(run.status==='complete'){stop();onComplete();return;}
    raf=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(raf);raf=0;run=null;last=0;gesture=null;controls.hidden=true;pauseButton.hidden=true;root.classList.remove('ar-maze-mode');}
  return {start(seed,assisted){stop();run=createRun(seed,assisted);controls.hidden=false;pauseButton.hidden=false;root.classList.add('ar-maze-mode');announce();raf=requestAnimationFrame(tick);},stop,pause,snapshot:()=>run?{seed:run.seed,distance:run.distance,time:run.time,lane:run.lane,height:run.height,paused:run.paused}:null};
}
