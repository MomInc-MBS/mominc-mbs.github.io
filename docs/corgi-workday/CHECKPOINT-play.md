# CHECKPOINT — gameplay worker (26 Nov, repair pass 1)

## Changed files
- `tv/channels/corgi-endless.mjs`: `cleanSettings` (exported) adds `appearance` and `ambience`. New `awardHealing(run, id)`: one quarter per id, clamped. Ids are saved in `run.healed`; the Heart pick heals through it.
- `tv/channels/corgi-locker.mjs` (new, pure): placement post-pass with its own RNG (layouts unchanged), player states, damage check, encounter, `canExit`, grace, rearm. Holds the framing knobs `EYE_Y`/`VIEW_D`/`HEAD_AHEAD` and `reachGap(section)`.
- `tv/channels/corgi-scare.mjs`: seeded 8–22 s shuffle-bag ambience, at most 2 at once. Adds `setLevel` and `setMuffle`.
- `tv/channels/corgi.js` (ENDLESS only; APP_OFFER kept): quarter hearts with `+¼`, pause/resume hold, lockers (sequence, grip, slit, steering, inspection pose, creature sounds), and a `persistRun` that keeps menu settings.
- Tests: `check_corgi_endless.test.mjs` (+3); `check_corgi_locker.test.mjs` (A10–A15 plus reach at speed).

## Repair pass 1
1. **Slit framing**:
   - The hidden eye is now at 0.51 m, and the slit band is centred on its horizon (37–63%).
   - The creature inspects from across the hall, its head 1.55 m from the eye.
   - The inspection pose keeps his head up at the slit; a small light at the door keys his face.
   - The drive samples head top, head centre, jaw and chin every ~90 ms through INSPECT. All stayed inside the slit at 390×844 and 360×780.
   - During PASS his body crosses about 190 px of the slit.
   - Exit shows WAIT while he sniffs at this door.
2. **Reach at speed**:
   - `reachGap(section)` sets bank spacing. The model: the dog sprints at 4.25 u/s; the pursuer starts at the layout's fair-seat distance of 10 u and closes to catch range.
   - The gap is 7.5 through about section 95 and 7.0 at section 100.
   - Gaps are filled middle-first. Facing banks are allowed only when the creature still has room past the open door.
   - Test at sections 3, 30, 60 and 100 (8 seeds, 250 ms swept frames): from the widest stretch, the dog always hides first. Layouts are byte-identical.
   - Past about section 100 the hall's doorways cap density.
3. **Selectors (engine adds no styling)**:
   - `#ccHide.cc-use.cc-hide[data-state="hide|exit|wait|clear"]`, with `aria-disabled` on wait. Its inline style is removed.
   - `#ccPrompt[data-locker="hide|clear"]` marks the locker lines.
   - Slit: `.cc-slit` and its inner `i`. Grip paw: `.cc-grip.on` and `.pull`.
   - UI worker: `#ccHide` inherits `.cc-use` `bottom:80px` and overlaps `.cc-flash`. It needs a `bottom` in corgi.html.

## Results
- `node --test tools/check_corgi_*.test.mjs`: **57/57 pass**.
- Browser drive (390×844 full, 360×780 framing, story smoke): **33/33 PASS**, no page errors.
- Shots in `C:/corgi-work/shots/play/`:
  - New: `3-slit-sniff.png`, `3-slit-sniff-360.png`, `4a-passing.png`, `4a-passing-360.png`.
  - Kept from the first run: 1, 2, 4, 5, 6, 7.
- Driver: `C:/corgi-work/scratch-play/drive_lockers.py`. The harness skips the pack hash check.

## Known issues
- The flashlight cannot light things at arm's length, so locker doors glow faintly.
- Locker state is not saved; a reload restarts the section.

## Next step
- Integrator: regenerate packs, then a phone pass on hide/exit feel and the ambience mix.
