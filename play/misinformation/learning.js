import { POINTS } from './engine.js';

/**
 * Pick one answer example to show after this question was failed or skipped.
 * The last-used answer is avoided when the prompt has another known answer.
 */
export function failureExample(question, subjects, history) {
  if (!question || typeof question.id !== 'string' || !Array.isArray(question.answers)
      || !Array.isArray(subjects) || !Array.isArray(history) || history.length === 0) return null;

  const last = history[history.length - 1];
  if (!last || last.question !== question.id || !(last.correct === false || last.skipped === true)) return null;

  const byId = new Map(subjects.filter(subject => subject && typeof subject.id === 'string').map(subject => [subject.id, subject]));
  const candidates = question.answers.flatMap(answer => {
    if (!answer || typeof answer.id !== 'string' || !Number.isInteger(answer.tier)
        || answer.tier < 0 || answer.tier >= POINTS.length) return [];
    const subject = byId.get(answer.id);
    return subject ? [{ subject, tier: answer.tier, points: POINTS[answer.tier] }] : [];
  });
  if (!candidates.length) return null;

  const alternatives = candidates.filter(candidate => candidate.subject.id !== last.subject);
  const pool = alternatives.length ? alternatives : candidates;
  const highestTier = Math.max(...pool.map(candidate => candidate.tier));
  const top = pool.filter(candidate => candidate.tier === highestTier)
    .sort((a, b) => a.subject.id.localeCompare(b.subject.id));

  // A stable hash rotates equal-tier answers across questions and run lengths
  // without storing any extra state or depending on randomness.
  const key = `${question.id}:${history.length}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const selected = top[(hash >>> 0) % top.length];
  return { subject: selected.subject, tier: selected.tier, points: selected.points };
}
