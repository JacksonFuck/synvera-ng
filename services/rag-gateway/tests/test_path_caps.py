"""Caps de paths/triplas no evidence-pack (#10).

Pack nunca excede N; k-hop tipado ≤ 2; truncamento determinístico.
"""
from __future__ import annotations

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph.lexicon import Entity, Lexicon, normalize
from raggw.graph.store import GraphStore
from raggw.retrieval import (
    MAX_GRAPH_HOPS,
    build_evidence_pack,
    candidate_typed_edges,
    typed_triples_with_provenance,
)

_EMB = FakeEmbedder(dim=8)


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex_chain() -> Lexicon:
    """Cadeia A—trata→B—dd→C—trata→D para exercitar 2-hop e cap."""
    ents = [
        _ent("doenca-a", "DoencaA", "disease", ["doenca-a", "alfa clinico"]),
        _ent("drug-b", "DrugB", "drug", ["drug-b", "farmaco b"]),
        _ent("doenca-c", "DoencaC", "disease", ["doenca-c", "gama sindrome"]),
        _ent("drug-d", "DrugD", "drug", ["drug-d", "farmaco d"]),
        _ent("doenca-e", "DoencaE", "disease", ["doenca-e"]),
        _ent("drug-f", "DrugF", "drug", ["drug-f"]),
    ]
    edges = [
        ("drug-b", "trata", "doenca-a"),
        ("doenca-a", "tratado_por", "drug-b"),
        ("doenca-a", "dd", "doenca-c"),
        ("doenca-c", "dd", "doenca-a"),
        ("drug-d", "trata", "doenca-c"),
        ("doenca-c", "tratado_por", "drug-d"),
        ("drug-f", "trata", "doenca-e"),
        ("doenca-e", "tratado_por", "drug-f"),
        ("doenca-c", "dd", "doenca-e"),
        ("doenca-e", "dd", "doenca-c"),
    ]
    return Lexicon(entities=ents, typed_edges=edges)


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


def test_candidate_edges_hard_cap_max_hops_two():
    lex = _lex_chain()
    seeds = {"doenca-a"}
    # mesmo pedindo 99 hops, hard cap = 2
    e1 = candidate_typed_edges(lex, seeds, max_hops=1)
    e2 = candidate_typed_edges(lex, seeds, max_hops=2)
    e99 = candidate_typed_edges(lex, seeds, max_hops=99)
    assert MAX_GRAPH_HOPS == 2
    assert len(e2) >= len(e1)
    assert set(e99) == set(e2)
    # 1-hop: edges touching doenca-a
    nodes1 = {x for a, _, b in e1 for x in (a, b)}
    assert "doenca-a" in nodes1
    assert "drug-b" in nodes1 or "doenca-c" in nodes1
    # 2-hop alcança vizinhos de doenca-c (ex. drug-d)
    nodes2 = {x for a, _, b in e2 for x in (a, b)}
    assert "drug-d" in nodes2 or "doenca-c" in nodes2


def test_candidate_edges_deterministic_order():
    lex = _lex_chain()
    seeds = {"doenca-a"}
    a = candidate_typed_edges(lex, seeds, max_hops=2)
    b = candidate_typed_edges(lex, seeds, max_hops=2)
    assert a == b


def test_pack_never_exceeds_max_triples(db_path):
    conn = db.open_db(db_path)
    lex = _lex_chain()
    # um chunk co-menciona várias entidades da cadeia → várias triplas candidatas
    _add_chunk(
        conn,
        "alfa clinico com farmaco b e gama sindrome e farmaco d e doenca-e drug-f",
        citation="multi p.1",
    )
    GraphStore(conn, lex).build_from_chunks()
    for n in (1, 2, 3, 5):
        triples = typed_triples_with_provenance(
            conn, "alfa clinico farmaco b", lex, max_triples=n, max_hops=2)
        assert len(triples) <= n, f"exceeded cap {n}: {len(triples)}"
        assert all(t.get("citation_label") for t in triples)


def test_truncation_deterministic(db_path):
    conn = db.open_db(db_path)
    lex = _lex_chain()
    _add_chunk(conn, "alfa clinico farmaco b gama sindrome farmaco d", citation="det p.1")
    GraphStore(conn, lex).build_from_chunks()
    t1 = typed_triples_with_provenance(
        conn, "alfa clinico", lex, max_triples=3, max_hops=2)
    t2 = typed_triples_with_provenance(
        conn, "alfa clinico", lex, max_triples=3, max_hops=2)
    keys1 = [(t["source"], t["predicate"], t["target"]) for t in t1]
    keys2 = [(t["source"], t["predicate"], t["target"]) for t in t2]
    assert keys1 == keys2


def test_build_evidence_pack_respects_passed_cap(db_path):
    """Defesa em profundidade: pack filtra e não inchá além do que o caller passou."""
    conn = db.open_db(db_path)
    lex = _lex_chain()
    _add_chunk(conn, "alfa clinico farmaco b gama sindrome farmaco d", citation="cap p.1")
    GraphStore(conn, lex).build_from_chunks()
    triples = typed_triples_with_provenance(
        conn, "alfa clinico", lex, max_triples=2, max_hops=2)
    assert len(triples) <= 2
    from raggw.retrieval import Hit
    hit = Hit(1, 1, "x", "c", 1, 1, None, None, None, 0.0, 0.9, 0.9)
    pack = build_evidence_pack("q", [hit], graph_triples=triples)
    assert len(pack["graph_triples"]) <= 2
