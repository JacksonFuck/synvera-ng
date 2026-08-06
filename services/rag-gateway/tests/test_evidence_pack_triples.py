"""Seam evidence-pack: triplas tipadas com provenance (ticket #7).

Contrato externo: graph_triples só com citation; omite sem fonte; schema fechado.
"""
from __future__ import annotations

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph.lexicon import Entity, Lexicon, normalize
from raggw.graph.store import GraphStore
from raggw.retrieval import build_evidence_pack, typed_triples_with_provenance

_EMB = FakeEmbedder(dim=8)
_ALLOWED = frozenset({"trata", "tratado_por", "dd", "interage", "contraindicado"})


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex_sepse_nora() -> Lexicon:
    return Lexicon(
        entities=[
            _ent("sepse", "Sepse", "disease", ["sepse", "choque septico"]),
            _ent("drug-noradrenalina", "Noradrenalina", "drug",
                 ["noradrenalina", "norepinefrina"]),
            _ent("asma", "Asma", "disease", ["asma"]),
            _ent("drug-salbutamol", "Salbutamol", "drug", ["salbutamol"]),
        ],
        typed_edges=[
            ("drug-noradrenalina", "trata", "sepse"),
            ("sepse", "tratado_por", "drug-noradrenalina"),
            # aresta tipada SEM chunk que co-mencione as duas entidades
            ("drug-salbutamol", "trata", "asma"),
            ("asma", "tratado_por", "drug-salbutamol"),
        ],
    )


def _add_chunk(conn, text, *, citation="src p.1", specialty="uti"):
    doc = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status, specialty) "
        "VALUES (?,?,?,?)",
        (f"/{citation}.pdf", f"h-{hash(text) & 0xffff}", "active", specialty),
    ).lastrowid
    vec = encode_vector(_EMB.embed([text])[0])
    cid = conn.execute(
        "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
        "section_path,page_start,page_end,citation_label,embedding,specialty,evidence_level) "
        "VALUES (?,0,?,?,?,10,11,?,?,?,?)",
        (doc, text, text, "Sec", citation, vec, specialty, "guideline"),
    ).lastrowid
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    conn.commit()
    return cid, doc


def test_typed_triple_with_shared_chunk_has_provenance(db_path):
    conn = db.open_db(db_path)
    lex = _lex_sepse_nora()
    cid, _ = _add_chunk(
        conn,
        "No choque septico a noradrenalina e o vasopressor de escolha",
        citation="Knobel sepse p. 210",
    )
    GraphStore(conn, lex).build_from_chunks()

    triples = typed_triples_with_provenance(conn, "vasopressor sepse noradrenalina", lex)
    assert triples, "expected at least one triple with provenance"
    for t in triples:
        assert t["predicate"] in _ALLOWED
        assert t.get("citation_label")
        assert t.get("chunk_id")
        assert t["source"] and t["target"]
    # a tripla trata deve estar presente
    preds = {(t["source"], t["predicate"], t["target"]) for t in triples}
    assert ("drug-noradrenalina", "trata", "sepse") in preds
    assert any(t["chunk_id"] == cid for t in triples)


def test_typed_triple_without_source_chunk_is_omitted(db_path):
    """Aresta tipada asma—salbutamol existe no léxico, mas nenhum chunk as menciona juntas."""
    conn = db.open_db(db_path)
    lex = _lex_sepse_nora()
    # chunk só de sepse+nora — não ancora asma/salbutamol
    _add_chunk(conn, "sepse e noradrenalina no choque", citation="only-sepse")
    GraphStore(conn, lex).build_from_chunks()

    triples = typed_triples_with_provenance(conn, "asma salbutamol", lex)
    # sem co-menção no corpus → lista vazia (invariante)
    assert triples == []


def test_evidence_pack_exposes_graph_triples(db_path):
    conn = db.open_db(db_path)
    lex = _lex_sepse_nora()
    cid, doc = _add_chunk(
        conn, "noradrenalina no choque septico grave", citation="AMIB p. 100")
    GraphStore(conn, lex).build_from_chunks()
    triples = typed_triples_with_provenance(conn, "sepse noradrenalina", lex)
    from raggw.retrieval import Hit
    hit = Hit(chunk_id=cid, document_id=doc, chunk_text="noradrenalina no choque septico grave",
              citation_label="AMIB p. 100", page_start=100, page_end=100,
              section_path="S", specialty="uti", evidence_level="guideline",
              fused_score=1.0, rerank_score=0.9, final_score=0.9)
    pack = build_evidence_pack("sepse noradrenalina", [hit], conn=conn,
                               graph_triples=triples)
    assert "graph_triples" in pack
    assert pack["graph_triples"]
    assert all(t.get("citation_label") for t in pack["graph_triples"])
    assert pack["chunks"]  # hybrid chunks intact


def test_evidence_pack_default_empty_triples_without_arg():
    from raggw.retrieval import Hit
    hit = Hit(1, 1, "x", "c", 1, 1, None, None, None, 0.0, 0.9, 0.9)
    pack = build_evidence_pack("q", [hit])
    assert pack.get("graph_triples") == []


def test_open_predicate_never_emitted(db_path):
    conn = db.open_db(db_path)
    lex = Lexicon(
        entities=[
            _ent("a", "A", "disease", ["alfa-doenca"]),
            _ent("b", "B", "drug", ["beta-farmaco"]),
        ],
        typed_edges=[("b", "cura_magica", "a")],  # fora do schema
    )
    _add_chunk(conn, "alfa-doenca tratada com beta-farmaco", citation="x")
    GraphStore(conn, lex).build_from_chunks()
    triples = typed_triples_with_provenance(conn, "alfa-doenca beta-farmaco", lex)
    assert triples == []
