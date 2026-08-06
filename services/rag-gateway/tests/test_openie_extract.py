"""Extração OpenIE offline via Gemma local (#19) — fake LLM, sem GPU."""
from __future__ import annotations

import pytest

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph import candidates as cand
from raggw.graph.gemma_index import _assert_local_only, extract_relation_candidates
from raggw.graph.lexicon import Entity, Lexicon, normalize
from raggw.graph.openie_extract import extract_from_chunk, run_extract_batch

_EMB = FakeEmbedder(dim=8)


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex() -> Lexicon:
    return Lexicon(entities=[
        _ent("sepse", "Sepse", "disease", ["sepse", "choque septico"]),
        _ent("drug-nora", "Noradrenalina", "drug", ["noradrenalina"]),
        _ent("asma", "Asma", "disease", ["asma"]),
    ], typed_edges=[])


def _add_chunk(conn, text, *, citation="src p.1"):
    doc = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status, specialty) "
        "VALUES (?,?,?,?)",
        (f"/{citation}.pdf", f"h-{hash((text, citation)) & 0xffff}", "active", "uti"),
    ).lastrowid
    vec = encode_vector(_EMB.embed([text])[0])
    cid = conn.execute(
        "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
        "section_path,page_start,page_end,citation_label,embedding,specialty,evidence_level) "
        "VALUES (?,0,?,?,?,10,11,?,?,?,?)",
        (doc, text, text, "Sec", citation, vec, "uti", "guideline"),
    ).lastrowid
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    conn.commit()
    return cid


def test_cloud_url_blocked():
    with pytest.raises(RuntimeError):
        _assert_local_only("https://api.openai.com/v1")
    with pytest.raises(RuntimeError):
        _assert_local_only("https://api.anthropic.com/v1")
    _assert_local_only("http://127.0.0.1:8081/v1")  # ok


def test_extract_relation_candidates_uses_chat_fn():
    def fake_chat(messages, **kw):
        return '[{"source":"drug-nora","predicate":"trata","target":"sepse"}]'

    out = extract_relation_candidates(
        "noradrenalina no choque septico", "drug-nora", "sepse", chat_fn=fake_chat)
    assert len(out) == 1
    assert out[0]["predicate"] == "trata"


def test_extract_filters_open_predicate_from_llm():
    def fake_chat(messages, **kw):
        return '[{"source":"a","predicate":"cura_magica","target":"b"},' \
               '{"source":"drug-nora","predicate":"trata","target":"sepse"}]'

    out = extract_relation_candidates("t", "drug-nora", "sepse", chat_fn=fake_chat)
    assert all(c["predicate"] == "trata" for c in out)
    assert len(out) == 1


def test_chunk_without_co_mention_inserts_nothing(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    cid = _add_chunk(conn, "apenas asma sem parceiro tipado aqui", citation="solo p.1")
    # só uma entidade detectável (asma) → zero pares
    n = extract_from_chunk(
        conn, lex, cid, "apenas asma sem parceiro tipado aqui",
        extract_fn=lambda *a, **k: [{"source": "x", "predicate": "trata", "target": "y"}],
    )
    assert n == 0
    assert cand.list_candidates(conn) == []


def test_extract_from_chunk_writes_pending_only(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    text = "noradrenalina e sepse no choque septico"
    cid = _add_chunk(conn, text, citation="Knobel p. 210")

    def fake_extract(chunk_text, entity_a, entity_b, **kw):
        return [{"source": entity_a, "predicate": "trata", "target": entity_b}]

    n = extract_from_chunk(conn, lex, cid, text, extract_fn=fake_extract)
    assert n >= 1
    rows = cand.list_candidates(conn, status="pending")
    assert rows
    assert all(r["status"] == "pending" for r in rows)
    assert all(r["source_chunk_id"] == cid for r in rows)
    # sem produção
    assert conn.execute(
        "SELECT name FROM sqlite_master WHERE name='graph_edges'"
    ).fetchone() is None or conn.execute(
        "SELECT COUNT(*) FROM graph_edges").fetchone()[0] == 0


def test_run_extract_batch_limit_and_resume(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    t = "noradrenalina sepse"
    c1 = _add_chunk(conn, t + " um", citation="a p.1")
    c2 = _add_chunk(conn, t + " dois", citation="b p.2")
    c3 = _add_chunk(conn, t + " tres", citation="c p.3")

    def fake_extract(chunk_text, entity_a, entity_b, **kw):
        return [{"source": entity_a, "predicate": "trata", "target": entity_b}]

    r1 = run_extract_batch(
        conn, lex, limit=1, after_chunk_id=0, extract_fn=fake_extract)
    assert r1["chunks_seen"] == 1
    assert r1["candidates_inserted"] >= 1
    last = r1["last_chunk_id"]
    assert last == c1

    r2 = run_extract_batch(
        conn, lex, limit=10, after_chunk_id=last, extract_fn=fake_extract)
    assert r2["chunks_seen"] == 2
    assert r2["last_chunk_id"] == c3


def test_dedup_same_triple_chunk(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    text = "noradrenalina sepse"
    cid = _add_chunk(conn, text, citation="d p.1")

    def fake_extract(chunk_text, entity_a, entity_b, **kw):
        return [{"source": entity_a, "predicate": "trata", "target": entity_b}]

    n1 = extract_from_chunk(conn, lex, cid, text, extract_fn=fake_extract)
    n2 = extract_from_chunk(conn, lex, cid, text, extract_fn=fake_extract)
    assert n1 >= 1
    assert n2 == 0  # dedup
