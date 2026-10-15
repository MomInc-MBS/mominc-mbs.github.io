import test from 'node:test';
import assert from 'node:assert/strict';
import {addWikipediaSubjects,readershipTiers} from '../misinformation_wiki_adapter.mjs';

const article=(id,name,overrides={})=>({
 id,name,description:'A documented reference subject.',aliases:[],categories:[],topics:[],source:`https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
 ...overrides
});

test('equal Wikipedia readership ties receive the same tier at a boundary',()=>{
 const records=[100,90,80,80,70,60,50,40,30,20].map((views,index)=>({id:`wiki-${index}`,views}));
 const tiers=readershipTiers(records);
 assert.equal(tiers.get('wiki-2'),tiers.get('wiki-3'));
 assert.equal(tiers.get('wiki-2'),0);
});

test('a subject without readership data gets discovery credit, not an invented rarity score',()=>{
 const [subject]=addWikipediaSubjects([],{
  articles:[article('wiki-11','Unmeasured Subject')],viewsWindow:'2026-09'
 });
 assert.equal(subject.familiarity,1);
 assert.equal(subject.depth,1);
 assert.equal(subject.rewardKind,'discovery');
 assert.deepEqual(subject.readership,{views:null,window:'2026-09'});
 assert.match(subject.explanation,/No readership observation was available/);
 assert.match(subject.explanation,/not an invented rarity estimate/);
});

test('a reviewed title absorbs Wikipedia aliases without changing reviewed scoring',()=>{
 const reviewed={id:'reviewed-1',name:'Café Case',aliases:['Existing Name'],familiarity:3,depth:4,classification:'event'};
 const results=addWikipediaSubjects([reviewed],{
  articles:[article('wiki-12','Cafe Case',{aliases:['Existing Name','New Wikipedia Name']})]
 });
 const [result]=results;
 assert.equal(results.length,1);
 assert.equal(result,reviewed);
 assert.equal(result.familiarity,3);
 assert.equal(result.depth,4);
 assert.equal(result.classification,'event');
 assert.deepEqual(result.aliases,['Existing Name','New Wikipedia Name']);
});

test('aliases colliding with reviewed or earlier imported names are suppressed',()=>{
 const reviewed={id:'reviewed-2',name:'Reviewed Topic',aliases:['Taken Alias'],familiarity:2};
 const result=addWikipediaSubjects([reviewed],{
  articles:[
   article('wiki-13','First Imported Topic',{aliases:['Taken Alias','Shared Article Alias']}),
   article('wiki-14','Second Imported Topic',{aliases:['shared article alias']})
  ]
 });
 assert.deepEqual(result[1].aliases,['Shared Article Alias']);
 assert.deepEqual(result[2].aliases,[]);
});

test('conspiracy metadata marks the topic while a related documented subject stays neutral',()=>{
 const result=addWikipediaSubjects([],{articles:[
  article('wiki-15','Moon landing hoax',{topics:['conspiracy theory']}),
  article('wiki-16','Lunar Archive Museum',{categories:['Conspiracy theory research'],description:'A museum preserving records about twentieth century history.'})
 ]});
 assert.equal(result[0].classification,'claim');
 assert.equal(result[0].classificationMode,'topic');
 assert.equal(result[0].statement,'A documented reference subject.');
 assert.equal(result[1].classification,'event');
 assert.equal(result[1].classificationMode,'statement');
 assert.ok(!result[1].topics.includes('conspiracy'));
});

test('experiment tags require a direct experiment or study description',()=>{
 const result=addWikipediaSubjects([],{articles:[
  article('wiki-17','Psychology Study',{description:'A psychology experiment conducted by researchers.'}),
  article('wiki-18','Experimental Research Center',{description:'An institution supporting scientific work.',categories:['Experiments','Research']})
 ]});
 for(const tag of ['research','experiments','science'])assert.ok(result[0].topics.includes(tag),tag);
 assert.ok(!result[1].topics.includes('experiments'));
 assert.ok(!result[1].topics.includes('research'));
 assert.ok(!result[1].topics.includes('science'));
});
