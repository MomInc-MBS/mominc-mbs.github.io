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
    def promote(self, checkpoint_id):
        self._load(checkpoint_id)
        previous = self.store.get('current_checkpoint')
        self.store.db.execute('BEGIN IMMEDIATE')
        try:
            self.store.set('previous_checkpoint', previous)
            self.store.set('current_checkpoint', checkpoint_id)
            self.store.db.execute('COMMIT')
        except BaseException:
            self.store.db.execute('ROLLBACK'); raise
    def rollback(self, checkpoint_id):
        self.promote(checkpoint_id)
        self.store.set('last_rollback', {'restored': checkpoint_id, 'reason': 'explicit or verified-regression rollback'})
    def current(self):
        ref = self.store.get('current_checkpoint')
        if ref is None: return None
        return self._load(ref)
