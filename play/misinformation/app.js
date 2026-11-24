import {STATION,LEVELS,normalize} from './engine.js';
import {subjects} from './catalog.js';
import {createScoreStore} from './scores.js';
import {renderScene} from './scene.js';
import {mountMinimaps,renderMinimaps} from './minimap.js';
import {mountFlightFX,playFlightReaction} from './flight-fx.js';
import {createFeedback} from './feedback.js';
import * as content from './education-content.js';
import {freshCourse,submitAnswer,passPrompt,pickChoice,toCommentary,continueCourse,restoreCourse,promptOf,gateOf,commentaryOf,distanceOf,GATES,STAGE_POINTS} from './education.js';
const $=s=>document.querySelector(s);
// Inside the installed app the wordmark must not navigate out to the website's TV.
if(new URLSearchParams(location.search).get('app')==='1')$('.wordmark')?.removeAttribute('href');
const fmt=n=>Math.round(n).toLocaleString('en-US');
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('.depth-chart').innerHTML=LEVELS.map((level,i)=>`<li data-stop="${i}"><b>${String(i+1).padStart(2,'0')}</b><span>${safe(level.name)}</span></li>`).join('');
$('#route-list').innerHTML=LEVELS.map((level,i)=>`<li data-stop="${i}"><b>LEVEL ${String(i+1).padStart(2,'0')}</b>${safe(level.name)}</li>`).join('');
mountMinimaps();mountFlightFX();
const sound=createFeedback();
function soundLabel(){const enabled=sound.soundEnabled();$('#sound-toggle').textContent=enabled?'Sound on':'Sound off';$('#sound-toggle').setAttribute('aria-pressed',String(enabled));}
soundLabel();
$('#sound-toggle').addEventListener('click',()=>{sound.toggleSound();soundLabel();});
// Versioned save. The old five-round flight lives under its own keys and is never
// converted into a twenty-gate record: it is parked here and only shown as legacy.
const STORAGE='mom-misinformation-education-v1';
const LEGACY_FLIGHT='mom-misinformation-flight-v1',LEGACY_PARKED='mom-misinformation-flight-legacy-v1',ARCHIVE='mom-misinformation-education-archive-v1';
let storageAvailable=true,feedback='',menuView=null;
function parkOldRuns(){
 try{
  const old=localStorage.getItem(LEGACY_FLIGHT);
  if(old){if(!localStorage.getItem(LEGACY_PARKED))localStorage.setItem(LEGACY_PARKED,old);localStorage.removeItem(LEGACY_FLIGHT);}
 }catch{storageAvailable=false;}
}
function load(){
 parkOldRuns();
 try{
  const raw=localStorage.getItem(STORAGE);if(!raw)return null;
  const s=restoreCourse(raw,content);
  if(!s){localStorage.setItem(ARCHIVE,raw);localStorage.removeItem(STORAGE);}   // other content version / damaged: keep, don't adopt
  return s;
 }catch{storageAvailable=false;return null;}
}
// course===null means the briefing screen; the first Begin starts a fresh course.
let course=load();
const scoreStore=createScoreStore();
function save(){if(!course)return;try{localStorage.setItem(STORAGE,JSON.stringify(course));}catch{storageAvailable=false;}}
function react(type,tier=0){playFlightReaction({type,tier,travelled:0,streak:0,ordinal:`${course?.runId}:${course?.promptCount}:${course?.cleared.length}`});sound.trigger({type,tier,streak:0,ordinal:`${course?.runId}:${course?.promptCount}`});}
function scoreboardHtml(){
 const board=scoreStore.snapshot(),status={escaped:'ESCAPED',dead:'RECALLED',abandoned:'ABANDONED'};
 const rows=board.runs.slice(0,20).map((run,i)=>`<tr><th scope="row" style="text-align:left;padding:10px 4px">${i+1}</th><td style="padding:10px 4px">${safe(new Date(run.finishedAt).toLocaleDateString())}<br><small>${status[run.outcome]}</small></td><td style="text-align:right;padding:10px 4px">${fmt(run.distance)}</td><td style="text-align:right;padding:10px 4px">${fmt(run.score)}</td></tr>`).join('');
 const mine=course?`<div class="preflight"><span><b>${course.cleared.length}/${GATES}</b>GATES CLEARED</span><span><b>${fmt(course.total)}</b>TOTAL SCORE</span></div>`:'';
 return `<div class="screen-label"><span>PUBLIC EDUCATION RECORD</span><span>THIS BROWSER ONLY</span></div><h2>Your progress.</h2>${mine}<p>Saved on this browser only. Not a global leaderboard.</p><h3>Legacy five-round flights</h3><p>Records from the earlier five-question version. They are kept as they were and do not count as gates.</p>${!board.available?'<p class="notice">Browser storage is unavailable.</p>':''}${rows?`<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr><th scope="col" style="text-align:left">#</th><th scope="col" style="text-align:left">SAVED / RESULT</th><th scope="col" style="text-align:right">KM</th><th scope="col" style="text-align:right">SCORE</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="notice">No legacy flights saved.</p>'}<button class="primary" data-action="scoreboard-back" style="margin-top:20px">BACK <span>&larr;</span></button>`;
}
function hud(){
 const gate=course?Math.min(GATES,course.cleared.length+(['prompt','quiz'].includes(course.phase)?1:0)):0;
 const distance=course?distanceOf(course):0;
 $('#distance').innerHTML=`${fmt(distance)}<small> km</small>`;$('#score').textContent=fmt(course?.total??0);
 $('#hull').closest('div').hidden=true;                              // no hull in the curriculum
 $('#progress').style.width=`${distance/STATION*100}%`;
 $('.progress-track').setAttribute('aria-valuenow',String(distance));
 const level=Math.min(19,Math.floor(distance/5000)),view={distance,hits:0,phase:course?.phase==='victory'?'escaped':'answer',rounds:course?.promptCount??0,score:course?.total??0,history:[]};
 $('#band-code').textContent=`GATE ${String(Math.max(1,gate)).padStart(2,'0')} / ${GATES}`;
 $('#band-name').textContent=course?.phase==='victory'?'COURSE COMPLETE':'NEXT STOP: '+LEVELS[Math.min(19,level+1)].name;
 $('#scene-distance').innerHTML=`${fmt(distance)} <small>KM</small>`;
 renderScene(view);renderMinimaps(view);
 $('.starfield').style.transform=`translateY(${distance/STATION*28}px)`;
 $('#clearance').textContent=course?(course.phase==='victory'?'PUBLIC EDUCATION PROGRAM: COMPLETE':`GATE ${gate} OF ${GATES} · ${course.stagePoints} / ${STAGE_POINTS} STAGE POINTS`):`${GATES} GATES · NO HULL · NO TIMER`;
 $('#restart').hidden=!course;
}
function closeCockpitMenu(){const menu=$('#cockpit-menu');if(menu)menu.hidden=true;$('.terminal-wrap').classList.remove('cockpit-menu-open');}
function toggleCockpitMenu(force){
 let menu=$('#cockpit-menu');
 if(!menu){menu=document.createElement('div');menu.id='cockpit-menu';menu.className='cockpit-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Flight menu');$('.terminal-wrap').append(menu);}
 const open=force??menu.hidden;
 menu.innerHTML=`<h2>Flight menu</h2><button class="primary" data-action="menu">BACK TO CHASE</button><button class="secondary" data-action="scoreboard">PROGRESS &amp; LEGACY RECORDS</button><button class="secondary" data-action="archive">SEARCH THE ARCHIVE</button><button class="secondary" data-action="sound">${sound.soundEnabled()?'SOUND ON':'SOUND OFF'}</button><button class="text-button" data-action="restart">START THE COURSE OVER</button>`;
 menu.hidden=!open;$('.terminal-wrap').classList.toggle('cockpit-menu-open',open);
}
function mountCockpitControls(){
 const controls=$('#cockpit-controls');if(!controls)return;
 controls.replaceChildren();
 const main=$('#screen .choice-grid')||$('#screen button.primary');
 if(main){
  const form=main.closest('form');if(form&&main.tagName==='BUTTON')main.setAttribute('form',form.id);
  controls.append(main);
 }
 const nav=document.createElement('nav');nav.className='cockpit-nav';nav.setAttribute('aria-label','Chase controls');
 nav.innerHTML=`${course?.phase==='prompt'&&!menuView?'<button class="text-button" data-action="skip">PASS</button>':''}<button class="text-button" data-action="menu" aria-haspopup="dialog">FLIGHT MENU</button>`;
 controls.append(nav);
}
const sourceLinks=g=>g.sources.map(s=>{let ok=false;try{ok=new URL(s.url).protocol==='https:';}catch{}return ok?`<a class="source-link" href="${safe(s.url)}" target="_blank" rel="noopener noreferrer">${safe(s.title)} ↗</a>`:'';}).join('');
function render({focus=false}={}){
 hud();let html='';
 const phase=course?.phase??'ready';
 document.body.dataset.flight=phase;
 if(phase==='ready')html=`<div class="screen-label"><span>MOM'S PUBLIC EDUCATION PROGRAM</span><span>${GATES} GATES</span></div><h2>Your employer<br>would prefer<br>you stayed.</h2><p class="lede">Name easy things while the saucer escapes. At 100 points, QUIZ TIME opens a real history gate. Clear all ${GATES} to finish the course.</p><div class="preflight"><span><b>${GATES}</b>GATES</span><span><b>100</b>POINTS EACH</span><span><b>0</b>HULL HITS</span></div><button class="primary warm" data-action="launch">BEGIN THE COURSE <span>↑</span></button><p style="font-size:11px">No timer and no game over. Wrong quiz picks just try again. Progress is saved on this device and works offline.</p><p style="font-size:10px">Includes non-graphic discussion of historical atrocities and abuses, with sources. MOM's commentary is fictional character dialogue.</p>`;
 if(phase==='prompt'){
  const p=promptOf(course,content);
  html=`<div class="screen-label"><span>GATE ${course.cleared.length+1} OF ${GATES} / NAME IT</span><span id="timer" class="timer">${course.stagePoints} / ${STAGE_POINTS}</span></div><span class="question-topic">Easy question</span><h2>${safe(p.prompt)}</h2><p>Common answers earn 10 points. Rarer ones earn more. At ${STAGE_POINTS}, QUIZ TIME opens.</p><form class="answer-form" id="answer-form"><label for="answer">YOUR ANSWER</label><input id="answer" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="Type your answer…" required><p id="answer-feedback" role="status" aria-live="polite" class="danger">${safe(feedback)}</p><button class="primary" type="submit">TRANSMIT ANSWER <span>↑</span></button></form>`;
 }
 if(phase==='quiz'){
  const g=gateOf(course,content);
  html=`<div class="screen-label"><span>QUIZ TIME · GATE ${course.stage+1} OF ${GATES}</span><span>NO TIMER</span></div><span class="badge">QUIZ TIME</span><span class="question-topic">${safe(g.topic)}</span><h2>${safe(g.question)}</h2>${course.wrong.length?'<p class="danger" role="status">Not that one. Some options are MOM\'s invented nonsense, not history. Choose again; nothing is lost.</p>':'<p>Choose the documented answer. Wrong picks cost nothing.</p>'}<div class="choice-grid">${g.choices.map(c=>`<button data-action="choice" data-choice="${safe(c.id)}" ${course.wrong.includes(c.id)?'disabled aria-disabled="true"':''}><b>${safe(c.label)}</b></button>`).join('')}</div>`;
 }
 if(phase==='lesson'){
  const g=gateOf(course,content);
  html=`<div class="screen-label"><span>GATE ${course.stage+1} CLEARED</span><span>${safe(g.evidenceStatus.toUpperCase())}</span></div><h2>${safe(g.topic)}</h2><section class="statement" aria-label="Sourced explanation"><p>${safe(g.factualExplanation)}</p></section><p>${sourceLinks(g)}</p><p style="font-size:10px">Sources checked ${safe(g.sources[0].checkedDate)}. Opening a source needs a connection; this explanation is saved for offline use.</p><button class="primary" data-action="commentary">MOM'S COMMENTARY <span>→</span></button>`;
 }
 if(phase==='commentary'){
  const g=gateOf(course,content),last=course.stage===GATES-1;
  html=`<div class="screen-label"><span>MOM'S COMMENTARY</span><span>FICTIONAL CHARACTER</span></div><section class="statement" aria-label="MOM's commentary"><p><b>MOM'S COMMENTARY</b></p><p>“${safe(commentaryOf(g))}”</p><small>${safe(g.momLineLabel||'Fictional character dialogue')}</small></section><button class="primary warm" data-action="continue">${last?'FINISH THE COURSE':'CONTINUE'} <span>↑</span></button>`;
 }
 if(phase==='victory')html=`<div class="screen-label"><span>MOM'S PUBLIC EDUCATION PROGRAM</span><span>COURSE COMPLETE</span></div><h2>All ${GATES} gates.<br>She noticed.</h2><p>You cleared every gate with ${fmt(course.total)} points. Mother would still like you home, darling.</p><button class="primary warm" data-action="restart">START THE COURSE AGAIN <span>↺</span></button>`;
 if(menuView==='scores')html=scoreboardHtml();
 const stage={ready:-1,prompt:0,quiz:1,lesson:2,commentary:2,victory:2}[phase];
 const flow=phase!=='ready'&&!menuView?`<div class="question-flow" aria-label="Gate steps">${['01 NAME IT','02 QUIZ TIME','03 LEARN'].map((name,i)=>`<span class="${stage===i?'active':''}">${name}</span>`).join('')}</div>`:'';
 $('#screen').innerHTML=flow+html;
 document.body.dataset.panel=menuView||'flight';
 mountCockpitControls();save();
 if(focus&&!matchMedia('(max-width:650px)').matches){const target=phase==='prompt'?$('#answer'):$('#terminal');target?.focus({preventScroll:true});}
}
function submit(event){
 event.preventDefault();if(course?.phase!=='prompt')return;
 const input=$('#answer'),value=input.value.trim();
 const {state,result}=submitAnswer(course,value,content);
 if(result.ok){course=state;feedback='';render({focus:true});react(result.quiz?'launch':'accept',result.tier);return;}
 // Unknown answers are never graded as false. The judge worker only knows the
 // archive prompts, so here we give an example instead of a fake verdict.
 feedback=result.reason==='duplicate'?`“${result.name}” already counted at this gate. Try a different answer.`
  :value.length<2?'Type an answer of at least two letters.'
  :`I don't have “${value}” for this one yet. No points lost. Try something like “${result.example}”, or tap PASS for a new question.`;
 render();react('reject');const again=$('#answer');if(again){again.value=value;again.focus({preventScroll:true});}
}
$('#screen').addEventListener('submit',e=>{if(e.target.id==='answer-form')submit(e);});
document.addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b)return;
 switch(b.dataset.action){
  case 'menu': toggleCockpitMenu();break;
  case 'archive': closeCockpitMenu();$('#archive-toggle').click();break;
  case 'sound': $('#sound-toggle').click();toggleCockpitMenu(true);break;
  case 'launch': closeCockpitMenu();if(!course){course=freshCourse(content);feedback='';render({focus:true});playFlightReaction({type:'depart'});}break;
  case 'skip': if(course?.phase==='prompt'){course=passPrompt(course,content);feedback='';render({focus:true});react('pass');}break;
  case 'choice':{
   if(course?.phase!=='quiz')break;
   const {state,result}=pickChoice(course,b.dataset.choice,content);course=state;save();
   render({focus:true});react(result.ok?(result.victory?'win':'launch'):'hit',result.ok?5:0);break;}
  case 'commentary': if(course?.phase==='lesson'){course=toCommentary(course);render({focus:true});}break;
  case 'continue': if(course?.phase==='commentary'){course=continueCourse(course,content);feedback='';render({focus:true});playFlightReaction({type:'depart'});}break;
  case 'restart': closeCockpitMenu();restart();break;
  case 'scoreboard': closeCockpitMenu();menuView='scores';render({focus:true});break;
  case 'scoreboard-back':menuView=null;render({focus:true});break;
 }
});
function restart(){
 if(course&&course.phase!=='victory'&&course.cleared.length>0&&!confirm('Start the course over? Your cleared gates will be archived on this device.'))return;
 try{if(course)localStorage.setItem(ARCHIVE,JSON.stringify(course));localStorage.removeItem(STORAGE);}catch{storageAvailable=false;}
 course=null;menuView=null;feedback='';render({focus:true});
}
$('#restart').addEventListener('click',restart);
const sourceLink=s=>`<a class="source-link" href="${safe(s.source)}" target="_blank" rel="noopener noreferrer">Read the evidence · ${safe(s.publisher)} ↗</a>`;
function archive(){const query=normalize($('#archive-search').value);const list=subjects.filter(s=>normalize(`${s.name} ${s.category} ${s.statement}`).includes(query));$('#archive-list').innerHTML=list.length?`<p class="notice">${list.length.toLocaleString('en-US')} matching answers${list.length>100?' / showing the first 100. Search to narrow the archive.':'.'}</p>`+list.slice(0,100).map(s=>`<details class="archive-item"><summary>${safe(s.name)}<small>${safe(s.category).toUpperCase()}</small></summary><p><b>${s.classificationMode==='topic'?'Topic description':'Exact statement'}:</b> ${safe(s.statement)}</p><p>${safe(s.explanation)}</p>${sourceLink(s)}</details>`).join(''):'<p>No matching archive entries.</p>';}
$('#archive-toggle').addEventListener('click',()=>{$('#archive').hidden=!$('#archive').hidden;if(!$('#archive').hidden){archive();if(!matchMedia('(max-width:650px)').matches)$('#archive').scrollIntoView({behavior:'smooth',block:'start'});$('#archive-search').focus({preventScroll:true});}});
$('#archive-close').addEventListener('click',()=>{$('#archive').hidden=true;$('#archive-toggle').focus();});
$('#archive-search').addEventListener('input',archive);
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeCockpitMenu();$('#archive').hidden=true;}});
window.addEventListener('pagehide',save);
render();
if(!storageAvailable){const note=document.createElement('p');note.className='notice';note.textContent='Browser storage is unavailable. Progress will not survive a page reload.';$('.test-note').append(note);}

// The main site's download gate releases only after this module mounts.
window.MBS_LOAD?.finish().catch(()=>window.MBS_LOAD.failed());
