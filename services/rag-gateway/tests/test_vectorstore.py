"""VectorStore: brute-force (SQLite) e LanceDB (ANN) atrás do mesmo port."""
from __future__ import annotations

from raggw import db
from raggw.config import get_settings
from raggw.embedding import FakeEmbedder, encode_vector
from raggw.vectorstore import BruteForceStore, LanceDbStore, VectorStore, make_vector_store

_EMB = FakeEmbedder(dim=8)


def _seed(conn):
    def add_doc(status, spec):
        return conn.execute(
            "INSERT INTO documents (source_path, content_hash, status, specialty) VALUES (?,?,?,?)",
            (f"/{status}-{spec}.pdf", f"h-{status}-{spec}", status, spec)).lastrowid

    def add_chunk(doc, text, spec):
        v = encode_vector(_EMB.embed([text])[0])
        return conn.execute(
            "INSERT INTO document_chunks (document_id,chunk_index,chunk_text,embedding,specialty) "
            "VALUES (?,?,?,?,?)", (doc, 0, text, v, spec)).lastrowid

    ids = {}
    ids["c1"] = add_chunk(add_doc("active", "intensiva"), "sepse grave", "intensiva")
    ids["c2"] = add_chunk(add_doc("active", "orto"), "fratura tornozelo", "orto")
    ids["c3"] = add_chunk(add_doc("superseded", "intensiva"), "sepse antiga", "intensiva")
    conn.commit()
    return ids


def test_bruteforce_filters_status_and_specialty(db_path):
    conn = db.open_db(db_path)
    ids = _seed(conn)
    res = BruteForceStore(conn).search(_EMB.embed(["sepse grave"])[0], 10, specialties=["intensiva"])
    assert ids["c1"] in res
    assert ids["c3"] not in res  # superseded
    assert ids["c2"] not in res  # orto


def test_bruteforce_is_vectorstore(db_path):
    assert isinstance(BruteForceStore(db.open_db(db_path)), VectorStore)


def test_lancedb_add_and_search_filters(tmp_path):
    store = LanceDbStore(str(tmp_path / "lance"), dim=8)
    v1 = _EMB.embed(["sepse grave"])[0]
    v2 = _EMB.embed(["fratura tornozelo"])[0]
    store.add([
        {"id": 1, "vector": v1, "specialty": "intensiva", "status": "active"},
        {"id": 2, "vector": v2, "specialty": "orto", "status": "active"},
        {"id": 3, "vector": v1, "specialty": "intensiva", "status": "superseded"},
    ])
    res = store.search(v1, 10, specialties=["intensiva"])
    assert 1 in res
    assert 3 not in res  # superseded excluído
    assert 2 not in res  # orto filtrado


def test_lancedb_is_vectorstore(tmp_path):
    assert isinstance(LanceDbStore(str(tmp_path / "l"), dim=8), VectorStore)


def test_make_vector_store_switches_on_env(tmp_path, monkeypatch):
    monkeypatch.delenv("RAG_VECTOR_STORE", raising=False)
    assert make_vector_store(get_settings()) is None  # default = brute-force
    monkeypatch.setenv("RAG_VECTOR_STORE", "lancedb")
    monkeypatch.setenv("RAG_LANCEDB_URI", str(tmp_path / "l"))
    assert isinstance(make_vector_store(get_settings()), LanceDbStore)


def test_ingest_populates_vector_store(db_path, sample_pdf, tmp_path):
    from raggw.ingest import ingest_file
    conn = db.open_db(db_path)
    store = LanceDbStore(str(tmp_path / "l"), dim=8)
    ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8),
                settings=get_settings(), vector_store=store)
    assert store.search(FakeEmbedder(dim=8).embed(["sepse"])[0], 10)  # vetores espelhados no ANN


def test_hybrid_search_routes_dense_through_store(db_path, sample_pdf, tmp_path):
    from raggw.ingest import ingest_file
    from raggw.reranking import FakeReranker
    from raggw.retrieval import hybrid_search
    conn = db.open_db(db_path)
    store = LanceDbStore(str(tmp_path / "l2"), dim=8)
    ingest_file(conn, sample_pdf, embedder=FakeEmbedder(dim=8),
                settings=get_settings(), vector_store=store)
    hits = hybrid_search(conn, "sepse", embedder=FakeEmbedder(dim=8),
                         reranker=FakeReranker(), store=store)
    assert hits and any("sepse" in h.chunk_text.lower() for h in hits)
