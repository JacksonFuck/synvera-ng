"""Seam store de candidatos OpenIE (#18).

Contrato: só predicado fechado + chunk fonte; pending não altera produção.
"""
from __future__ import annotations

import pytest

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph import candidates as cand
from raggw.graph.lexicon import Entity, Lexicon, normalize
from raggw.graph.store import GraphStore
from raggw.retrieval import build_evidence_pack, typed_triples_with_provenance

_EMB = FakeEmbedder(dim=8)
_ALLOWED = frozenset({"trata", "tratado_por", "dd", "interage", "contraindicado"})


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex() -> Lexicon:
    return Lexicon(
        entities=[
            _ent("sepse", "Sepse", "disease", ["sepse"]),
            _ent("drug-nora", "Noradrenalina", "drug", ["noradrenalina"]),
        ],
        typed_edges=[],  # produção tipada vazia — só candidatos pending
    )


def _add_chunk(conn, text, *, citation="src p.1"):
    doc = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status, specialty) "
        "VALUES (?,?,?,?)",
        (f"/{citation}.pdf", f"h-{hash(text) & 0xffff}", "active", "uti"),
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


def test_insert_pending_with_valid_chunk(db_path):
    conn = db.open_db(db_path)
    cid = _add_chunk(conn, "noradrenalina no choque septico", citation="Knobel p. 210")
    row_id = cand.insert_candidate(
        conn,
        source="drug-nora",
        predicate="trata",
        target="sepse",
        source_chunk_id=cid,
    )
    assert row_id > 0
    got = cand.get_candidate(conn, row_id)
    assert got is not None
    assert got["status"] == "pending"
    assert got["predicate"] == "trata"
    assert got["source_chunk_id"] == cid
    assert got["citation_label"] == "Knobel p. 210"


def test_reject_missing_chunk(db_path):
    conn = db.open_db(db_path)
    with pytest.raises(cand.CandidateError) as ei:
        cand.insert_candidate(
            conn, source="a", predicate="trata", target="b", source_chunk_id=999999)
    assert "chunk" in str(ei.value).lower() or "fonte" in str(ei.value).lower()


def test_reject_open_predicate(db_path):
    conn = db.open_db(db_path)
    cid = _add_chunk(conn, "texto clinico", citation="x p.1")
    with pytest.raises(cand.CandidateError):
        cand.insert_candidate(
            conn, source="a", predicate="cura_magica", target="b", source_chunk_id=cid)


def test_reject_empty_or_same_endpoints(db_path):
    conn = db.open_db(db_path)
    cid = _add_chunk(conn, "texto", citation="y p.1")
    with pytest.raises(cand.CandidateError):
        cand.insert_candidate(
            conn, source="", predicate="trata", target="b", source_chunk_id=cid)
    with pytest.raises(cand.CandidateError):
        cand.insert_candidate(
            conn, source="a", predicate="trata", target="a", source_chunk_id=cid)


def test_list_by_status_pending(db_path):
    conn = db.open_db(db_path)
    c1 = _add_chunk(conn, "chunk um sepse nora", citation="a p.1")
    c2 = _add_chunk(conn, "chunk dois", citation="b p.2")
    id1 = cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=c1)
    id2 = cand.insert_candidate(
        conn, source="sepse", predicate="tratado_por", target="drug-nora", source_chunk_id=c2)
    # marcar um rejected via update de teste (API de promote/reject é #20)
    conn.execute("UPDATE openie_candidates SET status='rejected' WHERE id=?", (id2,))
    conn.commit()
    pending = cand.list_candidates(conn, status="pending")
    assert len(pending) == 1
    assert pending[0]["id"] == id1
    all_rows = cand.list_candidates(conn)
    assert {r["id"] for r in all_rows} >= {id1, id2}


def test_pending_does_not_change_production_graph_or_pack(db_path):
    """Só candidatos pending: typed edges / pack sem triplas inventadas."""
    conn = db.open_db(db_path)
    lex = _lex()
    cid = _add_chunk(conn, "noradrenalina e sepse no choque", citation="z p.1")
    GraphStore(conn, lex).build_from_chunks()
    n_edges_before = conn.execute("SELECT COUNT(*) FROM graph_edges").fetchone()[0]
    cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    n_edges_after = conn.execute("SELECT COUNT(*) FROM graph_edges").fetchone()[0]
    assert n_edges_after == n_edges_before
    # lexicon sem typed_edges → pack sem graph_triples tipadas de produção
    triples = typed_triples_with_provenance(conn, "sepse noradrenalina", lex)
    assert triples == []
    pack = build_evidence_pack("sepse", [], graph_triples=triples)
    assert pack.get("graph_triples") == []


def test_closed_predicates_match_schema():
    assert cand.TYPED_PREDICATES == _ALLOWED
