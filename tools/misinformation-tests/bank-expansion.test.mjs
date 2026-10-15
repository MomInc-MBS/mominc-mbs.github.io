import test from 'node:test';
import assert from 'node:assert/strict';
import {subjects, questions} from '../../play/misinformation/catalog.js';
import {lookup} from '../../play/misinformation/engine.js';

test('common world-event answers work across broadly worded event prompts', () => {
  for (const questionId of ['history-01']) {
    const question=questions.find(q=>q.id===questionId);
    assert.ok(question,questionId);
    for (const [name,id] of [
      ['cuban missile crisis','cuban-missile-crisis'],
      ['cuban missle crisis','cuban-missile-crisis'],
      ['cuban missile crises','cuban-missile-crisis'],
      ['WWII','world-war-two'],
      ['world war 1','world-war-one'],
      ['Great Depression','great-depression'],
      ['Kennedy assassination','jfk-assassination'],
      ['Katrina','hurricane-katrina'],
      ['COVID','covid-pandemic']
    ]) assert.equal(lookup(name,question,subjects)?.id,id,`${questionId}: ${name}`);
  }
});

test('familiar bank expansion preserves exact-event and unsupported-claim distinctions', () => {
  const byId=new Map(subjects.map(s=>[s.id,s]));
  assert.ok(subjects.length>=204);
  for(const id of ['illuminati','freemasons','bilderberg','area-51','world-war-two']) {
    assert.equal(byId.get(id)?.classification,'event',id);
  }
  for(const id of ['wtc-controlled-demolition','wtc7-demolition','mmr-autism-claim','protocols-forgery-claim','great-wall-moon-myth','pentagon-confirmed-aliens']) {
    assert.equal(byId.get(id)?.classification,'claim',id);
    assert.match(byId.get(id).explanation,/no |not |myth|forgery|does not|do not/i,id);
  }
  assert.ok(byId.get('world-war-two').statement.endsWith('in Europe.'));
  assert.match(byId.get('vietnam-war').explanation,/did not mean.*ended/);
});
