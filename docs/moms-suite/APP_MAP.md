# MOM's suite: app map (site lane, 25 Nov 2026)

Names follow `D:/outputs/moms-suite-1125/CONTRACT.md`. Unlock keys are the ids in `mom-tour-v1` (`unlocked.<id>`); none changed.

| id | full name | short_name | source asset (verified) | manifest / package | download or install route | unlock (tour) |
|---|---|---|---|---|---|---|
| lilboyfriend | MOM's: Little Boyfriend LIVE | MOM's: Lil Boyfriend | `D:/MIcroMillionaire/02 - Micro Millionaire/Segment Logos/Transparent 0824/Lil Boyfriend - mark.png` (2048 px; matches the site's `tv/assets/marks/lilboyfriend.png`). 1024 px copy in `docs/moms-suite/sources/` | APK `com.mominc.littleboyfriend` (live 0.14.0, versionCode 15); PWA `/little-boyfriend/app/manifest.webmanifest` | APK `/download/lilboyfriend/little-boyfriend-live-0.14.0.apk` (page `/games/lilboyfriend/`); PWA `/little-boyfriend/app/` | `lilboyfriend` (page complete) |
| jump | MOM's: Coach Jump | MOM's: Coach Jump | Dr Girlfriend mark: vault `.../Transparent 0824/Dr Girlfriend - mark.png` (2048 px; matches `tv/assets/marks/girlfriend.png`). 1024 px copy in `docs/moms-suite/sources/` | `/apps/jump/manifest.webmanifest` (id/scope `/apps/jump/`) | `/apps/jump/` | `jump` (goggles) |
| hand | MOM's: Hand Customizer | MOM's: Hand | `tv/assets/helping-hand-badge.png` (1440 px). Confirmed as the hand's logo: it is the Helping Hand brand mark (DJ Scratch page badge and the Helping Hand loader logo) and the existing `apps/hand` icon was already this art; the icons are regenerated from it | `/apps/hand/manifest.webmanifest` | `/apps/hand/` | `hand` (DJ Scratch + offer) |
| alarm | MOM's: 2048 Reminder | MOM's: 2048 | stage 1 `D:/outputs/moms-suite-1125/2048-stages/stage1-7636.png` (794 px). Copy `docs/moms-suite/sources/2048-stage1-7636.png` | APK `com.mominc.alarm2048` (live 0.2.0, versionCode 2, `adhd-0.2.0.apk`); PWA `/apps/alarm/manifest.webmanifest` | APK page `/download/alarm/`; PWA `/apps/alarm/` | `alarm` (Goon result menu; untouched) |
| coach | MOM's: Coach MYR5 | MOM's: MYR5 | tiny flat 2D coach, copied from the old `apps/jump/icon-*.png` to `docs/moms-suite/coach-myr5-icons/` (identical to `git show 271f0d3d:apps/jump/icon-512.png`) | none yet | none yet: `apps.json` entry is `status: pending`, no href. Unlocked users see COMING SOON until the conductor adds the URL | `coach` = the other seven unlocked (derived in `reconcile`) |
| corgi | MOM's: Corgi Endless | MOM's: Corgi | kept (`apps/corgi/icon-*`) | `/apps/corgi/manifest.webmanifest` | `/apps/corgi/` | `corgi` |
| misinformation | MOM's: Misinformation Machine | MOM's: Misinfo | kept | `/apps/misinformation/manifest.webmanifest` | `/apps/misinformation/` | `misinformation` |
| fuel | MOM's: Nitro Fuel | MOM's: Nitro Fuel | kept | `/apps/fuel/manifest.webmanifest` | `/apps/fuel/` | `fuel` |

Other apps found: `download/haunt/` (HAUNT inspection APK, `haunt-v7.apk`). It is not in the contract table and is not a tour reward, so it was left alone.

## Missing / not found
- None of the required logos was missing. No substitute was guessed.
- Icon art uses a cream (#fff9e6) canvas for Dr Girlfriend and Little Boyfriend because both logos have dark caption text that is unreadable on dark canvases. This is padding colour only.

## Icon rules (`tools/gen_suite_icons.py`)
Mechanical crop-to-artwork + resize + pad. "any" icons fit the artwork in 90% of the canvas; maskable icons fit the artwork's bounding-box diagonal inside the central 80%-diameter circle. Old source files were not touched. The shells already use `icon-192.png` as their apple-touch-icon; the LB PWA keeps its own 180 px `apple-touch-icon-180.png` (regenerated).
