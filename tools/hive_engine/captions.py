"""Fixed, non-destructive caption adapters. Input is untrusted; never a command."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

VERSION = 'captions-1'
MAX_BYTES = 65536
LIMIT_SECONDS = 15


def validate(data):
    """Strict timing/structure rules, with standard UTF-8 BOM/CRLF support."""
    if len(data) > MAX_BYTES: raise ValueError('input byte budget exceeded')
    try:
        text = data.decode('utf-8-sig').replace('\r\n', '\n').strip()
    except UnicodeDecodeError:
        return {'valid': False, 'reason': 'encoding'}
    if not text or '\x00' in text or '\r' in text:
        return {'valid': False, 'reason': 'empty-or-control'}
    previous = 0
    count = 0
    for number, block in enumerate(re.split(r'\n\s*\n', text), 1):
        lines = block.split('\n')
        if len(lines) < 3 or lines[0] != str(number) or not any(line.strip() for line in lines[2:]):
            return {'valid': False, 'reason': 'structure'}
        if any(re.match(r'^\d{2}:\d{2}:\d{2},\d{3} --> ', line) for line in lines[2:]):
            return {'valid': False, 'reason': 'missing-cue-separator'}
        match = re.fullmatch(r'(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})', lines[1])
        if not match: return {'valid': False, 'reason': 'timestamp-format'}
        parts = list(map(int, match.groups()))
        if any(parts[i] >= 60 for i in (1, 2, 5, 6)):
            return {'valid': False, 'reason': 'timestamp-range'}
        start = ((parts[0]*60+parts[1])*60+parts[2])*1000+parts[3]
        end = ((parts[4]*60+parts[5])*60+parts[6])*1000+parts[7]
        if start < previous or end <= start or end > LIMIT_SECONDS*1000:
            return {'valid': False, 'reason': 'timing'}
        previous = end
        count += 1
    return {'valid': True, 'cue_count': count}


def probe(path, executable, timeout=2):
    if Path(path).stat().st_size > MAX_BYTES: raise ValueError('input byte budget exceeded')
    command = [executable, '-v', 'error', '-f', 'srt', '-show_packets', '-show_entries',
               'packet=pts_time,duration_time', '-of', 'json', str(Path(path).resolve())]
    result = subprocess.run(command, capture_output=True, timeout=timeout, check=False)
    if len(result.stdout) > 2_000_000: raise ValueError('tool output byte budget exceeded')
    if result.returncode: return {'valid': False, 'reason': 'tool-rejected', 'returncode': result.returncode}
    parsed = json.loads(result.stdout)
    if not isinstance(parsed, dict) or not isinstance(parsed.get('packets'), list):
        raise ValueError('malformed ffprobe response')
    return {'valid': bool(parsed['packets']), 'packet_count': len(parsed['packets'])}


def execute(config, path, executable):
    if config == 'rules': return validate(Path(path).read_bytes()) | {'tool_calls': 0}
    if config == 'probe': return probe(path, executable) | {'tool_calls': 1}
    if config == 'combined':
        result = probe(path, executable)
        return (validate(Path(path).read_bytes()) if result['valid'] else result) | {'tool_calls': 1}
    if config == 'probe-guard':
        # Candidate procedure: mandatory semantic check BEFORE spending a tool call.
        result = validate(Path(path).read_bytes())
        if not result['valid']: return result | {'tool_calls': 0}
        return probe(path, executable) | {'tool_calls': 1}
    raise ValueError('unknown executable configuration')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('config', choices=['rules', 'probe', 'combined', 'probe-guard'])
    ap.add_argument('path', type=Path)
    ap.add_argument('--ffprobe', default='ffprobe')
    args = ap.parse_args()
    try:
        print(json.dumps(execute(args.config, args.path, args.ffprobe), allow_nan=False))
    except Exception as exc:
        print(json.dumps({'error': type(exc).__name__, 'detail': str(exc)[:160]}))
        sys.exit(1)
