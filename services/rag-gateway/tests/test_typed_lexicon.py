"""Léxico tipado + política Gemma-local para indexação."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from raggw.graph.gemma_index import _assert_local_only, extract_relation_candidates
from raggw.graph.lexicon import load_lexicon
from raggw.graph.store import GraphStore

LEX = Path(__file__).resolve().parents[1] / "raggw" / "graph" / "lexicon.json"
CLIN = Path(__file__).resolve().parents[1] / "clinical_data"


def test_lexicon_has_typed_edges():
    data = json.loads(LEX.read_text(encoding="utf-8"))
    typed = data.get("typed_edges") or []
    assert len(typed) >= 200, f"typed_edges too few: {len(typed)}"
    rels = {t[1] for t in typed}
    assert "trata" in rels
    assert "dd" in rels
    assert "tratado_por" in rels


def test_emergency_drug_nodes_present():
    data = json.loads(LEX.read_text(encoding="utf-8"))
    ids = {e["id"] for e in data["entities"]}
    assert "drug-adrenalina" in ids
    # noradrenalina se mencionada nas condutas
    assert "drug-noradrenalina" in ids or "drug-vancomicina" in ids


def test_anafilaxia_linked_to_adrenalina():
    data = json.loads(LEX.read_text(encoding="utf-8"))
    edges = {(a, rel, b) for a, rel, b in data["typed_edges"]}
    assert ("drug-adrenalina", "trata", "anafilaxia") in edges
    assert ("anafilaxia", "tratado_por", "drug-adrenalina") in edges


def test_load_lexicon_typed():
    lex = load_lexicon(LEX)
    assert len(lex.typed_edges) >= 200
    assert lex.detect("anafilaxia adrenalina IM")


def test_expand_uses_typed_neighbor(db_path):
    """Com aresta tipada no fixture, expand traz chunk do vizinho."""
    from raggw import db
    from raggw.embedding import FakeEmbedder, encode_vector
    from raggw.graph.lexicon import Entity, Lexicon, normalize

    def ent(eid, label, kind, surfaces):
        return Entity(id=eid, label=label, kind=kind,
                      surfaces=tuple(normalize(s) for s in surfaces))

    lex = Lexicon(
        entities=[
            ent("sepse", "Sepse", "disease", ["sepse", "choque septico"]),
            ent("drug-noradrenalina", "Noradrenalina", "drug", ["noradrenalina"]),
        ],
        typed_edges=[("drug-noradrenalina", "trata", "sepse")],
    )
    emb = FakeEmbedder(dim=8)
    conn = db.open_db(db_path)
    doc = conn.execute(
        "INSERT INTO documents (source_path, content_hash, status, specialty) VALUES (?,?,?,?)",
        ("/n.pdf", "h-n", "active", "uti")).lastrowid
    text = "noradrenalina e o vasopressor de escolha no choque septico"
    vec = encode_vector(emb.embed([text])[0])
    cid = conn.execute(
        "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,contextual_text,"
        "section_path,page_start,page_end,citation_label,embedding,specialty) "
        "VALUES (?,0,?,?,?,1,1,?,?,?)",
        (doc, text, text, "Sec", "doc p.1", vec, "uti")).lastrowid
    conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    conn.commit()
    gs = GraphStore(conn, lex)
    gs.build_from_chunks()
    hits = gs.expand("sepse", 10)
    assert cid in hits


def test_gemma_index_blocks_cloud_urls():
    with pytest.raises(RuntimeError):
        _assert_local_only("https://api.anthropic.com/v1")
    with pytest.raises(RuntimeError):
        _assert_local_only("https://api.openai.com/v1")
    _assert_local_only("http://127.0.0.1:8081/v1")


def test_clinical_data_vendored():
    assert (CLIN / "doencas.ts").exists()
    assert (CLIN / "bulario.ts").exists()
