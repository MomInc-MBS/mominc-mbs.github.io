import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {subjects, questions} from '../../play/misinformation/catalog.js';
import {normalize, lookup} from '../../play/misinformation/engine.js';

const byId = new Map(subjects.map(subject => [subject.id, subject]));

test('catalog subjects have unique IDs and complete sourced exact statements', () => {
  assert.equal(byId.size, subjects.length);
  assert.ok(subjects.length >= 40, 'Expanded release must retain meaningful breadth');
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

test('exactly three distinct prompts exist at each of eight altitude bands', () => {
  assert.equal(questions.length, 24);
  assert.equal(new Set(questions.map(question => question.id)).size, 24);
  for (let band = 0; band < 8; band++) {
    const group = questions.filter(question => question.band === band);
    assert.equal(group.length, 3, `Band ${band}`);
    assert.equal(new Set(group.map(question => question.prompt)).size, 3);
  }
  assert.ok(questions.every(question => Number.isInteger(question.band) && question.band >= 0 && question.band <= 7));
});

test('all pools have multiple valid alternatives and a top-tier answer', () => {
  const allTiers = new Set();
  for (const question of questions) {
    assert.ok(question.answers.length >= 3, question.id);
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

test('every subject is reachable, with new material introduced at every band', () => {
  const firstBands = new Map();
  for (const question of questions) {
    for (const answer of question.answers) {
      firstBands.set(answer.id, Math.min(firstBands.get(answer.id) ?? 8, question.band));
    }
  }
  assert.equal(firstBands.size, subjects.length);
  for (const subject of subjects) {
    assert.equal(subject.depth, firstBands.get(subject.id), `${subject.id}: misleading depth`);
  }
  for (let band = 0; band < 8; band++) {
    assert.ok(subjects.some(subject => subject.depth === band), `No new subjects at band ${band}`);
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
  assert.equal(questions[0].answers.find(answer => answer.id === 'nibiru')?.tier, 5);
  assert.equal(questions[0].answers.find(answer => answer.id === 'chemtrails')?.tier, 0);
  assert.equal(questions[0].answers.find(answer => answer.id === 'apollo')?.tier, 3);
  assert.equal(lookup('MK Ultra', questions[1], subjects)?.id, 'mkultra');
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
