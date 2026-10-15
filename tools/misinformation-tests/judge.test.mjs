import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanJudgment,cleanSavedJudgments,questionWithJudgments,subjectsWithJudgments,judgeAnswer} from '../../play/misinformation/judge.js';
const subject={id:'online-event',name:'A sourced event',statement:'The source describes a documented event.',explanation:'A source-backed description, not proof of unrelated allegations.',source:'https://en.wikipedia.org/wiki/Example',publisher:'Wikipedia',category:'Historical event',classification:'event',aliases:['Event'],topics:['history']};
const response={accepted:true,subject,tier:0};
test('evidence-backed online answers extend only their reviewed prompt and survive a save',()=>{
 const entry=cleanJudgment(response,'world-events');assert.ok(entry);
 const saved=cleanSavedJudgments(JSON.parse(JSON.stringify([entry])),new Set(['world-events']));assert.deepEqual(saved,[entry]);
 const q={id:'world-events',answers:[{id:'existing',tier:1}]};
 assert.deepEqual(questionWithJudgments(q,saved).answers,[...q.answers,{id:subject.id,tier:0}]);
 assert.deepEqual(questionWithJudgments({...q,id:'space-only'},saved).answers,q.answers);
 assert.equal(q.answers.length,1);
 assert.equal(questionWithJudgments(q,[...saved,...saved]).answers.length,2);
});
test('malformed online cards, unknown prompts and unsafe links do not restore',()=>{
 for(const value of [{...response,tier:6},{...response,subject:{...subject,source:'javascript:alert(1)'}},{...response,subject:{...subject,classification:'uncertain'}},{...response,subject:{...subject,statement:''}}])assert.equal(cleanJudgment(value,'q'),null);
 assert.deepEqual(cleanSavedJudgments([{questionId:'removed',subject,tier:0},null],new Set(['q'])),[]);
});

test('fixed discovery credit stays explicit after saving a newly verified answer',()=>{
 const entry=cleanJudgment({accepted:true,subject:{...subject,classificationMode:'topic',rewardKind:'discovery'},tier:1},'q');
 assert.equal(entry.subject.rewardKind,'discovery');
 const [restored]=cleanSavedJudgments(JSON.parse(JSON.stringify([entry])),new Set(['q']));
 assert.equal(restored.subject.rewardKind,'discovery');
 assert.equal(restored.subject.classificationMode,'topic');
 assert.equal(questionWithJudgments({id:'q',answers:[]},[restored]).answers[0].tier,1);
});
test('a saved verified tier overrides the expanded catalog answer tier for its question',()=>{
 const entry=cleanJudgment({accepted:true,subject,tier:1},'q');
 const [restored]=cleanSavedJudgments(JSON.parse(JSON.stringify([entry])),new Set(['q']));
 const question={id:'q',answers:[{id:subject.id,tier:4}]};
 assert.deepEqual(questionWithJudgments(question,[restored]).answers,[{id:subject.id,tier:1}]);
});
test('current-question verified subjects preserve their locked card over a same-ID catalog update',()=>{
 const locked={...subject,id:'wiki-fixture',name:'Locked neutral topic',classification:'event',classificationMode:'statement',statement:'The answer-time card described a documented reference subject.'};
 const newlyImported={...subject,id:locked.id,name:locked.name,classification:'claim',classificationMode:'topic',statement:'The expanded catalog now classifies this as a conspiracy topic.'};
 const entry=cleanJudgment({accepted:true,subject:locked,tier:1},'q');
 const additional=cleanJudgment({accepted:true,subject:{...subject,id:'new-verified-story',name:'A newly verified story'},tier:2},'q');
 const [restored,restoredAdditional]=cleanSavedJudgments(JSON.parse(JSON.stringify([entry,additional])),new Set(['q']));
 const base=[newlyImported];
 assert.strictEqual(subjectsWithJudgments(base,[],'q'),base);
 const merged=subjectsWithJudgments(base,[restored,restoredAdditional],'q');
 assert.equal(merged.filter(item=>item.id===locked.id).length,1);
 const effective=merged.find(item=>item.id===locked.id);
 assert.equal(effective.statement,locked.statement);
 assert.equal(effective.classification,'event');
 assert.notEqual(effective.classificationMode,'topic');
 assert.ok(merged.some(item=>item.id==='new-verified-story'));
});
test('verified subjects from another question do not override or duplicate the catalog card',()=>{
 const catalogCard={...subject,id:'wiki-fixture',classification:'claim',classificationMode:'topic'};
 const savedCard={...subject,id:catalogCard.id,classification:'event',classificationMode:'statement'};
 const entry=cleanJudgment({accepted:true,subject:savedCard,tier:1},'other-question');
 const [restored]=cleanSavedJudgments(JSON.parse(JSON.stringify([entry])),new Set(['q','other-question']));
 const merged=subjectsWithJudgments([catalogCard],[restored],'q');
 assert.equal(merged.filter(item=>item.id===catalogCard.id).length,1);
 assert.equal(merged[0],catalogCard);
 assert.equal(merged[0].classificationMode,'topic');
});
test('hosted check sends only the answer and question ID, never score or history',async()=>{
 let options;
 const result=await judgeAnswer('my answer','my question',{fetcher:async(url,input)=>{options=input;return new Response(JSON.stringify(response));}});
 assert.deepEqual(JSON.parse(options.body),{answer:'my answer',questionId:'my question'});assert.equal(options.credentials,'omit');assert.equal(result.entry.subject.name,subject.name);
});
test('rejection remains a retry and busy or incomplete hosted replies are explicit',async()=>{
 const result=await judgeAnswer('offtopic','q',{fetcher:async()=>new Response(JSON.stringify({accepted:false,reason:'This does not fit the prompt.'}))});assert.equal(result.entry,null);assert.match(result.reason,/does not fit/);
 await assert.rejects(judgeAnswer('x','q',{fetcher:async()=>new Response('{}',{status:429})}),/busy/);
 await assert.rejects(judgeAnswer('x','q',{fetcher:async()=>new Response(JSON.stringify({accepted:true,tier:0}))}),/incomplete/);
});
