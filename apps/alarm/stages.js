// MOM's: 2048 Reminder escalation timing + wording, shared by the app (in-app alerts) and backend/adhd-push (push cadence).
// From the due time T0 the alerts fall at 0, 300, 480 and 540 s (sequential deadlines), then every 30 s on stage 4.
// An "alert index" n = 0,1,2,3,4,5...; the stage (face) is min(n, 3) + 1, so every repeat stays on stage 4.
export const APP_NAME = 'MOM\'s: 2048 Reminder';
export const STAGE_AT = [0, 300, 480, 540];                // seconds after due: stages 1..4
export const REPEAT_S = 30;                                // stage-4 repeat gap
export const OFF_LOCK_MS = STAGE_AT[3] * 1000;             // Settings "Turn off alarm" stays locked until T0 + 540 s (stage 4 begins)
export const MISS_MS = 3 * 3600_000;                       // an unfinished occurrence becomes MISSED after this
export const HOLD_MS = 3000;                               // emergency stop: a deliberate hold
export const MAX_LABEL = 200;                              // stored/typed reminder text limit; only the notification preview is cut shorter
export const PREVIEW_MAX = 60;                             // notification preview length (code points); the app keeps the full text

/** Alert index at `s` seconds after T0. */
export function stageFor(s) {
  const i = Math.max(0, STAGE_AT.findLastIndex(t => s >= t)), last = STAGE_AT.length - 1;
  return i < last ? i : last + Math.floor((s - STAGE_AT[last]) / REPEAT_S);
}
/** Seconds after T0 at which alert n fires. */
export const stageStart = n => n < STAGE_AT.length ? STAGE_AT[n] : STAGE_AT.at(-1) + (n - STAGE_AT.length + 1) * REPEAT_S;
/** Face 0..3 (stage 1..4 artwork) for alert n. */
export const faceFor = n => Math.min(Math.max(0, n | 0), STAGE_AT.length - 1);
export const faceUrl = face => `/apps/alarm/stages/stage${faceFor(face) + 1}.webp`;
/** The one app-wide face: highest unresolved stage, ties to the earliest due; nothing active shows stage 1 (face 0).
 *  list = [{face, due}] of unresolved occurrences. */
export const topFace = list => list.reduce((b, x) => !b || x.face > b.face || (x.face === b.face && x.due < b.due) ? x : b, null)?.face ?? 0;

/** Whitespace normalised label for a notification line; truncation only when `preview`. Empty -> "Your reminder". */
export function labelText(label, preview = false) {
  const t = [...String(label ?? '').replace(/\s+/g, ' ').trim()];
  if (!t.length) return 'Your reminder';
  return preview && t.length > PREVIEW_MAX ? t.slice(0, PREVIEW_MAX - 1).join('').trimEnd() + '…' : t.join('');
}
const COPY = [
  l => `Reminder: “${l}”.`,
  l => `Still waiting: “${l}”.`,
  l => `Did you forget about “${l}”?`,
  l => `Still pending: “${l}”. Finish the game or open Settings to turn this alarm off.`,
];
/** Body text for alert n. Plain text only: callers must put it in textContent. */
export const copyFor = (n, label = '', preview = false) => COPY[faceFor(n)](labelText(label, preview));
