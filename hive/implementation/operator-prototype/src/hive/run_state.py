"""Durable run state machine inside the existing Store's SQLite (no new DB/daemon).

ADMITTED -> RUNNING -> CHECKPOINTED -> VERIFYING -> ACCEPTED | REJECTED | PAUSED | FAILED
PAUSED -> RUNNING on resume. ACCEPTED/REJECTED/FAILED are terminal and immutable.
The event log is append-only, per-run gapless cursor, hash-chained so a corrupt or
deleted row is detected. Writers serialize on BEGIN IMMEDIATE.
"""
from __future__ import annotations
import hashlib
import json
from contextlib import contextmanager

from .storage import _json

TERMINAL = frozenset({'ACCEPTED', 'REJECTED', 'FAILED'})
LEGAL = {
    None: {'ADMITTED'},
    'ADMITTED': {'RUNNING', 'FAILED'},
    'RUNNING': {'CHECKPOINTED', 'PAUSED', 'FAILED'},
    'CHECKPOINTED': {'RUNNING', 'VERIFYING', 'PAUSED', 'FAILED'},
    'VERIFYING': {'ACCEPTED', 'REJECTED', 'PAUSED', 'FAILED'},
    'PAUSED': {'RUNNING', 'FAILED'},
}
STATES = frozenset(LEGAL) - {None} | TERMINAL


class IllegalTransition(ValueError):
    pass


class RunStateCorrupt(RuntimeError):
    pass


def _digest(prev, run_id, seq, event_id, frm, to, payload):
    return hashlib.sha256('\x1f'.join([prev, run_id, str(seq), event_id, frm or '', to, payload]).encode()).hexdigest()


def _check_id(value, what):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{what} must be a non-empty string')


def _event(row):
    return {'run_id': row['run_id'], 'cursor': row['seq'], 'event_id': row['event_id'],
            'from_state': row['from_state'], 'to_state': row['to_state'],
            'payload': json.loads(row['payload'])}


class RunStates:
    def __init__(self, store):
        self.db = store.db
        self.db.execute('''CREATE TABLE IF NOT EXISTS run_events (
            run_id TEXT NOT NULL, seq INTEGER NOT NULL, event_id TEXT NOT NULL, from_state TEXT,
            to_state TEXT NOT NULL, payload TEXT NOT NULL, digest TEXT NOT NULL,
            PRIMARY KEY (run_id, seq), UNIQUE (run_id, event_id))''')
        self.db.execute('''CREATE TABLE IF NOT EXISTS run_effects (
            run_id TEXT NOT NULL, effect_id TEXT NOT NULL, started_cursor INTEGER,
            digest TEXT, receipt_cursor INTEGER, PRIMARY KEY (run_id, effect_id))''')

    @contextmanager
    def _tx(self, mode='IMMEDIATE'):
        self.db.execute('BEGIN ' + mode)
        try:
            yield self.db
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK')
            raise

    def _last(self, run_id):
        row = self.db.execute('SELECT * FROM run_events WHERE run_id=? ORDER BY seq DESC LIMIT 1', (run_id,)).fetchone()
        if row is not None:
            prev = self.db.execute('SELECT digest FROM run_events WHERE run_id=? AND seq=?', (run_id, row['seq'] - 1)).fetchone()
            want = _digest(prev['digest'] if prev else '', run_id, row['seq'], row['event_id'],
                           row['from_state'], row['to_state'], row['payload'])
            if row['seq'] < 1 or want != row['digest'] or (row['seq'] > 1 and prev is None):
                raise RunStateCorrupt(f'{run_id}: last event row fails integrity check')
        return row

    def transition(self, run_id, to_state, event_id, payload=None):
        _check_id(run_id, 'run_id'); _check_id(event_id, 'event_id')
        if to_state not in STATES:
            raise IllegalTransition(f'unknown state {to_state!r}')
        body = _json(payload if payload is not None else {})
        with self._tx() as db:
            dup = db.execute('SELECT * FROM run_events WHERE run_id=? AND event_id=?', (run_id, event_id)).fetchone()
            if dup is not None:  # replay: original wins, even if it would now be illegal
                if dup['to_state'] != to_state or dup['payload'] != body:
                    raise ValueError('event_id reused with different content')
                return _event(dup)
            last = self._last(run_id)
            cur = last['to_state'] if last else None
            if cur in TERMINAL:
                raise IllegalTransition(f'{run_id} is {cur} (terminal, immutable)')
            if to_state not in LEGAL[cur]:
                raise IllegalTransition(f'{cur} -> {to_state} not allowed')
            seq = last['seq'] + 1 if last else 1
            dig = _digest(last['digest'] if last else '', run_id, seq, event_id, cur, to_state, body)
            db.execute('INSERT INTO run_events VALUES (?,?,?,?,?,?,?)', (run_id, seq, event_id, cur, to_state, body, dig))
            return {'run_id': run_id, 'cursor': seq, 'event_id': event_id, 'from_state': cur,
                    'to_state': to_state, 'payload': json.loads(body)}

    def events(self, run_id, after=0):
        """Events with cursor > after (consumer cursor), oldest first."""
        return [_event(r) for r in self.db.execute(
            'SELECT * FROM run_events WHERE run_id=? AND seq>? ORDER BY seq', (run_id, after))]

    def effect_begin(self, run_id, effect_id):
        """Record intent BEFORE the external effect; no receipt later => unknown on resume."""
        _check_id(effect_id, 'effect_id')
        with self._tx() as db:
            last = self._last(run_id)
            if last is None:
                raise KeyError(run_id)
            if last['to_state'] in TERMINAL:
                raise IllegalTransition(f'{run_id} is terminal')
            db.execute('INSERT OR IGNORE INTO run_effects(run_id,effect_id,started_cursor) VALUES (?,?,?)',
                       (run_id, effect_id, last['seq']))
            return dict(db.execute('SELECT * FROM run_effects WHERE run_id=? AND effect_id=?', (run_id, effect_id)).fetchone())

    def effect_receipt(self, run_id, effect_id, digest):
        """Record that the effect completed, exactly once. Same digest again = no-op."""
        _check_id(effect_id, 'effect_id'); _check_id(digest, 'digest')
        with self._tx() as db:
            last = self._last(run_id)
            if last is None:
                raise KeyError(run_id)
            row = db.execute('SELECT * FROM run_effects WHERE run_id=? AND effect_id=?', (run_id, effect_id)).fetchone()
            if row is None:
                db.execute('INSERT INTO run_effects VALUES (?,?,?,?,?)', (run_id, effect_id, last['seq'], digest, last['seq']))
            elif row['digest'] is None:
                db.execute('UPDATE run_effects SET digest=?, receipt_cursor=? WHERE run_id=? AND effect_id=?',
                           (digest, last['seq'], run_id, effect_id))
            elif row['digest'] != digest:
                raise ValueError('effect already receipted with a different digest')
            return dict(db.execute('SELECT * FROM run_effects WHERE run_id=? AND effect_id=?', (run_id, effect_id)).fetchone())

    def resume(self, run_id):
        """Verify the full chain, then report state, cursor and effect status. Read-only."""
        with self._tx('DEFERRED') as db:
            rows = db.execute('SELECT * FROM run_events WHERE run_id=? ORDER BY seq', (run_id,)).fetchall()
            effects = db.execute('SELECT * FROM run_effects WHERE run_id=? ORDER BY rowid', (run_id,)).fetchall()
        if not rows:
            raise KeyError(run_id)
        prev, state = '', None
        for n, r in enumerate(rows, 1):
            if (r['seq'] != n or r['from_state'] != state
                    or r['digest'] != _digest(prev, run_id, n, r['event_id'], r['from_state'], r['to_state'], r['payload'])):
                raise RunStateCorrupt(f'{run_id}: event {n} corrupt, missing or out of order')
            prev, state = r['digest'], r['to_state']
        return {'run_id': run_id, 'state': state, 'cursor': rows[-1]['seq'], 'terminal': state in TERMINAL,
                'effects_done': [e['effect_id'] for e in effects if e['digest'] is not None],
                'effects_unknown': [e['effect_id'] for e in effects if e['digest'] is None],
                'effect_digests': {e['effect_id']: e['digest'] for e in effects}}
