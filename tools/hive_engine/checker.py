"""Independent live SRT oracle. Does not import the executor or its verdicts."""
import hashlib
from pathlib import Path

VERSION = 'independent-caption-checker-1'


def reference(data):
    if not data or len(data) > 65536:
        return False
    try:
        text = data.decode('utf-8-sig').replace('\r\n', '\n').strip()
    except UnicodeError:
        return False
    if not text or '\x00' in text or '\r' in text:
        return False
    groups, current = [], []
    for line in text.split('\n'):
        if not line.strip():
            if current:
                groups.append(current)
                current = []
        else:
            current.append(line)
    if current:
        groups.append(current)

    def millis(stamp):
        if len(stamp) != 12 or stamp[2] != ':' or stamp[5] != ':' or stamp[8] != ',':
            raise ValueError('timestamp')
        fields = [stamp[:2], stamp[3:5], stamp[6:8], stamp[9:]]
        if not all(s.isdecimal() for s in fields):
            raise ValueError('digits')
        h, m, s, ms = map(int, fields)
        if m >= 60 or s >= 60:
            raise ValueError('range')
        return ((h * 60 + m) * 60 + s) * 1000 + ms

    previous = 0
    try:
        for number, group in enumerate(groups, 1):
            if len(group) < 3 or group[0] != str(number):
                return False
            stamps = group[1].split(' --> ')
            if len(stamps) != 2:
                return False
            start, end = map(millis, stamps)
            if start < previous or end <= start or end > 15000:
                return False
            # A second timestamp in payload signals a missing blank separator.
            for line in group[2:]:
                if len(line) >= 17 and line[12:17] == ' --> ':
                    try:
                        millis(line[:12])
                    except ValueError:
                        continue
                    return False
            previous = end
    except (ValueError, OverflowError):
        return False
    return bool(groups)


def verify(data, output, error):
    expected = reference(data)
    return {'checker_id': VERSION, 'checker_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'result': error is None and type(output.get('valid')) is bool and output['valid'] == expected,
            'expected': expected, 'actual': output.get('valid'), 'confidence_if_calibrated': None}
