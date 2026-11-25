from .review_gate import evaluate


class Checkpoints:
    def __init__(self, store): self.store = store
    def save(self, policy, evidence, approved=False):
        if type(approved) is not bool: raise ValueError('approval must be an explicit boolean')
        ref = self.store.put_artifact({'policy': policy, 'evidence': evidence, 'approved': approved})
        self.store.set('checkpoint:' + ref, True)
        return ref
    def _load(self, checkpoint_id):
        if not self.store.get('checkpoint:' + checkpoint_id, False): raise ValueError('unknown checkpoint')
        checkpoint = self.store.read_artifact(checkpoint_id)
        if not isinstance(checkpoint, dict) or checkpoint.get('approved') is not True or 'policy' not in checkpoint or 'evidence' not in checkpoint: raise ValueError('checkpoint is not approved')
        return checkpoint
    def record_review(self, checkpoint_id, gate_input):
        """Evaluate review_gate evidence for this checkpoint and store the verdict (promote needs PROMOTE)."""
        self._load(checkpoint_id)
        verdict = evaluate(gate_input)
        self.store.set('review:' + checkpoint_id, {'decision': verdict['decision'], 'reasons': verdict['reasons']})
        return verdict
    def _reviewed(self, checkpoint_id):
        verdict = self.store.get('review:' + checkpoint_id)
        return isinstance(verdict, dict) and verdict.get('decision') == 'PROMOTE'
    def _was_promoted(self, checkpoint_id):
        # current/previous cover stores promoted before the explicit marker existed.
        return bool(self.store.get('promoted:' + checkpoint_id)) or checkpoint_id in (self.store.get('current_checkpoint'), self.store.get('previous_checkpoint'))
    def promote(self, checkpoint_id):
        self._load(checkpoint_id)
        if not self._reviewed(checkpoint_id): raise ValueError('checkpoint has no passing review_gate verdict')
        self._switch(checkpoint_id)
    def _switch(self, checkpoint_id):
        previous = self.store.get('current_checkpoint')
        self.store.db.execute('BEGIN IMMEDIATE')
        try:
            self.store.set('previous_checkpoint', previous)
            self.store.set('current_checkpoint', checkpoint_id)
            self.store.set('promoted:' + checkpoint_id, True)
            self.store.db.execute('COMMIT')
        except BaseException:
            self.store.db.execute('ROLLBACK'); raise
    def rollback(self, checkpoint_id):
        self._load(checkpoint_id)
        if not self._was_promoted(checkpoint_id): raise ValueError('rollback target was never promoted')
        self._switch(checkpoint_id)
        self.store.set('last_rollback', {'restored': checkpoint_id, 'reason': 'explicit or verified-regression rollback'})
    def current(self):
        ref = self.store.get('current_checkpoint')
        if ref is None: return None
        return self._load(ref)
