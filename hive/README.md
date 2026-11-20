# HIVE public research reference

Live URL: https://mominc.online/hive/

The 286 canonical research pages use stable IDs in `/hive/notes/ID/`. Search covers
the complete text of every canonical page. The interactive graph uses all 2,381
original typed edges; focusing a page displays its direct neighborhood and the
source/relationship/target of each link. Text remains readable without JavaScript.

`vault/` preserves the supplied source bytes (excluding Obsidian editor settings).
`downloads/HIVE_Framework_Research_Vault.zip` is the unchanged original attachment.
Twelve archived Markdown documents also have browser reading views. Other original
formats remain available directly from the archive index. Evidence and
implementation labels come from the source graph. Publication adds no runtime,
training results, or experiment outcomes.

Rebuild from the preserved package using Python 3.11 or later:

```
python -m pip install -r tools/hive-requirements.txt
python -m zipfile -e hive/downloads/HIVE_Framework_Research_Vault.zip /temporary/source
python tools/build_hive.py /temporary/source/HIVE_Framework_Research_Vault --zip /absolute/path/to/original.zip
python tools/check_hive.py
python tools/gen_game_packs.py
```

The ZIP input must be outside the generated output directory during rebuilding.
The existing site's `AGENTS.md` requires game-pack regeneration before publication.
No package install or JavaScript compilation is needed to serve the site.

Diagrams render from preserved Mermaid source with a local, pinned Mermaid 10.9.3
bundle. Its MIT license is in `assets/vendor/MERMAID-LICENSE.txt`. Source diagrams
remain available if JavaScript fails and in expandable source panels after rendering.
