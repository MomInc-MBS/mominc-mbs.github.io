// MOM's alarm games: the completion rule table. PURE: judge() reads the final STATE (never a UI flag) and says 'won' | 'lost' | null (not finished).
// Win is always checked before the budget, so a last-move win counts. Mirrored 1:1 by the Kotlin port in the APK (AlarmCore.kt, object Games).
// Anything malformed -> null (the alarm keeps ringing). Keep both tables in sync when a game changes; bump rulesVersion if a rule changes.
export const RULES_VERSION = 1;
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const RULES = {
  brick: s => int(s.bricksTotal, 1, 100) && int(s.bricksLeft, 0, s.bricksTotal) && int(s.lives, 0, 4)
    ? (s.bricksLeft === 0 ? 'won' : s.lives === 0 ? 'lost' : null) : null,                     // 4 total lives
  pong: s => int(s.player, 0, 5) && int(s.cpu, 0, 5) && !(s.player === 5 && s.cpu === 5)
    ? (s.player === 5 ? 'won' : s.cpu === 5 ? 'lost' : null) : null,                           // first to 5
  match3: s => int(s.target, 1, 1000) && int(s.progress, 0, 100000) && int(s.swaps, 0, 20)
    ? (s.progress >= s.target ? 'won' : s.swaps >= 20 ? 'lost' : null) : null,                // 20 valid swaps
  blocks: s => int(s.lines, 0, 1000) && int(s.pieces, 0, 30) && typeof s.toppedOut === 'boolean'
    ? (s.lines >= 3 ? 'won' : s.toppedOut || s.pieces >= 30 ? 'lost' : null) : null,           // 3 lines, 30 pieces
  memory: s => int(s.pairs, 0, 6) && int(s.attempts, 0, 18)
    ? (s.pairs === 6 ? 'won' : s.attempts >= 18 ? 'lost' : null) : null,                        // 6 pairs, 18 attempts
  odd: s => int(s.answered, 0, 12) && int(s.correct, 0, s.answered)
    ? (s.answered === 12 ? (s.correct >= 8 ? 'won' : 'lost') : null) : null,                    // exactly 12, never early
};
export const GAMES = Object.keys(RULES);
export function judge(gameId, rulesVersion, finalState) {
  if (rulesVersion !== RULES_VERSION || !Object.hasOwn(RULES, gameId) || !finalState || typeof finalState !== 'object') return null;
  try { return RULES[gameId](finalState); } catch { return null; }
}
