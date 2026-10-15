import test from 'node:test';
import assert from 'node:assert/strict';
import {createScoreStore,SCORE_KEY,MAX_SAVED_RUNS,newRunId} from '../../play/misinformation/scores.js';
import {freshRun,beginQuestion,acceptAnswer,classify} from '../../play/misinformation/engine.js';
function storage(){const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
function run(id='one',override={}){return {id,outcome:'dead',score:300,distance:15000,hits:3,rounds:6,pristine:true,
 startedAt:'2026-10-14T12:00:00.000Z',finishedAt:'2026-10-14T12:05:00.000Z',...override};}
test('finished flights persist across reload, with separate best score and distance',()=>{
 const local=storage(),board=createScoreStore(local);
 board.record(run('far',{score:400,distance:90000}));board.record(run('points',{score:2500,distance:80000}));
 const saved=createScoreStore(local).snapshot();
 assert.equal(saved.runs[0].id,'far');assert.equal(saved.bestDistance,90000);assert.equal(saved.bestScore,2500);
 assert.equal(saved.available,true);
});
test('same finalized run is idempotent across reload and separate tabs merge',()=>{
 const local=storage(),a=createScoreStore(local),b=createScoreStore(local);
 a.record(run());b.record(run('two'));a.record(run());
 assert.deepEqual(createScoreStore(local).snapshot().runs.map(r=>r.id).sort(),['one','two']);
});
test('escaped, recalled, and abandoned outcomes remain distinct',()=>{
 const board=createScoreStore(storage());board.record(run('escaped',{outcome:'escaped',score:2000,distance:100000,hits:0,rounds:20}));
 board.record(run('dead'));board.record(run('abandoned',{outcome:'abandoned',hits:1}));
 assert.equal(board.snapshot().escapes,1);assert.equal(board.snapshot().runs.length,3);
 assert.throws(()=>board.record(run('fake',{outcome:'escaped'})),/Invalid/);
});
test('malformed and duplicate stored entries cannot become flights',()=>{
 const local=storage();local.setItem(SCORE_KEY,JSON.stringify({version:1,runs:[run(),run(),run('nan',{score:'9000'}),{id:'bad'}]}));
 assert.equal(createScoreStore(local).snapshot().runs.length,1);
});
test('broken JSON, blocked access, and quota failures degrade honestly to session memory',()=>{
 const corrupt=storage();corrupt.setItem(SCORE_KEY,'{bad');const a=createScoreStore(corrupt);a.record(run());
 assert.equal(a.snapshot().available,false);assert.equal(a.snapshot().runs.length,1);
 const b=createScoreStore({getItem(){throw Error('blocked');}});b.record(run());assert.equal(b.snapshot().available,false);
 const c=createScoreStore({getItem(){return null;},setItem(){throw Error('quota');}});c.record(run());
 assert.equal(c.snapshot().available,false);assert.equal(c.snapshot().runs.length,1);
});
test('only best 100 flights are kept, never losing the earlier best',()=>{
 const board=createScoreStore(storage());board.record(run('best',{distance:99000,score:3000}));
 for(let i=0;i<120;i++)board.record(run(`low-${i}`,{distance:i,score:i}));
 assert.equal(board.snapshot().runs.length,MAX_SAVED_RUNS);assert.equal(board.snapshot().runs[0].id,'best');
});
test('invalid dates, impossible terminal states and unsafe numeric values rejected',()=>{
 const board=createScoreStore(storage());
 for(const override of [{score:NaN},{score:-1},{distance:100001},{hits:2},{finishedAt:'yesterday'},
 {finishedAt:'2020-01-01T00:00:00Z'},{rounds:-1},{score:Number.MAX_SAFE_INTEGER+1}])assert.throws(()=>board.record(run('bad',override)),/Invalid/);
});
test('score snapshots cannot mutate persisted records and run identifiers differ',()=>{
 const board=createScoreStore(storage());board.record(run());board.snapshot().runs[0].score=999999;
 assert.equal(board.snapshot().bestScore,300);assert.notEqual(newRunId(),newRunId());
});
test('an already-open board refreshes another tab\'s finalized flight without writing',()=>{
 const local=storage(),observer=createScoreStore(local),writer=createScoreStore(local);
 assert.equal(observer.snapshot().runs.length,0);
 writer.record(run('other-tab',{outcome:'escaped',distance:100000,score:2000,hits:0,rounds:20}));
 const before=local.getItem(SCORE_KEY),observed=observer.snapshot();
 assert.equal(observed.runs[0].id,'other-tab');assert.equal(observed.bestDistance,100000);
 assert.equal(observed.bestScore,2000);assert.equal(local.getItem(SCORE_KEY),before);
});
test('historical best score survives table cutoff by 100 farther escaped flights and reload',()=>{
 const local=storage(),board=createScoreStore(local);
 board.record(run('practice-high-score',{outcome:'abandoned',distance:95000,score:10000,hits:0,rounds:100,pristine:false}));
 for(let i=0;i<100;i++)board.record(run(`escape-${i}`,{outcome:'escaped',distance:100000,score:2000,hits:0,rounds:20}));
 const saved=board.snapshot();
 assert.equal(saved.runs.length,100);assert.equal(saved.runs.some(r=>r.id==='practice-high-score'),false);
 assert.equal(saved.bestScore,10000);assert.equal(saved.bestDistance,100000);
 assert.equal(createScoreStore(local).snapshot().bestScore,10000);
 assert.equal(JSON.parse(local.getItem(SCORE_KEY)).bestScore,10000);
});
test('legacy version-one records initialize aggregates and tabs preserve each other\'s historical best',()=>{
 const local=storage();local.setItem(SCORE_KEY,JSON.stringify({version:1,runs:[run('legacy',{score:5000,distance:95000})]}));
 const a=createScoreStore(local),b=createScoreStore(local);
 assert.equal(a.snapshot().bestScore,5000);assert.equal(a.snapshot().bestDistance,95000);
 a.record(run('escape',{outcome:'escaped',score:2000,distance:100000,hits:0,rounds:20}));
 b.record(run('practice',{outcome:'abandoned',score:6000,distance:95000,hits:0,rounds:60,pristine:false}));
 const result=createScoreStore(local).snapshot();
 assert.equal(result.bestScore,6000);assert.equal(result.bestDistance,100000);assert.equal(result.runs.length,3);
});
test('a failed snapshot refresh preserves prior records and becomes explicitly temporary',()=>{
 const local=storage(),board=createScoreStore(local);board.record(run());
 local.getItem=()=>{throw Error('permission changed');};
 const current=board.snapshot();assert.equal(current.available,false);assert.equal(current.runs.length,1);
 assert.equal(current.bestScore,300);assert.equal(current.bestDistance,15000);
});
test('ordinary twenty-answer escapes persist even when naming performance is not pristine',()=>{
 const prompt={id:'ordinary-win',band:0,answers:[{id:'ordinary',tier:0}]};
 const subject={id:'ordinary',classification:'event'};
 let state=freshRun();
 for(let i=0;i<20;i++)state=classify(acceptAnswer(beginQuestion(state,prompt),subject,prompt),subject,prompt,'event');
 assert.equal(state.phase,'escaped');assert.equal(state.pristine,false);assert.equal(state.score,200);
 const local=storage(),board=createScoreStore(local);
 const record=run('ordinary-win',{outcome:state.phase,score:state.score,distance:state.distance,
  hits:state.hits,rounds:state.rounds,pristine:state.pristine});
 board.record(record);board.record(record);
 const restored=createScoreStore(local).snapshot();
 assert.equal(restored.runs.length,1);assert.equal(restored.escapes,1);assert.equal(restored.runs[0].pristine,false);
 assert.equal(restored.bestDistance,100000);assert.equal(restored.bestScore,200);
});
test('old top-tier escapes and new mixed-answer escapes coexist without losing legacy records',()=>{
 const local=storage(),legacy=run('old-perfect',{outcome:'escaped',distance:100000,score:2000,hits:0,rounds:20,pristine:true});
 const current=run('new-mixed',{outcome:'escaped',distance:100000,score:200,hits:2,rounds:22,pristine:false});
 local.setItem(SCORE_KEY,JSON.stringify({version:1,runs:[legacy,current]}));
 const board=createScoreStore(local);assert.equal(board.snapshot().escapes,2);
 board.record(run('later'));assert.equal(createScoreStore(local).snapshot().runs.length,3);
 assert.deepEqual(createScoreStore(local).snapshot().runs.filter(r=>r.outcome==='escaped').map(r=>r.id).sort(),['new-mixed','old-perfect']);
 assert.throws(()=>board.record(run('not-arrived',{outcome:'escaped',distance:95000,hits:0,pristine:false})),/Invalid/);
 assert.throws(()=>board.record(run('caught',{outcome:'escaped',distance:100000,hits:3,pristine:false})),/Invalid/);
});
