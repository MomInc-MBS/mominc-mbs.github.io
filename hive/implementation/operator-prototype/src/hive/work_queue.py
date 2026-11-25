"""Durable engineering backlog in the existing Store; never executes missions."""
from __future__ import annotations
import copy
import re
from .orchestrator import config_hash


class BuildQueue:
    KEY = 'authorized_build_queue_v1'

    def __init__(self, store):
        self.store = store

    def initialize(self, manifest: dict) -> dict:
        if (not isinstance(manifest, dict) or manifest.get('version') != 1 or
                not isinstance(manifest.get('authorization_ref'), str) or
                not manifest['authorization_ref'].strip()):
            raise ValueError('versioned engineering authorization reference required')
        items = manifest.get('items')
        if not isinstance(items, list) or not 1 <= len(items) <= 128:
            raise ValueError('one to 128 bounded build items required')
        ids = set()
        for item in items:
            if (not isinstance(item, dict) or not re.fullmatch(r'[A-Za-z0-9_.-]{1,80}', item.get('id', ''))
                    or item['id'] in ids or item.get('authorized') is not True
                    or not all(isinstance(item.get(k), str) and item[k].strip()
                               for k in ('owner', 'hypothesis', 'next_command'))
                    or not isinstance(item.get('depends_on'), list)):
                raise ValueError('invalid, duplicate or unauthorized build item')
            # Topological order makes cycles and unknown dependencies impossible.
            if not all(isinstance(dep, str) and dep in ids for dep in item['depends_on']):
                raise ValueError('dependencies must precede their dependent item')
            ids.add(item['id'])
        previous = self.store.get(self.KEY)
        identity = config_hash(manifest)
        if previous:
            if previous['manifest_sha256'] != identity:
                raise ValueError('existing queue is immutable; no implicit authorization reset')
            return self.status()
        manifest_ref = self.store.put_artifact(manifest)
        state = {'manifest_sha256': identity, 'manifest_ref': manifest_ref,
                 'items': [{**copy.deepcopy(item), 'status': 'PENDING', 'history': []} for item in items]}
        self.store.set(self.KEY, state)
        return self.status()

    def status(self) -> dict:
        state = self.store.get(self.KEY)
        if not state:
            return {'items': [], 'next_item': None, 'mission_authority': False}
        manifest = self.store.read_artifact(state['manifest_ref'])
        if config_hash(manifest) != state['manifest_sha256']:
            raise ValueError('build manifest identity mismatch')
        for item in state['items']:
            for ref in item['history']:
                self.store.read_artifact(ref)
        completed = {i['id'] for i in state['items'] if i['status'] == 'COMPLETED'}
        eligible = [i for i in state['items'] if i['status'] == 'PENDING' and set(i['depends_on']) <= completed]
        return {**state, 'next_item': eligible[0]['id'] if eligible else None,
                'mission_authority': False,
                'note': 'Engineering queue does not clear STOP, grant inference, reset budgets or approve policy.'}

    def record(self, item_id: str, *, outcome: str, evidence: dict,
               failure_signature: str | None = None) -> dict:
        if outcome not in ('passed', 'failed', 'blocked') or not isinstance(evidence, dict) or not evidence:
            raise ValueError('bounded outcome and concrete evidence required')
        state = self.status()
        item = next((i for i in state['items'] if i['id'] == item_id), None)
        if not item or item['status'] != 'PENDING' or state['next_item'] != item_id:
            raise ValueError('item is not the next authorized eligible build task')
        if outcome == 'failed' and (not isinstance(failure_signature, str) or not failure_signature.strip()):
            raise ValueError('failed attempt requires a stable failure signature')
        event = {'item_id': item_id, 'outcome': outcome, 'hypothesis': item['hypothesis'],
                 'failure_signature': failure_signature, 'evidence': evidence}
        unchanged = sum(self.store.read_artifact(ref).get('failure_signature') == failure_signature
                        and self.store.read_artifact(ref).get('hypothesis') == item['hypothesis']
                        for ref in item['history']) if outcome == 'failed' else 0
        item['history'].append(self.store.put_artifact(event))
        item['status'] = ('COMPLETED' if outcome == 'passed' else 'BLOCKED_DEPENDENCY'
                          if outcome == 'blocked' else 'BLOCKED_REVIEW' if unchanged >= 1 else 'PENDING')
        self.store.set(self.KEY, {k: state[k] for k in ('manifest_sha256', 'manifest_ref', 'items')})
        return self.status()

    def revise(self, item_id: str, *, hypothesis: str, review_ref: str) -> dict:
        state = self.status()
        item = next((i for i in state['items'] if i['id'] == item_id), None)
        review = self.store.read_artifact(review_ref)
        if (not item or item['status'] not in ('BLOCKED_REVIEW', 'BLOCKED_DEPENDENCY')
                or not isinstance(hypothesis, str) or not hypothesis.strip() or hypothesis == item['hypothesis']
                or review.get('item_id') != item_id or not review.get('reviewer')
                or review['reviewer'] == item['owner'] or not review.get('diagnosis')
                or not review.get('discriminating_test')):
            raise ValueError('independent diagnosis and changed falsifiable hypothesis required')
        item['history'].append(review_ref)
        item.update(hypothesis=hypothesis, status='PENDING')
        self.store.set(self.KEY, {k: state[k] for k in ('manifest_sha256', 'manifest_ref', 'items')})
        return self.status()
