"""Post-rebuild smoke check: run a handful of sanity queries against a corpus
generation and confirm hybrid_search returns hits for each.

Extracted from the inline Python heredoc in scripts/rebuild_real_corpus.sh so the
check is importable and unit-testable (fake embedder/reranker, no model downloads).

    python -m raggw.scripts.smoke [--db PATH] [--query "..." [--query "..." ...]]

Exits non-zero (and prints to stderr) when the staged corpus isn't ready or any
query returns zero hits — same failure conditions as the original heredoc."""
from __future__ import annotations

import argparse
import sqlite3
import sys
from dataclasses import dataclass, field

from .. import retrieval
from ..config import get_settings
from ..embedding import Embedder, make_embedder
from ..reranking import Reranker, make_reranker
from ..vectorstore import VectorStore, make_vector_store

# Same 3 queries previously hardcoded in the rebuild_real_corpus.sh heredoc.
DEFAULT_QUERIES = [
    "conduta inicial na sepse e choque septico",
    "sindromes aorticas agudas dissecção de aorta Stanford A tratamento",
    "diagnostico e preparo do feocromocitoma",
]


@dataclass
class QueryResult:
    query: str
    hits: int
    ok: bool


@dataclass
class SmokeResult:
    passed: bool
    per_query: list[QueryResult] = field(default_factory=list)


def run_smoke(conn: sqlite3.Connection, embedder: Embedder, reranker: Reranker,
             store: VectorStore | None, queries: list[str] | None = None, *,
             top_k: int = 4, candidate_n: int = 80) -> SmokeResult:
    """Run each query through hybrid_search; a query "ok"s when it returns >=1 hit."""
    queries = DEFAULT_QUERIES if queries is None else queries
    per_query = []
    for q in queries:
        hits = retrieval.hybrid_search(conn, q, embedder=embedder, reranker=reranker,
                                       top_k=top_k, candidate_n=candidate_n, store=store)
        per_query.append(QueryResult(query=q, hits=len(hits), ok=len(hits) > 0))
    return SmokeResult(passed=all(r.ok for r in per_query), per_query=per_query)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Sanity-check a corpus generation with a few clinical queries.")
    ap.add_argument("--db", default=None,
                    help="SQLite path to smoke-test (default: RAG_DB_PATH / settings.db_path)")
    ap.add_argument("--query", action="append", dest="queries", default=None,
                    help="override query (repeatable); default: 3 built-in clinical queries")
    args = ap.parse_args(argv)

    settings = get_settings()
    db_path = args.db or str(settings.db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        docs = conn.execute(
            "SELECT COUNT(*) c FROM documents WHERE status='active'").fetchone()["c"]
        chunks = conn.execute("SELECT COUNT(*) c FROM document_chunks").fetchone()["c"]
        embedded = conn.execute(
            "SELECT COUNT(*) c FROM document_chunks WHERE embedding IS NOT NULL").fetchone()["c"]
        dims = conn.execute(
            "SELECT DISTINCT length(embedding)/4 d FROM document_chunks "
            "WHERE embedding IS NOT NULL LIMIT 5").fetchall()
        print(f"[smoke] counts docs={docs} chunks={chunks} embedded={embedded} "
              f"dims={[r['d'] for r in dims]}")
        if docs == 0 or chunks == 0 or embedded != chunks:
            print("[smoke] staged corpus is not ready", file=sys.stderr)
            return 1

        embedder = make_embedder(settings)
        reranker = make_reranker()
        store = make_vector_store(settings)
        candidate_n = max(80, settings.candidate_n)  # same floor as the old heredoc
        result = run_smoke(conn, embedder, reranker, store, args.queries,
                           candidate_n=candidate_n)
        for r in result.per_query:
            print(f"[smoke] query={r.query!r} hits={r.hits} ok={r.ok}")
        if not result.passed:
            failed = [r.query for r in result.per_query if not r.ok]
            print(f"[smoke] FAILED: no hits for {failed}", file=sys.stderr)
            return 1
        print("[smoke] OK")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
