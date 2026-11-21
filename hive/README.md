# HIVE public research reference

Live URL: https://mominc.online/hive/

The 288 reference pages use stable IDs in `/hive/notes/ID/`. Search covers
the complete text of every page. The interactive graph preserves all 2,381
original typed edges and adds 32 editorial links for the current handoff and research addendum;
focusing a page displays its direct neighborhood and the
source/relationship/target of each link. Text remains readable without JavaScript.

`vault/` preserves the supplied source bytes (excluding Obsidian editor settings).
`downloads/HIVE_Framework_Research_Vault.zip` is the unchanged original attachment.
The current coder directions are revision 0.4 at `/hive/notes/CODER/`. The supplied
Markdown packet is preserved byte for byte in `updates/`; `updates/index.json`
records its digest, revision, and editorial graph links. The original HANDOFF and
ROADMAP pages link to these newer directions while preserving the 0.2 content.
The current packet has a separate download; the original ZIP remains version 0.2.
The latest research addendum is `/hive/notes/ADAPTIVE/`, supplied on 20 November
2026. It adds adaptive organizational duality, six learning layers, a formula
registry, a promotion governor, and eight proposed experiments. Its source file
is preserved in `updates/`. Source wiki links resolve to actual supplied documents;
five unavailable documents are explicitly listed as gaps. The addendum supplements
the 0.4 coder packet and preserves alternatives and earlier evidence.
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
Keep the tracked `hive/updates/` directory: the builder includes those records
without rewriting the original vault or treating its proposals as measurements.
The existing site's `AGENTS.md` requires game-pack regeneration before publication.
No package install or JavaScript compilation is needed to serve the site.

Diagrams render from preserved Mermaid source with a local, pinned Mermaid 10.9.3
bundle. Its MIT license is in `assets/vendor/MERMAID-LICENSE.txt`. Source diagrams
remain available if JavaScript fails and in expandable source panels after rendering.
The new addendum's two display equations render using a locally vendored KaTeX
0.19.1 bundle; its license and verified npm integrity are in `assets/vendor/katex/`.
Formula source remains readable without JavaScript and in expandable source panels.
