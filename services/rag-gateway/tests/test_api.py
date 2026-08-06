"""FastAPI app: /health, /ingest (enqueue), /jobs. Worker drains the queue async."""
from __future__ import annotations

import time

from fastapi.testclient import TestClient

from raggw import db
from raggw.api import create_app
from raggw.embedding import FakeEmbedder, encode_vector


class SpyStore:
    def __init__(self):
        self.added: list[dict] = []
        self.search_calls: list[dict] = []

    def add(self, items: list[dict]) -> None:
        self.added.extend(items)

    def search(self, query_vec: list[float], top_n: int, *, specialties=None) -> list[int]:
        self.search_calls.append({"top_n": top_n, "specialties": specialties})
        return [int(it["id"]) for it in self.added[:top_n]]


class EmptyStore(SpyStore):
    def search(self, query_vec: list[float], top_n: int, *, specialties=None) -> list[int]:
        self.search_calls.append({"top_n": top_n, "specialties": specialties})
        return []


def _insert_doc_chunk(db_path, *, embedding: bytes | None) -> None:
    conn = db.open_db(db_path)
    try:
        cur = conn.execute(
            "INSERT INTO documents (source_path,title,status,ingestion_status) "
            "VALUES (?,?,?,?)",
            ("manual.pdf", "Manual", "active", "done"))
        conn.execute(
            "INSERT INTO document_chunks "
            "(document_id,chunk_index,chunk_text,contextual_text,citation_label,embedding) "
            "VALUES (?,?,?,?,?,?)",
            (cur.lastrowid, 0, "sepse", "sepse", "Manual — p. 1", embedding))
        conn.commit()
    finally:
        conn.close()


def _client(db_path):
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8), start_worker=True)
    return TestClient(app)


def test_health_ok(db_path):
    with _client(db_path) as client:
        body = client.get("/health").json()
        assert body["status"] == "ok"
        assert body["host"] == "127.0.0.1"          # zero-egress: loopback only
        assert "pdftotext" in body["parsers"]
        assert body["embedder"] == "FakeEmbedder"   # transparent: no silent fake
        # Clinical GraphRAG observabilidade (#15)
        assert "graph" in body
        g = body["graph"]
        assert "lexicon_loaded" in g
        assert "n_entities" in g and "n_typed_edges" in g
        assert "edges_by_rel" in g and isinstance(g["edges_by_rel"], dict)
        assert "n_nodes" in g and "n_chunk_links" in g


def test_health_graph_edges_by_rel(db_path, tmp_path, monkeypatch):
    """Com lexicon tipado + edges no DB, health lista contagens por rel."""
    import json
    from raggw.api import create_app
    from raggw.embedding import FakeEmbedder

    lex_path = tmp_path / "lex.json"
    lex_path.write_text(json.dumps({
        "entities": [
            {"id": "sepse", "label": "Sepse", "kind": "disease",
             "surfaces": ["sepse"]},
            {"id": "drug-nora", "label": "Nora", "kind": "drug",
             "surfaces": ["noradrenalina"]},
        ],
        "typed_edges": [["drug-nora", "trata", "sepse"]],
    }), encoding="utf-8")
    monkeypatch.setenv("RAG_GRAPH_LEXICON", str(lex_path))

    conn = db.open_db(db_path)
    try:
        # schema graph via GraphStore path: insert edges after ensure
        from raggw.graph.store import GraphStore
        from raggw.graph.lexicon import load_lexicon
        GraphStore(conn, load_lexicon(lex_path)).build_from_chunks()
        # inject typed edge count (build may only cooc if no chunks)
        conn.execute(
            "INSERT OR IGNORE INTO graph_edges (a, rel, b, weight) VALUES (?,?,?,?)",
            ("drug-nora", "trata", "sepse", 1.0))
        conn.commit()
    finally:
        conn.close()

    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8),
                     start_worker=False)
    with TestClient(app) as client:
        g = client.get("/health").json()["graph"]
    assert g["lexicon_loaded"] is True
    assert g["n_entities"] >= 2
    assert g["n_typed_edges"] >= 1
    assert g["edges_by_rel"].get("trata", 0) >= 1
    assert "error" not in g


def test_ingest_enqueues_then_worker_completes(db_path, sample_pdf):
    with _client(db_path) as client:
        r = client.post("/ingest", json={"path": str(sample_pdf)})
        assert r.status_code == 200
        assert r.json()["status"] == "queued"
        job_id = r.json()["job_id"]

        deadline, jr = time.time() + 5, {}
        while time.time() < deadline:
            jr = client.get(f"/jobs/{job_id}").json()
            if jr["status"] in ("done", "failed"):
                break
            time.sleep(0.05)
        assert jr["status"] == "done", jr
        assert jr["document_id"] is not None


def test_ingest_missing_file_returns_404(db_path):
    with _client(db_path) as client:
        r = client.post("/ingest", json={"path": "/nope/missing.pdf"})
        assert r.status_code == 404


def test_jobs_listing(db_path, sample_pdf):
    with _client(db_path) as client:
        client.post("/ingest", json={"path": str(sample_pdf)})
        r = client.get("/jobs")
        assert r.status_code == 200
        assert len(r.json()["jobs"]) >= 1


def _ingest_and_wait(client, pdf):
    job_id = client.post("/ingest", json={"path": str(pdf)}).json()["job_id"]
    deadline = time.time() + 5
    while time.time() < deadline:
        if client.get(f"/jobs/{job_id}").json()["status"] in ("done", "failed"):
            return
        time.sleep(0.05)


def test_rag_search_returns_hits(db_path, sample_pdf):
    with _client(db_path) as client:
        _ingest_and_wait(client, sample_pdf)
        r = client.post("/rag/search", json={"query": "sepse"})
        assert r.status_code == 200
        hits = r.json()["hits"]
        assert hits and any("sepse" in h["chunk_text"].lower() for h in hits)
        assert hits[0]["citation_label"]


def test_rag_evidence_pack_abstains_on_nonsense(db_path, sample_pdf):
    with _client(db_path) as client:
        _ingest_and_wait(client, sample_pdf)
        r = client.post("/rag/evidence-pack", json={"query": "xyzqwerty inexistente zzz"})
        assert r.status_code == 200
        assert r.json()["abstain"] is True


def test_health_reports_reranker(db_path):
    with _client(db_path) as client:
        assert client.get("/health").json()["reranker"] == "FakeReranker"


def test_health_reports_vector_store(db_path):
    store = SpyStore()
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8),
                     vector_store=store, start_worker=False)
    with TestClient(app) as client:
        assert client.get("/health").json()["vector_store"] == "SpyStore"


def test_health_rag_ready_flips_after_ingest(db_path, sample_pdf, monkeypatch):
    # readiness requires the embedder's dim to equal settings.embed_dim; the fake
    # client uses FakeEmbedder(dim=8), so pin RAG_EMBED_DIM=8 (default is 1024) to
    # keep the test hermetic instead of depending on an external env var.
    monkeypatch.setenv("RAG_EMBED_DIM", "8")
    with _client(db_path) as client:
        h0 = client.get("/health").json()
        assert h0["rag_ready"] is False
        assert h0["agents"] >= 7
        _ingest_and_wait(client, sample_pdf)
        assert client.get("/health").json()["rag_ready"] is True


def test_health_rag_ready_false_when_chunks_have_no_embeddings(db_path):
    _insert_doc_chunk(db_path, embedding=None)
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8),
                     start_worker=False)
    with TestClient(app) as client:
        body = client.get("/health").json()
        assert body["status"] == "ok"
        assert body["rag_ready"] is False
        assert body["retrieval_ready"]["active_chunks"] == 1
        assert body["retrieval_ready"]["embedded_chunks"] == 0
        assert body["retrieval_ready"]["embeddings_complete"] is False


def test_health_rag_ready_false_when_embedding_dim_mismatches(db_path):
    _insert_doc_chunk(db_path, embedding=encode_vector([0.1, 0.2, 0.3]))
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8),
                     start_worker=False)
    with TestClient(app) as client:
        body = client.get("/health").json()
        assert body["rag_ready"] is False
        assert body["retrieval_ready"]["embedding_dims"] == [3]
        assert body["retrieval_ready"]["embedding_dim_ready"] is False


def test_health_rag_ready_false_when_vector_store_configured_but_empty(db_path):
    _insert_doc_chunk(db_path, embedding=encode_vector([0.1] * 8))
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8),
                     vector_store=EmptyStore(), start_worker=False)
    with TestClient(app) as client:
        body = client.get("/health").json()
        assert body["rag_ready"] is False
        assert body["retrieval_ready"]["vector_store"]["configured"] is True
        assert body["retrieval_ready"]["vector_store"]["coherent"] is False


def test_agents_list_and_get_with_server_resolved_prompt(db_path):
    with _client(db_path) as client:
        keys = {a["key"] for a in client.get("/agents").json()["agents"]}
        assert "intensivista" in keys
        a = client.get("/agents/intensivista").json()
        assert a["corpus_filter"] == ["intensiva"]
        assert a["system_prompt"].startswith("[NÚCLEO DE SEGURANÇA")  # núcleo primeiro
        assert client.get("/agents/naoexiste").status_code == 404


def _ingest_meta_and_wait(client, pdf, metadata):
    job_id = client.post("/ingest", json={"path": str(pdf), "metadata": metadata}).json()["job_id"]
    deadline = time.time() + 5
    while time.time() < deadline:
        if client.get(f"/jobs/{job_id}").json()["status"] in ("done", "failed"):
            return
        time.sleep(0.05)


def test_agent_key_applies_corpus_filter(db_path, sample_pdf):
    with _client(db_path) as client:
        _ingest_meta_and_wait(client, sample_pdf, {"specialty": "intensiva"})
        hit = client.post("/rag/search",
                          json={"query": "sepse", "agent_key": "intensivista"}).json()
        miss = client.post("/rag/search",
                           json={"query": "sepse", "agent_key": "pediatra"}).json()
        assert hit["hits"]            # corpus intensiva bate
        assert miss["hits"] == []     # filtro pediatra exclui
        assert client.post("/rag/search",
                           json={"query": "x", "agent_key": "naoexiste"}).status_code == 404


def test_agent_key_does_not_empty_unclassified_corpus(db_path, sample_pdf):
    with _client(db_path) as client:
        _ingest_and_wait(client, sample_pdf)
        r = client.post("/rag/search",
                        json={"query": "sepse", "agent_key": "intensivista"})
        assert r.status_code == 200
        assert r.json()["hits"]


def test_api_wires_vector_store_for_ingest_and_search(db_path, sample_pdf):
    store = SpyStore()
    app = create_app(db_path=str(db_path), embedder=FakeEmbedder(dim=8),
                     vector_store=store, start_worker=True)
    with TestClient(app) as client:
        _ingest_and_wait(client, sample_pdf)
        assert store.added
        r = client.post("/rag/search", json={"query": "sepse"})
        assert r.status_code == 200
        assert store.search_calls
        assert r.json()["hits"]
