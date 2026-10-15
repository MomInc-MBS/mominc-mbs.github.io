import test from 'node:test';
import assert from 'node:assert/strict';
import { failureExample } from '../../play/misinformation/learning.js';
import { POINTS } from '../../play/misinformation/engine.js';

const question = { id: 'q1', answers: [
  { id: 'common', tier: 0 }, { id: 'rare-a', tier: 5 }, { id: 'rare-b', tier: 5 },
  { id: 'redacted', tier: 4 }
] };
const subjects = [
  { id: 'common', name: 'Common' }, { id: 'rare-a', name: 'Rare A' },
  { id: 'rare-b', name: 'Rare B' }, { id: 'redacted', name: 'Redacted' }
];

test('chooses a known highest-tier answer and returns its engine points', () => {
  const result = failureExample(question, subjects, [{ question: 'q1', subject: 'common', correct: false }]);
  assert.ok(['rare-a', 'rare-b'].includes(result.subject.id));
  assert.equal(result.tier, 5);
  assert.equal(result.points, POINTS[5]);
});

test('avoids the failed subject and falls back to the next highest available tier', () => {
  const result = failureExample(question, subjects, [{ question: 'q1', subject: 'rare-a', correct: false }]);
  assert.equal(result.subject.id, 'rare-b');
  const withoutOtherTop = { ...question, answers: question.answers.filter(answer => answer.id !== 'rare-b') };
  const fallback = failureExample(withoutOtherTop, subjects, [{ question: 'q1', subject: 'rare-a', correct: false }]);
  assert.equal(fallback.subject.id, 'redacted');
  assert.equal(fallback.tier, 4);
  assert.equal(fallback.points, POINTS[4]);
});

test('supports skipped timeouts, but returns nothing after success or on another question', () => {
  assert.ok(failureExample(question, subjects, [{ question: 'q1', skipped: true }]));
  assert.equal(failureExample(question, subjects, [{ question: 'q1', correct: true }]), null);
  assert.equal(failureExample(question, subjects, [
    { question: 'q1', correct: false }, { question: 'q2', subject: 'common', correct: false }
  ]), null);
});

test('returns nothing when required data or a known answer is missing', () => {
  assert.equal(failureExample(null, subjects, [{ question: 'q1', skipped: true }]), null);
  assert.equal(failureExample(question, null, [{ question: 'q1', skipped: true }]), null);
  assert.equal(failureExample(question, subjects, null), null);
  assert.equal(failureExample(question, [], [{ question: 'q1', skipped: true }]), null);
});
