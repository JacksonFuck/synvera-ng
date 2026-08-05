"""CLI: auto-ingest a local folder into the RAG corpus (parse -> chunk -> embed -> store).

    python -m raggw.scripts.seed_corpus FOLDER [--db PATH]

All local, zero egress. Dedup by content_hash makes re-runs incremental.
(Near-duplicate dedup is deferred — not a #320 acceptance criterion; tracked for a later slice.)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Callable

from .. import db
from ..config import Settings, get_settings
from ..embedding import Embedder, FakeEmbedder, make_embedder
from ..graph.store import build_graph_index
from ..ingest import ingest_file
from ..models import ParsedDoc
from ..parsing.router import parse_file
from ..vectorstore import make_vector_store
from .parse_file import discover


def default_embedder(settings: Settings) -> Embedder:
    emb = make_embedder(settings)  # real bge-m3 if RAG_REAL_MODELS=1, else fake
    if isinstance(emb, FakeEmbedder):
        print("[seed] WARNING: using FakeEmbedder (placeholder vectors). "
              "Set RAG_REAL_MODELS=1 to embed with bge-m3.", file=sys.stderr)
    return emb


def seed(folder, *, db_path, embedder: Embedder | None = None,
         settings: Settings | None = None,
         parse: Callable[[Any], ParsedDoc] = parse_file) -> dict:
    settings = settings or get_settings()
    embedder = embedder or default_embedder(settings)
    store = make_vector_store(settings)  # LanceDB se RAG_VECTOR_STORE=lancedb; senão None
    conn = db.open_db(db_path)
    summary = {"files": 0, "ingested": 0, "skipped": 0, "failed": 0, "chunks": 0,
               "degraded": 0}
    try:
        for f in discover(folder):
            summary["files"] += 1
            try:
                res = ingest_file(conn, f, embedder=embedder, settings=settings,
                                  parse=parse, vector_store=store)
                if res.skipped:
                    summary["skipped"] += 1
                else:
                    summary["ingested"] += 1
                    summary["chunks"] += res.n_chunks
                    if res.degraded_parser:
                        summary["degraded"] += 1
            except Exception as exc:  # noqa: BLE001 — one bad file shouldn't stop the seed
                summary["failed"] += 1
                print(f"[seed] FAILED {f}: {exc}", file=sys.stderr)
        # Grafo é sinal de recall obrigatório (#320): (re)constrói a partir dos chunks
        # recém-semeados. Derivado dos chunks → idempotente; nunca citável, nunca LLM.
        # Isolado como o loop de ingest: uma falha de grafo não descarta os arquivos já
        # commitados nem esconde o summary (é registrada, não abortada).
        try:
            summary["graph"] = build_graph_index(conn)
        except Exception as exc:  # noqa: BLE001
            summary["graph"] = {"error": f"{type(exc).__name__}: {exc}"}
            print(f"[seed] graph build FAILED: {exc}", file=sys.stderr)
    finally:
        conn.close()
    return summary


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Auto-ingest a local folder into the RAG corpus.")
    ap.add_argument("folder", help="folder to ingest (recursively)")
    ap.add_argument("--db", default=None, help="SQLite path (default: RAG_DB_PATH)")
    args = ap.parse_args(argv)
    settings = get_settings()
    db_path = args.db or str(settings.db_path)
    summary = seed(args.folder, db_path=db_path, settings=settings)
    print(f"[seed] {summary}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
