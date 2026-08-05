"""Startup graph policy (#321 + boot cost): create_app must GUARANTEE the graph exists
without paying an unconditional full rebuild on every boot — over a 2M+ chunk corpus the
rebuild takes hours and left the service unreachable during startup. Rebuild only when the
graph is empty (fresh DB) or when RAG_GRAPH_REBUILD_ON_START=1 forces it."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from raggw import db
from raggw.api import create_app


def _write_lexicon(path):
    path.write_text(json.dumps({
        "entities": [{"id": "sepse", "label": "Sepse", "kind": "disease",
                      "surfaces": ["sepse", "choque septico"]}],
        "typed_edges": [],
    }), encoding="utf-8")


def _seed_chunk(db_path, text="sepse com choque septico"):
    conn = db.open_db(db_path)
    try:
        doc = conn.execute(
            "INSERT INTO documents (source_path, content_hash, status) VALUES (?,?,?)",
            ("/m.pdf", "h1", "active")).lastrowid
        conn.execute(
            "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
            "citation_label) VALUES (?,0,?,?,?)", (doc, text, text, "m p.1"))
        conn.commit()
    finally:
        conn.close()


def _app(tmp_path, monkeypatch, db_path):
    lex = tmp_path / "lex.json"
    _write_lexicon(lex)
    monkeypatch.setenv("RAG_GRAPH_LEXICON", str(lex))
    return create_app(db_path=db_path, start_worker=False)


def _graph_rows(db_path):
    conn = db.open_db(db_path)
    try:
        return conn.execute("SELECT COUNT(*) FROM graph_chunk_entities").fetchone()[0]
    finally:
        conn.close()


def test_empty_graph_is_built_on_startup(tmp_path, monkeypatch):
    db_path = str(tmp_path / "rag.db")
    _seed_chunk(db_path)
    with TestClient(_app(tmp_path, monkeypatch, db_path)):
        pass
    assert _graph_rows(db_path) > 0  # fresh DB -> built


def test_populated_graph_is_not_rebuilt_on_startup(tmp_path, monkeypatch):
    """The expensive path: a corpus whose graph is already populated must NOT be rebuilt.
    We seed a graph row that does NOT correspond to any real chunk-entity; if startup
    rebuilt from chunks it would be wiped. It must survive."""
    db_path = str(tmp_path / "rag.db")
    _seed_chunk(db_path)
    conn = db.open_db(db_path)
    conn.executescript(
        "CREATE TABLE IF NOT EXISTS graph_chunk_entities "
        "(chunk_id INTEGER, entity_id TEXT, PRIMARY KEY(chunk_id, entity_id));")
    conn.execute("INSERT INTO graph_chunk_entities (chunk_id, entity_id) VALUES (999999, 'sentinel')")
    conn.commit()
    conn.close()

    with TestClient(_app(tmp_path, monkeypatch, db_path)):
        pass

    conn = db.open_db(db_path)
    try:
        survived = conn.execute(
            "SELECT EXISTS(SELECT 1 FROM graph_chunk_entities WHERE entity_id='sentinel')"
        ).fetchone()[0]
    finally:
        conn.close()
    assert survived == 1  # not rebuilt


def test_force_rebuild_flag_wipes_and_rebuilds(tmp_path, monkeypatch):
    db_path = str(tmp_path / "rag.db")
    _seed_chunk(db_path)
    conn = db.open_db(db_path)
    conn.executescript(
        "CREATE TABLE IF NOT EXISTS graph_chunk_entities "
        "(chunk_id INTEGER, entity_id TEXT, PRIMARY KEY(chunk_id, entity_id));")
    conn.execute("INSERT INTO graph_chunk_entities (chunk_id, entity_id) VALUES (999999, 'sentinel')")
    conn.commit()
    conn.close()

    monkeypatch.setenv("RAG_GRAPH_REBUILD_ON_START", "1")
    with TestClient(_app(tmp_path, monkeypatch, db_path)):
        pass

    conn = db.open_db(db_path)
    try:
        sentinel = conn.execute(
            "SELECT EXISTS(SELECT 1 FROM graph_chunk_entities WHERE entity_id='sentinel')"
        ).fetchone()[0]
    finally:
        conn.close()
    assert sentinel == 0  # forced rebuild wiped the stale sentinel
