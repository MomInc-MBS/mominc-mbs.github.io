import {POINTS,TIERS,STATION,LEVELS,levelIndex,migrateRun,freshRun,normalize,lookup,beginQuestion,acceptAnswer,classify,skip,selectQuestion} from './engine.js';
import {subjects,questions} from './catalog.js';
import {createScoreStore,newRunId} from './scores.js';
import {renderScene} from './scene.js';
import {createQuestionDeck} from './deck.js';
import {judgeAnswer,cleanSavedJudgments,questionWithJudgments} from './judge.js';
import {createStoryDraft,fillStory,STORY_TEMPLATES,STORY_LIMITS} from './stories.js';
import {mountMinimaps,renderMinimaps} from './minimap.js';
import {mountFlightFX,playFlightReaction,reactionFor} from './flight-fx.js';
import {createFeedback} from './feedback.js';
import {openTransmission,namingClock,suggestCorrection} from './question-flow.js';
const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('en-US');
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('.depth-chart').innerHTML=LEVELS.map((level,i)=>`<li data-stop="${i}"><b>${String(i+1).padStart(2,'0')}</b><span>${safe(level.name)}</span></li>`).join('');
$('#route-list').innerHTML=LEVELS.map((level,i)=>`<li data-stop="${i}"><b>LEVEL ${String(i+1).padStart(2,'0')}</b>${safe(level.name)}</li>`).join('');
mountMinimaps();mountFlightFX();
const sound=createFeedback();
function soundLabel(){const enabled=sound.soundEnabled();$('#sound-toggle').textContent=enabled?'Sound on':'Sound off';$('#sound-toggle').setAttribute('aria-pressed',String(enabled));}
soundLabel();
$('#sound-toggle').addEventListener('click',()=>{sound.toggleSound();soundLabel();});
const STORAGE='mom-misinformation-flight-v1';
let storageAvailable=true, suggestion=null, feedback='',showHint=false,checking=null;
let state=restore();
const questionDeck=createQuestionDeck(questions.map(q=>q.id),undefined,
 [...state.history.map(h=>h?.question),state.question].filter(id=>typeof id==='string'));
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
   &&(s.phase!=='escaped'||s.distance===STATION)
   &&(s.phase==='ready'||questions.some(q=>q.id===s.question))
   &&(s.phase!=='answer'||Number.isFinite(s.deadline))){
    s.verifiedAnswers=cleanSavedJudgments(s.verifiedAnswers,new Set(questions.map(q=>q.id)));
    s.draft=typeof s.draft==='string'?s.draft.slice(0,120):'';
    if(s.phase==='classify'&&!questionWithJudgments(questions.find(q=>q.id===s.question),s.verifiedAnswers)?.answers.some(a=>a.id===s.answer))return freshRun();
    return migrateRun(s);
   }
 }catch{storageAvailable=false;}return freshRun();
}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{storageAvailable=false;}}
function q(){return questionWithJudgments(questions.find(q=>q.id===state.question),state.verifiedAnswers);}
function flightSubjects(){return [...subjects,...(state.verifiedAnswers??[]).map(e=>e.subject).filter(s=>!subjects.some(a=>a.id===s.id))];}
function subject(){return flightSubjects().find(s=>s.id===state.answer);}
function hud(){
 $('#distance').innerHTML=`${fmt(state.distance)}<small> km</small>`;$('#score').textContent=fmt(state.score);
 $('#hull').textContent=Array.from({length:3},(_,i)=>i<3-state.hits?'●':'○').join(' ');
 $('#hull').setAttribute('aria-label',`${3-state.hits} hits remaining`);$('#hull').classList.toggle('hull-damaged',state.hits>0);
 $('#progress').style.width=`${state.distance/STATION*100}%`;
 $('.progress-track').setAttribute('aria-valuenow',String(state.distance));
 $('#band-code').textContent=`LEVEL ${String(levelIndex(state.distance)+1).padStart(2,'0')} / 20`;
 $('#band-name').textContent=state.phase==='escaped'?'YOU ESCAPED':'NEXT STOP: '+(LEVELS[Math.min(19,levelIndex(state.distance)+1)].name);$('#scene-distance').innerHTML=`${fmt(state.distance)} <small>KM</small>`;
 renderScene(state);
 renderMinimaps(state);
 $('.starfield').style.transform=`translateY(${state.distance/STATION*28}px)`;
 $('#clearance').textContent=state.phase==='escaped'?'MOTHERSHIP DESK: YOU MADE IT':`LEVEL ${levelIndex(state.distance)+1} OF 20 · EVERY CORRECT ANSWER COUNTS`;
 $('#clearance').classList.toggle('danger',state.hits===2);
 $('#restart').hidden=state.phase==='ready';
}
function sourceLink(s){return `<a class="source-link" href="${safe(s.source)}" target="_blank" rel="noopener noreferrer">Read the evidence · ${safe(s.publisher)} ↗</a>`;}
function streak(){let n=0;for(const item of [...state.history].reverse()){if(!item.correct)break;n++;}return n;}
function react(type,entry={}){
 const event={type,tier:entry.tier??0,travelled:entry.travelled??0,streak:streak(),ordinal:`${state.runId}:${state.rounds}`};
 playFlightReaction(event);sound.trigger(event);
}
function resolvePass(){state=skip(state);render({focus:true});react('pass');}
function storyHtml(){
 if(!state.storyDraft||!STORY_TEMPLATES.some(t=>t.id===state.storyDraft.templateId)||!Array.isArray(state.storyDraft.slots)||state.storyDraft.slots.length>STORY_LIMITS.maxSlots||state.storyDraft.slots.some(s=>!s||typeof s.id!=='string'||typeof s.type!=='string')){state.storyDraft=createStoryDraft(state.history,flightSubjects());state.storyValues={};state.storyFinished=false;}
 const draft=state.storyDraft;
 return `<div class="screen-label"><span>DEPARTMENT OF CREATIVE ACCOUNTING</span><span>AD-LIB REPORT</span></div><h2>${safe(draft.title)}</h2><p>Your flight answers fill matching word types. Add the missing words or change any blank, then assemble the report.</p><p class="fiction-label">FICTIONAL INCIDENT REPORT · AUTOMATIC WORDPLAY. These combinations are made-up satire, not claims about real people or events.</p>${state.storyFinished?`<div id="story-output" class="story-output" role="status">${safe(fillStory(draft,state.storyValues))}</div><div class="story-tools"><button class="secondary" data-action="story-edit">EDIT THE BLANKS</button><button class="secondary" data-action="story-copy">COPY STORY</button></div>`:`<form id="story-form" class="story-form">${draft.slots.map(slot=>`<label>${safe(slot.label||slot.type).toUpperCase()}<input name="${safe(slot.id)}" value="${safe(state.storyValues?.[slot.id]??slot.value??'')}" maxlength="${STORY_LIMITS.maxInputLength}" placeholder="${safe(slot.type)}" autocomplete="off"><small>${slot.fromAnswer?'FROM YOUR FLIGHT ANSWER':`ADD ${/^[aeiou]/i.test(slot.type)?'AN':'A'} ${safe(slot.type).toUpperCase()}`}</small></label>`).join('')}<button class="primary warm" type="submit">ASSEMBLE INCIDENT REPORT <span>↵</span></button></form>`}<p id="story-feedback" class="fiction-label" role="status"></p><div class="story-tools"><button class="secondary" data-action="story-remix">ANOTHER TEMPLATE</button><button class="secondary" data-action="story-back">BACK TO FLIGHT</button></div>`;
}
function render({focus=false}={}){
 if(['dead','escaped'].includes(state.phase))finalizeFlight(state.phase);
 hud();let html='';
 document.body.dataset.flight=state.phase;
 if(state.phase==='ready')html=`<div class="screen-label"><span>FLIGHT BRIEFING</span><span>20 PLACES TO ESCAPE THROUGH</span></div><h2>Your employer<br>would prefer<br>you stayed.</h2><p class="lede">From the office desk to the edge of the page. Name something that fits, then separate documented facts from unsupported claims.</p><div class="preflight"><span><b>35s</b>TO NAME IT</span><span><b>3 hits</b>UNTIL RECALL</span><span><b>20</b>PAPER WORLDS</span></div><button class="primary warm" data-action="launch">BEGIN UNAUTHORIZED ASCENT <span>↑</span></button><p style="font-size:11px">Common correct answers clear a level. Rare answers go farther. Every flight can reach MOM's Mothership Desk.</p><p style="font-size:10px">${subjects.length} sourced answers · ${questions.length} broad questions. Unlisted answers are sent to the hosted answer judge with the current prompt, never your flight history. Historical violence is discussed without graphic detail.</p>`;
 if(state.phase==='answer'){
  const question=q(),preview=namingClock(state).phase==='preview',locked=checking||preview;html=`<div class="screen-label"><span>TRANSMISSION ${String(state.rounds+1).padStart(3,'0')} / ${preview?'READ THE PROMPT':'NAME IT'}</span><span id="timer" class="timer"></span></div><span class="question-topic">${safe(question.topic||question.family||'The signal')}</span><h2>${safe(question.prompt)}</h2><p>${preview?'Read it first. Your 35 seconds start after the countdown.':'Name one. Uncommon answers fly farther.'}</p><form class="answer-form" id="answer-form" data-rejected="${!!feedback&&!suggestion&&!checking}"><label for="answer">YOUR ANSWER</label><input id="answer" name="answer" value="${safe(state.draft??'')}" aria-describedby="answer-feedback" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="Type your answer…" ${locked?'disabled':''} required><p id="answer-feedback" role="status" aria-live="polite" class="${checking?'judge-status':'danger'}">${checking?'Checking the evidence and prompt fit. Your timer is paused.':safe(feedback)}</p><button class="primary" type="submit" ${locked?'disabled':''}>${checking?'CHECKING ANSWER…':preview?'STAND BY…':'TRANSMIT ANSWER'} <span>↑</span></button></form>${suggestion?`<button class="secondary" data-action="confirm" style="width:100%;margin-top:10px">Confirm ${safe(suggestion.name)} ↵</button>`:''}<div class="answer-tools"><button class="text-button" data-action="hint" ${locked?'disabled':''}>${showHint?'Hide clue':'Need a clue?'}</button><button class="text-button" data-action="skip" ${locked?'disabled':''}>Pass · 0 points</button></div>${showHint?`<p class="hint">${safe(question.hint)}</p>`:''}`;
 }
 if(state.phase==='classify'){
  const s=subject(),entry=q().answers.find(a=>a.id===s.id);html=`<div class="screen-label"><span>ANSWER LOCKED / CHECK IT</span><span>NO TIMER</span></div><h2>${safe(s.name)}</h2><span class="badge">${safe(TIERS[entry.tier]).toUpperCase()} · ${POINTS[entry.tier]} POTENTIAL POINTS</span><div class="tier-ladder" aria-label="Rarity tier ${entry.tier+1} of 6">${Array.from({length:6},(_,i)=>`<span class="${i<=entry.tier?'lit':''}"></span>`).join('')}</div><div class="statement">${safe(s.statement)}</div><p>Judge <b>this exact statement</b>. A record about a theory does not prove the theory.</p><div class="choice-grid"><button data-action="classify" data-choice="event"><b>Documented event or fact</b><small>Supported history, science, program, or criminal case</small></button><button data-action="classify" data-choice="claim"><b>Unsupported claim</b><small>The statement is unsupported or contradicted</small></button></div>`;
 }
 if(state.phase==='result'||state.phase==='dead'||state.phase==='escaped'){
  const last=state.history.at(-1),s=subject();
  const priorLevel=levelIndex(state.distance-(last?.travelled??0)),currentLevel=levelIndex(state.distance);
  const arrival=last?.correct&&currentLevel>priorLevel?`<p class="arrival"><b>LEVEL ${currentLevel+1} / 20</b> ${safe(LEVELS.slice(priorLevel+1,currentLevel+1).map(l=>l.name).join(' → '))}</p>`:'';
  const result=last?.skipped?'<p class="result-title">No answer transmitted.</p><p>Zero points. Your hull is intact. The next correct answer can keep your escape moving.</p>':last&&s?`<p class="result-title">${safe(s.name)} · ${safe(TIERS[last.tier])}</p><div class="result-score"><strong>+${last.earned}</strong><span>POINTS<br>${last.correct?`+${fmt(last.travelled??last.earned*50)} KM`:'HULL DAMAGE · −1 HIT'}</span></div>${last.correct?`<p class="result-quip">${safe(reactionFor({type:'launch',tier:last.tier}).quip)}${streak()>1?` <b>${streak()} correct signals in a row.</b>`:''}</p>`:''}${arrival}<details class="evidence-reveal"><summary>Why ${last.correct?'that checked out':'the hull took a hit'} · read the evidence</summary><p><b>${last.correct?'Correct classification.':'That classification missed.'}</b> ${s.classification==='event'?'This exact statement is documented.':'This exact statement is unsupported or contradicted by the evidence.'}</p><p>${safe(s.explanation)}</p>${sourceLink(s)}</details>`:'';
  if(state.phase==='dead')html=`<div class="screen-label"><span>EMPLOYEE RECALL COMPLETE</span><span>HULL 0 / 3</span></div><h2>Mom brought<br>you home.</h2><p>You took three hits. The flight is over.</p>${result}<button class="primary warm" data-action="restart">ESCAPE AGAIN <span>↺</span></button>`;
  else if(state.phase==='escaped')html=`<div class="screen-label"><span>MOM'S MOTHERSHIP DESK</span><span>DOCKING APPROVED</span></div><h2>You escaped.<br>She noticed.</h2><p>All 20 stops. ${state.rounds} transmissions. You reached MOM's Mothership Desk with ${3-state.hits} hull hits remaining.</p>${result}<button class="primary warm" data-action="restart">START ANOTHER FLIGHT <span>↺</span></button>`;
  else html=`<div class="screen-label"><span>TRANSMISSION RECEIVED</span><span>${state.hits} / 3 HITS TAKEN</span></div><h2>${last?.skipped?'Dead air.':last?.correct?'Signal verified.':'Misinformation hit.'}</h2>${result}<button class="primary" data-action="next">CONTINUE ESCAPE <span>↑</span></button>`;
 }
 if(state.phase==='ready'||['result','dead','escaped'].includes(state.phase))html+=`<button class="secondary" data-action="scoreboard" style="width:100%;margin-top:12px">VIEW THIS BROWSER'S SCOREBOARD</button>`;
 if(['result','dead','escaped'].includes(state.phase)&&state.history.some(h=>h.subject))html+=`<button class="secondary" data-action="story" style="width:100%;margin-top:10px">TURN MY ANSWERS INTO AN AD-LIB <span>↗</span></button>`;
 if(menuView==='scores')html=scoreboardHtml();
 if(menuView==='story')html=storyHtml();
 const stage=state.phase==='answer'?0:state.phase==='classify'?1:2;
 const flow=state.phase!=='ready'&&!menuView?`<div class="question-flow" aria-label="Answer steps">${['01 NAME IT','02 CHECK IT','03 LAUNCH'].map((name,i)=>`<span class="${stage===i?'active':''}">${name}</span>`).join('')}</div>`:'';
 $('#screen').innerHTML=flow+html;
 if(state.phase==='answer')tick();save();
 if(focus){const target=state.phase==='answer'?$('#answer'):$('#terminal');target?.focus({preventScroll:true});if(matchMedia('(max-width:650px)').matches)$('#terminal').scrollIntoView({behavior:'instant',block:'start'});}
}
function next(){
 menuView=null;runMetadata();
 const selected=selectQuestion({...state,recentQuestions:questionDeck.recent()},questions);
 questionDeck.remember(selected.question.id);
 if(selected.recycled){state={...state,seen:[],cycle:state.cycle+1};}
 state=openTransmission(state,selected.question);feedback='';showHint=false;suggestion=null;render({focus:true});playFlightReaction({type:'depart'});
}
function commit(s){const typed=$('#answer')?.value?.trim();state={...acceptAnswer(state,s,q()),answerText:typed||s.name};suggestion=null;feedback='';render({focus:true});react('accept',{tier:q().answers.find(a=>a.id===s.id)?.tier});}
async function submit(event,autoTimeout=false){
 event.preventDefault();if(state.phase!=='answer'||checking||namingClock(state).phase==='preview')return;if(Date.now()>=state.deadline&&!autoTimeout){tick();return;}
 const value=$('#answer').value.trim();state.draft=value;const matched=lookup(value,q(),flightSubjects());if(matched){commit(matched);return;}
 suggestion=autoTimeout?null:suggestCorrection(value,q(),flightSubjects());
 if(suggestion){feedback=`“${value}” → “${suggestion.name}”. Press Enter again to confirm, or edit it.`;state.draft=suggestion.name;render();const input=$('#answer');if(input){input.value=suggestion.name;input.focus({preventScroll:true});}return;}
 if(value.length<2){if(autoTimeout){resolvePass();return;}feedback='Use a subject name with at least two characters.';render();if(state.phase==='answer')react('reject');return;}
 const request={controller:new AbortController(),runId:state.runId,questionId:state.question,remaining:Math.max(0,state.deadline-Date.now())};checking=request;
 // Reloading during an interrupted lookup gets no more than the same bounded lookup allowance.
 state={...state,deadline:state.deadline+18000};render();$('#answer').value=value;
 try{
  const response=await judgeAnswer(value,request.questionId,{signal:request.controller.signal});
  if(checking!==request||state.runId!==request.runId||state.question!==request.questionId)return;
  state={...state,deadline:Date.now()+request.remaining};checking=null;
  if(response.entry){
   state={...state,verifiedAnswers:[...(state.verifiedAnswers??[]).filter(e=>!(e.questionId===request.questionId&&e.subject.id===response.entry.subject.id)),response.entry].slice(-100)};
   commit(response.entry.subject);return;
  }
  feedback=response.reason;
 }catch(error){
  if(checking!==request)return;
  state={...state,deadline:Date.now()+request.remaining};checking=null;
  feedback=error.name==='AbortError'?'The answer desk timed out. Your answer time is preserved; retry or try another name.':error.message;
 }
 render();if(state.phase==='answer'){react('reject');const input=$('#answer');if(input){input.value=value;input.focus({preventScroll:true});}}
}
function tick(){
 if(state.phase!=='answer')return;if(checking){const el=$('#timer');if(el)el.textContent='PAUSED';return;}
 const clock=namingClock(state),el=$('#timer');
 if(clock.phase==='preview'){if(el)el.textContent=String(clock.seconds);return;}
 if(state.previewUntil){delete state.previewUntil;render({focus:true});return;}
 if(clock.phase==='expired'){
  if(!state.namingAutoSubmitted&&$('#answer')?.value.trim()){state.namingAutoSubmitted=true;submit({preventDefault(){}},true);return;}
  suggestion=null;resolvePass();return;
 }
 if(el){el.textContent=`${clock.seconds}s`;el.dataset.urgent=String(clock.seconds<=8);}
}
$('#screen').addEventListener('submit',e=>{
 if(e.target.id==='answer-form')submit(e);
 if(e.target.id==='story-form'){e.preventDefault();state.storyValues=Object.fromEntries(new FormData(e.target));state.storyFinished=true;render({focus:true});}
});
$('#screen').addEventListener('input',e=>{
 if(e.target.id==='answer'){state.draft=e.target.value.slice(0,120);save();sound.trigger({type:'typing'});if(suggestion&&normalize(e.target.value)!==normalize(suggestion.name)){suggestion=null;feedback='';$('#answer-feedback').textContent='';$('#screen [data-action="confirm"]')?.remove();}}
 if(e.target.closest('#story-form')&&e.target.name){state.storyValues={...state.storyValues,[e.target.name]:e.target.value};save();}
});
$('#screen').addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b)return;
 switch(b.dataset.action){
  case 'launch': case 'next': next();break;
  case 'restart': restart();break;
  case 'scoreboard':if(['ready','result','dead','escaped'].includes(state.phase)){menuView='scores';render({focus:true});}break;
  case 'scoreboard-back':menuView=null;render({focus:true});break;
  case 'story':menuView='story';render({focus:true});break;
  case 'story-back':menuView=null;render({focus:true});break;
  case 'story-edit':state.storyFinished=false;render({focus:true});break;
  case 'story-remix':{const previous=state.storyDraft?.templateId;for(let i=0;i<5;i++){state.storyDraft=createStoryDraft(state.history,flightSubjects());if(state.storyDraft.templateId!==previous)break;}state.storyValues={};state.storyFinished=false;render({focus:true});break;}
  case 'story-copy':navigator.clipboard?.writeText(fillStory(state.storyDraft,state.storyValues)).then(()=>{$('#story-feedback').textContent='Story copied.';}).catch(()=>{$('#story-feedback').textContent='Select the story text to copy it on this browser.';});break;
  case 'hint': {const v=$('#answer')?.value;showHint=!showHint;render();if($('#answer'))$('#answer').value=v??'';break;}
  case 'skip':if(!checking&&namingClock(state).phase!=='preview')resolvePass();break;
  case 'confirm':if(state.phase==='answer'&&Date.now()<state.deadline&&suggestion)commit(suggestion);else tick();break;
  case 'classify':if(state.phase==='classify'){const chosen=subject(),typed=state.answerText;state=classify(state,chosen,q(),b.dataset.choice);Object.assign(state.history.at(-1),{typedAnswer:typed||chosen.name,subjectName:chosen.name});delete state.storyDraft;state.storyFinished=false;render({focus:true});react(state.phase==='escaped'?'win':state.history.at(-1).correct?'launch':'hit',state.history.at(-1));}break;
 }
});
function restart(){checking?.controller.abort();checking=null;if(state.phase!=='ready')finalizeFlight(['dead','escaped'].includes(state.phase)?state.phase:'abandoned');state=freshRun();runMetadata();menuView=null;suggestion=null;feedback='';render({focus:true});}
$('#restart').addEventListener('click',restart);
function archive(){const query=normalize($('#archive-search').value);const list=subjects.filter(s=>normalize(`${s.name} ${s.category} ${s.statement}`).includes(query));$('#archive-list').innerHTML=list.length?list.map(s=>`<details class="archive-item"><summary>${safe(s.name)}<small>${safe(s.category).toUpperCase()}</small></summary><p><b>Exact statement:</b> ${safe(s.statement)}</p><p>${safe(s.explanation)}</p>${sourceLink(s)}</details>`).join(''):'<p>No matching archive entries.</p>';}
$('#archive-toggle').addEventListener('click',()=>{$('#archive').hidden=!$('#archive').hidden;if(!$('#archive').hidden){archive();$('#archive').scrollIntoView({behavior:'smooth',block:'start'});$('#archive-search').focus({preventScroll:true});}});
$('#archive-close').addEventListener('click',()=>{$('#archive').hidden=true;$('#archive-toggle').focus();});
$('#archive-search').addEventListener('input',archive);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&state.phase==='result'&&!menuView&&!event.target.closest('button,input,textarea,a,summary')){event.preventDefault();next();}});
window.addEventListener('pagehide',save);
setInterval(tick,200);
render();
if(!storageAvailable){const note=document.createElement('p');note.className='notice';note.textContent='Browser storage is unavailable. This flight will not survive a page reload.';$('.test-note').append(note);}

// The main site's download gate releases only after this module mounts.
window.MBS_LOAD?.finish().catch(()=>window.MBS_LOAD.failed());
