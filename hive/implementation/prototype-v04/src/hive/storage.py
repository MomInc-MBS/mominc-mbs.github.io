import hashlib, json, os, sqlite3, uuid
from pathlib import Path

ACTIVE = {'RUNNING', 'VERIFYING', 'REVIEWING'}
TERMINAL = {'PROMOTED', 'REJECTED', 'RETRY_READY', 'BLOCKED'}
TRANSITIONS = {'QUEUED': {'RUNNING'}, 'RUNNING': {'VERIFYING', 'RETRY_READY', 'BLOCKED'}, 'VERIFYING': {'REVIEWING', 'RETRY_READY', 'BLOCKED'}, 'REVIEWING': TERMINAL, 'RETRY_READY': {'QUEUED'}}

def _json(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)

def _alive(pid):
    if not isinstance(pid, int) or pid <= 0:
        return True
    if os.name == 'nt':
        import ctypes
        kernel = ctypes.windll.kernel32
        kernel.OpenProcess.restype = ctypes.c_void_p
        kernel.GetExitCodeProcess.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
        kernel.CloseHandle.argtypes = [ctypes.c_void_p]
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle:
            return kernel.GetLastError() != 87  # Unknown or inaccessible means alive.
        code = ctypes.c_ulong()
        try:
            return not kernel.GetExitCodeProcess(handle, ctypes.byref(code)) or code.value == 259
        finally:
            kernel.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except (PermissionError, OSError):
        return True

class Store:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.artifacts = self.root / 'artifacts'
        self.artifacts.mkdir(exist_ok=True)
        self.db = sqlite3.connect(self.root / 'hive.sqlite3', timeout=30, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.executescript('''CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, spec TEXT NOT NULL, state TEXT NOT NULL, owner TEXT, generation INTEGER NOT NULL DEFAULT 0, pid INTEGER, result TEXT); CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT NOT NULL, state TEXT NOT NULL, detail TEXT); CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);''')
    def put_artifact(self, value):
        data = _json(value).encode('utf-8')
        digest = hashlib.sha256(data).hexdigest()
        target = self.artifacts / (digest + '.json')
        if not target.exists():
            temp = self.artifacts / (uuid.uuid4().hex + '.tmp')
            try:
                with temp.open('xb') as f:
                    f.write(data); f.flush(); os.fsync(f.fileno())
                os.replace(temp, target)
            finally:
                temp.unlink(missing_ok=True)
        return 'artifacts/' + digest + '.json'
    def read_artifact(self, ref):
        import re
        if not isinstance(ref, str) or not re.fullmatch(r'artifacts/[0-9a-f]{64}\.json', ref):
            raise ValueError('invalid artifact reference')
        path = self.root / ref
        if path.is_symlink() or self.artifacts.is_symlink(): raise ValueError('artifact symlink refused')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != path.stem:
            raise ValueError('artifact digest mismatch')
        return json.loads(data)
    def enqueue(self, spec):
        job_id = uuid.uuid4().hex
        self.db.execute('BEGIN IMMEDIATE')
        try:
            self.db.execute('INSERT INTO jobs(id,spec,state) VALUES (?,?,?)', (job_id, _json(spec), 'QUEUED'))
            self.db.execute('INSERT INTO events(job_id,state) VALUES (?,?)', (job_id, 'QUEUED'))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK'); raise
        return job_id
    def claim(self, owner, job_id=None):
        if not owner: raise ValueError('owner required')
        self.db.execute('BEGIN IMMEDIATE')
        try:
            if job_id is None:
                row = self.db.execute("SELECT id FROM jobs WHERE state='QUEUED' ORDER BY rowid LIMIT 1").fetchone()
            else:
                row = self.db.execute("SELECT id FROM jobs WHERE state='QUEUED' AND id=?", (job_id,)).fetchone()
            if row is None:
                self.db.execute('COMMIT'); return None
            self.db.execute("UPDATE jobs SET state='RUNNING',owner=?,generation=generation+1,pid=? WHERE id=?", (owner, os.getpid(), row['id']))
            self.db.execute('INSERT INTO events(job_id,state,detail) VALUES (?,?,?)', (row['id'], 'RUNNING', _json({'owner':owner})))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK'); raise
        return self.get_job(row['id'])
    def transition(self, job_id, state, detail=None, owner=None, generation=None):
        if state == 'RUNNING': raise ValueError('use claim to atomically assign ownership')
        self._change(job_id, state, detail, owner, generation, None, False)
    def enqueue_once(self, key, spec):
        """Exactly one successor per parent cycle, including crash replay."""
        self.db.execute('BEGIN IMMEDIATE')
        try:
            existing = self.get('enqueue:' + key)
            if existing:
                self.db.execute('COMMIT'); return existing
            job_id = uuid.uuid4().hex
            self.db.execute('INSERT INTO jobs(id,spec,state) VALUES (?,?,?)', (job_id, _json(spec), 'QUEUED'))
            self.db.execute('INSERT INTO events(job_id,state) VALUES (?,?)', (job_id, 'QUEUED'))
            self.set('enqueue:' + key, job_id)
            self.db.execute('COMMIT'); return job_id
        except BaseException:
            self.db.execute('ROLLBACK'); raise
    def finish(self, job_id, state, result, owner, generation):
        if state not in TERMINAL: raise ValueError('finish requires terminal state')
        self._change(job_id, state, None, owner, generation, result, True)
    def _change(self, job_id, state, detail, owner, generation, result, finishing):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            row = self.db.execute('SELECT * FROM jobs WHERE id=?', (job_id,)).fetchone()
            if row is None: raise KeyError(job_id)
            if state not in TRANSITIONS.get(row['state'], set()): raise ValueError('invalid transition')
            if row['state'] in ACTIVE and (not owner or owner != row['owner'] or generation != row['generation']): raise PermissionError('stale or unauthorized worker')
            self.db.execute('UPDATE jobs SET state=?, result=CASE WHEN ? THEN ? ELSE result END WHERE id=?', (state, finishing, _json(result) if finishing else None, job_id))
            self.db.execute('INSERT INTO events(job_id,state,detail) VALUES (?,?,?)', (job_id, state, _json(detail) if detail is not None else None))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK'); raise
    def recover(self):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            rows = self.db.execute("SELECT * FROM jobs WHERE state IN ('RUNNING','VERIFYING','REVIEWING')").fetchall()
            recovered = []
            for row in rows:
                if not _alive(row['pid']):
                    self.db.execute("UPDATE jobs SET state='QUEUED',owner=NULL,pid=NULL,generation=generation+1 WHERE id=?", (row['id'],))
                    self.db.execute("INSERT INTO events(job_id,state,detail) VALUES (?,'QUEUED',?)", (row['id'], _json({'recovered':True})))
                    recovered.append(row['id'])
            # Recovery and its conservative time debit must commit together.
            # CLI resume also calls this method; requeuing first would otherwise
            # hide the interrupted reservation from the next executor.
            inflight = self.get('inflight')
            interrupted = self.get_job(inflight['job']) if inflight else None
            # Also settle an orphan left by a pre-fix CLI resume. Conservatively
            # charge it before any new dispatch can replace that reservation.
            orphaned = interrupted and interrupted['state'] == 'QUEUED' and interrupted['owner'] is None
            if inflight and (inflight['job'] in recovered or orphaned):
                budget = self.get('budget')
                budget['wall_s'] += inflight['reserved_wall_s']
                self.set('budget', budget)
                self.set('inflight', None)
            self.db.execute('COMMIT'); return recovered
        except BaseException:
            self.db.execute('ROLLBACK'); raise
    def get_job(self, job_id):
        row = self.db.execute('SELECT * FROM jobs WHERE id=?', (job_id,)).fetchone()
        if row is None: raise KeyError(job_id)
        item = dict(row); item['spec'] = json.loads(item['spec']); item['result'] = json.loads(item['result']) if item['result'] is not None else None
        item['history'] = [dict(r) for r in self.db.execute('SELECT state,detail FROM events WHERE job_id=? ORDER BY seq', (job_id,))]
        for event in item['history']:
            if event['detail'] is not None: event['detail'] = json.loads(event['detail'])
        return item
    def jobs(self):
        return [self.get_job(r['id']) for r in self.db.execute('SELECT id FROM jobs ORDER BY rowid').fetchall()]
    def get(self, key, default=None):
        row = self.db.execute('SELECT value FROM kv WHERE key=?', (key,)).fetchone()
        return json.loads(row['value']) if row else default
    def set(self, key, value):
        self.db.execute('INSERT INTO kv(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', (key, _json(value)))
    def close(self): self.db.close()



