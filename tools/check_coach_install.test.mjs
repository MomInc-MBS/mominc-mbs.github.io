import test from 'node:test';
import assert from 'node:assert/strict';
import {coachDraft,installerURL} from '../coach-setup/coach-draft.mjs';
import {decodeHandoff} from '../coach-setup/onboarding-domain.mjs';
const recipe={version:1,styles:{head:1,eye:2,collar:3,body:4,arms:5,feet:6},coach:'calm',eye:'open',fur:1,iris:1};
const armie={game:{hallways:3,experience:'Beginner'},plan:{sleep:'8'}};
function store(values){return {getItem:k=>values[k]===undefined?null:JSON.stringify(values[k])};}
test('a finished creature goes straight to the app installer with its actual saved choices',()=>{
 const data=coachDraft(store({'myr5-recipe-v1':recipe,'mbs-state':{drafts:{fuel:{answers:{q1:'Decaf'}}}},'mbs-final-coach-draft-v1':{profile:{name:'Ian'},answers:{djscratch:{q1:'Quiet'}}}}),armie,'America/Los_Angeles');
 const url=new URL(installerURL(data));assert.equal(url.origin,'https://myr5-coach.ianmyersrocks97.chatgpt.site');assert.equal(url.pathname,'/install.html');assert.equal(url.search,'');
 const received=decodeHandoff(new URLSearchParams(url.hash.slice(1)).get('coach'));
 assert.deepEqual(received.appearance['myr5-recipe-v1'],recipe);assert.equal(received.profile.name,'Ian');assert.equal(received.answers.fuel.q1,'Decaf');assert.equal(received.answers.djscratch.q1,'Quiet');assert.equal(received.armieCompleted,true);assert.equal(received.customizationConfirmed,true);
 assert.equal(received.profile.goalWeightLbs,undefined,'Never invent missing personal answers');
});
test('incomplete games and invalid recipes cannot claim a completed coach',()=>{assert.throws(()=>coachDraft(store({'myr5-recipe-v1':recipe}),{game:{hallways:2}},'UTC'));assert.throws(()=>coachDraft(store({'myr5-recipe-v1':{}}),armie,'UTC'));});
