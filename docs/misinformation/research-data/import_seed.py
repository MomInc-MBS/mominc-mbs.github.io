"""Import the reviewed research starter into SQLite. Standard library only.

Usage: python import_seed.py [--seed PATH] [--database PATH] [--overwrite]
Existing populated catalogs are refused unless --overwrite is explicitly supplied.
"""
import argparse
import json
import re
import sqlite3
from pathlib import Path


def normalize(value):
    return re.sub(r"\s+", " ", value.casefold().strip())


def main():
    base = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=Path, default=base / "seed-catalog.json")
    parser.add_argument("--database", type=Path, default=base / "starter-catalog.sqlite3")
    parser.add_argument("--overwrite", action="store_true",
                        help="Replace existing catalog rows in one transaction; use only for this research starter")
    args = parser.parse_args()
    catalog = json.loads(args.seed.read_text(encoding="utf-8"))
    with sqlite3.connect(args.database) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript((base / "schema.sql").read_text(encoding="utf-8"))
        if conn.execute("SELECT COUNT(*) FROM subjects").fetchone()[0] and not args.overwrite:
            raise SystemExit("Refusing to overwrite a populated catalog; choose a new --database path.")
        with conn:
            if args.overwrite:
                for table in ("review_history", "answer_stats", "accepted_answers", "questions",
                              "claim_sources", "claims", "subject_sources", "aliases", "subjects", "sources"):
                    conn.execute(f"DELETE FROM {table}")
            for source in catalog["sources"]:
                conn.execute("INSERT INTO sources VALUES (?,?,?,?,?,?,?,?)", (
                    source["id"], source["title"], source["publisher"], source["url"],
                    source["retrieved_at"], source["licensing_status"],
                    source.get("licensing_url"), source["reuse_policy"]))
            for subject in catalog["subjects"]:
                conn.execute("INSERT INTO subjects VALUES (?,?,?,?,?,?,?)", (
                    subject["id"], subject["canonical_name"], subject["category"],
                    subject["proposed_iceberg_tier"], subject["tier_basis"],
                    subject["review_state"], subject["reviewed_at"]))
                for alias in subject["aliases"]:
                    conn.execute("INSERT INTO aliases(subject_id,alias,normalized_alias) VALUES (?,?,?)",
                                 (subject["id"], alias, normalize(alias)))
                claim = subject["claim"]
                conn.execute("INSERT INTO claims VALUES (?,?,?,?,?,?,?,?,?)", (
                    claim["id"], subject["id"], claim["exact_statement"],
                    claim["evidence_status"], int(claim["historical_conspiracy"]),
                    claim["evidence_summary"], claim["reviewed_at"],
                    claim["review_state"], claim["eligibility"]))
                for evidence in claim["sources"]:
                    conn.execute("INSERT INTO subject_sources VALUES (?,?)",
                                 (subject["id"], evidence["source_id"]))
                    conn.execute("INSERT INTO claim_sources VALUES (?,?,?,?)", (
                        claim["id"], evidence["source_id"], evidence["evidence_role"],
                        evidence.get("locator")))
                question = subject["question"]
                conn.execute("INSERT INTO questions VALUES (?,?,?,?,?,?,?,?,?,?)", (
                    question["id"], claim["id"], question["version"],
                    question["identification_prompt"], question["classification_prompt"],
                    claim["evidence_status"], question["explanation"],
                    question["rarity_seed"], question["review_state"], question["eligibility"]))
                for answer in question["accepted_answers"]:
                    conn.execute("INSERT INTO accepted_answers(question_id,answer,normalized_answer) VALUES (?,?,?)",
                                 (question["id"], answer, normalize(answer)))
        foreign_keys = conn.execute("PRAGMA foreign_key_check").fetchall()
        integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
        tables = ("subjects", "aliases", "claims", "sources", "subject_sources", "claim_sources",
                  "questions", "accepted_answers", "answer_stats", "eligible_questions")
        counts = {table: conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in tables}
        print(json.dumps({"database": str(args.database.resolve()), "counts": counts,
                          "foreign_key_errors": foreign_keys, "integrity_check": integrity}, indent=2))
        if foreign_keys or integrity != "ok":
            raise SystemExit("Database verification failed")


if __name__ == "__main__":
    main()
