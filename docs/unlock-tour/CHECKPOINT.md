# Unlock tour PR 1 checkpoint: app shell/offline plumbing + Nitro Fuel endless

Base: origin/main cebf8e87. Branch: w/site-unlock-tour (head = PR head).

## Files
- Engine/game: `arcade/tub-flight/engine.mjs` (`{target}` option), `game.mjs` (`endless` option, `BEST_KEY`).
- Catalogue/generator: `apps/apps.json`, `tools/gen_apps.py`; generated `apps/fuel/index.html`, `manifest.webmanifest`; icons `apps/fuel/icon-*.png`.
- Shell: `apps/shell.mjs`, `apps/shell.css`, `apps/install.mjs`.
- Offline: `game-assets-sw.js` (accept `app-*` packs), `tv/game-loader.js` (names map), `tools/gen_game_packs.py` (app packs), `tv/game-packs/*.json` (app-fuel new; others changed only for the loader/game bytes).
- Tests: `tools/check_nitro_fuel.test.mjs`.

## Results (desktop)
- check_nitro_fuel 4/4, check_game_loading 25/25, check_optional_fuel 2/2, check_sponsor_repeat 16/16 (needs jsdom via NODE_PATH).
- check_landing, check_contract, check_state fail identically on clean origin/main (baseline): landing times out waiting for a CTA, contract/state throw in the harness.
- Playwright (desktop chromium, phone-sized touch viewport): install shell, offline reload, endless play past 8, crash, best persisted across offline reload, reset: pass. Evidence: D:/myr5-work/site-unlock-tour-evidence/.

## Pending phone gates (NOT done)
1. Android Chrome: install, airplane-mode relaunch.
2. iPhone Safari: Add to Home Screen, offline launch, separate storage behaviour.
3. Two-app coexistence on device (second manifest can be a temporary fixture).
4. Update preserving best: ship a new pack version over an installed app on device.
