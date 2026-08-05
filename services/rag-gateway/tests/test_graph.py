"""GraphStore: léxico determinístico, build de co-ocorrência, expansão e wiring no RRF.

Léxico de fixture (não o gerado) para testes determinísticos. Prova: (1) detecção
tolerante a acento, (2) co-ocorrência + mapa chunk↔entidade, (3) expand traz chunks
ligados + vizinhos, (4) hybrid_search com graph=None é idêntico (regressão zero),
(5) o grafo faz emergir um chunk por sinônimo que o léxico/denso sozinhos perderiam.
"""
from __future__ import annotations

import os

import pytest

from raggw import db
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.graph.lexicon import Entity, Lexicon, load_lexicon, normalize
from raggw.graph.store import GraphStore, load_graph_lexicon, make_graph_store
from raggw.reranking import FakeReranker
from raggw.retrieval import hybrid_search, lexical_search

_EMB = FakeEmbedder(dim=8)


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex() -> Lexicon:
    return Lexicon(entities=[
        _ent("feocromocitoma", "Feocromocitoma", "disease",
             ["feocromocitoma", "pheochromocytoma", "paraganglioma", "metanefrinas"]),
        _ent("sepse", "Sepse", "disease", ["sepse", "choque septico", "sofa"]),
        _ent("drug-noradrenalina", "Noradrenalina", "drug", ["noradrenalina", "norepinefrina"]),
    ], typed_edges=[("drug-noradrenalina", "trata", "sepse")])


def _add_chunk(conn, text, spec="uti"):
    doc = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status, specialty) VALUES (?,?,?,?)",
        (f"/{text[:10]}.pdf", f"h-{text[:16]}", "active", spec)).lastrowid
    vec = encode_vector(_EMB.embed([text])[0])
    cid = conn.execute(
        "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
        "section_path,page_start,page_end,citation_label,embedding,specialty) "
        "VALUES (?,0,?,?,?,1,1,?,?,?)",
        (doc, text, text, "Secao", f"doc{doc} p.1", vec, spec)).lastrowid
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    conn.commit()
    return cid


# ── léxico ────────────────────────────────────────────────────────────────────
def test_detect_is_accent_insensitive():
    lex = _lex()
    assert "feocromocitoma" in lex.detect("suspeita de FEOCROMOCITOMA com crise")
    # sinônimo EN também casa
    assert "feocromocitoma" in lex.detect("pheochromocytoma workup")
    assert lex.detect("dor de garganta banal") == set()


# ── build ───────────────────────────────────────────────────────────────────────
def test_build_graph_index_populates_from_active_chunks(db_path):
    # #320: the graph build runs as part of the corpus build (not flag-gated) and only ever
    # names chunk IDs — never emits text, never calls an LLM.
    from raggw.graph.store import build_graph_index
    conn = db.open_db(db_path)
    c1 = _add_chunk(conn, "sepse com choque septico e sofa elevado")
    c2 = _add_chunk(conn, "noradrenalina indicada na sepse refrataria")
    conn.commit()

    stats = build_graph_index(conn, lexicon=_lex())
    assert stats["chunks_indexed"] >= 1
    assert conn.execute("SELECT COUNT(*) c FROM graph_chunk_entities").fetchone()["c"] >= 1

    hits = GraphStore(conn, _lex()).expand("sepse", 10)
    assert all(isinstance(h, int) for h in hits)  # chunk IDs only, never text
    assert c1 in hits or c2 in hits


def test_build_graph_index_no_lexicon_is_noop(tmp_path, db_path):
    from raggw.graph.store import build_graph_index
    conn = db.open_db(db_path)
    stats = build_graph_index(conn, lexicon_path=tmp_path / "missing.json")
    assert stats == {"skipped": "no_lexicon"}


def test_expand_respects_specialty_filter(db_path):
    # #321: as an OBLIGATORY signal the graph must not pierce an agent's corpus boundary —
    # it may only name chunks of the requested specialty or general (NULL/'') ones.
    conn = db.open_db(db_path)
    c_uti = _add_chunk(conn, "sepse com choque septico", spec="uti")
    c_ped = _add_chunk(conn, "sepse neonatal com sofa", spec="pediatria")
    conn.commit()
    store = GraphStore(conn, _lex())
    store.build_from_chunks()

    both = store.expand("sepse", 10)
    assert c_uti in both and c_ped in both  # no filter → both
    ped = store.expand("sepse", 10, specialties=["pediatria"])
    assert c_ped in ped and c_uti not in ped  # boundary held: uti not nominated


def test_build_cooccurrence_and_chunk_map(db_path):
    conn = db.open_db(db_path)
    c1 = _add_chunk(conn, "sepse com choque septico tratado com noradrenalina")
    _add_chunk(conn, "fratura de tornozelo sem relacao")
    g = GraphStore(conn, _lex())
    stats = g.build_from_chunks()

    assert stats["chunks_indexed"] == 1  # só o chunk com entidades
    # chunk↔entidade
    ents = {r["entity_id"] for r in conn.execute(
        "SELECT entity_id FROM graph_chunk_entities WHERE chunk_id=?", (c1,))}
    assert ents == {"sepse", "drug-noradrenalina"}
    # aresta de co-ocorrência sepse↔noradrenalina existe
    edge = conn.execute(
        "SELECT weight FROM graph_edges WHERE rel='cooc' AND "
        "((a='sepse' AND b='drug-noradrenalina') OR (a='drug-noradrenalina' AND b='sepse'))"
    ).fetchone()
    assert edge is not None and edge["weight"] >= 1
    # aresta típica curada
    typed = conn.execute("SELECT weight FROM graph_edges WHERE rel='trata'").fetchone()
    assert typed is not None


# ── expand ──────────────────────────────────────────────────────────────────────
def test_expand_returns_linked_and_neighbor_chunks(db_path):
    conn = db.open_db(db_path)
    c_sepse = _add_chunk(conn, "manejo da sepse grave na emergencia")
    c_nora = _add_chunk(conn, "noradrenalina em bomba de infusao continua")
    _add_chunk(conn, "colelitiase assintomatica conduta")
    g = GraphStore(conn, _lex())
    g.build_from_chunks()

    # query cita 'sepse' → traz o chunk de sepse e, via aresta typed 'trata', o de noradrenalina
    ids = g.expand("qual a conduta na sepse", top_n=10)
    assert c_sepse in ids
    assert c_nora in ids  # vizinho 1-hop (noradrenalina trata sepse)

    # query sem entidade do léxico → vazio (no-op)
    assert g.expand("dor de dente", top_n=10) == []


# ── wiring / regressão ───────────────────────────────────────────────────────────
def test_hybrid_search_graph_none_is_regression_free(db_path):
    conn = db.open_db(db_path)
    _add_chunk(conn, "sepse grave antibiotico precoce")
    args = dict(embedder=_EMB, reranker=FakeReranker(), top_k=5, candidate_n=20)
    base = hybrid_search(conn, "sepse", **args)
    with_none = hybrid_search(conn, "sepse", graph=None, **args)
    assert [h.chunk_id for h in base] == [h.chunk_id for h in with_none]


def test_graph_surfaces_synonym_chunk_missed_by_lexical(db_path):
    conn = db.open_db(db_path)
    # chunk fala só de 'paraganglioma'/'metanefrinas' (sinônimos); a query usa 'feocromocitoma'.
    c_syn = _add_chunk(conn, "paraganglioma com metanefrinas elevadas e alfa bloqueio")
    g = GraphStore(conn, _lex())
    g.build_from_chunks()

    # Busca léxica (FTS/BM25) por 'feocromocitoma' NÃO casa o chunk (palavra ausente).
    assert c_syn not in lexical_search(conn, "feocromocitoma", 20)
    # O grafo faz o vínculo: a entidade 'feocromocitoma' agrega os sinônimos → chunk emerge.
    assert c_syn in g.expand("feocromocitoma", top_n=20)


# ── flag ─────────────────────────────────────────────────────────────────────────
def test_flag_off_returns_none(monkeypatch):
    monkeypatch.delenv("RAG_GRAPH_ENABLED", raising=False)
    assert load_graph_lexicon() is None
    assert make_graph_store(None, None) is None


def test_generated_lexicon_is_loadable():
    """O léxico versionado (gerado de DOENCAS/BULARIO) carrega e tem massa."""
    import pathlib
    path = pathlib.Path(__file__).resolve().parents[1] / "raggw" / "graph" / "lexicon.json"
    if not path.exists():
        pytest.skip("lexicon.json não gerado neste ambiente")
    lex = load_lexicon(path)
    assert len(lex.entities) > 100
    # NOTA: as entidades usam o NOME COMPLETO ("Sepse e choque séptico") + sinônimos/CID;
    # detecção é por superfície curada. Ex.: o sinônimo "choque séptico" da ficha de sepse.
    assert lex.detect("paciente em choque séptico refratário")
