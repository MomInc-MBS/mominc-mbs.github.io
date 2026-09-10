Game downloads are described by generated files in `tv/game-packs/`.
After editing website HTML, JavaScript, CSS, images, models, audio, or fonts, run
`python tools/gen_game_packs.py` and include the generated manifests in the same
commit. Each manifest identifies the exact asset bytes used by the loading screen.

Run `node --test tools/check_game_loading.test.mjs` when changing the download
worker, loading screen, or game entrypoints. Armie's complete pack loads on initial
page entry, before character selection and Start. Preserve that ordering.
