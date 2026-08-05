"""Schema: documents, document_chunks, ingestion_jobs (+FTS5, content_hash dedup)."""
from __future__ import annotations

import sqlite3

import pytest

from raggw import db


def _columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {r["name"] for r in conn.execute(f"PRAGMA table_info({table})")}


def test_init_creates_core_tables(db_path):
    conn = db.open_db(db_path)
    tables = {r["name"] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'")}
    assert {"documents", "document_chunks", "ingestion_jobs"} <= tables


def test_skill_packages_table_exists(db_path):
    conn = db.open_db(db_path)
    cols = _columns(conn, "skill_packages")
    assert {"id", "name", "specialty", "agent_key", "document_id", "status", "created_at"} <= cols


def test_documents_has_curation_and_provenance_columns(db_path):
    conn = db.open_db(db_path)
    cols = _columns(conn, "documents")
    assert {
        "content_hash", "source_type", "specialty", "evidence_level",
        "publication_year", "status", "superseded_by", "language",
        "parser", "parser_version", "markdown_path", "page_count",
    } <= cols


def test_chunks_carry_citation_fields(db_path):
    conn = db.open_db(db_path)
    cols = _columns(conn, "document_chunks")
    assert {
        "document_id", "chunk_index", "chunk_text", "section_path",
        "page_start", "page_end", "token_count", "citation_label", "embedding",
    } <= cols


def test_content_hash_is_unique(db_path):
    conn = db.open_db(db_path)
    conn.execute("INSERT INTO documents (source_path, content_hash) VALUES (?, ?)",
                 ("/a.pdf", "deadbeef"))
    conn.commit()
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("INSERT INTO documents (source_path, content_hash) VALUES (?, ?)",
                     ("/b.pdf", "deadbeef"))
        conn.commit()


def test_fts_index_exists_and_searchable(db_path):
    conn = db.open_db(db_path)
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (1, 'sepse pediátrica grave')")
    conn.commit()
    hits = conn.execute(
        "SELECT rowid FROM chunk_fts WHERE chunk_fts MATCH 'sepse'").fetchall()
    assert [h["rowid"] for h in hits] == [1]
