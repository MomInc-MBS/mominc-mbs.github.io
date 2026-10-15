import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY_TEMPLATES,STORY_LIMITS,createStoryDraft,fillStory} from '../../play/misinformation/stories.js';
import {subjects as actualSubjects} from '../../play/misinformation/catalog.js';

const subjects=[
  {id:'leader',name:'Sample Leader',classification:'event',topics:['people','leaders']},
  {id:'event',name:'Sample Historical Event',classification:'event',topics:['history','events']},
  {id:'mars',name:'Mars',classification:'event',topics:['space','natural-objects']},
  {id:'theory',name:'Sample Unsupported Claim',classification:'claim',topics:['conspiracy']},
  {id:'hubble',name:'Hubble Space Telescope',classification:'event',topics:['space','spacecraft']},
  {id:'criminal-case',name:'Unidentified Killer case',classification:'event',topics:['people','serial-killers','criminal-cases']}
];
const history=subjects.map(subject=>({subject:subject.id,correct:true}));
function rngForTemplate(index) {
  let calls=0;
  return ()=>calls++===0?(index+.25)/STORY_TEMPLATES.length:0;
}

test('at least twelve distinct original templates declare every typed blank',()=>{
  assert.ok(STORY_TEMPLATES.length>=12);
  assert.equal(new Set(STORY_TEMPLATES.map(t=>t.id)).size,STORY_TEMPLATES.length);
  assert.equal(new Set(STORY_TEMPLATES.map(t=>t.text)).size,STORY_TEMPLATES.length);
  for(const template of STORY_TEMPLATES){
    assert.ok(template.slots.length<=STORY_LIMITS.maxSlots);
    const ids=[...template.text.matchAll(/\{([a-z]+)\}/g)].map(match=>match[1]);
    assert.deepEqual(new Set(ids),new Set(template.slots.map(slot=>slot.id)),template.id);
    assert.equal(new Set(template.slots.map(slot=>slot.id)).size,template.slots.length);
    assert.ok(template.slots.every(slot=>slot.type&&slot.label));
  }
});

test('run answers prefill only compatible roles and never invent grammar words',()=>{
  const before=JSON.stringify({history,subjects});
  const used=new Set();
  for(let i=0;i<STORY_TEMPLATES.length;i++){
    const draft=createStoryDraft(history,subjects,rngForTemplate(i));
    assert.equal(draft.templateId,STORY_TEMPLATES[i].id);
    for(const slot of draft.slots){
      if(['verb','adjective','adverb'].includes(slot.type)){
        assert.equal(slot.value,'',`${draft.templateId}: ${slot.type}`);
        assert.equal(slot.fromAnswer,false);
      }else{
        assert.equal(slot.fromAnswer,true,`${draft.templateId}: ${slot.type}`);
        if(slot.type==='person')assert.equal(slot.sourceSubject,'leader');
        if(slot.type==='event')assert.equal(slot.sourceSubject,'event');
        if(slot.type==='place')assert.equal(slot.sourceSubject,'mars');
        if(slot.type==='theory')assert.equal(slot.sourceSubject,'theory');
        used.add(slot.type);
      }
    }
    assert.ok(fillStory(draft).includes('['),'Unfilled grammar blanks stay visible');
    assert.ok(!fillStory(draft,{verb:'dance',adjective:'wobbly',adverb:'politely'}).includes('['));
  }
  for(const type of ['person','event','place','theory','subject','noun'])assert.ok(used.has(type),type);
  assert.equal(JSON.stringify({history,subjects}),before,'Source history and catalog stay immutable');
});

test('a run without a requested role leaves that role editable and empty',()=>{
  for(let i=0;i<STORY_TEMPLATES.length;i++){
    const draft=createStoryDraft([{subject:'hubble'}],subjects,rngForTemplate(i));
    for(const slot of draft.slots){
      if(['person','place','event','theory'].includes(slot.type)){
        assert.equal(slot.value,'',slot.type);
        assert.equal(slot.fromAnswer,false,slot.type);
      }
    }
  }
});

test('actual catalog case subjects are not mislabeled people or places',()=>{
  const input=[{subject:'zodiac'},{subject:'cuban-missile-crisis'},{subject:'hubble'}];
  for(let i=0;i<STORY_TEMPLATES.length;i++){
    const draft=createStoryDraft(input,actualSubjects,rngForTemplate(i));
    for(const slot of draft.slots){
      if(slot.type==='person'||slot.type==='place')assert.equal(slot.value,'');
      if(slot.type==='event')assert.equal(slot.sourceSubject,'cuban-missile-crisis');
    }
  }
});

test('unknown judged answers retain text only as noun or subject, with no guessed role',()=>{
  for(let i=0;i<STORY_TEMPLATES.length;i++){
    const draft=createStoryDraft([{subject:'custom-answer',typedAnswer:'My unusual answer'}],subjects,rngForTemplate(i));
    for(const slot of draft.slots){
      if(slot.fromAnswer){
        assert.ok(['noun','subject'].includes(slot.type));
        assert.equal(slot.value,'My unusual answer');
      }
    }
  }
  const draft=createStoryDraft([{subject:'mars',typedAnswer:'MARS'}],subjects,()=>0);
  assert.ok(draft.slots.some(slot=>slot.value==='MARS'));
});

test('filling stays plain text, bounds input and honors intentional clearing',()=>{
  const draft=createStoryDraft(history,subjects,()=>0);
  const html='<img src=x onerror=alert(1)>';
  const result=fillStory(draft,{adjective:html,verb:'dance\n\u0000quietly',adverb:'x'.repeat(1000),subject:''});
  assert.ok(result.includes(html),'HTML-looking input stays literal plain text');
  assert.ok(result.includes('dance quietly'));
  assert.ok(!result.includes('\n')&&!result.includes('\u0000'));
  assert.ok(result.includes('x'.repeat(STORY_LIMITS.maxInputLength)));
  assert.ok(!result.includes('x'.repeat(STORY_LIMITS.maxInputLength+1)));
  assert.ok(result.includes('[subject]'),'Cleared fields do not silently restore answers');
  assert.throws(()=>fillStory({templateId:'unknown'}),/Unknown story/);
});

test('empty, skipped, duplicate and old entries are handled without fabricated answers',()=>{
  const empty=createStoryDraft(null,null,()=>NaN);
  assert.ok(empty.slots.every(slot=>slot.value===''&&!slot.fromAnswer));
  assert.equal(createStoryDraft([],[],()=>1).templateId,STORY_TEMPLATES.at(-1).id);
  const skipped=createStoryDraft([{subject:'mars',skipped:true}],subjects,()=>0);
  assert.ok(skipped.slots.every(slot=>slot.value===''));
  const old=createStoryDraft([{subject:'mars'},...Array.from({length:STORY_LIMITS.maxHistory},()=>({skipped:true}))],subjects,()=>0);
  assert.ok(old.slots.every(slot=>slot.value===''));
});
