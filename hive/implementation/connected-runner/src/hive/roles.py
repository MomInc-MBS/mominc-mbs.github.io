"""Scoped role registry: which tool may touch which path, per role. Fail-closed.

Standalone seam (not yet wired into ContextPolicy.preflight). Model output never
grants authority; the registry answers (allowed, reason) and unknown means deny.
"""
from __future__ import annotations
import re
from dataclasses import dataclass
from pathlib import Path

import yaml

ROLE_NAMES = ('builder', 'reviewer', 'research', 'diagnostic', 'verifier')
WRITE_TOOLS = frozenset({'write_file', 'edit_file', 'apply_patch', 'delete_file', 'move_file'})
READ_ONLY_ON_CANDIDATES = frozenset({'reviewer', 'verifier'})
_KEYS = {'allowed_tools', 'allowed_path_globs', 'may_spawn_children', 'max_input_tokens', 'max_output_tokens'}


class RoleConfigError(ValueError):
    pass


def _is_abs(p: str) -> bool:
    return p.startswith('/') or re.match(r'[A-Za-z]:', p) is not None


def _glob_re(glob: str):
    out, i = [], 0
    while i < len(glob):
        if glob.startswith('**/', i): out.append('(?:.*/)?'); i += 3
        elif glob.startswith('**', i): out.append('.*'); i += 2
        elif glob[i] == '*': out.append('[^/]*'); i += 1
        elif glob[i] == '?': out.append('[^/]'); i += 1
        else: out.append(re.escape(glob[i])); i += 1
    return re.compile(''.join(out) + r'\Z')


def _norm_glob(g) -> str:
    if not isinstance(g, str) or not g.strip() or '\0' in g:
        raise RoleConfigError('glob must be a non-empty string')
    g = g.replace('\\', '/')
    if '..' in g.split('/'):
        raise RoleConfigError('glob may not contain ..')
    return g


def _norm_path(path):
    """Return (normalized, None) or (None, deny_reason)."""
    if not isinstance(path, str) or not path.strip() or '\0' in path:
        return None, 'path must be a non-empty string'
    p = path.replace('\\', '/')
    parts = p.split('/')
    if '..' in parts:
        return None, 'path traversal (..) denied'
    norm = ('/' if p.startswith('/') else '') + '/'.join(c for c in parts if c not in ('', '.'))
    if not norm.strip('/'):
        return None, 'empty path'
    return norm, None


@dataclass(frozen=True)
class Role:
    name: str
    allowed_tools: frozenset
    allowed_path_globs: tuple
    may_spawn_children: bool
    max_input_tokens: int
    max_output_tokens: int


class RoleRegistry:
    def __init__(self, roles: dict, candidate_globs: tuple):
        self.roles = roles
        self.candidate_globs = candidate_globs
        self._glob_res = {n: [(g, _glob_re(g)) for g in r.allowed_path_globs] for n, r in roles.items()}
        self._cand_res = [_glob_re(g.casefold()) for g in candidate_globs]
        self._assigned: dict = {}  # (task_id, identity) -> role; one identity, one role per task

    @classmethod
    def load(cls, path) -> 'RoleRegistry':
        data = yaml.safe_load(Path(path).read_text(encoding='utf-8'))
        if not isinstance(data, dict) or data.get('version') != 1:
            raise RoleConfigError('roles config must be a mapping with version: 1')
        cand = data.get('candidate_globs')
        if not isinstance(cand, list) or not cand:
            raise RoleConfigError('candidate_globs required (non-empty list)')
        cand = tuple(_norm_glob(g) for g in cand)
        raw = data.get('roles')
        if not isinstance(raw, dict) or not raw:
            raise RoleConfigError('roles mapping required')
        roles = {}
        for name, spec in raw.items():
            if name not in ROLE_NAMES:
                raise RoleConfigError(f'unknown role {name!r}')
            if not isinstance(spec, dict) or set(spec) - _KEYS:
                raise RoleConfigError(f'role {name}: unknown or malformed keys')
            tools, globs = spec.get('allowed_tools'), spec.get('allowed_path_globs')
            if (not isinstance(tools, list) or not tools
                    or not all(isinstance(t, str) and t for t in tools)):
                raise RoleConfigError(f'role {name}: allowed_tools must be a non-empty list of names')
            if not isinstance(globs, list) or not globs:
                raise RoleConfigError(f'role {name}: allowed_path_globs required')
            spawn = spec.get('may_spawn_children', False)
            if not isinstance(spawn, bool):
                raise RoleConfigError(f'role {name}: may_spawn_children must be bool')
            limits = [spec.get(k) for k in ('max_input_tokens', 'max_output_tokens')]
            if not all(type(v) is int and v > 0 for v in limits):
                raise RoleConfigError(f'role {name}: token limits must be positive ints')
            roles[name] = Role(name, frozenset(tools), tuple(_norm_glob(g) for g in globs), spawn, *limits)
        return cls(roles, cand)

    def check(self, role, tool, path):
        """(allowed, reason). Unknown role/tool/path, `..`, or out-of-glob => deny."""
        r = self.roles.get(role) if isinstance(role, str) else None
        if r is None:
            return False, f'unknown role {role!r}'
        if not isinstance(tool, str) or tool not in r.allowed_tools:
            return False, f'tool {tool!r} not allowed for {role}'
        norm, why = _norm_path(path)
        if norm is None:
            return False, why
        absolute = _is_abs(norm)
        if role in READ_ONLY_ON_CANDIDATES and tool in WRITE_TOOLS:
            if absolute:
                return False, f'{role} may not write absolute paths (cannot prove outside candidates)'
            if any(rx.match(norm.casefold()) for rx in self._cand_res):
                return False, f'{role} may not write candidate path'
        for glob, rx in self._glob_res[role]:
            if _is_abs(glob) == absolute and rx.match(norm):
                return True, f'matched {glob}'
        return False, f'path {norm!r} outside allowed globs for {role}'

    def may_spawn(self, role) -> bool:
        r = self.roles.get(role) if isinstance(role, str) else None
        return bool(r and r.may_spawn_children)

    def assign(self, task_id: str, identity: str, role: str) -> None:
        """One identity holds one role per task; this also bars a builder from verifying."""
        if role not in self.roles:
            raise ValueError(f'unknown role {role!r}')
        if not task_id or not identity:
            raise ValueError('task_id and identity required')
        held = self._assigned.get((task_id, identity))
        if held is not None and held != role:
            raise PermissionError(f'{identity} already holds {held} on {task_id}; cannot also be {role}')
        self._assigned[(task_id, identity)] = role
