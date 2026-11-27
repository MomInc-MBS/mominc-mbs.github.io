# CHECKPOINT: UI/appearance worker (26 Nov 2026)

## Changed files
- `apps/corgi/app.mjs` (mount applies look, pause/resume controller, folding paper + Settings + Customization logic), `apps/corgi/app.css` (paper theme, HUD strips, popups, wall, gate), generated `apps/corgi/index.html` + `manifest.webmanifest`.
- `apps/apps.json` corgi record: name "Mom's Endless Corgi Workday", shortName "Corgi Workday", `paper:true`, `keepGame:true`, theme `#2a1e12`. (The corgi record lives here, not in gen_apps.py.)
- `tools/gen_apps.py`: `UI_PAPER` template used only when a record has `paper`; `keepGame` copied into the config. Regeneration touches no other app (verified by `git status`).
- `apps/shell.mjs`: TWO flag-gated lines (`cfg.keepGame`): "← Menu" pauses instead of disposing, Start resumes the mounted game. Other apps byte-identical (their generated files unchanged).
- `tv/channels/corgi.html`: `.cc-grip` div + CSS, `scale:var(--look-scale,1)` on nose/paws. Story render proven pixel-identical (390 px, nose+paws region diff = none).
- NEW `tv/channels/corgi-looks.mjs` (LOOKS x100, lookById, applyLook, markup helpers), NEW `tools/check_corgi_looks.test.mjs`. `tv/mom-tour.js:216` name string.

## Decisions
- Looks drawn in code: 15 families (parametric cone + paw geometry), 17 patterns, shared `--fur/--fur-mark/--fur-mark2/--skin/--claw/--look-scale`. Roster written from PLAN §7 (the local draft had wrong group counts: 10 big cats, 10 rabbits). Records carry two optional extras: `mark2` (tricolor/patches) and `scale` (0.92-1.10). animal_001 keeps `#caa06a`/`#2a1a10` plus small claws.
- Paper menu is three leaves hinged on shared spines; neighbours stand as folded slivers; `inert` on non-active leaves; swipes need >=64 px, 2:1 horizontal, never from inputs; far hops pass through the front page; reduced motion = 120 ms dissolve. Start folds the front away (380 ms) then the shell reveals the game.
- "← Menu" pauses (`cc:pause`), Start becomes "Resume run" (`cc:resume`); Escape returns to front / resumes. Reset run is blocked while a run is paused.
- Look change while `root.dataset.locker` is set queues until `cc:locker-idle`.
- Gameplay worker note: the preview menu also contains a `.cc-grip`; scope game queries to `#cc` (`root.querySelector`).

## Checks
- `node --test tools/check_corgi_*.test.mjs`: 55 pass, 0 fail (6 mine). `check_mom_tour`, `check_app_hand`, `check_nitro_fuel`: 25 pass.
- Browser (devserver recomputing pack hashes, not committed): 18/18 menu flow checks (tabs, rapid, swipe, vertical drag, slider drag, saves, prev/next/shuffle x30/filter/use/leave-without-apply); 9/10 game flow (look before mount, pause/resume same run, locker queue, trait popup; the one "FAIL" was my test reading uppercase label text); 360/430 no overflow and Start reachable; reduced-motion 3/3.

## Screenshots (`C:/corgi-work/shots/ui/`)
`before-*` (menu 360/390/430, settings, game, trait), `after-menu-{360,390,430}`, `after-settings/custom/custom-pull/wall/pause/game/trait/game-grip/game-grip-pull/death/reduced/gate-390`, `contact-sheet.png` (all 100: nose, paws, grip).

## Not done / failures
- Pack hashes (`tv/game-packs/app-corgi.json`) are stale until the integrator regenerates packs; the grip, ambience slider and `settings.appearance/ambience` depend on the gameplay worker's `cleanSettings`.
- `tv/game-loader.js:9` still labels the download overlay "MOM's: Corgi Endless" (outside my files).
- Update reload while paused: `watchUpdates` is only busy while the stage shows; the run is saved in the store, not in memory.
- Real-phone check of fold feel and swipes still needed; swiftshader was used for screenshots.

## Next
Integrator: regenerate packs, wire the gameplay worker's grip (`on`/`pull` on `#cc .cc-grip`) and ambience, then phone test.

## Repair pass 1
- `#ccHide` is now a paper dog-tag (ink border, paw stamp, purple EXIT stamp, dashed WAIT, pressed/focus states) and the locker/clear prompt a red-ruled printed stamp; both styled only from `corgi.html` (ids beat the injected `.cc-use`).
- `apps/shell.mjs`: updater busy is `!stage.hidden || (cfg.keepGame && !!game)`.
- Rabbit paws: long furry palm, one underside patch, no toe pads, tiny nail tips (a test requires the claw var).
- `node --test tools/check_corgi_*.test.mjs`: 56 pass. Re-shot `after-game-390.png` (HIDE visible, section 3) and `contact-sheet.png`.
