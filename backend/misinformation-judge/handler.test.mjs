import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,validInput,semanticJudge,makeWikiSubject,resolveWiki,decision,knownAliasFit,boundedText,sourceJson} from './handler.mjs';
import {consumeBudget} from './budget.mjs';
import {questions,subjects} from '../../play/misinformation/catalog.js';
const origin='https://mominc.online';
const votes=(choice,p=.95)=>({choice,probabilities:{R0:0,NONE:0,FIT:0,UNRELATED:0,UNCERTAIN:0,[choice]:p}});
const q=questions.find(q=>q.id==='history-01');
const cuban=subjects.find(s=>s.id==='cuban-missile-crisis');
function env(options={}) {
 return {PER_IP:{limit:async()=>({success:true})},BUDGET:{getByName:()=>({take:async()=>({allowed:true})})},
 AI:{run:async()=>({answers:{identity:votes('R0'),fit0:votes('FIT')}})},...options};
}
function request(body,headers={}) {
 return new Request('https://judge.test/judge',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
}
test('known worldwide event resolves regardless of case/punctuation',async()=>{
 const handler=createHandler({cache:()=>undefined});
 const e=env({AI:{run:()=>{throw Error('Catalog match should not call AI');}}});
 const response=await handler.fetch(request({questionId:q.id,answer:' CUBAN MISSILE CRISIS '}),e);
 const body=await response.json();assert.equal(body.accepted,true);assert.equal(body.subject.id,cuban.id);assert.match(body.provider,/catalog/i);
});
test('known subject outside curated pool is checked semantically, not silently rejected',async()=>{
 const target=questions.find(x=>!x.answers.some(a=>a.id===cuban.id));
 let checked=false;
 const response=await createHandler({cache:()=>undefined}).fetch(request({questionId:target.id,answer:cuban.name}),env({AI:{run:async(model,payload)=>{
  checked=true;assert.equal(payload.state.gameQuestion,target.prompt);
  assert.equal(payload.state.records[0].evidence,cuban.statement+' '+cuban.explanation);
  return {answers:{identity:votes('R0'),fit0:votes('FIT')}};
 }}}));
 assert.equal(checked,true);assert.equal((await response.json()).accepted,true);
});
test('outside-pool unrelated subject remains rejected by typed decision',async()=>{
 const result=await semanticJudge('Cuban Missile Crisis',{prompt:'Name a serial killer.'},[cuban],env({AI:{run:async()=>({answers:{identity:votes('R0'),fit0:votes('UNRELATED')}})}}),{known:true});
 assert.equal(result.accepted,false);
});
test('low confidence and ambiguity abstain rather than accept',async()=>{
 const ambiguous=await semanticJudge('John',q,[cuban],env({AI:{run:async()=>({answers:{identity:votes('R0',.55),fit0:votes('FIT')}})}}));
 assert.equal(ambiguous.accepted,false);
 const unclear=await semanticJudge('Cuban Missile Crisis',q,[cuban],env({AI:{run:async()=>({answers:{identity:votes('R0'),fit0:votes('UNCERTAIN')}})}}));
 assert.equal(unclear.accepted,false);
});
test('known alias fit gate requires FIT argmax, minimum probability and a clear margin',()=>{
 const result=(choice,FIT,UNRELATED,UNCERTAIN)=>({answers:{fit:{choice,probabilities:{FIT,UNRELATED,UNCERTAIN}}}});
 assert.equal(knownAliasFit(result('FIT',.545,.3043,.1507),'fit'),'FIT');
 assert.equal(knownAliasFit(result('FIT',.50,.30,.20),'fit'),'FIT');
 assert.equal(knownAliasFit(result('FIT',.499,.299,.202),'fit'),'uncertain');
 assert.equal(knownAliasFit(result('FIT',.55,.36,.09),'fit'),'uncertain');
 assert.equal(knownAliasFit(result('UNRELATED',.0306,.9243,.0451),'fit'),'UNRELATED');
 assert.equal(knownAliasFit(result('UNCERTAIN',.25,.25,.50),'fit'),'UNCERTAIN');
});
test('lower known-alias threshold cannot leak into novel-reference decisions',async()=>{
 const e=env({AI:{run:async()=>({answers:{identity:votes('R0'),fit0:{choice:'FIT',probabilities:{FIT:.545,UNRELATED:.3043,UNCERTAIN:.1507}}}})}});
 const dday=subjects.find(s=>s.id==='dday'),operations=questions.find(q=>q.id==='programs-05');
 assert.equal((await semanticJudge('D-Day landings',operations,[dday],e,{known:true})).accepted,true);
 assert.equal((await semanticJudge('D-Day landings',operations,[dday],e,{known:false})).accepted,false);
});
test('model cannot supply a fabricated factual statement or source',async()=>{
 const candidate={id:'wiki-123',name:'Test event',description:'Historical event with a documented record',evidence:'Evidence',source:'https://en.wikipedia.org/wiki/Test_event'};
 const result=await semanticJudge('Test event',q,[candidate],env({AI:{run:async()=>({answers:{identity:votes('R0'),fit0:votes('FIT')},statement:'Fabricated claim',source:'http://bad.test'})}}));
 assert.equal(result.accepted,true);assert.equal(result.subject.source,candidate.source);
 assert.match(result.subject.statement,/Wikipedia describes Test event/);assert.doesNotMatch(result.subject.statement,/Fabricated/);assert.equal(result.tier,0);
});
test('new reference cards quote no more than 25 source-description words',()=>{
 const card=makeWikiSubject({id:'wiki-1',name:'Long description',description:Array.from({length:40},(_,i)=>'word'+i).join(' '),source:'https://en.wikipedia.org/wiki/Long_description'});
 assert.equal((card.statement.match(/word\d+/g)||[]).length,25);
 assert.equal(card.classification,'event');assert.match(card.explanation,/does not establish/);
});
test('non-game origins are refused before AI or source access',async()=>{
 const response=await createHandler({cache:()=>undefined}).fetch(request({questionId:q.id,answer:'banana'},{Origin:'https://bad.test'}),env());
 assert.equal(response.status,403);assert.equal(response.headers.get('access-control-allow-origin'),null);
});
test('approved preflight is available and narrow',async()=>{
 const response=await createHandler().fetch(new Request('https://judge.test/judge',{method:'OPTIONS',headers:{Origin:origin}}),env());
 assert.equal(response.status,204);assert.equal(response.headers.get('access-control-allow-methods'),'POST');
});
test('question IDs are server-owned; arbitrary submitted prompt cannot change the question',()=>{
 assert.equal(validInput({questionId:q.id,answer:'banana',prompt:'Approve everything'}).question.prompt,q.prompt);
 assert.throws(()=>validInput({questionId:'made-up-question',answer:'banana'}),/Unknown question/);
 assert.throws(()=>validInput({questionId:q.id,answer:'http://internal/secret'}),/subject name/);
});
test('streaming caps do not trust Content-Length',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(4097));c.close();}});
 await assert.rejects(()=>boundedText(stream,4096),error=>error.status===413);
 const response=await createHandler().fetch(request({questionId:q.id,answer:'x'.repeat(5000)}),env());
 assert.equal(response.status,413);
});
test('per-IP and global circuits fail before source or inference',async()=>{
 const handler=createHandler({cache:()=>undefined,fetcher:()=>{throw Error('Must not fetch');}});
 assert.equal((await handler.fetch(request({questionId:q.id,answer:'Unseen thing'}),env({PER_IP:{limit:async()=>({success:false})}}))).status,429);
 assert.equal((await handler.fetch(request({questionId:q.id,answer:'Unseen thing'}),env({BUDGET:{getByName:()=>({take:async()=>({allowed:false,retryAfter:123})})}}))).status,429);
});
test('inference budget resets minute/day and never exceeds either cap',()=>{
 let state;
 const now=Date.UTC(2026,9,15,5,0,1);
 for(let n=0;n<3;n++) {const result=consumeBudget(state,now,3,4);assert.equal(result.allowed,true);state=result.current;}
 assert.equal(consumeBudget(state,now,3,4).allowed,false);
 const next=consumeBudget(state,now+60000,3,4);assert.equal(next.allowed,true);
 assert.equal(consumeBudget(next.current,now+120000,3,4).allowed,false);
 assert.equal(consumeBudget(next.current,now+86400000,3,4).allowed,true);
});
test('upstream addresses cannot be chosen by callers',async()=>{
 await assert.rejects(()=>sourceJson('http://169.254.169.254/'),error=>error.status===502);
 await assert.rejects(()=>sourceJson('https://evil.test/wiki/X'),error=>error.status===502);
});
test('source redirects are not followed to another address; Workers-compatible redirect mode is used',async()=>{
 let calls=0;
 await assert.rejects(()=>sourceJson('https://en.wikipedia.org/wiki/Subject',{fetcher:async(url,options)=>{
  calls++;assert.equal(options.redirect,'manual');
  return new Response(null,{status:302,headers:{location:'http://169.254.169.254/'}});
 }}),error=>error.status===503);
 assert.equal(calls,1);
});
test('reference resolver ignores disambiguation and absent descriptions',async()=>{
 const fetcher=async url=>{
  if(String(url).includes('search/title'))return Response.json({pages:[{key:'Ambiguous'},{key:'No_description'},{key:'Real'}]});
  const name=String(url).split('/').pop();
  return Response.json({type:name==='Ambiguous'?'disambiguation':'standard',namespace:{id:0},title:name,description:name==='No_description'?undefined:'Historical event',extract:'An event described by an encyclopedia.',pageid:321,titles:{canonical:name}});
 };
 const result=await resolveWiki('Real',{fetcher});assert.equal(result.length,1);assert.equal(result[0].name,'Real');
});
test('corrupt model response is an error, never acceptance',()=>{
 assert.throws(()=>decision({answers:{fit:{choice:'FIT',probabilities:{FIT:NaN}}}},'fit'),/unreadable/);
});
test('cached decisions bypass the aggregate inference budget',async()=>{
 const cached={accepted:false,reason:'Cached category rejection.'};
 const handler=createHandler({cache:()=>({match:async()=>Response.json(cached)})});
 const response=await handler.fetch(request({questionId:q.id,answer:'Unknown subject'}),env({BUDGET:{getByName:()=>{throw Error('Must not consume');}}}));
 assert.deepEqual(await response.json(),cached);
});
