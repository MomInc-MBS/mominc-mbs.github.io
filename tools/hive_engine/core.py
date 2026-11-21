"""Versioned decisions, append-only evidence, protected memory and staged releases.

Only trusted local operators may write this database. These integrity checks are
not an OS sandbox or a security boundary against its filesystem owner.
"""
from __future__ import annotations

import hashlib
import json
import math
import sqlite3
import time
from pathlib import Path

POLICY_VERSION = 'deciders-1'
PARTITIONS = {'raw_observations', 'inferred_claims', 'validated_facts', 'deployable_procedures'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


class Store:
    def __init__(self, path):
        self.db = sqlite3.connect(path, timeout=10)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.executescript('''
            CREATE TABLE IF NOT EXISTS events (
              seq INTEGER PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL,
              previous TEXT NOT NULL, hash TEXT NOT NULL UNIQUE);
            CREATE TRIGGER IF NOT EXISTS immutable_update BEFORE UPDATE ON events
              BEGIN SELECT RAISE(ABORT, 'append-only'); END;
            CREATE TRIGGER IF NOT EXISTS immutable_delete BEFORE DELETE ON events
              BEGIN SELECT RAISE(ABORT, 'append-only'); END;
        ''')

    def append(self, kind, payload):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            row = self.db.execute('SELECT hash FROM events ORDER BY seq DESC LIMIT 1').fetchone()
            previous = row[0] if row else '0' * 64
            envelope = {'kind': kind, 'payload': payload, 'previous': previous}
            checksum = digest(envelope)
            self.db.execute('INSERT INTO events(kind,payload,previous,hash) VALUES(?,?,?,?)',
                            (kind, canonical(payload), previous, checksum))
            self.db.commit()
            return checksum
        except Exception:
            self.db.rollback()
            raise

    def records(self, kind=None):
        rows = self.db.execute('SELECT kind,payload FROM events ORDER BY seq').fetchall()
        return [json.loads(payload) for k, payload in rows if kind is None or kind == k]

    def verify(self):
        previous = '0' * 64
        for kind, payload, parent, checksum in self.db.execute('SELECT kind,payload,previous,hash FROM events ORDER BY seq'):
            if parent != previous or checksum != digest({'kind': kind, 'payload': json.loads(payload), 'previous': parent}):
                raise ValueError('event integrity failure')
            previous = checksum
        return previous

    def export(self, path):
        self.verify()
        with Path(path).open('w', encoding='utf-8', newline='\n') as stream:
            for seq, kind, payload, previous, checksum in self.db.execute('SELECT * FROM events ORDER BY seq'):
                stream.write(canonical(dict(seq=seq, kind=kind, payload=json.loads(payload), previous=previous, hash=checksum)) + '\n')

    def close(self):
        self.db.close()


def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0


def eligibility(task, capability):
    """D1 fails closed. Hard constraints are never traded for score."""
    reasons = []
    if not set(capability['permissions']).issubset(task['permissions']): reasons.append('unauthorized')
    if task['task_type'] not in capability['supported_tasks']: reasons.append('incompatible')
    if capability['health'] != 'ready': reasons.append('unavailable')
    if not capability.get('safe', False): reasons.append('unsafe')
    for name, needed in capability['requirements'].items():
        limit = task['resource_budget'].get(name)
        if not finite_number(needed) or not finite_number(limit) or needed > limit:
            reasons.append('budget:' + name)
    try:
        task_hash, capability_hash = digest(task), digest(capability)
    except (ValueError, TypeError):
        task_hash = capability_hash = None
        reasons.append('invalid-record')
    return {'eligible': not reasons, 'reasons': reasons, 'policy_version': POLICY_VERSION,
            'task_hash': task_hash, 'capability_hash': capability_hash}


def route(task, capabilities, estimates, weights):
    """D2 deterministic initial heuristic; p is an estimate, not calibrated fact."""
    if not all(finite_number(weights[k]) for k in ('value', 'cost', 'latency', 'risk')):
        raise ValueError('invalid routing weights')
    alternatives = []
    for cap in capabilities:
        gate = eligibility(task, cap)
        e = estimates[cap['capability_id']]
        if not all(finite_number(e[k]) for k in ('p', 'cost', 'latency', 'risk')) or e['p'] > 1:
            raise ValueError('invalid routing estimate')
        score = e['p'] * weights['value'] - sum(weights[k] * e[k] for k in ('cost', 'latency', 'risk'))
        alternatives.append(dict(capability_id=cap['capability_id'], gate=gate, estimate=e,
                                 score=score if gate['eligible'] else None))
    eligible = [a for a in alternatives if a['gate']['eligible']]
    selected = sorted(eligible, key=lambda a: (-a['score'], a['capability_id']))[0]['capability_id'] if eligible else None
    return dict(policy_version=POLICY_VERSION, task=task, capabilities=capabilities,
                weights=weights, alternatives=alternatives, selected=selected,
                assumptions='Pilot heuristic. No calibrated success predictor.')


def verification_value(mandatory, expected_gain, cost):
    """D3 keeps compulsory checks regardless of estimated value."""
    if not all(finite_number(v) for v in (expected_gain, cost)): raise ValueError('invalid EVI input')
    return dict(policy_version=POLICY_VERSION, mandatory=mandatory, expected_gain=expected_gain,
                cost=cost, evi=expected_gain-cost, run=bool(mandatory or expected_gain > cost))


def experiment_priority(probability, gain, cost, risk, scarce_usage, uncertainty):
    """D4 is a ranking heuristic, including its uncalibrated uncertainty."""
    if not all(finite_number(v) for v in (probability, gain, cost, risk, scarce_usage, uncertainty)) or probability > 1 or scarce_usage == 0:
        raise ValueError('invalid priority input')
    return dict(policy_version=POLICY_VERSION, probability=probability, gain=gain, cost=cost,
                risk=risk, scarce_usage=scarce_usage, uncertainty=uncertainty,
                score=(probability*gain-cost-risk)/scarce_usage)


def promotion_gate(evidence, criteria):
    """D5 independent booleans; quality cannot compensate for a failed gate."""
    gates = dict(
        benefit=(evidence['quality_delta'] >= criteria['min_quality_gain'] or
                 (evidence['quality_delta'] >= -criteria['max_quality_loss'] and
                  evidence['cost_reduction'] >= criteria['min_cost_reduction'])),
        retention=evidence['regressions'] == 0,
        safety=evidence['safety_passed'] is True,
        memory=evidence['memory_passed'] is True,
        budgets=evidence['budgets_passed'] is True,
        reproducibility=evidence['reproducible'] is True,
        holdout_integrity=evidence['holdout_clean'] is True,
        rollback=evidence['rollback_tested'] is True,
    )
    if not all(math.isfinite(evidence[k]) for k in ('quality_delta', 'cost_reduction')):
        gates['benefit'] = False
    return dict(policy_version=POLICY_VERSION, criteria_hash=digest(criteria),
                evidence=evidence, gates=gates, eligible=all(gates.values()))


def promote(store, candidate, gate, approval):
    """Explicit local-staging policy only. This code cannot deploy production."""
    if candidate['scope'] != 'local-staging' or not gate['eligible']:
        raise ValueError('candidate not eligible for local staging')
    if (approval.get('authority') != 'operator' or not approval.get('approval_ref') or
        approval.get('candidate_hash') != digest(candidate) or approval.get('gate_hash') != digest(gate)):
        raise ValueError('missing bound operator approval')
    releases = store.records('Release')
    previous = releases[-1]['deployed_version'] if releases else candidate['parent_version']
    record = dict(release_id='release-' + digest(approval)[:16], candidate_id=candidate['candidate_id'],
                  approval_ref=approval['approval_ref'], gate_results=gate, deployed_version=candidate['candidate_id'],
                  rollback_ref=previous, timestamp=time.time(), scope='local-staging')
    store.append('Release', record)
    return record


def rollback(store, release):
    known = store.records('Release')
    if not known or known[-1] != release: raise ValueError('rollback requires current release')
    restored = dict(release, release_id=release['release_id']+'-rollback',
                    deployed_version=release['rollback_ref'], rollback_ref=release['deployed_version'], timestamp=time.time())
    store.append('Release', restored)
    return restored


def memory_add(store, item):
    if item['partition'] not in PARTITIONS or not item['source_refs'] or not item['access_policy']:
        raise ValueError('memory partition, provenance and access required')
    if item['partition'] in {'validated_facts', 'deployable_procedures'} and item['validation_status'] != 'validated':
        raise ValueError('unvalidated knowledge')
    existing = store.records('MemoryItem')
    if any(m['memory_id'] == item['memory_id'] for m in existing): raise ValueError('immutable memory ID')
    if item.get('supersedes'):
        old = next((m for m in existing if m['memory_id'] == item['supersedes']), None)
        if old is None or old['partition'] != item['partition'] or old['access_policy'] != item['access_policy']:
            raise ValueError('invalid cross-partition correction')
    store.append('MemoryItem', item)


def memory_retrieve(store, partition, principal, now):
    if partition not in PARTITIONS: raise ValueError('unknown partition')
    items = [m for m in store.records('MemoryItem') if m['partition'] == partition and principal in m['access_policy']]
    inactive = {m['supersedes'] for m in items if m.get('supersedes')}
    inactive.update(m['memory_id'] for m in store.records('MemoryInvalidation'))
    active = [m for m in items if m['memory_id'] not in inactive and
              (m['expires_at'] is None or m['expires_at'] > now) and m['validation_status'] == 'validated']
    # Conflicting validated claims remain visible, but are withheld as current truth.
    conflicts = {m['key'] for m in active if len({n['content_ref'] for n in active if n['key'] == m['key']}) > 1}
    return dict(items=[m for m in active if m['key'] not in conflicts], conflicts=sorted(conflicts))
