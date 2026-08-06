"""FastAPI app — local-only ingestion API. Bind 127.0.0.1 (zero PHI egress).

Endpoints: GET /health, POST /ingest (enqueue local path), GET /jobs, GET /jobs/{id}.
File upload (drag-and-drop) is Phase 4 (admin). Phase 1 ingests server-side local paths.
Embeddings default to FakeEmbedder unless RAG_REAL_MODELS=1 — reported in /health."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

log = logging.getLogger("raggw.search")

from . import __version__, admin, agents, db, jobs, retrieval
from .config import get_settings
from .embedding import Embedder, make_embedder
from .multi_embedder import make_multi_embedder
from .graph.store import GraphStore, load_required_lexicon, make_graph_store
from .parsing.router import default_parsers
from .reranking import Reranker, make_reranker
from .vectorstore import VectorStore, make_vector_store


class IngestRequest(BaseModel):
    path: str
    metadata: dict | None = None


class SearchRequest(BaseModel):
    query: str
    specialty: str | None = None
    agent_key: str | None = None
    top_k: int | None = None


def _vector_store_status(vector_store: VectorStore | None, *, dim: int,
                         embedded_chunks: int) -> dict:
    if vector_store is None:
        return {"configured": False, "ready": True, "coherent": True}
    try:
        probe = [1.0] + [0.0] * max(0, dim - 1)
        ids = vector_store.search(probe, 1)
        coherent = embedded_chunks == 0 or len(ids) > 0
        return {"configured": True, "ready": True, "coherent": coherent}
    except Exception as e:
        return {
            "configured": True,
            "ready": False,
            "coherent": False,
            "error": type(e).__name__,
        }


def _readiness(*, active_documents: int, active_chunks: int,
               embedded_chunks: int, embedding_dims: list[int],
               embedder_kind: str,
               vector_store: VectorStore | None, settings) -> dict:
    real_models_requested = os.environ.get("RAG_REAL_MODELS", "").lower() in (
        "1", "true", "yes")
    embedder_ready = (not real_models_requested) or embedder_kind != "FakeEmbedder"
    embeddings_complete = active_chunks > 0 and embedded_chunks == active_chunks
    embedding_dim_ready = (
        len(embedding_dims) == 1 and embedding_dims[0] == settings.embed_dim)
    thresholds_ready = settings.rerank_min >= 0 and settings.min_supporting_chunks >= 1
    vector_status = _vector_store_status(
        vector_store, dim=settings.embed_dim, embedded_chunks=embedded_chunks)
    ready = (
        active_chunks > 0
        and embeddings_complete
        and embedding_dim_ready
        and embedder_ready
        and thresholds_ready
        and vector_status["ready"]
        and vector_status["coherent"]
    )
    return {
        "ready": ready,
        "active_documents": active_documents,
        "active_chunks": active_chunks,
        "embedded_chunks": embedded_chunks,
        "embeddings_complete": embeddings_complete,
        "embedding_dims": embedding_dims,
        "embedding_dim_ready": embedding_dim_ready,
        "embedder_ready": embedder_ready,
        "real_models_requested": real_models_requested,
        "thresholds": {
            "rerank_min": settings.rerank_min,
            "min_supporting_chunks": settings.min_supporting_chunks,
            "ready": thresholds_ready,
        },
        "vector_store": vector_status,
    }


def _has_specialty_index(conn) -> bool:
    row = conn.execute(
        "SELECT 1 FROM document_chunks "
        "WHERE specialty IS NOT NULL AND specialty != '' LIMIT 1").fetchone()
    return row is not None


def create_app(*, db_path=None, embedder: Embedder | None = None,
               reranker: Reranker | None = None,
               vector_store: VectorStore | None = None,
               settings=None, start_worker: bool = True) -> FastAPI:
    settings = settings or get_settings()
    db_path = str(db_path or settings.db_path)
    embedder = embedder or make_embedder(settings)
    multi_embedder = make_multi_embedder(settings)  # Simvera 2.0: MedCPT + Contriever
    reranker = reranker or make_reranker()
    vector_store = vector_store or make_vector_store(settings)
    graph_lexicon = load_required_lexicon(settings)  # sinal obrigatório: sempre carregado (#321)
    embedder_kind = type(embedder).__name__
    reranker_kind = type(reranker).__name__
    vector_store_kind = type(vector_store).__name__ if vector_store is not None else "BruteForceStore"
    embedder_info = embedder.info() if hasattr(embedder, "info") else {}

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        conn = db.open_db(db_path)  # ensure schema exists
        agents.init_agents(conn)    # seed default specialist agents (Q4)
        # Grafo (obrigatório, #321): o startup garante que o grafo EXISTE, sem pagar o
        # rebuild completo a cada boot — sobre um corpus grande (2M+ chunks) o rebuild
        # leva horas e deixava o serviço fora do ar. A ingestão (seed/reprocess) já
        # reconstrói o grafo após escrever chunks, então aqui só construímos quando o
        # grafo está vazio (DB novo) ou quando RAG_GRAPH_REBUILD_ON_START=1 força.
        if graph_lexicon is not None:
            graph_store = GraphStore(conn, graph_lexicon)  # garante o schema
            force_rebuild = os.environ.get(
                "RAG_GRAPH_REBUILD_ON_START", "").lower() in ("1", "true", "yes")
            populated = conn.execute(
                "SELECT EXISTS(SELECT 1 FROM graph_chunk_entities)").fetchone()[0]
            if force_rebuild or not populated:
                graph_store.build_from_chunks()
        conn.close()
        # Pré-carrega BGE-M3 e o reranker no boot. Sem isto a 1ª query paga ~12s de
        # embed + ~4s de rerank (medido 2026-08-04: total_s≈21,8s) e estoura o
        # SIMVERA_RAG_TIMEOUT de 20s do orquestrador — a mesma pergunta quente cai
        # para ~1,1–1,5s. Opt-out: RAG_PRELOAD_MODELS=0.
        preload = os.environ.get("RAG_PRELOAD_MODELS", "1").lower() not in (
            "0", "false", "no")
        if preload and os.environ.get("RAG_REAL_MODELS", "").lower() in (
                "1", "true", "yes"):
            try:
                embedder.embed(["warmup"])
                reranker.rerank("warmup", ["short warmup passage for model load"])
                log.info("preload: embedder=%s reranker=%s ready",
                         embedder_kind, reranker_kind)
            except Exception:
                log.exception("preload failed; first real query will pay model load")
        worker = None
        if start_worker:
            worker = jobs.Worker(db_path, embedder=embedder, settings=settings,
                                 vector_store=vector_store)
            worker.start()
        app.state.worker = worker
        yield
        if worker:
            worker.stop()

    app = FastAPI(title="RAG Gateway", version=__version__, lifespan=lifespan)

    @app.get("/health")
    def health():
        conn = db.connect(db_path)
        try:
            counts = conn.execute(
                "SELECT COUNT(DISTINCT d.id) active_documents, "
                "COUNT(dc.id) active_chunks, "
                "SUM(CASE WHEN dc.embedding IS NOT NULL THEN 1 ELSE 0 END) embedded_chunks "
                "FROM documents d LEFT JOIN document_chunks dc "
                "ON dc.document_id = d.id WHERE d.status='active'").fetchone()
            dim_rows = conn.execute(
                "SELECT DISTINCT length(dc.embedding) / 4 AS dim "
                "FROM document_chunks dc JOIN documents d ON d.id = dc.document_id "
                "WHERE d.status='active' AND dc.embedding IS NOT NULL").fetchall()
            n_agents = len(agents.list_agents(conn))
        finally:
            conn.close()
        readiness = _readiness(
            active_documents=int(counts["active_documents"] or 0),
            active_chunks=int(counts["active_chunks"] or 0),
            embedded_chunks=int(counts["embedded_chunks"] or 0),
            embedding_dims=[int(r["dim"]) for r in dim_rows],
            embedder_kind=embedder_kind,
            vector_store=vector_store,
            settings=settings)
        return {
            "status": "ok",
            "host": settings.host,
            "embedder": embedder_kind,
            "embedder_info": embedder_info,
            "reranker": reranker_kind,
            "vector_store": vector_store_kind,
            "embed_dim": settings.embed_dim,
            "parsers": sorted(default_parsers().keys()),
            "retrieval_ready": readiness,
            "rag_ready": readiness["ready"],
            "agents": n_agents,
            "graph_enabled": graph_lexicon is not None,
            "simvera_version": "2.0",
            "multi_retriever": {
                "enabled": len(multi_embedder.models) > 1,
                "models": multi_embedder.models,
                "info": multi_embedder.info(),
            },
        }

    @app.get("/agents")
    def list_agents():
        conn = db.connect(db_path)
        try:
            return {"agents": [
                {"key": a["key"], "display_name": a["display_name"],
                 "corpus_filter": a["corpus_filter"]}
                for a in agents.list_agents(conn)]}
        finally:
            conn.close()

    @app.get("/agents/{key}")
    def get_agent(key: str):
        conn = db.connect(db_path)
        try:
            agent = agents.get_agent(conn, key)
        finally:
            conn.close()
        if agent is None:
            raise HTTPException(status_code=404, detail="agent not found")
        # system_prompt resolvido no servidor: núcleo de segurança SEMPRE primeiro
        return {**agent, "system_prompt": agents.resolve_system_prompt(agent)}

    def _search(req: SearchRequest):
        conn = db.connect(db_path)
        try:
            specialties = None
            if req.agent_key:
                agent = agents.get_agent(conn, req.agent_key)
                if agent is None:
                    raise HTTPException(status_code=404, detail="agent not found")
                specialties = agent["corpus_filter"] or None
                if specialties and not _has_specialty_index(conn):
                    specialties = None

            # Simvera 2.0: extra dense rankings from multi-retriever
            extra_dense = None
            if len(multi_embedder.models) > 1:
                extra_dense = {}
                for model_name in multi_embedder.models:
                    if model_name == "bge-m3":
                        continue
                    try:
                        qvec = multi_embedder.embed([req.query], model=model_name)[0]
                        ranking = retrieval.dense_search(
                            conn, qvec, settings.candidate_n,
                            specialty=req.specialty, specialties=specialties,
                        )
                        if ranking:
                            extra_dense[model_name] = ranking
                    except Exception:
                        pass

            hits, diagnostics = retrieval.planned_search(
                conn, req.query, embedder=embedder, reranker=reranker,
                lexicon=graph_lexicon, graph=make_graph_store(conn, graph_lexicon),
                top_k=req.top_k or settings.search_top_k,
                candidate_n=settings.candidate_n,
                specialty=req.specialty, specialties=specialties,
                rerank_min=settings.rerank_min,
                min_supporting_chunks=settings.min_supporting_chunks,
                store=vector_store, family_cap=settings.diversity_family_cap,
                extra_dense_rankings=extra_dense)
            # Timing por estágio: sem isto o total de 37s esconde se o custo está no
            # denso/ANN ou no rerank. Vai no JSON de resposta e no log do processo.
            log.info(
                "search total_s=%.3f dominant=%s stages=%s n_hits=%s q=%r",
                float(diagnostics.get("total_s") or 0.0),
                diagnostics.get("dominant_stage"),
                diagnostics.get("stage_timings_s"),
                len(hits),
                (req.query or "")[:120],
            )
            return hits, diagnostics
        finally:
            conn.close()

    @app.post("/rag/search")
    def rag_search(req: SearchRequest):
        hits, diagnostics = _search(req)
        return {"query": req.query, "hits": [vars(h) for h in hits],
                "retrieval": diagnostics}

    @app.post("/rag/evidence-pack")
    def rag_evidence_pack(req: SearchRequest):
        hits, diagnostics = _search(req)
        conn = db.connect(db_path)  # for hierarchical context (#322) + provenance de triplas
        try:
            triples: list = []
            if graph_lexicon is not None:
                triples = retrieval.typed_triples_with_provenance(
                    conn, req.query, graph_lexicon, hits=hits,
                    max_triples=settings.graph_max_triples,
                    max_hops=settings.graph_max_hops)
            pack = retrieval.build_evidence_pack(
                req.query, hits, top_rerank_min=settings.rerank_min,
                min_supporting_chunks=settings.min_supporting_chunks, conn=conn,
                graph_triples=triples,
                max_triples=settings.graph_max_triples)
        finally:
            conn.close()
        pack["retrieval"] = diagnostics  # contribuição do grafo + plano (mensurável, #321)
        # contagem auditável no diagnostics espelhado
        if isinstance(pack.get("retrieval"), dict):
            pack["retrieval"]["graph_triples"] = len(pack.get("graph_triples") or [])
            pack["retrieval"]["graph_max_triples"] = settings.graph_max_triples
            pack["retrieval"]["graph_max_hops"] = settings.graph_max_hops
        return pack

    @app.post("/ingest")
    def ingest(req: IngestRequest):
        if not Path(req.path).exists():
            raise HTTPException(status_code=404, detail=f"file not found: {req.path}")
        conn = db.connect(db_path)
        try:
            job_id = jobs.enqueue(conn, req.path, req.metadata)
        finally:
            conn.close()
        return {"job_id": job_id, "status": "queued"}

    @app.get("/jobs")
    def list_jobs():
        conn = db.connect(db_path)
        try:
            rows = conn.execute(
                "SELECT * FROM ingestion_jobs ORDER BY id DESC").fetchall()
            return {"jobs": [dict(r) for r in rows]}
        finally:
            conn.close()

    @app.get("/jobs/{job_id}")
    def get_job(job_id: int):
        conn = db.connect(db_path)
        try:
            row = conn.execute(
                "SELECT * FROM ingestion_jobs WHERE id=?", (job_id,)).fetchone()
        finally:
            conn.close()
        if row is None:
            raise HTTPException(status_code=404, detail="job not found")
        return dict(row)

    # Admin (Fase 4): rotas registradas em admin.py. Gating X-Admin-Token, loopback, zero egress.
    admin.register_admin_routes(app, db_path=db_path, embedder=embedder, settings=settings)

    return app


app = create_app()
