"""Handborne at /handborne/: the room is reachable, and the hand can get back out.

Handborne is a prebuilt static app that was authored to be served from a domain root, so every
reference it emits is root-absolute. Serving it from /handborne/ means those references were
rewritten at port time, and a single missed one is a file that 404s in production while every local
check stays green. So the first half of this gate is dull on purpose: no root-absolute reference may
survive that does not start with /handborne/, and everything referenced must exist on disk.

The second half is the part that actually breaks. THE HAND CROSSES THREE FILES THAT NOBODY EDITS
TOGETHER: Handborne persists six sections, tv/channels/armie.html validates seven, and
tv/assets/armie-intro/intro.js pulls seven named regions out of the family models. handborne/return.js
is the only thing that knows all three, and it is the only thing that would silently keep working if
one of them changed - it would hand over a profile the gate on the other side quietly rejects, and the
visitor would be told to go make a hand they had already made. So the region names are read back out
of all three files and compared, rather than trusted.
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HB = os.path.join(ROOT, "handborne")
TEXT = (".html", ".css", ".js", ".json", ".rsc", ".txt", ".svg")

ok = True
def check(cond, msg):
    global ok
    if not cond:
        ok = False
    print(("  ok   " if cond else "  FAIL ") + msg)

def read(p):
    return io.open(p, encoding="utf8", errors="replace").read()

def text_files():
    for base, _, names in os.walk(HB):
        for n in names:
            if n.endswith(TEXT):
                yield os.path.join(base, n)

print("\n  -- handborne: the room --")
check(os.path.isdir(HB), "/handborne/ exists")
check(os.path.exists(os.path.join(HB, "index.html")), "index.html is present")

# 1. No root-absolute reference may point outside /handborne/. Two patterns rather than one loose
#    one: a bare /... looks identical to a JavaScript regex literal, and three.module.js is full of
#    them (/NUM_DIR_LIGHTS/g), so a catch-all here fails on code that is not a URL at all. Instead:
#    every asset root this build actually emits, anywhere; plus anything in a real URL position in
#    the markup and the stylesheets, which is where a new root would show up first.
ROOTS = ("_next", "models", "previews", "fonts", "downloads", "favicon.svg", "og.png")
STRAY = re.compile(r"""["'(]/(%s)""" % "|".join(ROOTS))
URLPOS = re.compile(r"""(?:src|href)=["']/(?!handborne/|/)[\w.-]|url\(/(?!handborne/|/)[\w.-]""")
stray = {}
for p in text_files():
    body = read(p)
    hits = set(m.group(0)[1:] for m in STRAY.finditer(body))
    if p.endswith((".html", ".css")):
        hits |= set(m.group(0) for m in URLPOS.finditer(body))
    for m in hits:
        stray.setdefault(m, []).append(os.path.relpath(p, ROOT))
check(not stray, "every root-absolute reference sits under /handborne/ (%s)"
      % (sorted(stray)[:4] or "none"))

# 2. Everything referenced under /handborne/ exists. family-NN is built at runtime from an index, so
#    the whole set of twenty is checked rather than the template literal.
refs = set()
for p in text_files():
    refs |= set(re.findall(r"/handborne/[\w./-]+", read(p)))
missing = []
for r in sorted(refs):
    rel = r[len("/handborne/"):].split("?")[0]
    if rel.endswith("family-"):                       # `/handborne/models/family-` + padded index
        stem = rel[:-len("family-")]
        for i in range(20):
            for ext in (".glb", ".png"):
                cand = os.path.join(HB, (stem + "family-%02d" % i + ext).replace("/", os.sep))
                if os.path.exists(cand):
                    break
            else:
                missing.append(stem + "family-%02d" % i)
        continue
    if not rel or rel.endswith("/"):
        rel += "index.html"
    if not os.path.exists(os.path.join(HB, rel.replace("/", os.sep))):
        missing.append(rel)
check(not missing, "every referenced file is on disk (%s)" % (missing[:4] or "none"))

# 3. The 133 MB export archives are not shipped, so nothing may still link to them.
zips = [os.path.relpath(p, ROOT) for p in text_files() if "downloads/handborne-" in read(p)]
check(not zips, "no link survives to the unshipped export archives (%s)" % (zips[:3] or "none"))
check(os.path.exists(os.path.join(HB, "downloads", "index.html")),
      "the downloads buttons land on an explanation instead of a 404")

print("\n  -- handborne: the way back out --")
idx = read(os.path.join(HB, "index.html"))
check('src="/handborne/return.js"' in idx, "index.html loads return.js")

ret = read(os.path.join(HB, "return.js"))
check("u.origin === location.origin" in ret,
      "an off-site ?return= is refused - the profile only ever goes somewhere of ours")

# 4. The three files that have to agree about what a hand is.
six_ret = re.findall(r'"(\w+)"', re.search(r"var SIX = \[([^\]]+)\]", ret).group(1))
bundle = read(os.path.join(HB, "_next", "static", "chunks", "page-BNzi5YPU.js"))
six_app = re.findall(r"\{id:`(\w+)`,label:`[^`]*`,short:", bundle)[:6]
check(six_ret == six_app,
      "return.js reads the six sections Handborne actually persists (%s)" % (six_ret,))

sect = re.search(r"sections: \{(.+?)\n      \}", ret, re.S).group(1)
seven_ret = sorted(set(re.findall(r"(\w+):", sect)))
armie = read(os.path.join(ROOT, "tv", "channels", "armie.html"))
seven_armie = sorted(re.findall(r"'(\w+)'", re.search(r"handRegions=\[([^\]]+)\]", armie).group(1)))
intro = read(os.path.join(ROOT, "tv", "assets", "armie-intro", "intro.js"))
seven_intro = sorted(re.findall(r"'(\w+)'", re.search(r"const regions=\[([^\]]+)\]", intro).group(1)))
check(seven_ret == seven_armie == seven_intro,
      "return.js, armie.html and intro.js agree on the seven regions (%s)" % (seven_ret,))
check("fingers" in sect and sect.count("s.fingers") == 2,
      "the one Handborne control labelled 'Fingers & knuckles' drives both of the parts it names")

# 5. The models really do carry all seven, or the assembly throws on a region nobody picked.
import struct
def glb_nodes(p):
    d = open(p, "rb").read()
    off = 12
    while off < len(d):
        ln, ty = struct.unpack_from("<II", d, off)
        if ty == 0x4E4F534A:
            return {n.get("name") for n in json.loads(d[off + 8:off + 8 + ln].decode("utf8")).get("nodes", [])}
        off += 8 + ln
    return set()
short = []
for i in range(20):
    p = os.path.join(ROOT, "tv", "assets", "armie-intro", "models", "family-%02d.glb" % i)
    if not os.path.exists(p) or not set(seven_ret) <= glb_nodes(p):
        short.append("family-%02d" % i)
check(not short, "all twenty family models carry all seven named regions (%s)" % (short[:4] or "none"))

print("\n%s" % ("HANDBORNE WIRED" if ok else "HANDBORNE BROKEN"))
raise SystemExit(0 if ok else 1)
