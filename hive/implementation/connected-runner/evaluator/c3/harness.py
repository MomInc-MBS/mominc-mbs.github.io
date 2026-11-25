"""C3 shared harness (stdlib only): the static check for proposed code and the wrapper that batches many cases into ONE
container run. The container runner calls apply(text, checks); here text is a JSON list of envs, the reply a JSON list of results."""
import ast
import json

FORBID = {"open", "exec", "eval", "compile", "__import__", "globals", "locals", "vars", "os", "sys", "subprocess", "socket", "input", "breakpoint"}


def static_problems(body):
    """Why `body` may not run (empty = ok): must parse, define run(env), import nothing but json, name no forbidden builtin/module."""
    try:
        tree = ast.parse(body)
    except (SyntaxError, ValueError) as e:
        return [f"does not parse: {type(e).__name__}"]
    bad = []
    for n in ast.walk(tree):
        if isinstance(n, ast.Import) and any(a.name.split(".")[0] != "json" for a in n.names):
            bad.append("import outside json")
        elif isinstance(n, ast.ImportFrom) and (n.level or (n.module or "").split(".")[0] != "json"):
            bad.append("import outside json")
        elif isinstance(n, ast.Name) and n.id in FORBID:
            bad.append(f"forbidden name {n.id}")
        elif isinstance(n, ast.Attribute) and n.attr.startswith("__"):
            bad.append(f"forbidden attribute {n.attr}")
    if not any(isinstance(n, ast.FunctionDef) and n.name == "run" and len(n.args.args) == 1 for n in tree.body):
        bad.append("no top-level def run(env)")
    return sorted(set(bad))


def wrap(body):
    """Container source: the candidate body plus apply(). A case that raises or returns a non-str yields null (never a pass)."""
    return ("import json as _hj\n" + body + "\n\ndef apply(_t, _c):\n    _o = []\n    for _e in _hj.loads(_t):\n        try:\n"
            "            _r = run(_e)\n            _o.append(_r if isinstance(_r, str) else None)\n        except Exception:\n"
            "            _o.append(None)\n    return _hj.dumps(_o)\n")
