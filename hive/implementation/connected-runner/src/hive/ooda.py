"""Bounded OODA experiment controller with an immutable hash-chained ledger.

Vulnerator AI pattern: evidence-only, no security/exploit features.
States: CREATED -> OBSERVE -> ORIENT -> DECIDE -> ACT -> VERIFY ->
    ACCEPT | REJECT | INCONCLUSIVE -> CHECKPOINT (terminal).
Tables `ooda_experiments` (one row per experiment) and `ooda_steps`
(append-only, per-experiment gapless step number, prev_sha256 chain) live
inside the existing Store SQLite. Writers serialize on BEGIN IMMEDIATE.
"""
from __future__ import annotations

import hashlib
import json
import time
from contextlib import contextmanager

from .storage import _json

CREATED = 'CREATED'
OBSERVE = 'OBSERVE'
ORIENT = 'ORIENT'
DECIDE = 'DECIDE'
ACT = 'ACT'
VERIFY = 'VERIFY'
ACCEPT = 'ACCEPT'
REJECT = 'REJECT'
INCONCLUSIVE = 'INCONCLUSIVE'
CHECKPOINT = 'CHECKPOINT'

STATES = frozenset({CREATED, OBSERVE, ORIENT, DECIDE, ACT, VERIFY,
                    ACCEPT, REJECT, INCONCLUSIVE, CHECKPOINT})
TERMINAL = frozenset({CHECKPOINT})

# Only the next state is legal; VERIFY may go to any of the three verdicts.
LEGAL = {
    None: {CREATED},
    CREATED: {OBSERVE},
    # Any in-flight phase may end INCONCLUSIVE (observation/decision/act failed before a verifier could run).
    OBSERVE: {ORIENT, INCONCLUSIVE},
    ORIENT: {DECIDE, INCONCLUSIVE},
    DECIDE: {ACT, INCONCLUSIVE},
    ACT: {VERIFY, INCONCLUSIVE},
    VERIFY: {ACCEPT, REJECT, INCONCLUSIVE},
    ACCEPT: {CHECKPOINT},
    REJECT: {CHECKPOINT},
    INCONCLUSIVE: {CHECKPOINT},
}

REQUIRE_REFS = frozenset({ORIENT, ACT, VERIFY, ACCEPT, REJECT, INCONCLUSIVE})


class OODAError(ValueError):
    pass


def _digest(prev, experiment_id, step, event_id, frm, to, payload):
    return hashlib.sha256('\x1f'.join([
        prev, experiment_id, str(step), event_id, frm or '', to, payload
    ]).encode()).hexdigest()


def _check_id(value, what):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{what} must be a non-empty string')


def _step(row):
    return {'experiment_id': row['experiment_id'], 'step': row['step'],
            'event_id': row['event_id'], 'from_state': row['from_state'],
            'to_state': row['to_state'], 'payload': json.loads(row['payload'])}


class OODAController:
    def __init__(self, store, clock=time.time):
        self.db = store.db
        self.clock = clock  # seconds since epoch; injectable so wall-clock limits are testable
        self.db.execute('''CREATE TABLE IF NOT EXISTS ooda_experiments (
            experiment_id TEXT PRIMARY KEY, hypothesis TEXT NOT NULL,
            baseline_ref TEXT NOT NULL, max_steps INTEGER NOT NULL,
            max_wall_seconds INTEGER NOT NULL, state TEXT NOT NULL,
            verdict TEXT, reason TEXT, created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )''')
        self.db.execute('''CREATE TABLE IF NOT EXISTS ooda_steps (
            experiment_id TEXT NOT NULL, step INTEGER NOT NULL,
            event_id TEXT NOT NULL, from_state TEXT, to_state TEXT NOT NULL,
            payload TEXT NOT NULL, digest TEXT NOT NULL,
            PRIMARY KEY (experiment_id, step), UNIQUE (experiment_id, event_id)
        )''')

    @contextmanager
    def _tx(self, mode='IMMEDIATE'):
        self.db.execute('BEGIN ' + mode)
        try:
            yield self.db
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK')
            raise

    def _last(self, experiment_id):
        return self.db.execute(
            'SELECT * FROM ooda_steps WHERE experiment_id=? ORDER BY step DESC LIMIT 1',
            (experiment_id,)).fetchone()

    def _tail_digest(self, experiment_id):
        row = self.db.execute(
            'SELECT digest FROM ooda_steps WHERE experiment_id=? ORDER BY step DESC LIMIT 1',
            (experiment_id,)).fetchone()
        return row['digest'] if row else ''

    def _record_step(self, db, experiment_id, step, event_id, cur, to_state, body):
        prev = self.db.execute(
            'SELECT digest FROM ooda_steps WHERE experiment_id=? AND step=?',
            (experiment_id, step - 1)).fetchone() if step > 1 else None
        digest = _digest(prev['digest'] if prev else '', experiment_id, step,
                         event_id, cur, to_state, body)
        db.execute(
            'INSERT INTO ooda_steps VALUES (?,?,?,?,?,?,?)',
            (experiment_id, step, event_id, cur, to_state, body, digest))
        return digest

    def _set_state(self, db, experiment_id, state, reason=None, verdict=None):
        db.execute('UPDATE ooda_experiments SET state=?, verdict=?, reason=?, updated_at=? WHERE experiment_id=?',
                   (state, verdict, reason, self._now(), experiment_id))

    def _now(self):
        return str(int(self.clock() * 1000))

    def create(self, experiment_id, hypothesis, baseline_ref, limits):
        _check_id(experiment_id, 'experiment_id')
        _check_id(hypothesis, 'hypothesis')
        _check_id(baseline_ref, 'baseline_ref')
        if not isinstance(limits, dict):
            raise ValueError('limits must be a dict')
        if not isinstance(limits.get('max_steps'), int) or limits['max_steps'] <= 0:
            raise ValueError('limits.max_steps must be a positive int')
        if not isinstance(limits.get('max_wall_seconds'), int) or limits['max_wall_seconds'] <= 0:
            raise ValueError('limits.max_wall_seconds must be a positive int')
        with self._tx() as db:
            existing = db.execute(
                'SELECT 1 FROM ooda_experiments WHERE experiment_id=?', (experiment_id,)).fetchone()
            if existing is not None:
                raise ValueError(f'experiment {experiment_id!r} already exists')
            db.execute(
                'INSERT INTO ooda_experiments VALUES (?,?,?,?,?,?,?,?,?,?)',
                (experiment_id, hypothesis, baseline_ref, limits['max_steps'],
                 limits['max_wall_seconds'], CREATED, None, None, self._now(), self._now()))

    def advance(self, experiment_id, to_state, evidence):
        _check_id(experiment_id, 'experiment_id')
        if to_state not in STATES:
            raise OODAError(f'unknown state {to_state!r}')
        if evidence is None or not isinstance(evidence, dict):
            raise ValueError('evidence must be a dict')
        body = _json(evidence)
        raise_after = False
        with self._tx() as db:
            exp = db.execute(
                'SELECT * FROM ooda_experiments WHERE experiment_id=?', (experiment_id,)).fetchone()
            if exp is None:
                raise KeyError(experiment_id)
            if exp['state'] == CHECKPOINT:
                raise OODAError(f'{experiment_id} is {CHECKPOINT} (terminal, immutable)')
            last = self._last(experiment_id)
            cur = last['to_state'] if last else CREATED
            if to_state not in LEGAL[cur]:
                raise OODAError(f'{cur} -> {to_state} not allowed')
            step = (last['step'] + 1) if last else 1
            # Wall clock runs from create. A finished verdict may still be checkpointed late, never overridden.
            wall_over = ((self.clock() * 1000 - int(exp['created_at'])) / 1000 > exp['max_wall_seconds']
                         and not (to_state == CHECKPOINT and cur in (ACCEPT, REJECT, INCONCLUSIVE)))
            reason = 'budget' if step > exp['max_steps'] else 'wall_clock' if wall_over else None
            if reason:
                # budget exhausted: commit INCONCLUSIVE then CHECKPOINT, then raise
                self._record_step(db, experiment_id, step, 'inconclusive:' + str(step),
                                  cur, INCONCLUSIVE, _json({'reason': reason}))
                self._set_state(db, experiment_id, INCONCLUSIVE, reason, INCONCLUSIVE)
                step2 = step + 1
                self._record_step(db, experiment_id, step2, 'checkpoint:' + str(step2),
                                  INCONCLUSIVE, CHECKPOINT, _json({'reason': reason}))
                self._set_state(db, experiment_id, CHECKPOINT, reason, INCONCLUSIVE)
                raise_after = True
            else:
                if to_state in REQUIRE_REFS:
                    refs = evidence.get('refs')
                    if not isinstance(refs, list) or not refs or not all(isinstance(r, str) for r in refs):
                        raise ValueError(f'{to_state} requires non-empty refs list')
                if to_state == ACCEPT:
                    if evidence.get('verifier_verdict') != 'pass':
                        raise ValueError('ACCEPT requires verifier_verdict == pass')
                    if not evidence.get('verifier') or evidence.get('verifier') == evidence.get('author'):
                        raise ValueError('ACCEPT requires independent verifier (verifier != author)')
                self._record_step(db, experiment_id, step, 'step:' + str(step), cur, to_state, body)
                if to_state == CHECKPOINT:
                    self._set_state(db, experiment_id, CHECKPOINT, verdict=exp['verdict'])
                elif to_state in (ACCEPT, REJECT, INCONCLUSIVE):
                    self._set_state(db, experiment_id, to_state, verdict=to_state)
                else:
                    self._set_state(db, experiment_id, to_state)
                return {'experiment_id': experiment_id, 'step': step, 'from_state': cur,
                        'to_state': to_state, 'payload': evidence}
        if raise_after:
            raise OODAError(f'{experiment_id} {"wall clock" if reason == "wall_clock" else "step"} budget exceeded')

    def get(self, experiment_id):
        row = self.db.execute(
            'SELECT * FROM ooda_experiments WHERE experiment_id=?', (experiment_id,)).fetchone()
        if row is None:
            raise KeyError(experiment_id)
        steps = [_step(r) for r in self.db.execute(
            'SELECT * FROM ooda_steps WHERE experiment_id=? ORDER BY step', (experiment_id,))]
        return {'experiment_id': experiment_id, 'hypothesis': row['hypothesis'],
                'baseline_ref': row['baseline_ref'], 'max_steps': row['max_steps'],
                'max_wall_seconds': row['max_wall_seconds'], 'state': row['state'],
                'verdict': row['verdict'], 'reason': row['reason'], 'steps': steps}

    def verify_chain(self, experiment_id):
        rows = self.db.execute(
            'SELECT * FROM ooda_steps WHERE experiment_id=? ORDER BY step', (experiment_id,)).fetchall()
        if not rows:
            return False
        prev, state = '', CREATED
        for n, r in enumerate(rows, 1):
            want = _digest(prev, experiment_id, n, r['event_id'], r['from_state'],
                           r['to_state'], r['payload'])
            if r['step'] != n or r['digest'] != want or r['from_state'] != state:
                return False
            prev, state = r['digest'], r['to_state']
        return True
