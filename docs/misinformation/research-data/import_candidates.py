"""Import separate, unreviewed CC0 discovery candidates into the research SQLite DB."""
import argparse
import json
import sqlite3
from pathlib import Path


def main():
    base = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=base / "starter-catalog.sqlite3")
    parser.add_argument("--candidates", type=Path, default=base / "candidates")
    args = parser.parse_args()
    manifest = json.loads((args.candidates / "manifest.json").read_text(encoding="utf-8"))
    with sqlite3.connect(args.database) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript((base / "schema.sql").read_text(encoding="utf-8"))
        with conn:
            for export in manifest["exports"]:
                if export["status"] != "success":
                    continue
                name = export["dataset"]
                rows = json.loads((args.candidates / (name + ".candidates.json")).read_text(encoding="utf-8"))
                if len(rows) != export["count"] or len({r["wikidata_id"] for r in rows}) != len(rows):
                    raise ValueError("Count mismatch or duplicate IDs in " + name)
                query = export.get("search") or (args.candidates / export["query_file"]).read_text(encoding="utf-8")
                conn.execute("""INSERT INTO discovery_exports VALUES (?,?,?,?,?,?,?,?)
                    ON CONFLICT(id) DO UPDATE SET class_id=excluded.class_id,
                    retrieval_method=excluded.retrieval_method, source_query=excluded.source_query,
                    retrieved_at=excluded.retrieved_at, license=excluded.license,
                    license_url=excluded.license_url, provenance_json=excluded.provenance_json""", (
                    name, export["class_id"], export.get("method", "Wikidata SPARQL"), query,
                    export["retrieved_at_utc"], export["license"], export["license_url"], json.dumps(export)))
                conn.execute("DELETE FROM discovery_candidate_exports WHERE export_id=?", (name,))
                for row in rows:
                    if row["scored_eligible"] or row["review_state"] != "unreviewed_discovery_only":
                        raise ValueError("Unexpected candidate approval state")
                    conn.execute("""INSERT INTO discovery_candidates(wikidata_id,label,wikidata_url)
                        VALUES (?,?,?) ON CONFLICT(wikidata_id) DO UPDATE
                        SET label=excluded.label, wikidata_url=excluded.wikidata_url""",
                                 (row["wikidata_id"], row["label"], row["wikidata_url"]))
                    conn.execute("INSERT INTO discovery_candidate_exports VALUES (?,?)", (row["wikidata_id"], name))
            conn.execute("DELETE FROM discovery_candidates WHERE wikidata_id NOT IN (SELECT wikidata_id FROM discovery_candidate_exports)")
        counts = dict(conn.execute("SELECT export_id,COUNT(*) FROM discovery_candidate_exports GROUP BY export_id"))
        unique = conn.execute("SELECT COUNT(*) FROM discovery_candidates").fetchone()[0]
        scored = conn.execute("SELECT COUNT(*) FROM eligible_questions").fetchone()[0]
        fk_errors = conn.execute("PRAGMA foreign_key_check").fetchall()
        integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
        print(json.dumps({"candidate_rows_by_export": counts, "candidate_membership_rows": sum(counts.values()),
                          "unique_candidate_entities": unique, "eligible_scored_questions": scored,
                          "foreign_key_errors": fk_errors, "integrity_check": integrity}, indent=2))
        if fk_errors or integrity != "ok":
            raise SystemExit("Database verification failed")


if __name__ == "__main__":
    main()
