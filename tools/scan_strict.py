"""Find bare undeclared assignments in a channel's inline <script>, BEFORE converting it (2.18).

WHY THIS EXISTS. A module is strict mode; a fragment's inline <script> is not. `name = value` with no
declaration is a silent global in sloppy mode and a ReferenceError in a module - and the crash is
reachable only on the code path that assigns, so it can sit undetected behind a win condition or an
error branch that no gate drives. djscratch had exactly one, on the line that fires when the game is
won (packet 10). Reading 1000 lines looking for it is how it gets missed; this asks the file.

WHAT IT IS AND IS NOT. A lexer for strings and comments, then a regex over what is left. Not a
parser. It will name a few things that are fine - a property assignment its heuristics misread, a
name declared in a form it does not know - so treat a hit as "read this line", never as a verdict.
It is a reading aid that costs a second, which is the only claim made for it.

TWO THINGS IT GOT WRONG ON THE WAY IN, both of which reported a CLEAN FILE that had never been read:

  1. The slice. Several fragments quote a literal <script> in their own header comment - corgi.html
     and lilboyfriend.html both explain there why type="module" would throw - so slicing from the
     FIRST <script> hands this thing an HTML comment and a stylesheet. corgi came back "1 declared
     name, nothing found". The real block is the LAST one, hence rindex.

  2. Stripping strings with a regex, one quote character at a time. A lone " inside a single-quoted
     string - girlfriend has them - leaves the double-quote pass unbalanced, and from there it eats
     everything to the next stray quote: 1026 lines collapsed to 98, and 244 declarations became 21.
     It reported "nothing obvious" for a file it had thrown away. Quoting is not a per-character
     problem and cannot be done in three independent passes; the scan below walks the source once and
     lets whichever quote opened first decide where the string ends.

Both mistakes failed the same way - silently, in the safe-looking direction - so the tool now states
its own reach: it counts declarations before and after stripping, and says so when they disagree,
because a scan that quietly lost the file must never read as a clean bill of health.

Run:  python tools/scan_strict.py tv/channels/girlfriend.html
      python tools/scan_strict.py                       (every fragment)
"""
import glob, io, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DECL = re.compile(r"\b(?:let|const|var|function|class)\s+[A-Za-z_$]")


def blank(src):
    """Replace every string literal and comment with same-length whitespace, in ONE pass.

    Whitespace rather than deletion so that reported line numbers still match the real file, and one
    pass rather than three so that an apostrophe or a stray quote inside another kind of quote cannot
    desynchronise the whole rest of the file. Newlines inside a template literal are preserved for
    the same reason. Regex literals are NOT handled - telling `/` division from `/` regex needs a
    parser - which is a known hole, stated rather than hidden.
    """
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'`":
            q, j = c, i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == q:
                    j += 1
                    break
                if src[j] == "\n" and q != "`":
                    break                     # unterminated: a plain string cannot span a line
                j += 1
            out.append("".join(ch if ch == "\n" else " " for ch in src[i:j]))
            i = j
        elif src.startswith("//", i):
            j = src.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("".join(ch if ch == "\n" else " " for ch in src[i:j]))
            i = j
        else:
            out.append(c)
            i += 1
    return "".join(out)


def declarators(b):
    """Every name bound by a let/const/var statement, not just the first.

    `let poured = 0, phase = "pour", lastPouredIdx = -1;` binds three names. Matching only the
    identifier that follows the keyword finds one of them and reports the other two as undeclared
    assignments - which is precisely the defect this tool exists to find, so the false positives were
    indistinguishable from real hits and would have been the reason nobody read its output twice.
    Walk the declaration list instead, to the `;` that ends it, splitting on top-level commas.
    """
    names = set()
    for m in re.finditer(r"\b(?:let|const|var)\s+", b):
        i, depth, part, parts = m.end(), 0, [], []
        while i < len(b):
            c = b[i]
            if c in "([{":
                depth += 1
            elif c in ")]}":
                if depth == 0:
                    break                      # a for(...) head ran out before its ;
                depth -= 1
            elif c == ";" and depth == 0:
                break
            elif c == "," and depth == 0:
                parts.append("".join(part)); part = []; i += 1; continue
            part.append(c)
            i += 1
        parts.append("".join(part))
        for p in parts:
            p = p.split("=")[0].strip()
            if not p:
                continue
            if p[0] in "[{":
                # destructuring: take every bare identifier, and the value half of `a: b`
                names |= set(re.findall(r"([A-Za-z_$][\w$]*)\s*(?:[,\]}]|$)", p))
            else:
                mm = re.match(r"([A-Za-z_$][\w$]*)", p)
                if mm:
                    names.add(mm.group(1))
    return names


def scan(path):
    s = io.open(path, encoding="utf-8").read()
    if "<script" not in s:
        return None
    body = s[s.rindex("<script"):s.rindex("</script>")]
    body = body[body.index(">") + 1:]        # past the opening tag, attributes and all
    b = blank(body)

    declared = set(re.findall(r"\b(?:function|class)\s+([A-Za-z_$][\w$]*)", b))
    declared |= declarators(b)
    for m in re.finditer(r"\(([^()]*)\)\s*=>", b):
        declared |= {x.strip().split("=")[0].strip() for x in m.group(1).split(",") if x.strip()}
    for m in re.finditer(r"function\s*\w*\s*\(([^()]*)\)", b):
        declared |= {x.strip().split("=")[0].strip() for x in m.group(1).split(",") if x.strip()}
    for m in re.finditer(r"([A-Za-z_$][\w$]*)\s*=>", b):
        declared.add(m.group(1))
    for m in re.finditer(r"\bcatch\s*\(\s*([\w$]+)", b):
        declared.add(m.group(1))
    for m in re.finditer(r"\bfor\s*\(\s*(?:let|const|var)\s+([\w$]+)", b):
        declared.add(m.group(1))

    hits = {}
    for m in re.finditer(r"(?:^|[;{}\n])\s*([A-Za-z_$][\w$]*)\s*=(?!=|>)", b):
        name = m.group(1)
        if name not in declared:
            hits.setdefault(name, b[:m.start()].count("\n") + 1)
    # the tool's own reach: if stripping lost declarations, it lost source, and nothing it says about
    # this file means anything
    return {"lines": len(body.splitlines()), "declared": len(declared),
            "raw_decls": len(DECL.findall(body)), "kept_decls": len(DECL.findall(b)),
            "hits": sorted(hits.items())}


def selfcheck():
    """One case per bug this tool actually shipped with. Each one reported a CLEAN file.

    A detector that finds nothing is indistinguishable from a detector that is broken, and all three
    of these failed in the reassuring direction, so the cases stay runnable rather than remembered.
    """
    import tempfile

    def run(html):
        f = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8")
        f.write(html); f.close()
        r = scan(f.name)
        os.unlink(f.name)
        return r

    # 1. the real thing: an undeclared assignment is found
    r = run('<script>\n(() => { let a = 1; a = 2; oops = 3; })();\n</script>')
    assert [h[0] for h in r["hits"]] == ["oops"], r["hits"]

    # 2. THE SLICE. A fragment that mentions <script> in its own header comment must not be sliced
    #    from that mention - corgi did, and came back "1 declared name, nothing found".
    r = run('<!-- tv.js re-creates <script> tags, so type="module" would throw -->\n'
            '<style>.a{color:red}</style>\n'
            '<script>\n(() => { let a = 1; oops = 3; })();\n</script>')
    assert [h[0] for h in r["hits"]] == ["oops"], r["hits"]
    assert r["declared"] >= 1, r

    # 3. THE QUOTE CASCADE. A lone " inside a single-quoted string must not eat the rest of the file.
    #    girlfriend has them: 1026 lines became 98 and 244 declarations became 21, reported clean.
    r = run('<script>\n'
            "(() => { const q = 'he said \" and left'; let keep = 1; oops = 3; return keep; })();\n"
            '</script>')
    assert [h[0] for h in r["hits"]] == ["oops"], r["hits"]
    assert r["raw_decls"] == r["kept_decls"], "stripping lost source: %r" % r

    # 4. COMMA DECLARATORS. `let a = 1, b = 2;` binds BOTH names; reporting b as undeclared is a false
    #    positive indistinguishable from a real hit, which is how a tool stops being read.
    r = run('<script>\n(() => { let poured = 0, phase = "pour", lastIdx = -1;\n'
            'phase = "mould"; lastIdx = 2; return poured + lastIdx; })();\n</script>')
    assert r["hits"] == [], r["hits"]

    # 5. and destructuring binds its names too
    r = run('<script>\n(() => { const [a, b] = [1, 2]; const {c, d: e} = {};\n'
            'a = 1; b = 2; c = 3; e = 4; })();\n</script>')
    assert r["hits"] == [], r["hits"]

    print("scan_strict self-check: all 5 cases pass")


if "--selfcheck" in sys.argv:
    selfcheck()
    raise SystemExit(0)

targets = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, "tv", "channels", "*.html")))
worst = 0
for p in targets:
    r = scan(p)
    name = os.path.basename(p)
    if r is None:
        print("%-22s no inline script (converted, or never had one)" % name)
        continue
    lost = r["raw_decls"] - r["kept_decls"]
    print("%-22s %d script lines, %d declared names" % (name, r["lines"], r["declared"]))
    if lost:
        worst = 1
        print("    UNRELIABLE: stripping lost %d of %d declarations - this scan read a damaged file"
              % (lost, r["raw_decls"]))
    for ident, line in r["hits"]:
        print("    %-18s ~script line %d" % (ident, line))
    if not r["hits"] and not lost:
        print("    nothing obvious")
raise SystemExit(worst)
