# Unlock tour PR 1: decisions

D01 App shell imports `/arcade/tub-flight/game.mjs` as a module (no iframe: the public page redirects unless the sponsor-ad session flag is set). One engine, no copy.
D02 Shell is `<html data-game="app-fuel" data-loader="bar">` plus `/tv/game-loader.js` (`'app-fuel'` added to its names map). The shell runtime (`/apps/shell.mjs`, `data-mbs-src` so the loader sees a load event) runs only after the verified pack is ready; "Ready offline" shows only on `mbs-game-ready`.
D03 Worker accepts pack ids matching `^app-[a-z0-9-]+$` in addition to the fixed game list. Pack JSON is still fetched same-origin and validated. No other worker change.
D04 `apps/apps.json` holds only real records (fuel, ready). No stubs for other games.
D05 Engine takes `{target}`; endless is `target: Infinity`. `TARGET=8` and finite logic unchanged. Selected by `mountTubFlight(host, {endless:true})`, not scattered query checks; the app config passes it.
D06 Endless best is `nitro-fuel-best-v1` (plain number). Endless never writes `mbs-fuel-flight-v1`, calls `onComplete`, or redirects.
D07 App packs are lean: `apps/<id>/*`, `apps/install.mjs|shell.css|shell.mjs`, the loader, then the existing literal-reference scan. They do not inherit the TV shared set. Helping Hand's loader badge is pruned.
D08 Manifest `id`/`start_url`/`scope` = `/apps/<id>/`; worker scope stays `/` (distinct from manifest scope).
D09 Icons generated once with Pillow from `tv/assets/mom-inc-mark.png` (round MOM disc cropped, on #5b17c9; maskable at 60% scale). Output committed under `apps/fuel/`.
D10 Reset deletes only `nitro-fuel-best-v1`. Install UX adapted from Coach (`SOURCES.md`); `appinstalled` is a hint, never a gate.
D11 Sound toggle omitted: Tub Flight has no sound.
D12 Left alone: public `/arcade/tub-flight/` page, sponsor/TV behaviour, other games.
