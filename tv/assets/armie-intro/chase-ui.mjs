import {chasePressure} from './chase-state.mjs?v=chase-4';
export function mountChase({root,panel}){
  const phone=root.querySelector('.ar-phone'),layout=root.querySelector('.ar-layout');
  const card=document.createElement('div');card.className='ar-stage-card';card.hidden=true;layout.append(card);
  const hud=document.createElement('div');hud.className='ar-chase';hud.hidden=true;
  hud.innerHTML='<div class="ar-chase-labels"><b>COACH</b><span class="ar-chase-status"></span><b>YOU</b></div><div class="ar-chase-track" role="progressbar" aria-label="Coach catching up" aria-valuemin="0" aria-valuemax="100"><i class="ar-chase-fill"></i><img class="ar-chase-coach" src="/tv/assets/armie-intro/coach.png" alt="Coach Armie"><svg class="ar-chase-player" viewBox="0 0 32 38" role="img" aria-label="You running"><circle cx="22" cy="5" r="4"/><path d="M19 12 14 22 23 28 29 27M15 21 10 29 3 33M19 12 11 11 6 17M18 14 24 18 29 14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  layout.append(hud);const track=hud.querySelector('.ar-chase-track'),status=hud.querySelector('.ar-chase-status');
  const tint=document.createElement('div');tint.className='ar-last-life-tint';tint.setAttribute('aria-hidden','true');layout.append(tint);
  const streaks=document.createElement('div');streaks.className='ar-speed-streaks';streaks.setAttribute('aria-hidden','true');layout.append(streaks);
  let lastPressure=-1,lastText='';
  function fit(){const viewport=window.visualViewport;root.style.setProperty('--ar-viewport-height',Math.min(innerHeight,viewport?.height||innerHeight)+'px');root.style.setProperty('--ar-viewport-top',(viewport?.offsetTop||0)+'px');}
  window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);fit();
  return {phase(state){
    const playing=root.classList.contains('ar-playing'),question=state.phase==='question'||state.phase==='feedback'&&state.from==='question',up=playing&&(state.phase==='tap'||question);
    root.dataset.phase=state.phase;root.classList.toggle('ar-phone-up',up);root.classList.toggle('ar-question-up',playing&&question);
    root.classList.remove('ar-junction-mode');if(up)root.classList.remove('ar-maze-mode');
    const target=!playing||up?phone:card;if(panel.parentNode!==target)target.append(panel);
    card.hidden=!playing||up||state.phase==='run';hud.hidden=!playing||['plan','complete','win'].includes(state.phase);panel.scrollTop=0;fit();
  },update(state,run){
    const pressure=chasePressure(state,run),value=Math.round(pressure*100);
    if(value!==lastPressure){lastPressure=value;hud.style.setProperty('--coach-x',(5+pressure*83)+'%');hud.style.setProperty('--danger',value+'%');track.setAttribute('aria-valuenow',value);track.setAttribute('aria-valuetext',(3-state.mistakes)+' chances left; Coach is '+value+' percent of the way to you');}
    const text=state.phase==='tap'?'DISTANCE +'+Math.round((state.boost||0)*18)+'m':state.mistakes===2?'LAST CHANCE · COACH IS CLOSE':(3-state.mistakes)+' CHANCES · KEEP YOUR DISTANCE';
    if(text!==lastText){lastText=text;status.textContent=text;}
    root.classList.toggle('ar-last-life',state.mistakes===2);root.classList.toggle('ar-boosting',state.phase==='tap'&&state.tapCount>0||state.phase==='run'&&!!run&&!run.paused&&run.status==='running'&&run.speed>5.2);
  },destroy(){window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);}};
}
