import {createRun,input,step,runSpeed} from './maze-run.mjs?v=chase-5';
import {swipeAction} from './swipe-input.mjs?v=swipe-2';

const PAUSE='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>',PLAY='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2 14 8 4 14Z"/></svg>';
export function mountRunner({root,onState,onHit,onComplete,getLives=()=>3}) {
  let run=null,raf=0,last=0,gesture=null;
  // No tutorial UI: keyboard and swipe only, pause is a small icon.
  const pauseButton=document.createElement('button');pauseButton.id='ar-run-pause';pauseButton.type='button';pauseButton.className='ar-maze-pause';pauseButton.hidden=true;pauseButton.innerHTML=PAUSE;pauseButton.setAttribute('aria-label','Pause run');root.querySelector('.ar-layout').append(pauseButton);pauseButton.onclick=pause;
  function announce(){
    if(!run)return;
    const exits=['choosing','exiting'].includes(run.status);root.classList.toggle('ar-exit-choice',exits);root.dataset.runStage=run.status;
    const label=run.paused?'Resume run':'Pause run',icon=run.paused?PLAY:PAUSE;if(pauseButton.getAttribute('aria-label')!==label){pauseButton.setAttribute('aria-label',label);pauseButton.innerHTML=icon;pauseButton.setAttribute('aria-pressed',String(run.paused));}
  }
  function action(value){if(run){input(run,value);announce();onState();}}
  function pause(){if(run&&['running','choosing','exiting'].includes(run.status)){run.paused=!run.paused;gesture=null;last=0;announce();onState();}}
  function key(e){if(!run||!['running','choosing','exiting'].includes(run.status)||e.repeat||e.altKey||e.metaKey||e.ctrlKey)return;
    const actionName={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',ArrowDown:'slide',s:'slide',S:'slide'}[e.key];
    if(actionName){if(e.key===' '&&e.target.closest('button'))return;e.preventDefault();action(actionName);}
    else if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();pause();}
  }
  const surface=root.querySelector('.ar-layout');
  function swipe(e){if(!gesture||e.pointerId!==gesture.id||gesture.used)return;const value=swipeAction(e.clientX-gesture.x,e.clientY-gesture.y);if(value){gesture.used=true;e.preventDefault();action(value);}}
  surface.addEventListener('pointerdown',e=>{if(!run||run.paused||!e.isPrimary||e.button!==0||e.target.closest('button,a,input,select'))return;gesture={x:e.clientX,y:e.clientY,id:e.pointerId,used:false};surface.setPointerCapture(e.pointerId);});
  surface.addEventListener('pointermove',swipe);
  surface.addEventListener('pointerup',e=>{if(gesture?.id!==e.pointerId)return;swipe(e);gesture=null;});
  surface.addEventListener('pointercancel',e=>{if(gesture?.id===e.pointerId)gesture=null;});
  surface.addEventListener('lostpointercapture',e=>{if(gesture?.id===e.pointerId)gesture=null;});
  function hidden(){if(document.hidden&&run&&!run.paused)pause();}
  document.addEventListener('keydown',key);document.addEventListener('visibilitychange',hidden);
  function tick(now){
    if(!root.isConnected){stop();document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hidden);return;}
    if(!run)return;
    const dt=last?(now-last)/1000:0;last=now;step(run,dt);announce();onState();
    if(run.status==='hit'){const hit=run.hit,exit=run.exit;stop();onHit(hit,exit);return;}
    if(run.status==='complete'){const exit=run.exit;stop();onComplete(exit);return;}
    raf=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(raf);raf=0;run=null;last=0;gesture=null;pauseButton.hidden=true;root.classList.remove('ar-maze-mode','ar-exit-choice');delete root.dataset.runStage;}
  return {start(seed,assisted,boost=0){stop();run=createRun(seed,assisted,boost);pauseButton.hidden=false;root.classList.add('ar-maze-mode');announce();raf=requestAnimationFrame(tick);},stop,pause,snapshot:()=>run?{seed:run.seed,distance:run.distance,time:run.time,lane:run.lane,height:run.height,duck:run.duck,paused:run.paused,status:run.status,exit:run.exit,exitProgress:run.exitProgress,boost:run.boost,speed:runSpeed(run)}:null};
}
