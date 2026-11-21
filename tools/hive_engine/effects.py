"""Conservative stateful-tool ledger for future adapters. Never blindly retry.

Current registered caption tools are read-only. A pending stateful intent after
crash is outcome_unknown until independent reconciliation proves not_applied.
The caller supplies a stable idempotency key; this ledger cannot invent remote
exactly-once guarantees. Use under the runtime's exclusive state lock.
"""
from .core import digest


class EffectJournal:
    def __init__(self, store):
        self.store = store

    def begin(self, key, request):
        self.store.verify()
        rows = [r for r in self.store.records('ToolEffect') if r['key'] == key]
        if rows:
            if rows[0]['request_hash'] != digest(request):
                raise ValueError('idempotency key reused with different request')
            if rows[-1]['state'] != 'not_applied':
                raise ValueError('outcome_unknown or already applied; reconcile before retry')
        self.store.append('ToolEffect', {'channel': 'Task', 'key': key,
                                       'request_hash': digest(request), 'state': 'outcome_unknown',
                                       'evidence': 'intent persisted before dispatch'})

    def reconcile(self, key, state, evidence):
        if state not in {'applied', 'not_applied', 'outcome_unknown'} or not evidence:
            raise ValueError('independent effect evidence required')
        rows = [r for r in self.store.records('ToolEffect') if r['key'] == key]
        if not rows or rows[-1]['state'] == 'applied':
            raise ValueError('no pending effect to reconcile')
        self.store.append('ToolEffect', {'channel': 'Evidence', 'key': key,
                                       'request_hash': rows[0]['request_hash'], 'state': state,
                                       'evidence': evidence})
