import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {subjects, questions} from '../../play/misinformation/catalog.js';
import {normalize, lookup} from '../../play/misinformation/engine.js';

const byId = new Map(subjects.map(subject => [subject.id, subject]));

test('catalog subjects have unique IDs and complete sourced exact statements', () => {
  assert.equal(byId.size, subjects.length);
  assert.ok(subjects.length >= 141, 'At least triple the original 47 distinct answers');
  for (const subject of subjects) {
    for (const key of ['id', 'name', 'statement', 'explanation', 'source', 'publisher', 'category']) {
      assert.equal(typeof subject[key], 'string', `${subject.id}: missing ${key}`);
      assert.ok(subject[key].trim(), `${subject.id}: blank ${key}`);
    }
    assert.ok(['event', 'claim'].includes(subject.classification), subject.id);
    assert.equal(new URL(subject.source).protocol, 'https:', subject.id);
    assert.ok(Array.isArray(subject.aliases), subject.id);
  }
});

test('ten broad prompts per topic and ample distinct transmissions at every depth', () => {
  assert.ok(questions.length >= 160);
  assert.equal(new Set(questions.map(question => question.id)).size, questions.length);
  assert.equal(new Set(questions.map(question => question.prompt)).size, questions.length);
  const authored=questions.filter(q=>!q.family.startsWith('legacy-'));
  const families=new Set(authored.map(q=>q.family));
  assert.equal(families.size,16);
  for(const family of families)assert.equal(authored.filter(q=>q.family===family).length,10,family);
  for (let band = 0; band < 8; band++) {
    const group = questions.filter(question => question.band === band);
    assert.ok(group.length >= 10, `Band ${band}`);
    assert.equal(new Set(group.map(question => question.prompt)).size, group.length);
  }
  assert.ok(questions.every(question => Number.isInteger(question.band) && question.band >= 0 && question.band <= 7));
});

test('all pools have multiple valid alternatives and a top-tier answer', () => {
  const allTiers = new Set();
  for (const question of questions) {
    assert.ok(question.answers.length >= 8, question.id);
    assert.ok(question.answers.some(answer => answer.tier === 5), question.id);
    assert.equal(new Set(question.answers.map(answer => answer.id)).size, question.answers.length, question.id);
    assert.ok(new Set(question.answers.map(answer => answer.tier)).size >= 3, question.id);
    for (const answer of question.answers) {
      assert.ok(byId.has(answer.id), `${question.id}: dangling ${answer.id}`);
      assert.ok(Number.isInteger(answer.tier) && answer.tier >= 0 && answer.tier <= 5, question.id);
      allTiers.add(answer.tier);
    }
    assert.ok(question.prompt.length > 20, question.id);
    assert.ok(question.hint.length > 30, question.id);
    const counts=Array.from({length:6},(_,tier)=>question.answers.filter(a=>a.tier===tier).length);
    assert.ok(counts[0]>question.answers.length/2, `${question.id}: common answers must be the majority`);
    assert.ok(counts.slice(1).every(count=>counts[0]>count), question.id);
    assert.equal(counts[5],1, `${question.id}: the top tier stays scarce`);
  }
  assert.deepEqual([...allTiers].sort(), [0, 1, 2, 3, 4, 5]);
});

test('normalized names and aliases are unique within each question', () => {
  for (const question of questions) {
    const seen = new Map();
    for (const answer of question.answers) {
      const subject = byId.get(answer.id);
      for (const alias of [subject.name, ...subject.aliases]) {
        const normalized = normalize(alias);
        assert.ok(normalized, `${subject.id}: empty normalized alias`);
        assert.ok(!seen.has(normalized), `${question.id}: ${alias} collides with ${seen.get(normalized)}`);
        seen.set(normalized, subject.id);
      }
    }
  }
});

test('every distinct answer fits at least ten broad prompts', () => {
  const memberships = new Map();
  for (const question of questions) {
    for (const answer of question.answers) {
      memberships.set(answer.id, (memberships.get(answer.id) ?? 0)+1);
    }
  }
  assert.equal(memberships.size, subjects.length);
  for (const subject of subjects) {
    assert.ok(memberships.get(subject.id)>=10,subject.id);
    assert.ok(Number.isInteger(subject.depth)&&subject.depth>=0&&subject.depth<=7,subject.id);
  }
  const deepest = questions.filter(question => question.band === 7).flatMap(question => question.answers);
  assert.ok(deepest.some(answer => byId.get(answer.id).classification === 'claim' && answer.tier === 5));
  assert.ok(deepest.some(answer => byId.get(answer.id).classification === 'event' && answer.tier === 5));
  assert.ok(new Set(deepest.filter(answer => answer.tier === 5).map(answer => answer.id)).size >= 3);
});

test('original subjects and the established first two question contracts survive', () => {
  for (const id of ['chemtrails', 'nibiru', 'apollo', 'mkultra', 'cointelpro', 'tuskegee', 'wtc', 'hindenburg', 'bundy', 'dahmer', 'hitler', 'samphan']) {
    assert.ok(byId.has(id), id);
  }
  assert.equal(questions[0].id, 'sky');
  assert.equal(questions[1].id, 'secrets');
  for(const id of ['nibiru','chemtrails','apollo','sun','moon','mars'])assert.ok(questions[0].answers.some(a=>a.id===id),id);
  assert.equal(lookup('MK Ultra', questions[1], subjects)?.id, 'mkultra');
});

test('typed scopes do not confuse documents, leaders, victims, or natural objects',()=>{
 const pool=id=>new Set(questions.find(q=>q.id===id).answers.map(a=>a.id));
 const leaders=pool('leaders-01');
 assert.ok(leaders.has('abraham-lincoln'));assert.ok(leaders.has('gandhi'));
 assert.ok(!leaders.has('emancipation-proclamation'));assert.ok(!leaders.has('magna-carta'));
 const criminal=pool('case-files');
 assert.ok(!criminal.has('abraham-lincoln'));assert.ok(criminal.has('harold-shipman'));
 const natural=pool('nature-01');
 assert.ok(natural.has('sun'));assert.ok(!natural.has('hubble'));assert.ok(!natural.has('moon-landing-hoax'));
});

test('matching answer pools share a stable scope identifier for rotation',()=>{
 const pools=new Map();
 for(const q of questions){
  const key=q.answers.map(a=>a.id).sort().join('|');
  if(pools.has(key))assert.equal(q.poolId,pools.get(key));else pools.set(key,q.poolId);
  assert.match(q.poolId,/^[a-f0-9]{16}$/);
 }
 assert.ok(pools.size>=140,'Most prompts should have genuinely different accepted pools');
});

test('top discoveries vary instead of accepting one obscure keyword across most of the game',()=>{
 const gems=new Map();
 for(const q of questions){const id=q.answers.find(a=>a.tier===5).id;gems.set(id,(gems.get(id)??0)+1);}
 assert.ok(gems.size>=35);
 assert.ok(Math.max(...gems.values())<questions.length*.2);
 for(const id of gems.keys())assert.ok(byId.get(id).familiarity>=2,id);
});

test('engine lookup resolves every accepted spelling to its intended subject', () => {
  for (const question of questions) {
    for (const answer of question.answers) {
      const subject = byId.get(answer.id);
      for (const alias of [subject.name, ...subject.aliases]) {
        assert.equal(lookup(alias, question, subjects)?.id, subject.id, `${question.id}: ${alias}`);
      }
    }
  }
});

test('catalog is UTF-8 without BOM or CRLF bytes', async () => {
  const bytes = await readFile(new URL('../../play/misinformation/catalog.js', import.meta.url));
  assert.ok(!bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])));
  assert.ok(!bytes.includes(13), 'Catalog must use LF line endings');
  assert.equal(Buffer.from(bytes.toString('utf8'), 'utf8').compare(bytes), 0);
});
