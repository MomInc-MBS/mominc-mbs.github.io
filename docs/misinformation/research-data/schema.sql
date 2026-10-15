PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    category TEXT NOT NULL,
    proposed_iceberg_tier INTEGER NOT NULL CHECK (proposed_iceberg_tier BETWEEN 1 AND 8),
    tier_basis TEXT NOT NULL,
    review_state TEXT NOT NULL CHECK (review_state IN ('draft','in_review','approved','rejected','retired')),
    reviewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aliases (
    id INTEGER PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    UNIQUE(subject_id, normalized_alias)
);

CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    retrieved_at TEXT NOT NULL,
    licensing_status TEXT NOT NULL,
    licensing_url TEXT,
    reuse_policy TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subject_sources (
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES sources(id),
    PRIMARY KEY(subject_id, source_id)
);

CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    exact_statement TEXT NOT NULL,
    evidence_status TEXT NOT NULL CHECK (evidence_status IN ('documented','unsupported','contradicted','disputed','unresolved')),
    historical_conspiracy INTEGER NOT NULL CHECK (historical_conspiracy IN (0,1)),
    evidence_summary TEXT NOT NULL,
    reviewed_at TEXT NOT NULL,
    review_state TEXT NOT NULL CHECK (review_state IN ('draft','in_review','approved','rejected','retired')),
    eligibility TEXT NOT NULL CHECK (eligibility IN ('pending_human_edit','scored','research_only','excluded')),
    CHECK (eligibility != 'scored' OR (review_state = 'approved' AND evidence_status IN ('documented','unsupported','contradicted')))
);

CREATE TABLE IF NOT EXISTS claim_sources (
    claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES sources(id),
    evidence_role TEXT NOT NULL,
    locator TEXT,
    PRIMARY KEY(claim_id, source_id)
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES claims(id),
    version INTEGER NOT NULL CHECK (version > 0),
    identification_prompt TEXT NOT NULL,
    classification_prompt TEXT NOT NULL,
    classification_answer TEXT NOT NULL CHECK (classification_answer IN ('documented','unsupported','contradicted','disputed','unresolved')),
    explanation TEXT NOT NULL,
    rarity_seed TEXT NOT NULL,
    review_state TEXT NOT NULL CHECK (review_state IN ('draft','in_review','approved','rejected','retired')),
    eligibility TEXT NOT NULL CHECK (eligibility IN ('pending_human_edit','scored','research_only','excluded')),
    UNIQUE(claim_id, version),
    UNIQUE(id, version),
    CHECK (eligibility != 'scored' OR review_state = 'approved')
);

CREATE TABLE IF NOT EXISTS accepted_answers (
    id INTEGER PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    normalized_answer TEXT NOT NULL,
    UNIQUE(question_id, normalized_answer)
);

CREATE TABLE IF NOT EXISTS answer_stats (
    question_id TEXT NOT NULL,
    question_version INTEGER NOT NULL,
    normalized_answer TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    correct_attempts INTEGER NOT NULL DEFAULT 0 CHECK (correct_attempts BETWEEN 0 AND attempts),
    calibration_version TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(question_id, question_version, normalized_answer, calibration_version),
    FOREIGN KEY(question_id, question_version) REFERENCES questions(id, version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_history (
    id INTEGER PRIMARY KEY,
    claim_id TEXT REFERENCES claims(id),
    question_id TEXT REFERENCES questions(id),
    reviewer TEXT NOT NULL,
    reviewed_at TEXT NOT NULL,
    outcome TEXT NOT NULL,
    notes TEXT NOT NULL,
    CHECK ((claim_id IS NOT NULL) != (question_id IS NOT NULL))
);

CREATE TRIGGER IF NOT EXISTS question_scoring_guard_insert
BEFORE INSERT ON questions WHEN NEW.eligibility = 'scored'
BEGIN
    SELECT RAISE(ABORT, 'Scored questions require an approved scored claim with matching classification')
    WHERE NOT EXISTS (
        SELECT 1 FROM claims WHERE id = NEW.claim_id AND review_state = 'approved'
        AND eligibility = 'scored' AND evidence_status = NEW.classification_answer
    );
END;

CREATE TRIGGER IF NOT EXISTS question_scoring_guard_update
BEFORE UPDATE ON questions WHEN NEW.eligibility = 'scored'
BEGIN
    SELECT RAISE(ABORT, 'Scored questions require an approved scored claim with matching classification')
    WHERE NOT EXISTS (
        SELECT 1 FROM claims WHERE id = NEW.claim_id AND review_state = 'approved'
        AND eligibility = 'scored' AND evidence_status = NEW.classification_answer
    );
END;

CREATE VIEW IF NOT EXISTS eligible_questions AS
SELECT q.* FROM questions q JOIN claims c ON c.id = q.claim_id
WHERE q.eligibility = 'scored' AND q.review_state = 'approved'
AND c.eligibility = 'scored' AND c.review_state = 'approved'
AND c.evidence_status = q.classification_answer
AND c.evidence_status IN ('documented','unsupported','contradicted');

-- Discovery entities are deliberately separate from claims and scored questions.
CREATE TABLE IF NOT EXISTS discovery_candidates (
    wikidata_id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    wikidata_url TEXT NOT NULL,
    review_state TEXT NOT NULL DEFAULT 'unreviewed_discovery_only'
        CHECK (review_state = 'unreviewed_discovery_only'),
    scored_eligible INTEGER NOT NULL DEFAULT 0 CHECK (scored_eligible = 0)
);

CREATE TABLE IF NOT EXISTS discovery_exports (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    retrieval_method TEXT NOT NULL,
    source_query TEXT NOT NULL,
    retrieved_at TEXT NOT NULL,
    license TEXT NOT NULL,
    license_url TEXT NOT NULL,
    provenance_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS discovery_candidate_exports (
    wikidata_id TEXT NOT NULL REFERENCES discovery_candidates(wikidata_id),
    export_id TEXT NOT NULL REFERENCES discovery_exports(id),
    PRIMARY KEY(wikidata_id, export_id)
);
