"""Read-only operator diagnostics. Availability never grants execution authority."""
from __future__ import annotations

import hashlib
import json
import platform
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path
from urllib.request import Request, build_opener

from .model_registry import _endpoint, _NoRedirect, MAX_BODY_BYTES, discover
from .orchestrator import code_version, config_hash


def running_models(endpoint):
    try:
        request = Request(_endpoint(endpoint) + '/api/ps', headers={'Accept': 'application/json'})
        with build_opener(_NoRedirect()).open(request, timeout=3) as response:
            raw = response.read(MAX_BODY_BYTES + 1)
        if len(raw) > MAX_BODY_BYTES:
            raise ValueError('running model response exceeds limit')
        data = json.loads(raw)
        if not isinstance(data, dict) or not isinstance(data.get('models'), list):
            raise ValueError('invalid running model response')
        return {'available': True, 'models': [
            {key: item.get(key) for key in ('name', 'digest', 'size', 'size_vram', 'expires_at')}
            for item in data['models'] if isinstance(item, dict)], 'error': None}
    except (OSError, ValueError, RuntimeError) as exc:
        return {'available': False, 'models': [], 'error': str(exc)}


def accounting(root):
    """Read selected ledger fields without creating/migrating a mission database."""
    path = Path(root) / 'hive.sqlite3'
    if not path.exists():
        return {'present': False, 'budget': None, 'authorization': 'not established'}
    try:
        db = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True, timeout=1)
        try:
            values = {key: json.loads(value) for key, value in db.execute(
                "SELECT key,value FROM kv WHERE key IN ('budget','stop_reason')")}
            return {'present': True, **values, 'authorization': 'ledger records consumption; it does not grant new spending'}
        finally:
            db.close()
    except (sqlite3.Error, ValueError) as exc:
        return {'present': True, 'error': str(exc), 'authorization': 'unverified'}


def doctor(config, root='.hive', *, offline=False):
    package = Path(__file__).parent
    verifiers = {name: hashlib.sha256((package / name).read_bytes()).hexdigest()
                 for name in ('verifier.py', 'code_verifier.py', 'pressure_verifier.py')
                 if (package / name).is_file()}
    tools = {name: {'installed': bool(shutil.which(name))}
             for name in ('ffmpeg', 'ffprobe', 'docker', 'podman')}
    docker = {'status': 'NOT_INSTALLED', 'enforcement_verified': False}
    if tools['docker']['installed']:
        docker['status'] = 'PRESENT_UNVERIFIED'
        if not offline:
            try:
                result = subprocess.run(['docker', 'version', '--format', '{{json .Server}}'],
                                        capture_output=True, text=True, timeout=5)
                docker['daemon_available'] = result.returncode == 0 and result.stdout.strip() not in ('', 'null')
                if docker['daemon_available']:
                    server = json.loads(result.stdout)
                    docker['server_version'] = server.get('Version')
                    docker['os'] = server.get('Os')
                else:
                    docker['error'] = result.stderr.strip()[-1000:]
            except (OSError, subprocess.TimeoutExpired, ValueError) as exc:
                docker.update(daemon_available=False, error=str(exc))
    skipped = {'available': None, 'models': [], 'error': 'offline: no endpoint request'}
    return {
        'runtime': skipped if offline else discover(config['endpoint']),
        'running_runtime': skipped if offline else running_models(config['endpoint']),
        'python': sys.version, 'platform': platform.platform(), 'build': code_version(),
        'config_hash': config_hash(config), 'verifier_hashes': verifiers,
        'budgets': config, 'budget_is_authorization': False,
        'permissions': 'task manifest required; candidate output cannot grant actions',
        'accounting': accounting(root), 'tools': tools, 'sandbox': docker,
        'new_model_calls': 0, 'offline': offline,
        'cpu_gpu_usage': 'unknown',
    }
