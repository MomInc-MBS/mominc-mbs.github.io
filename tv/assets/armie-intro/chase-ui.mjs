import {chasePressure} from './chase-state.mjs?v=chase-5';
import {coachHand} from './coach-hand.mjs?v=chase-5';
import {coachElement} from './coach-3d.mjs';
const LINES=['Coach not mad.','Coach must help.','Job says catch.','Mom loves you. Run.','Coach hears your feet.','Coach getting close.','Door needs facts.','Coach feels torn.'];
// Rolled-out clay letters on a canvas (the real text sits beside it for screen readers).
export function clayText(text,height=40){
  let seed=[...text].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7);const rnd=()=>(seed=seed*1664525+1013904223>>>0)/4294967296;
  const dpr=Math.min(2,devicePixelRatio||1),fs=height*.74,font=`900 ${fs}px "Arial Rounded MT Bold","Arial Black","Segoe UI Black",system-ui,sans-serif`;
  const c=document.createElement('canvas'),x=c.getContext('2d');x.font=font;
  const letters=[...text.toUpperCase()].map(ch=>({ch,w:ch===' '?fs*.32:x.measureText(ch).width+fs*.1,r:(rnd()-.5)*.22,dy:(rnd()-.5)*fs*.1}));
  const w=letters.reduce((a,l)=>a+l.w,0)+fs*.5;c.width=Math.ceil(w*dpr);c.height=Math.ceil(height*dpr);c.style.width=w+'px';c.style.height=height+'px';
  x.scale(dpr,dpr);x.font=font;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  const each=fn=>{let px=fs*.25;for(const l of letters){if(l.ch!==' '){x.save();x.translate(px+l.w/2,height/2+l.dy);x.rotate(l.r);fn(l);x.restore();}px+=l.w;}};
  x.shadowColor='#000c';x.shadowBlur=fs*.12;x.shadowOffsetY=fs*.07;x.strokeStyle=x.fillStyle='#3a1a4a';x.lineWidth=fs*.27;each(l=>{x.strokeText(l.ch,0,0);x.fillText(l.ch,0,0);});
  x.shadowColor='transparent';const g=x.createLinearGradient(0,height*.15,0,height*.85);g.addColorStop(0,'#b07acc');g.addColorStop(.45,'#8e5b99');g.addColorStop(1,'#5e3270');
  x.strokeStyle=x.fillStyle=g;x.lineWidth=fs*.19;each(l=>{x.strokeText(l.ch,0,0);x.fillText(l.ch,0,0);});
  x.strokeStyle='#d6a8ea88';x.lineWidth=fs*.035;each(l=>{x.save();x.translate(-fs*.025,-fs*.04);x.beginPath();x.rect(-l.w,-fs,l.w*2,fs*.75);x.clip();x.strokeText(l.ch,0,0);x.restore();});
  x.globalCompositeOperation='source-atop';for(let i=0;i<w*1.4;i++){x.fillStyle=rnd()<.5?'#512866':'#c79ce0';x.globalAlpha=.08+rnd()*.12;x.beginPath();x.ellipse(rnd()*w,rnd()*height,1+rnd()*fs*.09,1+rnd()*fs*.05,rnd()*3,0,7);x.fill();}
  x.globalAlpha=1;x.globalCompositeOperation='source-over';
  let px=fs*.25;letters.forEach((l,i)=>{if(l.ch!==' '&&rnd()<.3){const bx=px+l.w*(.3+rnd()*.4),by=height*(.3+rnd()*.4),a=rnd()*3,s=fs*.07;x.save();x.translate(bx,by);x.rotate(a);x.fillStyle='#d4a017';x.fillRect(-s*1.6,-s*.35,s*3.2,s*.7);for(const ex of[-1.6,1.6])for(const ey of[-.4,.4]){x.beginPath();x.arc(ex*s,ey*s,s*.45,0,7);x.fill();}x.restore();}px+=l.w;});
  return c;
}
export function mountChase({root,panel}){
  const phone=root.querySelector('.ar-phone'),layout=root.querySelector('.ar-layout');
  const card=document.createElement('div');card.className='ar-stage-card';card.hidden=true;layout.append(card);
  const hud=document.createElement('div');hud.className='ar-chase';hud.hidden=true;
  hud.innerHTML='<div class="ar-chase-labels"><b>COACH</b><span class="ar-chase-status"></span><b>YOU</b></div><div class="ar-chase-track" role="progressbar" aria-label="Coach catching up" aria-valuemin="0" aria-valuemax="100"><i class="ar-chase-fill"></i><svg class="ar-chase-player" viewBox="0 0 32 38" role="img" aria-label="You running"><circle cx="22" cy="5" r="4"/><path d="M19 12 14 22 23 28 29 27M15 21 10 29 3 33M19 12 11 11 6 17M18 14 24 18 29 14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  const coach=coachHand({size:46});coach.classList.add('ar-chase-coach','ch-crawl');coach.setAttribute('role','img');coach.removeAttribute('aria-hidden');coach.setAttribute('aria-label','Coach Armie');
  layout.append(hud);const track=hud.querySelector('.ar-chase-track'),status=hud.querySelector('.ar-chase-status');track.append(coach);
  const say=document.createElement('div');say.className='ar-coach-say';say.setAttribute('aria-live','polite');say.hidden=true;layout.append(say);
  const lunge=document.createElement('div');lunge.className='ar-coach-lunge';lunge.hidden=true;const big=coachElement(coachHand({size:420}));big.coach.pressure(1);lunge.append(big);layout.append(lunge);
  const tint=document.createElement('div');tint.className='ar-last-life-tint';tint.setAttribute('aria-hidden','true');layout.append(tint);
  const streaks=document.createElement('div');streaks.className='ar-speed-streaks';streaks.setAttribute('aria-hidden','true');layout.append(streaks);
  let lastPressure=-1,lastText='',lastBeat='',popTimer=0,hideTimer=0,lungeTimer=0,line=Math.floor(Math.random()*LINES.length),saying='';
  function fit(){const viewport=window.visualViewport;root.style.setProperty('--ar-viewport-height',Math.min(innerHeight,viewport?.height||innerHeight)+'px');root.style.setProperty('--ar-viewport-top',(viewport?.offsetTop||0)+'px');}
  window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);fit();
  function show(text){if(saying===text&&!say.hidden)return;saying=text;const sr=document.createElement('span');sr.className='ar-sr';sr.textContent=text;const room=Math.min(innerWidth,root.clientWidth||innerWidth)-24,h=innerWidth<420?34:44;let art=clayText(text,h);const w=parseFloat(art.style.width);if(w>room)art=clayText(text,h*room/w);say.replaceChildren(art,sr);say.hidden=false;say.classList.remove('ar-say-pop');void say.offsetWidth;say.classList.add('ar-say-pop');}
  function hide(){clearTimeout(hideTimer);say.hidden=true;saying='';}
  function chatter(on){clearTimeout(popTimer);if(!on)return;popTimer=setTimeout(()=>{line=(line+1+Math.floor(Math.random()*3))%LINES.length;show(LINES[line]);clearTimeout(hideTimer);hideTimer=setTimeout(()=>{hide();chatter(true);},2000+Math.random()*2000);},6000+Math.random()*4000);}
  function lunging(mode){clearTimeout(lungeTimer);lunge.className='ar-coach-lunge '+(mode?'ar-lunge-'+mode:'');lunge.hidden=!mode;big.coach.roll(!!mode);root.classList.toggle('ar-coach-in',!!mode);if(mode==='hit')lungeTimer=setTimeout(()=>lunging(''),1300);}
  return {phase(state){
    const playing=root.classList.contains('ar-playing'),question=state.phase==='question'||state.phase==='feedback'&&state.from==='question',up=playing&&(state.phase==='tap'||question);
    root.dataset.phase=state.phase;root.classList.toggle('ar-phone-up',up);root.classList.toggle('ar-question-up',playing&&question);
    root.classList.remove('ar-junction-mode');if(up)root.classList.remove('ar-maze-mode');
    const target=!playing||up?phone:card;if(panel.parentNode!==target)target.append(panel);
    card.hidden=!playing||up||state.phase==='run';hud.hidden=!playing||['plan','complete','win'].includes(state.phase);panel.scrollTop=0;fit();
    const hit=playing&&state.phase==='feedback'&&!state.good&&state.from!=='question',caught=playing&&state.phase==='caught';
    const beat=state.phase+'|'+state.from+'|'+state.mistakes+'|'+playing;
    if(beat!==lastBeat){lastBeat=beat;
      card.classList.toggle('ar-after-lunge',hit||caught);
      if(caught){chatter(false);clearTimeout(hideTimer);show('Coach caught you.');lunging('caught');}
      else if(hit){chatter(false);clearTimeout(hideTimer);show(state.mistakes===2?'Coach getting close.':'Coach gets closer.');lunging('hit');}
      else{lunging('');hide();chatter(playing&&['tap','run'].includes(state.phase));}
    }
  },update(state,run){
    const pressure=chasePressure(state,run),value=Math.round(pressure*100);
    if(value!==lastPressure){lastPressure=value;coach.coach.pressure(pressure);hud.style.setProperty('--coach-x',(5+pressure*83)+'%');hud.style.setProperty('--danger',value+'%');track.setAttribute('aria-valuenow',value);track.setAttribute('aria-valuetext',(3-state.mistakes)+' chances left; Coach is '+value+' percent of the way to you');}
    const text=state.phase==='tap'?'DISTANCE +'+Math.round((state.boost||0)*18)+'m':state.mistakes>=3?'COACH HAS YOU':state.mistakes===2?'LAST CHANCE · COACH IS CLOSE':(3-state.mistakes)+' CHANCES · KEEP YOUR DISTANCE';
    if(text!==lastText){lastText=text;status.textContent=text;}
    root.classList.toggle('ar-last-life',state.mistakes===2);root.classList.toggle('ar-boosting',state.phase==='tap'&&state.tapCount>0||state.phase==='run'&&!!run&&!run.paused&&run.status==='running'&&run.speed>5.2);
    return pressure;
  },destroy(){chatter(false);clearTimeout(hideTimer);clearTimeout(lungeTimer);coach.coach.destroy();big.coach.destroy();window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);}};
}
