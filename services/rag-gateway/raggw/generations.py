"""Index-generation registry: tracks each ingested SQLite generation through the
staged -> active -> superseded/rolled_back lifecycle. Metadata-only — the physical
DB file swap (mv + backup) stays in scripts/rebuild_real_corpus.sh; this module just
records which generation is the source of truth and makes promotion atomic.

Pure functions over a caller-supplied sqlite3.Connection, matching jobs.py/db.py style."""
from __future__ import annotations

import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS index_generations (
    id                   TEXT PRIMARY KEY,
    db_path              TEXT NOT NULL,
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    corpus_source_hash   TEXT,
    embedder_config_json TEXT,
    chunk_config_json    TEXT,
    status               TEXT NOT NULL DEFAULT 'staged',  -- staged|active|superseded|rolled_back
    promoted_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_generations_status ON index_generations(status);
"""


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Create-table-if-not-exists. Also defaults row_factory to sqlite3.Row so this
    module works standalone on a bare `sqlite3.connect(...)` (tests, one-off scripts),
    not only on connections that went through db.connect()."""
    if conn.row_factory is None:
        conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    conn.commit()


def register_generation(conn: sqlite3.Connection, generation_id: str, *,
                        db_path: str, corpus_source_hash: str | None = None,
                        embedder_config_json: str | None = None,
                        chunk_config_json: str | None = None) -> None:
    """Register a new generation with status='staged'. Idempotent: re-registering an
    existing id is a no-op (first registration wins; use promote/rollback to change
    status)."""
    ensure_schema(conn)
    conn.execute(
        "INSERT OR IGNORE INTO index_generations "
        "(id, db_path, corpus_source_hash, embedder_config_json, chunk_config_json, status) "
        "VALUES (?, ?, ?, ?, ?, 'staged')",
        (generation_id, str(db_path), corpus_source_hash,
         embedder_config_json, chunk_config_json))
    conn.commit()


def active_generation(conn: sqlite3.Connection) -> sqlite3.Row | None:
    """The current active generation, or None if nothing has been promoted yet."""
    ensure_schema(conn)
    return conn.execute(
        "SELECT * FROM index_generations WHERE status='active' "
        "ORDER BY promoted_at DESC LIMIT 1").fetchone()


def _get(conn: sqlite3.Connection, generation_id: str) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM index_generations WHERE id=?", (generation_id,)).fetchone()
    if row is None:
        raise ValueError(f"unknown generation: {generation_id!r}")
    return row


def promote(conn: sqlite3.Connection, generation_id: str) -> None:
    """Atomically make `generation_id` active, demoting whatever was active before to
    'superseded'. Both updates run in one transaction (commit only after both succeed);
    a failure between them leaves the previous active row untouched on rollback.
    Idempotent: promoting the already-active generation is a no-op."""
    ensure_schema(conn)
    target = _get(conn, generation_id)
    if target["status"] == "active":
        return
    try:
        conn.execute("UPDATE index_generations SET status='superseded' WHERE status='active'")
        conn.execute(
            "UPDATE index_generations SET status='active', promoted_at=datetime('now') "
            "WHERE id=?", (generation_id,))
        conn.commit()
    except BaseException:
        conn.rollback()
        raise


def rollback(conn: sqlite3.Connection, to_generation_id: str) -> None:
    """Atomically restore a prior generation as active, marking the current active
    generation (if any) as 'rolled_back'. Same atomicity guarantee as promote().
    Idempotent: rolling back to the already-active generation is a no-op."""
    ensure_schema(conn)
    target = _get(conn, to_generation_id)
    if target["status"] == "active":
        return
    try:
        conn.execute("UPDATE index_generations SET status='rolled_back' WHERE status='active'")
        conn.execute(
            "UPDATE index_generations SET status='active', promoted_at=datetime('now') "
            "WHERE id=?", (to_generation_id,))
        conn.commit()
    except BaseException:
        conn.rollback()
        raise
