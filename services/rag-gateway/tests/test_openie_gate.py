"""Gate manual OpenIE (#20): promote → produção; reject → trilha sem produção."""
from __future__ import annotations

import pytest

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph import candidates as cand
from raggw.graph.store import GraphStore
from raggw.graph.lexicon import Entity, Lexicon, normalize

_EMB = FakeEmbedder(dim=8)


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex() -> Lexicon:
    return Lexicon(entities=[
        _ent("sepse", "Sepse", "disease", ["sepse"]),
        _ent("drug-nora", "Noradrenalina", "drug", ["noradrenalina"]),
    ], typed_edges=[])


def _add_chunk(conn, text, *, citation="src p.1", status="active"):
    doc = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status, specialty) "
        "VALUES (?,?,?,?)",
        (f"/{citation}.pdf", f"h-{hash((text, citation)) & 0xffff}", status, "uti"),
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
    return cid, doc


def test_promote_writes_typed_edge_and_marks_promoted(db_path):
    conn = db.open_db(db_path)
    GraphStore(conn, _lex())  # schema graph
    cid, _ = _add_chunk(conn, "nora sepse", citation="Knobel p. 210")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    out = cand.promote_candidate(conn, kid)
    assert out["status"] == "promoted"
    assert out["id"] == kid
    edge = conn.execute(
        "SELECT weight FROM graph_edges WHERE a=? AND b=? AND rel=?",
        ("drug-nora", "sepse", "trata"),
    ).fetchone()
    assert edge is not None
    assert float(edge[0]) >= 1.0
    assert cand.get_candidate(conn, kid)["status"] == "promoted"


def test_promote_without_active_citation_refuses(db_path):
    conn = db.open_db(db_path)
    GraphStore(conn, _lex())
    cid, doc = _add_chunk(conn, "x", citation="ok p.1")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    # remove citation after insert
    conn.execute("UPDATE document_chunks SET citation_label='' WHERE id=?", (cid,))
    conn.commit()
    with pytest.raises(cand.CandidateError):
        cand.promote_candidate(conn, kid)
    assert cand.get_candidate(conn, kid)["status"] == "pending"
    assert conn.execute(
        "SELECT COUNT(*) FROM graph_edges WHERE rel='trata'").fetchone()[0] == 0


def test_promote_inactive_chunk_refuses(db_path):
    conn = db.open_db(db_path)
    GraphStore(conn, _lex())
    cid, doc = _add_chunk(conn, "x", citation="ok p.1")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="dd", target="sepse", source_chunk_id=cid)
    conn.execute("UPDATE documents SET status='superseded' WHERE id=?", (doc,))
    conn.commit()
    with pytest.raises(cand.CandidateError):
        cand.promote_candidate(conn, kid)
    assert cand.get_candidate(conn, kid)["status"] == "pending"


def test_reject_no_production_edge(db_path):
    conn = db.open_db(db_path)
    GraphStore(conn, _lex())
    cid, _ = _add_chunk(conn, "y", citation="r p.1")
    kid = cand.insert_candidate(
        conn, source="sepse", predicate="tratado_por", target="drug-nora",
        source_chunk_id=cid)
    out = cand.reject_candidate(conn, kid, note="ruido")
    assert out["status"] == "rejected"
    assert out["note"] == "ruido"
    assert conn.execute("SELECT COUNT(*) FROM graph_edges").fetchone()[0] == 0
    assert cand.list_candidates(conn, status="rejected")[0]["id"] == kid


def test_cannot_promote_rejected_or_missing(db_path):
    conn = db.open_db(db_path)
    GraphStore(conn, _lex())
    cid, _ = _add_chunk(conn, "z", citation="c p.1")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="interage", target="sepse",
        source_chunk_id=cid)
    cand.reject_candidate(conn, kid)
    with pytest.raises(cand.CandidateError):
        cand.promote_candidate(conn, kid)
    with pytest.raises(cand.CandidateError):
        cand.promote_candidate(conn, 999999)


def test_cannot_reject_already_promoted(db_path):
    conn = db.open_db(db_path)
    GraphStore(conn, _lex())
    cid, _ = _add_chunk(conn, "w", citation="d p.1")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    cand.promote_candidate(conn, kid)
    with pytest.raises(cand.CandidateError):
        cand.reject_candidate(conn, kid)
