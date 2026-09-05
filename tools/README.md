# tools — the acceptance gates for the standalone play routes

Three scripts. Each starts its own threaded web server on its own port, rooted at this repo, so
nothing else needs to be running and no dev server on a fixed port can interfere.

```
python tools/check_landing.py      # the landing card's CTA and title
python tools/check_contract.py     # the host contract, the lifecycle, and the isolation
python tools/check_play.py         # the playthrough, and any game writing into hidden furniture
```

All three exit non-zero on failure. None may be skipped before Part A is called done.

## check_landing.py

What survived of the old `verify.py`: every landing card puts its whole CTA inside the first 320x568
viewport at 44px or more, and no title clips at 320, 360, 390 or 430. Its play-route half was dropped
because the two gates below assert far more than the "mounted, no console errors" check that let round
one pass 8/8 while three games rendered 13% short.

## check_contract.py

* **The zoom contract.** `offsetHeight` is layout px, `getBoundingClientRect()` is visual px, so
  `visual / layout == 1.15` proves `.channel`'s zoom is reproduced off the television and `== 1.00` is
  the round-1 bug. This needs no per-game formula, which is why two earlier and wronger invariants were
  thrown away — see the module docstring.
* **The lifecycle.** `GAME_READY` fires only once the fragment is mounted, and `GAME_START` comes from
  the game rather than from the exit control.
* **The isolation.** Per channel: the named page furniture carries `.mbs-off`, the named game parts do
  not, nothing hidden still occupies space, and nothing hidden has escaped `#channel` still carrying the
  class. Sag's inventory bar is checked by hand because the game moves it into `.glass` during start-up.
* **Fail closed.** Two broken registries are written as real temporary routes and served: an
  unresolvable selector and an empty roots list. Both must mount nothing at all.

## check_play.py

* Arms a `MutationObserver` over the whole document **before** the fragment's scripts are re-created.
  Any write landing under a `.mbs-off` ancestor means a game needs something that was hidden, which
  means a missing root. Known-cosmetic exceptions are listed in `ALLOW`, narrowly and with a reason.
* Drives each game to its real terminal state and requires `MBS.unlock` **for that game**, read off the
  lifecycle event's own `game` field. WebGL is forced off wherever the channel ships a documented flat
  fallback, so the fallback is what gets played.
* Writes one screenshot per route into `tools/shots/`.

**PLAYED** means the terminal state was actually reached. Six of eight are: djscratch, fuel, corgi,
lil boyfriend, sag and armie. Armie's three checkpoints are five-question quizzes with no answer key in
the DOM, so the driver **learns** — `onPick` reveals the right option by classing it `.correct`
(`armie.html:1007`), the driver records it against the question text, and getting caught returns the
player to the last cleared checkpoint rather than ending the run, so a second pass is always available.

**PROBED** means the terminal state was not reached, and the run says so in its summary rather than
counting it as a pass. Two remain, each for a stated reason and each with a real assertion of its own
instead of a shrug:

* `goon` — the game is a compiled third-party bundle inside a same-origin iframe with no exposed state.
  Seeding it one merge from its win would mean reverse-engineering minified code, out of proportion to a
  change that never touches the bundle. What Part A *can* break is checked instead: the iframe is
  `loading="lazy"` (`goon.html:95`) and a lazy iframe inside a collapsed ancestor never loads, so the
  gate asserts it has real geometry, that its bundle returned 200, and that the game mounted inside it.
* `girlfriend` — she calls no `MBS.unlock` at all, by design (`girlfriend.html:9`), so there is no
  terminal state to assert. The gate forces WebGL off and requires her documented flat fallback to
  appear and render its written room.

## What the gates do not cover

Real touch input, real safe-area insets, and any browser that is not headless Chromium.
