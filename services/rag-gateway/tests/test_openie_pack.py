"""Pack só vê OpenIE após promoção manual (#21)."""
from __future__ import annotations

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph import candidates as cand
from raggw.graph.lexicon import Entity, Lexicon, normalize
from raggw.graph.store import GraphStore
from raggw.retrieval import Hit, build_evidence_pack, typed_triples_with_provenance

_EMB = FakeEmbedder(dim=8)


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex() -> Lexicon:
    return Lexicon(entities=[
        _ent("sepse", "Sepse", "disease", ["sepse"]),
        _ent("drug-nora", "Noradrenalina", "drug", ["noradrenalina"]),
    ], typed_edges=[])  # sem arestas no léxico — só OpenIE


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
    return cid, doc


def test_pending_openie_not_in_pack(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    GraphStore(conn, lex)
    cid, doc = _add_chunk(conn, "noradrenalina sepse", citation="p p.1")
    cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    triples = typed_triples_with_provenance(conn, "sepse noradrenalina", lex)
    assert triples == []
    pack = build_evidence_pack("q", [], graph_triples=triples)
    assert pack["graph_triples"] == []


def test_rejected_openie_not_in_pack(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    GraphStore(conn, lex)
    cid, _ = _add_chunk(conn, "noradrenalina sepse", citation="r p.1")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    cand.reject_candidate(conn, kid)
    assert typed_triples_with_provenance(conn, "sepse noradrenalina", lex) == []


def test_promoted_openie_appears_in_pack_with_citation(db_path):
    conn = db.open_db(db_path)
    lex = _lex()
    GraphStore(conn, lex)
    cid, doc = _add_chunk(conn, "noradrenalina no choque sepse", citation="Knobel p. 210")
    kid = cand.insert_candidate(
        conn, source="drug-nora", predicate="trata", target="sepse", source_chunk_id=cid)
    cand.promote_candidate(conn, kid)
    triples = typed_triples_with_provenance(conn, "sepse noradrenalina", lex)
    assert triples, "expected promoted triple in pack"
    assert all(t.get("citation_label") for t in triples)
    keys = {(t["source"], t["predicate"], t["target"]) for t in triples}
    assert ("drug-nora", "trata", "sepse") in keys
    hit = Hit(cid, doc, "noradrenalina no choque sepse", "Knobel p. 210",
              210, 210, None, "uti", "guideline", 1.0, 0.9, 0.9)
    pack = build_evidence_pack("sepse noradrenalina", [hit], conn=conn, graph_triples=triples)
    assert pack["graph_triples"]
    assert all(t.get("citation_label") for t in pack["graph_triples"])
