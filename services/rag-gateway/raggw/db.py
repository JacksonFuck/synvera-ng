"""SQLite schema + connection. Pure stdlib (works on any Python). FTS5 for lexical search."""
from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id               INTEGER PRIMARY KEY,
    corpus_id        TEXT,
    source_path      TEXT NOT NULL,
    source_type      TEXT,                 -- guideline|rct|review|book|skill|...
    title            TEXT,
    specialty        TEXT,
    evidence_level   TEXT,                 -- curated by admin (Q-grills)
    publication_year INTEGER,
    language         TEXT,
    license          TEXT,
    status           TEXT NOT NULL DEFAULT 'active',  -- active|superseded
    superseded_by    INTEGER REFERENCES documents(id),
    version          INTEGER NOT NULL DEFAULT 1,
    content_hash     TEXT UNIQUE,          -- dedup
    parser           TEXT,
    parser_version   TEXT,
    markdown_path    TEXT,
    page_count       INTEGER,
    ingestion_status TEXT NOT NULL DEFAULT 'pending',
    quarantine_reason TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id              INTEGER PRIMARY KEY,
    document_id     INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    chunk_text      TEXT NOT NULL,
    contextual_text TEXT,                  -- chunk + contextual header for embedding
    section_path    TEXT,                  -- e.g. "Sepse > Tratamento > Antibioticoterapia"
    page_start      INTEGER,
    page_end        INTEGER,
    token_count     INTEGER,
    chunk_type      TEXT DEFAULT 'text',   -- text|table|figure_caption
    citation_label  TEXT,                  -- human-readable source ref
    embedding       BLOB,                  -- float32 vector (BgeM3, 1024-dim)
    embedding_medcpt BLOB,                 -- MedCPT 768-dim (Simvera 2.0)
    embedding_contriever BLOB,             -- Contriever 768-dim (Simvera 2.0)
    specialty       TEXT,
    evidence_level  TEXT,
    source_date     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id          INTEGER PRIMARY KEY,
    file_ref    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'queued',  -- queued|processing|done|failed
    progress    REAL NOT NULL DEFAULT 0.0,
    error       TEXT,
    metadata    TEXT,                            -- JSON: curadoria (specialty, evidence_level, ...)
    document_id INTEGER REFERENCES documents(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Skill-as-RAG (Q2): um pacote .zip → references viram chunks (documents source_type='skill')
-- + SKILL.md vira persona de um agente. Liga skill ↔ documento ↔ agente, auditável.
CREATE TABLE IF NOT EXISTS skill_packages (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    specialty   TEXT,
    agent_key   TEXT,
    document_id INTEGER REFERENCES documents(id),
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_docs_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status);

-- Lexical index (BM25 via FTS5). rowid mirrors document_chunks.id.
CREATE VIRTUAL TABLE IF NOT EXISTS chunk_fts USING fts5(chunk_text);
"""


def connect(path: str | Path) -> sqlite3.Connection:
    p = Path(path)
    if p.parent and not p.parent.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")     # concurrent worker writes + handler reads
    conn.execute("PRAGMA busy_timeout = 5000")    # wait, don't error, on lock
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    _migrate_documents(conn)
    conn.commit()


def _has_column(conn: sqlite3.Connection, table: str, column: str) -> bool:
    return any(row["name"] == column for row in conn.execute(f"PRAGMA table_info({table})"))


def _migrate_documents(conn: sqlite3.Connection) -> None:
    for name, ddl in {
        "parser": "TEXT",
        "parser_version": "TEXT",
        "markdown_path": "TEXT",
        "page_count": "INTEGER",
        "quarantine_reason": "TEXT",
    }.items():
        if not _has_column(conn, "documents", name):
            conn.execute(f"ALTER TABLE documents ADD COLUMN {name} {ddl}")


def open_db(path: str | Path) -> sqlite3.Connection:
    conn = connect(path)
    init_db(conn)
    return conn
