export const PAPER_HEARTS = 3;

export function restoreDream(saved = {}) {
  return {
    lives: Number.isInteger(saved.lives) ? Math.max(0, Math.min(PAPER_HEARTS, saved.lives)) : PAPER_HEARTS,
    dreamPhase: ['hunt', 'ending', 'done'].includes(saved.dreamPhase) ? saved.dreamPhase : 'hunt'
  };
}

export function losePaperHeart(state) {
  if (state.lives <= 0 || state.dreamPhase !== 'hunt' || state.level !== 1) return false;
  state.lives -= 1;
  state.level = 0;
  // The office is a checkpoint. School drawings survive an ordinary death, too.
  state.found[0] = [true, true, true];
  return true;
}

export function restartDream(state) {
  state.lives = PAPER_HEARTS;
  state.dreamPhase = 'hunt';
  state.level = 0;
  state.found[1] = [false, false, false];
}

export function canOpenBackDoor(state) {
  return state.level === 1 && state.lives > 0 && state.dreamPhase === 'hunt' && state.found[1].every(Boolean);
}

// Both cinematics use exactly the same camera path, sampled in opposite directions.
export function breakRoomPose(seconds, reducedMotion = false) {
  const t = Math.max(0, Math.min(4.1, seconds));
  return {
    y: Math.max(.12, .5 - Math.max(0, t - 2.6) * .23),
    z: 2 - Math.min(4.1, t * 1.15),
    pitch: reducedMotion ? 0 : -Math.max(0, t - 2.5) * .3,
    roll: reducedMotion ? 0 : Math.max(0, t - 2.5) * .22,
    darkness: Math.min(1, Math.max(0, (t - 2.5) / 1.5))
  };
}
