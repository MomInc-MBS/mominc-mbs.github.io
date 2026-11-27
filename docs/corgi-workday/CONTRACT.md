# Mom's Endless Corgi Workday — frozen contract (integrator: Claude)

Plan: `docs/corgi-workday/PLAN.md` (Ian's build plan, 26 Nov 2026). Base: site origin/main 9140e45e. Branch `w/corgi-workday`, worktree `C:/corgi-work/site` (shared by both workers; NO commits by workers, the integrator commits at gates).

## Scope
The installed app `/apps/corgi/` (endless mode, `ctx.endless.app`). Story mode (`/play/corgi/`, `/tv/?ch=corgi`) must look and play exactly as today: every new style uses CSS-var fallbacks equal to today's colours, lockers/ambience events/look changes run only when `ENDLESS`.

## File ownership (one owner per file; ask the integrator for anything outside your list)
| Owner | Files |
|---|---|
| UI worker | `apps/corgi/*` (app.mjs, app.css, manifest), the corgi record in `tools/gen_apps.py` (index.html is GENERATED — run `python tools/gen_apps.py`, never hand-edit), `tv/channels/corgi.html` (CSS + static markup), NEW `tv/channels/corgi-looks.mjs`, NEW `tools/check_corgi_looks.test.mjs` |
| Gameplay worker | `tv/channels/corgi.js`, `tv/channels/corgi-endless.mjs`, `tv/channels/corgi-hearts.mjs`, `tv/channels/corgi-scare.mjs`, NEW `tv/channels/corgi-locker.mjs` (pure logic, node-testable), `tools/check_corgi_endless.test.mjs`, `tools/check_corgi_hearts.test.mjs`, NEW `tools/check_corgi_locker.test.mjs` |
| Integrator | `tools/gen_game_packs.py` + `tv/game-packs/*` (packs regenerated once at the end), docs, commits |

Shared shell `apps/shell.mjs/css` and other apps: do not change behaviour. `git diff origin/main -- apps/ ':!apps/corgi'` must be empty unless the integrator approves.

## Store (gameplay worker adds sanitising in `corgi-endless.mjs` `cleanSettings`; UI worker reads/writes via `loadStore`/`saveStore`)
- `settings.sound` (bool, existing), `settings.look` (number, EXISTING look *sensitivity* — do not reuse the name).
- NEW `settings.appearance`: string preset id, default `'animal_001'`; anything not matching `/^animal_\d{3}$/` → `'animal_001'`. (Unknown-but-well-formed ids fall back in `lookById`.)
- NEW `settings.ambience`: number 0..1, default 0.5.
- Store key stays `corgi-endless-v2`. No new key, no migration needed (missing fields get defaults).

## Looks module `tv/channels/corgi-looks.mjs` (UI worker)
```js
export const DEFAULT_LOOK = 'animal_001';
export const LOOKS;                 // exactly 100 frozen records, ids animal_001..animal_100
// {id, name, group, family, base, mark, pattern, skin, claw}
export function lookById(id);       // unknown -> LOOKS[0]
export function applyLook(root, look); // root = the #cc element. Sets CSS vars --fur, --fur-mark, --skin, --claw,
//   --look-scale (0.9..1.1) and data-look-family / data-look-pattern / data-look-id on root; (re)renders the
//   nose (.cc-nose), both walking paws (.cc-paw.l/.r) and the locker grip paw (.cc-grip) markup for that family.
//   Idempotent; does nothing if the same id is already applied. No per-frame work.
```
Binding rules: nose leather + nostril base + ALL paw pads use `--skin`; muzzle fur + paw fur use `--fur`/`--fur-mark` with the SAME pattern; nails use `--claw`. animal_001 = today's corgi exactly: fur `#caa06a`, skin `#2a1a10` (nostrils stay darker `#0e0805`), plus new small nails.

## Game ⇄ app events (on the #cc root element)
- App → game: `root.dispatchEvent(new CustomEvent('cc:pause'))` / `'cc:resume'`. Pause freezes the loop, chase, scare timers, encounter progression and ambience scheduling together; resume does not release a backlog of timers or sounds.
- App → game: `'cc:look'` with `detail:{id}` after `applyLook` (game snapshots it for the next locker sequence).
- Game → app: `root.dataset.locker` = `'entering' | 'hidden' | 'exiting'` while a locker sequence runs (absent otherwise) and `root.dispatchEvent(new CustomEvent('cc:locker-idle'))` when it ends. The app queues a new look while `dataset.locker` is set and applies it on `cc:locker-idle`.
- Game → app: `'cc:ambience'` is not needed; the game reads `settings.ambience` from the store at mount and on `cc:resume`.
- Locker grip paw: the game shows `.cc-grip` by adding class `on` (and `pull` for the pull-shut pose). The UI worker owns its markup/CSS (inside `#cc`, z-index above the nose, side = right paw, underside visible).

## Rules for both workers
- Read only the regions you need (`grep -n`, `sed -n a,bp`); corgi.js is 234 KB.
- Tests: `node --test tools/check_corgi_*.test.mjs` must pass. Add one small check for new logic; no frameworks.
- Stop only processes you started, by PID. Never `taskkill /IM`. Never run `gen_game_packs.py`.
- Local browser proof: serve a `git archive`-style copy or the worktree on a free port with `python -m http.server`; phone sizes 360/390/430 wide.
- Write your result into `docs/corgi-workday/CHECKPOINT-<ui|play>.md` (≤500 words: changed files, decisions, passing checks, failures, next step).
