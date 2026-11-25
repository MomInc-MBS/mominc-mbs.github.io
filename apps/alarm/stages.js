// ADHD escalation timing + copy, shared by the app (in-app escalation) and backend/adhd-push (push cadence).
// Plan B4: 0/30/90/180/300 s after due, then every 5 min. These are measured defaults, not OS delivery promises.
export const STAGE_AT = [0, 30, 90, 180, 300];            // seconds after due
export const PLATEAU_S = 300;                              // thereafter, every 5 minutes
export const TANDEM_FROM = 3;                              // companion notice allowed from the 180 s stage
export const TANDEM_GAP_MS = 3000;                         // companion ~3 s after the main message
export const ENGAGE_MS = 60_000;                           // after the user opens/acknowledges, follow-ups wait this long
export const MISS_MS = 3 * 3600_000;                       // an unfinished occurrence becomes MISSED after this
export const FRICTION_MS = 15_000;                         // "Task done" is blocked this long after the puzzle win (interaction friction only)

export const stageFor = s => s < 30 ? 0 : s < 90 ? 1 : s < 180 ? 2 : s < 300 ? 3 : 4 + Math.floor((s - 300) / PLATEAU_S);
export const stageStart = n => n < STAGE_AT.length ? STAGE_AT[n] : PLATEAU_S + (n - STAGE_AT.length + 1) * PLATEAU_S;

const COPY = [
  t => t ? `Time for: ${t}. Open the challenge.` : 'ADHD alarm. Open the challenge.',
  t => t ? `Still waiting for your check-off on "${t}".` : 'Still waiting for your check-off.',
  () => 'That was quick. Confirm you\'re actually done.',
  () => 'MOM has not received the paperwork.',
  t => t ? `Plateau reached. "${t}" is still not checked off.` : 'Plateau reached. Still not checked off.',
];
export const copyFor = (stage, label = '') => COPY[Math.min(stage, COPY.length - 1)](label);
export const companionFor = () => 'Second notice, same paperwork. One alarm, two envelopes.';
