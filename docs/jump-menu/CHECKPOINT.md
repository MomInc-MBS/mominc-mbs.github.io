# Coach Jump pyramid menu: checkpoint (MENU worker)

Base: origin/main 7a6f4c4a. Branch w/jump-menu, worktree C:/jump-work/menu. Not committed (conductor commits). Spec: C:/jump-work/PLAN.md.

## Changed files
- `apps/jump/selector.mjs` (new, pure): layout table, initialState (per-field fallback saved -> round -> default), pick, step (wrap), fixTrack, saveLook. Key `mbs-app-jump-look-v1` = {v:1, shapeId, paletteId, eyes, trackId}.
- `apps/jump/menu.mjs` (new): six real buttons on the pyramidDesk geometry (game units; cut() ported with the same hash), icons, centre preview via renderPaperCoach, one delegated click handler.
- `apps/jump/lab.css` (new, @imported from style.css): scene rules from tv/channels/girlfriend.html (portrait cascade) + pyramid + zoom + READY/BEGIN.
- `apps/jump/run.mjs` (rewritten): menu -> GO -> zoom -> READY?/BEGIN! -> game; EXIT/over -> pyramid; one soundtrack per mount; no rounds.mjs use.
- `apps/shell.mjs`: autostart accepts `true`; busy = false for autostart:true apps (Jump reports a run via window.MOM_APP_BUSY, which update.mjs already honours).
- `apps/apps.json` (jump: options.autostart true, new description) + regenerated apps/jump/index.html, manifest.
- `arcade/pyramid-jump/game.mjs` + SYNC.json + `tools/sync_pyramid_jump.py`: P11 hold (5 anchors, listed as one patch).
- `tools/check_jump_menu.test.mjs` (new), `tools/check_pyramid_jump_apps.test.mjs` (patch count 10 -> 11), `tools/gen_game_packs.py` (+.m4a in EXT so the music ships in app-jump).
- Regenerated `tv/game-packs/*.json`. NOT touched: soundtrack.mjs, music/**, check_jump_soundtrack.test.mjs (AUDIO worker).

## Decisions / deviations
- Pyramid keeps the REAL game geometry at close-up scale (1 unit = 1% of play-area width, tiers bleed off the sides). Only the GO label is bigger than the game's FOOD label (40x18 vs 30x14 units) for a 56px hit target. Squares are 22x18 units = about 72x59 px at 360 wide.
- drgf SVG path is /tv/assets/drgf-paper-character.svg (the brief said tv/channels/assets; that path does not exist).
- In the portrait source scene Dr GF is a huge torso close-up; her face is never in frame (nor in the TV). The pyramid leaves her name badge visible.
- `.paper-note` left out (display:none in portrait in the source).
- Zoom target measured from game constants: desk base 86 units above canvas bottom (camY -90), 150 units wide (`DESK_BASE_UP`, `DESK_BASE_W` in run.mjs).
- unlock(): soundtrack.unlock() starts the DEFAULT track first, then select(saved) swaps it; the first decode is wasted when the saved track differs. Fix belongs in soundtrack.mjs (accept an initial id).

## Verified
See the report; evidence in C:/jump-work/evidence/.

## Next
Conductor: regenerate (python tools/gen_apps.py; python tools/gen_game_packs.py) after the audio files land, commit, phone gates (iOS audio unlock, tilt permission card, install, offline).
