"""tools/prep_hand_obj.py - how tv/assets/floating-hand.obj was made, and how to remake it.

The source is Ian's supplied model, D:\\OpenGameBuilds\\websites-0905\\assets\\hand\\floating-hand.obj,
6.0 MB of ASCII OBJ. That file is the one PLAN-r9 row 7.9 names. It is not what ships, because 6 MB
of text on a channel that a phone loads is a real defect, and none of the weight is geometry:

  - Every coordinate was written at 17 significant figures. The model is 0.16 units across, so four
    decimals is a tenth of a millimetre at its own scale - past the point any of it can be seen.
  - It carries a normal and a UV for all 28,586 vertices. Nothing here samples a texture (the hand is
    a hologram tinted by material parameters, never an image), and three.js computes normals from the
    triangles at load. Both were dead weight.

Rounding alone: 6.0 MB -> 3.25 MB. Rounding and dropping vn/vt: **1.19 MB**, 235 KB over gzip. The
48 named parts and the three material assignments - skin, stump_flesh, nail - survive untouched,
because those are what the editor actually reads: the five *_claw groups are the nails it lengthens
and recolours, and the mtl's Kd values are the HUMAN preset's base tones.

Faces come out as bare `f a b c` triangles, which is why tv/channels/djscratch.js can parse this with
twenty lines instead of pulling three.js's OBJLoader - an addon that imports bare "three" and so needs
an import map the shell cannot give it (see the loader note in that file).

    python tools/prep_hand_obj.py tv/assets/floating-hand.obj

Re-run only if the source model changes. floating-hand.mtl is copied across verbatim.
"""

import io
import re
import sys

SRC = r"D:\OpenGameBuilds\websites-0905\assets\hand\floating-hand.obj"
NUM = re.compile(r"-?\d+\.\d+(?:[eE][-+]?\d+)?")


def shorten(m):
    s = f"{float(m.group(0)):.4f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def main(dst):
    kept = []
    for line in io.open(SRC, encoding="utf-8"):
        if line.startswith(("vn ", "vt ")):
            continue
        if line.startswith("v "):
            kept.append(NUM.sub(shorten, line))
        elif line.startswith("f "):
            # v/vt/vn -> v. The indices the dropped attributes referred to go with them.
            kept.append("f " + " ".join(p.split("/")[0] for p in line.split()[1:]) + "\n")
        else:
            kept.append(line)
    io.open(dst, "w", encoding="utf-8", newline="\n").writelines(kept)
    verts = sum(1 for line in kept if line.startswith("v "))
    faces = sum(1 for line in kept if line.startswith("f "))
    parts = sum(1 for line in kept if line.startswith("o "))
    print(f"{dst}: {verts} vertices, {faces} triangles, {parts} named parts")
    assert verts and faces and parts == 48, "the source model changed shape - check before shipping"


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "tv/assets/floating-hand.obj")
