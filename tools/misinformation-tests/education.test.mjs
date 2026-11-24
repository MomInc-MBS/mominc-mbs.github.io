import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../../play/misinformation/education-content.js';
import {freshCourse,submitAnswer,pickChoice,toCommentary,continueCourse,passPrompt,promptOf,gateOf,restoreCourse,lookupAnswer,distanceOf,GATES} from '../../play/misinformation/education.js';

const common=(s,skip=[])=>promptOf(s,content).answers.find(a=>a.tier===0&&!s.stageAnswers.includes(a.name.toLowerCase())&&!skip.includes(a.name));
const right=s=>gateOf(s,content).acceptedAnswerIds[0];
function fillStage(s){let n=0;while(s.phase==='prompt'){s=submitAnswer(s,common(s).name,content).state;n++;}return {s,n};}
function playGate(s){const f=fillStage(s);let t=pickChoice(f.s,right(f.s),content);return toCommentary(t.state);}

test('content: 20 gates, one accepted id each, 4 options, sources bundled',()=>{
 assert.equal(content.gates.length,20);
 for(const g of content.gates){assert.equal(g.choices.length,4);assert.equal(g.acceptedAnswerIds.length,1);assert.ok(g.sources.length&&g.factualExplanation&&g.momLine);}
});
test('common answers alone reach every gate and win; ten 10-point answers per gate',()=>{
 let s=freshCourse(content,{seed:7});
 for(let i=0;i<GATES;i++){
  const f=fillStage(s);assert.equal(f.n,10);assert.equal(f.s.phase,'quiz');assert.equal(f.s.stagePoints,100);
  s=continueCourse(toCommentary(pickChoice(f.s,right(f.s),content).state),content);
 }
 assert.equal(s.phase,'victory');assert.equal(s.cleared.length,20);assert.equal(s.total,2000);assert.equal(distanceOf(s),100000);
});
test('no score skips a quiz; rare 100 answer opens the quiz and overflow is not carried',()=>{
 let s=freshCourse(content,{seed:3});
 const rare=promptOf(s,content).answers.find(a=>a.tier===5);
 let r=submitAnswer(s,rare.name,content);
 assert.equal(r.state.phase,'quiz');
 // quiz open: typed answers are refused, stage cannot advance without the right pick
 assert.equal(submitAnswer(r.state,'red',content).result.ok,false);
 assert.equal(continueCourse(r.state,content).phase,'quiz');
 assert.equal(r.state.stage,0);
 // overflow: 90 stage points + 100 never exceeds 100, total keeps raw
 s=freshCourse(content,{seed:3});
 for(let i=0;i<9;i++)s=submitAnswer(s,common(s).name,content).state;
 const rare2=promptOf(s,content).answers.find(a=>a.tier===5);
 r=submitAnswer(s,rare2.name,content);
 assert.equal(r.state.stagePoints,100);assert.equal(r.state.total,190);
 const next=continueCourse(toCommentary(pickChoice(r.state,right(r.state),content).state),content);
 assert.equal(next.stagePoints,0);assert.equal(next.stage,1);
});
test('wrong pick = retry; right pick clears immediately before lesson/continue',()=>{
 const f=fillStage(freshCourse(content,{seed:1}));
 const gate=gateOf(f.s,content),wrong=gate.choices.find(c=>c.id!==right(f.s)).id;
 const w=pickChoice(f.s,wrong,content);
 assert.equal(w.result.reason,'wrong');assert.equal(w.state.phase,'quiz');assert.equal(w.state.cleared.length,0);
 const ok=pickChoice(w.state,right(f.s),content);
 assert.equal(ok.state.phase,'lesson');assert.deepEqual(ok.state.cleared,[gate.id]);
 // second tap on the right choice, or Continue before commentary, changes nothing
 assert.equal(pickChoice(ok.state,right(f.s),content).result.ok,false);
 assert.equal(continueCourse(ok.state,content).stage,0);
});
test('victory fires once after gate 20; double Continue does not skip or replay',()=>{
 let s=freshCourse(content,{seed:5}),wins=0;
 for(let i=0;i<GATES;i++){
  const f=fillStage(s),p=pickChoice(f.s,right(f.s),content);
  if(p.result.victory)wins++;
  assert.equal(pickChoice(p.state,right(f.s),content).result.victory??false,false);
  const c=toCommentary(p.state),a=continueCourse(c,content),b=continueCourse(a,content);
  assert.deepEqual(b,a);s=a;
 }
 assert.equal(wins,1);assert.equal(s.phase,'victory');
 assert.equal(continueCourse(s,content),s);assert.equal(pickChoice(s,'a',content).result.ok,false);
});
test('reload mid-lesson/commentary/quiz restores to the same phase and gate',()=>{
 const f=fillStage(freshCourse(content,{seed:9}));
 const lesson=pickChoice(f.s,right(f.s),content).state,comm=toCommentary(lesson);
 for(const s of [f.s,lesson,comm]){
  const back=restoreCourse(JSON.parse(JSON.stringify(s)),content);
  assert.deepEqual(back,s);
 }
 const cont=continueCourse(restoreCourse(JSON.stringify(comm),content),content);
 assert.equal(cont.stage,1);
 assert.equal(restoreCourse({...comm,cleared:[]},content),null);           // tampered
 assert.equal(restoreCourse({...comm,contentVersion:'old'},content),null);  // other content
 assert.equal(restoreCourse({version:1,phase:'dead',rounds:5},content),null); // legacy 5-round run is never adopted
});
test('duplicate aliases cannot farm points within a gate; reset next gate',()=>{
 let s=freshCourse(content,{seed:2});
 const p=promptOf(s,content),a=p.answers.find(x=>x.tier===0);
 const r1=submitAnswer(s,a.name,content);assert.equal(r1.result.points,10);
 // Same answer, any case/spacing/alias, on every later prompt in the gate scores nothing
 let t=r1.state;
 for(const v of [a.name.toUpperCase(),` ${a.name} `,...a.aliases]){
  const r=submitAnswer(t,v,content);assert.equal(r.state.total,10);
 }
 // a prompt that holds the same answer again (rotated in): still blocked
 const p2=promptOf(t,content);
 if(lookupAnswer(p2,a.name))assert.equal(submitAnswer(t,a.name,content).result.reason,'duplicate');
 // alias spellings resolve to one canonical answer
 const dog=content.prompts.find(x=>x.id==='animal');
 assert.equal(lookupAnswer(dog,'  The DOG ').name,'dog');assert.equal(lookupAnswer(dog,'puppy').name,'dog');
 // new gate: the same answer scores again
 const f=fillStage(freshCourse(content,{seed:2}));
 const n=continueCourse(toCommentary(pickChoice(f.s,right(f.s),content).state),content);
 assert.deepEqual(n.stageAnswers,[]);
});
test('unknown answers and pass: zero points, example offered, no penalty, no end',()=>{
 let s=freshCourse(content,{seed:4});
 const r=submitAnswer(s,'zzqx not a thing',content);
 assert.equal(r.result.reason,'unknown');assert.ok(r.result.example);assert.equal(r.state.total,0);
 for(let i=0;i<60;i++)s=passPrompt(s,content);   // 5-round cap is gone
 assert.equal(s.phase,'prompt');assert.equal(s.stagePoints,0);
 assert.ok(promptOf(s,content));
});
