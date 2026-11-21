"""Replaceable, explicitly enrolled trusted adapters. No automatic model loading."""
from __future__ import annotations

import hashlib
import ipaddress
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from typing import Protocol
import urllib.request
from urllib.parse import urlsplit

from .core import digest
from .pilot import child_resources

HERE = Path(__file__).resolve().parent


class Adapter(Protocol):
    def manifest(self) -> dict: ...
    def health(self) -> str: ...
    def execute(self, data: bytes, timeout: float) -> dict: ...


def manifest(name, kind, permissions, provenance):
    return dict(capability_id=name, kind=kind, version='adapter-2', adapter=kind,
                supported_tasks=['caption-validation'], permissions=permissions,
                requirements={'wall_seconds': 3, 'input_bytes': 65536, 'concurrency': 1},
                constraints={'max_bytes': 65536, 'max_media_seconds': 15,
                             'trust': 'operator-enrolled code; not hostile-code sandbox'},
                safe=True, health='unknown', effects='read-only', provenance=provenance)


class Registry:
    def __init__(self, adapters):
        self.adapters = {}
        for adapter in adapters:
            key = adapter.manifest()['capability_id']
            if key in self.adapters:
                raise ValueError('duplicate capability ID')
            self.adapters[key] = adapter

    def snapshot(self):
        caps = []
        for adapter in self.adapters.values():
            cap = adapter.manifest()
            try:
                cap['health'] = adapter.health()
            except Exception:
                cap['health'] = 'unavailable'
            caps.append(cap)
        return caps


def isolated(descriptor, data, timeout):
    """Private per-call files, fixed worker, no shell, whole-tree timeout cleanup.

    Isolation excludes labels/config state from the worker input. It does not deny
    filesystem/network access to malicious code; only trusted built-ins are used.
    """
    start = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix='hive-worker-') as tmp:
        root = Path(tmp)
        (root/'input.srt').write_bytes(data)
        (root/'adapter.json').write_text(json.dumps(descriptor), encoding='utf-8')
        with (root/'stdout').open('wb') as stdout, (root/'stderr').open('wb') as stderr:
            process = subprocess.Popen([sys.executable, '-I', str(HERE/'worker.py')], cwd=root,
                                       stdin=subprocess.DEVNULL, stdout=stdout, stderr=stderr,
                                       start_new_session=os.name != 'nt')
            error = None
            try:
                process.wait(timeout=timeout)
                if process.returncode:
                    error = 'worker-failed'
            except subprocess.TimeoutExpired:
                error = 'timeout'
                if os.name == 'nt':
                    subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                                   capture_output=True, timeout=5, check=False)
                else:
                    os.killpg(process.pid, signal.SIGKILL)
                if process.poll() is None:
                    process.kill()
                process.wait(timeout=5)
            resources = child_resources(process)
        output = {}
        try:
            if (root/'stdout').stat().st_size > 65536:
                error = error or 'output-budget'
            elif error is None:
                output = json.loads((root/'stdout').read_bytes())
                if not isinstance(output, dict) or type(output.get('valid')) is not bool:
                    output, error = {}, 'malformed-output'
        except (UnicodeError, ValueError):
            error = error or 'malformed-output'
        return dict(output=output, error=error, wall_seconds=time.perf_counter()-start,
                    resources=resources, returncode=process.returncode,
                    stderr_hash=hashlib.sha256((root/'stderr').read_bytes()).hexdigest())


class CaptionAdapter:
    def __init__(self, config, executable=None):
        if config not in {'rules', 'probe', 'combined', 'probe-guard'}:
            raise ValueError('unknown trusted procedure')
        self.config = config
        self.executable = executable or shutil.which('ffprobe')
        self._health = None
        self._identity_key = None
        self._identity = None
        self._version = None

    def identity(self):
        if self.config == 'rules':
            return None
        path = Path(self.executable).resolve() if self.executable else None
        try:
            stat = path.stat()
            key = (str(path), stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns)
            if key != self._identity_key:
                with path.open('rb') as stream:
                    self._identity = {'binary_sha256': hashlib.file_digest(stream, 'sha256').hexdigest(),
                                      'binary_bytes': stat.st_size, 'executable_name': path.name}
                self._identity_key, self._health, self._version = key, None, None
        except (OSError, AttributeError):
            self._identity, self._health = None, 'unavailable'
        return self._identity

    def manifest(self):
        identity = self.identity()
        if self.config != 'rules':
            self.health()
        return manifest(self.config, 'caption-software',
                        ['read-fixture'] + ([] if self.config == 'rules' else ['run-ffprobe']),
                        {'captions_sha256': hashlib.sha256((HERE/'captions.py').read_bytes()).hexdigest(),
                         'tool': identity, 'tool_version': self._version})

    def health(self):
        if self.config == 'rules':
            return 'ready'
        self.identity()
        if self._health is None:
            self._health = 'unavailable'
            if self.executable:
                try:
                    result = subprocess.run([self.executable, '-version'], capture_output=True, timeout=2)
                    if result.returncode == 0 and result.stdout.startswith(b'ffprobe version '):
                        self._health = 'ready'
                        self._version = result.stdout.splitlines()[0].decode('utf-8', errors='replace')
                except (OSError, subprocess.SubprocessError):
                    pass
        return self._health

    def execute(self, data, timeout):
        return isolated({'kind': 'caption', 'config': self.config, 'executable': self.executable}, data, timeout)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('adapter redirects forbidden')


def local_json(endpoint, path, timeout, body=None):
    parsed = urlsplit(endpoint)
    try:
        local = ipaddress.ip_address(parsed.hostname or '').is_loopback
    except ValueError:
        local = False
    if parsed.scheme != 'http' or not local or parsed.username or parsed.password or parsed.path not in {'', '/'} or parsed.query or parsed.fragment:
        raise ValueError('literal loopback HTTP origin required')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request = urllib.request.Request(endpoint.rstrip('/')+path,
                                    data=None if body is None else json.dumps(body).encode(),
                                    headers={'Content-Type': 'application/json'})
    with opener.open(request, timeout=timeout) as response:
        data = response.read(65537)
        if len(data) > 65536:
            raise ValueError('model response budget')
        return json.loads(data)


class OllamaAdapter:
    """A downloaded model is ineligible until already resident. No auto-load API."""
    def __init__(self, endpoint, model):
        self.endpoint, self.model = endpoint, model
        self.id = 'ollama-' + digest({'endpoint': endpoint, 'model': model})[:12]

    def manifest(self):
        cap = manifest(self.id, 'local-model', ['read-fixture', 'local-model-inference'],
                       {'model': self.model, 'transport': 'Ollama chat API; resident model only'})
        cap['requirements']['wall_seconds'] = 30
        return cap

    def health(self):
        result = local_json(self.endpoint, '/api/ps', 2)
        return 'ready' if any(m.get('name') == self.model or m.get('model') == self.model
                              for m in result.get('models', [])) else 'unavailable'

    def execute(self, data, timeout):
        # Recheck residency immediately before dispatch. A server-side race remains
        # possible; the transport cannot reserve GPU residency across this request.
        if self.health() != 'ready':
            return dict(output={}, error='model-not-resident', wall_seconds=0, resources={})
        return isolated({'kind': 'ollama', 'endpoint': self.endpoint, 'model': self.model,
                         'timeout': timeout}, data, timeout)


def default_registry():
    return Registry([CaptionAdapter(name) for name in ('rules', 'probe', 'combined', 'probe-guard')])
