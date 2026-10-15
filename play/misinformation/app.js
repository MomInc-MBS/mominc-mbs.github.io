import {POINTS,TIERS,STATION,BANDS,freshRun,bandIndex,normalize,lookup,beginQuestion,acceptAnswer,classify,skip,selectQuestion} from './engine.js';
import {subjects,questions} from './catalog.js';
import {createScoreStore,newRunId} from './scores.js';
import {renderScene} from './scene.js';
const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('en-US');
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE='mom-misinformation-flight-v1';
let storageAvailable=true, suggestion=null, feedback='',showHint=false;
let state=restore();
const scoreStore=createScoreStore();
let menuView=null;
function runMetadata(){
 if(typeof state.runId!=='string'||!state.runId.length||state.runId.length>150)state.runId=newRunId();
 if(!Number.isFinite(Date.parse(state.runStartedAt)))state.runStartedAt=new Date().toISOString();
}
runMetadata();
function finalizeFlight(outcome){
 if(!(state.rounds>0||state.distance>0))return;
 runMetadata();
 if(!Number.isFinite(Date.parse(state.runFinishedAt)))state.runFinishedAt=new Date(Math.max(Date.now(),Date.parse(state.runStartedAt))).toISOString();
 scoreStore.record({id:state.runId,outcome,score:state.score,distance:state.distance,hits:state.hits,
 rounds:state.rounds,pristine:state.pristine,startedAt:state.runStartedAt,finishedAt:state.runFinishedAt});
}
function scoreboardHtml(){
 const board=scoreStore.snapshot(),status={escaped:'ESCAPED',dead:'RECALLED',abandoned:'ABANDONED'};
 const rows=board.runs.slice(0,20).map((run,i)=>`<tr><th scope="row" style="text-align:left;padding:10px 4px">${i+1}</th><td style="padding:10px 4px">${safe(new Date(run.finishedAt).toLocaleDateString())}<br><small>${status[run.outcome]}</small></td><td style="text-align:right;padding:10px 4px">${fmt(run.distance)}</td><td style="text-align:right;padding:10px 4px">${fmt(run.score)}</td></tr>`).join('');
 return `<div class="screen-label"><span>FLIGHT RECORDS</span><span>THIS BROWSER ONLY</span></div><h2>Your best<br>unauthorized flights.</h2><p>This scoreboard is saved on this browser. It is not a global leaderboard. Completed flights and flights abandoned after progress are recorded.</p>${!board.available?'<p class="notice">Browser score storage is unavailable. These records are temporary for this page session.</p>':''}<div class="preflight"><span><b>${fmt(board.bestDistance)}</b>BEST KM</span><span><b>${fmt(board.bestScore)}</b>BEST SCORE</span><span><b>${board.escapes}</b>SAVED ESCAPES</span></div>${rows?`<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse"><caption style="text-align:left;margin-bottom:12px">Top ${Math.min(20,board.runs.length)} of ${board.runs.length} saved flights, ranked by distance then score. Up to 100 best flights are kept.</caption><thead><tr><th scope="col" style="text-align:left">#</th><th scope="col" style="text-align:left">SAVED / RESULT</th><th scope="col" style="text-align:right">KM</th><th scope="col" style="text-align:right">SCORE</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="notice">No finished flights yet. Launch from the play menu to set your first record.</p>'}<button class="primary" data-action="scoreboard-back" style="margin-top:20px">${state.phase==='ready'?'BACK TO PLAY MENU':'BACK TO FLIGHT DEBRIEF'} <span>&larr;</span></button>`;
}
function restore(){
 try{const s=JSON.parse(localStorage.getItem(STORAGE));
  if(s?.version===1 && ['ready','answer','classify','result','dead','escaped'].includes(s.phase)
   &&Number.isFinite(s.distance)&&s.distance>=0&&s.distance<=STATION
   &&Number.isInteger(s.hits)&&s.hits>=0&&s.hits<=3
   &&Array.isArray(s.history)&&Array.isArray(s.seen)&&typeof s.pristine==='boolean'
   &&Number.isSafeInteger(s.score)&&s.score>=0&&Number.isSafeInteger(s.rounds)&&s.rounds>=0
   &&(s.phase==='dead'?s.hits===3:s.hits<3)
   &&(s.phase!=='escaped'||(s.distance===STATION&&s.pristine))
   &&(s.phase==='ready'||questions.some(q=>q.id===s.question))
   &&(s.phase!=='classify'||questions.find(q=>q.id===s.question)?.answers.some(a=>a.id===s.answer))
   &&(s.phase!=='answer'||Number.isFinite(s.deadline)))return s;
 }catch{storageAvailable=false;}return freshRun();
}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{storageAvailable=false;}}
function q(){return questions.find(q=>q.id===state.question);}
function subject(){return subjects.find(s=>s.id===state.answer);}
function hud(){
 $('#distance').innerHTML=`${fmt(state.distance)}<small> km</small>`;$('#score').textContent=fmt(state.score);
 $('#hull').textContent=Array.from({length:3},(_,i)=>i<3-state.hits?'●':'○').join(' ');
 $('#hull').setAttribute('aria-label',`${3-state.hits} hits remaining`);$('#hull').classList.toggle('hull-damaged',state.hits>0);
 $('#progress').style.width=`${state.distance/STATION*100}%`;
 $('.progress-track').setAttribute('aria-valuenow',String(state.distance));
 $('#band-code').textContent=`LAYER ${String(bandIndex(state.distance)+1).padStart(2,'0')} / 08`;
 $('#band-name').textContent=state.phase==='escaped'?'Mother Solar Station':BANDS[bandIndex(state.distance)];$('#scene-distance').innerHTML=`${fmt(state.distance)} <small>KM</small>`;
 renderScene(state);
 $('.starfield').style.transform=`translateY(${state.distance/STATION*28}px)`;
 $('#clearance').textContent=state.phase==='escaped'?'CLEARANCE: YOU MADE IT':state.pristine?'CLEARANCE: PERFECT RUN INTACT':'CLEARANCE LOST · RESTART TO DOCK';
 $('#clearance').classList.toggle('danger',!state.pristine);
 $('#restart').hidden=state.phase==='ready';
}
function sourceLink(s){return `<a class="source-link" href="${safe(s.source)}" target="_blank" rel="noopener noreferrer">Read the evidence · ${safe(s.publisher)} ↗</a>`;}
function render({focus=false}={}){
 if(['dead','escaped'].includes(state.phase))finalizeFlight(state.phase);
 hud();let html='';
 if(state.phase==='ready')html=`<div class="screen-label"><span>FLIGHT BRIEFING</span><span>NO DAILY LIMIT</span></div><h2>Your employer<br>would prefer<br>you stayed.</h2><p class="lede">Escape MOM Inc. by naming rare answers, then separating documented history from unsupported conspiracy claims.</p><div class="preflight"><span><b>25s</b>TO NAME IT</span><span><b>3 hits</b>UNTIL RECALL</span><span><b>∞</b>RESTARTS</span></div><button class="primary warm" data-action="launch">BEGIN UNAUTHORIZED ASCENT <span>↑</span></button><p style="font-size:10px">Historical violence and abuse are discussed without graphic detail. ${subjects.length} subjects · ${questions.length} transmissions · editorial scores.</p>`;
 if(state.phase==='answer'){
  const question=q();html=`<div class="screen-label"><span>TRANSMISSION ${String(state.rounds+1).padStart(3,'0')} / NAME IT</span><span id="timer" class="timer"></span></div><h2>${safe(question.prompt)}</h2><p>Rare valid answers launch farther. Only a <b>100-point answer</b> preserves station clearance.</p>${!state.pristine?'<p class="notice">This is now a practice flight. Restart for an escape attempt.</p>':''}<form class="answer-form" id="answer-form"><label for="answer">YOUR ANSWER</label><input id="answer" name="answer" aria-describedby="answer-feedback" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="Think beyond the obvious…" required><p id="answer-feedback" aria-live="polite" class="danger">${safe(feedback)}</p><button class="primary" type="submit">TRANSMIT ANSWER <span>↑</span></button></form>${suggestion?`<button class="secondary" data-action="confirm" style="width:100%;margin-top:10px">Did you mean ${safe(suggestion.name)}? Confirm ↵</button>`:''}<div class="answer-tools"><button class="text-button" data-action="hint">${showHint?'Hide clue':'Need a clue?'}</button><button class="text-button" data-action="skip">Pass · 0 points</button></div>${showHint?`<p class="hint">${safe(question.hint)}</p>`:''}`;
 }
 if(state.phase==='classify'){
  const s=subject(),entry=q().answers.find(a=>a.id===s.id);html=`<div class="screen-label"><span>SECOND CHECK / CLASSIFY IT</span><span>NO TIMER</span></div><h2>${safe(s.name)}</h2><span class="badge">${safe(TIERS[entry.tier]).toUpperCase()} · ${POINTS[entry.tier]} POTENTIAL POINTS</span><div class="statement">${safe(s.statement)}</div><p>Classify <b>this exact statement</b>. A documented event can have unrelated conspiracy theories attached to it.</p><div class="choice-grid"><button data-action="classify" data-choice="event"><b>Documented event or fact</b><small>Supported history, science, program, or criminal case</small></button><button data-action="classify" data-choice="claim"><b>Unsupported conspiracy claim</b><small>The statement is unsupported or contradicted</small></button></div>${!state.pristine?'<p class="notice">Below top tier: station clearance is lost for this run.</p>':''}`;
 }
 if(state.phase==='result'||state.phase==='dead'||state.phase==='escaped'){
  const last=state.history.at(-1),s=subject();
  const result=last?.skipped?'<p class="result-title">No answer transmitted.</p><p>Zero points. Your hull is intact, but a perfect escape now requires a restart.</p>':last&&s?`<p class="result-title">${safe(s.name)} · ${safe(TIERS[last.tier])}</p><div class="result-score"><strong>+${last.earned}</strong><span>POINTS<br>${last.correct?`+${fmt(last.travelled??last.earned*50)} KM`:'HULL DAMAGE · −1 HIT'}</span></div><p><b>${last.correct?'Correct classification.':'That classification missed.'}</b> ${s.classification==='event'?'This exact statement is documented.':'This exact statement is an unsupported conspiracy claim.'}</p><p>${safe(s.explanation)}</p>${sourceLink(s)}`:'';
  if(state.phase==='dead')html=`<div class="screen-label"><span>EMPLOYEE RECALL COMPLETE</span><span>HULL 0 / 3</span></div><h2>Mom brought<br>you home.</h2><p>You took three hits. The flight is over.</p>${result}<button class="primary warm" data-action="restart">ESCAPE AGAIN <span>↺</span></button>`;
  else if(state.phase==='escaped')html=`<div class="screen-label"><span>MOTHER SOLAR STATION</span><span>DOCKING APPROVED</span></div><h2>You escaped.<br>She noticed.</h2><p>100,000 km. ${state.rounds} transmissions. Every accepted answer was top-tier. You reached the station with ${3-state.hits} hull hits remaining.</p>${result}<button class="primary warm" data-action="restart">START ANOTHER FLIGHT <span>↺</span></button>`;
  else html=`<div class="screen-label"><span>TRANSMISSION RECEIVED</span><span>${state.hits} / 3 HITS TAKEN</span></div><h2>${last?.skipped?'Dead air.':last?.correct?'Signal verified.':'Misinformation hit.'}</h2>${result}${!state.pristine?'<p class="notice">Station clearance lost: an answer was below 100 points or skipped. Continue practicing or restart for a perfect attempt.</p>':''}<button class="primary" data-action="next">${state.pristine?'CONTINUE ASCENT':'CONTINUE PRACTICE FLIGHT'} <span>↑</span></button>`;
 }
 if(state.phase==='ready'||['result','dead','escaped'].includes(state.phase))html+=`<button class="secondary" data-action="scoreboard" style="width:100%;margin-top:12px">VIEW THIS BROWSER'S SCOREBOARD</button>`;
 if(menuView==='scores')html=scoreboardHtml();
 $('#screen').innerHTML=html;
 if(state.phase==='answer')tick();save();
 if(focus){const target=state.phase==='answer'?$('#answer'):$('#terminal');target?.focus({preventScroll:true});if(matchMedia('(max-width:650px)').matches)$('#terminal').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});}
}
function next(){
 menuView=null;runMetadata();
 const selected=selectQuestion(state,questions);if(selected.recycled){state={...state,seen:[],cycle:state.cycle+1};}
 state=beginQuestion(state,selected.question);feedback='';showHint=false;suggestion=null;render({focus:true});
}
function commit(s){state=acceptAnswer(state,s,q());suggestion=null;feedback='';render({focus:true});}
function near(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return n+(a.length-i)+(b.length-j)<=1;}
function submit(event){
 event.preventDefault();if(state.phase!=='answer')return;if(Date.now()>=state.deadline){state=skip(state);render({focus:true});return;}
 const value=$('#answer').value.trim(),matched=lookup(value,q(),subjects);if(matched){commit(matched);return;}
 const norm=normalize(value);suggestion=norm.length>=5?subjects.find(s=>q().answers.some(a=>a.id===s.id)&&[s.name,...s.aliases].some(alias=>near(norm,normalize(alias)))):null;
 feedback=suggestion?'Possible typo. Confirm the proposed name below.':'No matching answer for this transmission. Try again; the clock is still running.';
 const previous=value;render();const input=$('#answer');if(input){input.value=previous;input.focus({preventScroll:true});}
}
function tick(){
 if(state.phase!=='answer')return;const ms=state.deadline-Date.now();if(ms<=0){state=skip(state);suggestion=null;render();return;}
 const el=$('#timer');if(el)el.textContent=`${Math.ceil(ms/1000)}s`;
}
$('#screen').addEventListener('submit',e=>{if(e.target.id==='answer-form')submit(e);});
$('#screen').addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b)return;
 switch(b.dataset.action){
  case 'launch': case 'next': next();break;
  case 'restart': restart();break;
  case 'scoreboard':if(['ready','result','dead','escaped'].includes(state.phase)){menuView='scores';render({focus:true});}break;
  case 'scoreboard-back':menuView=null;render({focus:true});break;
  case 'hint': {const v=$('#answer')?.value;showHint=!showHint;render();if($('#answer'))$('#answer').value=v??'';break;}
  case 'skip':state=skip(state);render({focus:true});break;
  case 'confirm':if(state.phase==='answer'&&Date.now()<state.deadline&&suggestion)commit(suggestion);else tick();break;
  case 'classify':if(state.phase==='classify'){state=classify(state,subject(),q(),b.dataset.choice);render({focus:true});}break;
 }
});
function restart(){if(state.phase!=='ready')finalizeFlight(['dead','escaped'].includes(state.phase)?state.phase:'abandoned');state=freshRun();runMetadata();menuView=null;suggestion=null;feedback='';render({focus:true});}
$('#restart').addEventListener('click',restart);
function archive(){const query=normalize($('#archive-search').value);const list=subjects.filter(s=>normalize(`${s.name} ${s.category} ${s.statement}`).includes(query));$('#archive-list').innerHTML=list.length?list.map(s=>`<details class="archive-item"><summary>${safe(s.name)}<small>${safe(s.category).toUpperCase()}</small></summary><p><b>Exact statement:</b> ${safe(s.statement)}</p><p>${safe(s.explanation)}</p>${sourceLink(s)}</details>`).join(''):'<p>No matching archive entries.</p>';}
$('#archive-toggle').addEventListener('click',()=>{$('#archive').hidden=!$('#archive').hidden;if(!$('#archive').hidden){archive();$('#archive').scrollIntoView({behavior:'smooth',block:'start'});$('#archive-search').focus({preventScroll:true});}});
$('#archive-close').addEventListener('click',()=>{$('#archive').hidden=true;$('#archive-toggle').focus();});
$('#archive-search').addEventListener('input',archive);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
window.addEventListener('pagehide',save);
setInterval(tick,200);
render();
if(!storageAvailable){const note=document.createElement('p');note.className='notice';note.textContent='Browser storage is unavailable. This flight will not survive a page reload.';$('.test-note').append(note);}

// The main site's download gate releases only after this module mounts.
window.MBS_LOAD?.finish().catch(()=>window.MBS_LOAD.failed());
