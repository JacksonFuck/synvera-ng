"""Reprocess the .md files that failed ingestion (router misroute, now fixed).

Computes the set fresh: paths that appear as `event: fail` in any seed JSONL log,
are still absent from the documents table, still exist on disk, and end in .md/.txt.
Ingests each via the (now fixed) router, then rebuilds the graph. Idempotent.
"""
from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

from raggw import db
from raggw.config import get_settings
from raggw.embedding import make_embedder
from raggw.graph.store import build_graph_index
from raggw.ingest import ingest_file
from raggw.vectorstore import make_vector_store

TEXT_EXTS = {".md", ".txt", ".markdown"}


def missing_text_failures(conn) -> list[str]:
    fails: set[str] = set()
    for lg in glob.glob("data/ingest_supervisor-*.jsonl") + glob.glob("data/seed_until_done.jsonl"):
        with open(lg, encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line)
                except Exception:
                    continue
                if e.get("event") == "fail" and e.get("path"):
                    fails.add(e["path"])
    indexed = {r[0] for r in conn.execute("SELECT source_path FROM documents")}
    out = [p for p in sorted(fails)
           if p not in indexed
           and os.path.splitext(p)[1].lower() in TEXT_EXTS
           and Path(p).exists()]
    return out


def main() -> int:
    settings = get_settings()
    conn = db.open_db(str(settings.db_path))
    paths = missing_text_failures(conn)
    print(f"[reprocess-md] {len(paths)} text files to reprocess", flush=True)
    if not paths:
        conn.close()
        return 0
    embedder = make_embedder(settings)
    store = make_vector_store(settings)
    ok = fail = 0
    for i, p in enumerate(paths, 1):
        try:
            res = ingest_file(conn, p, embedder=embedder, settings=settings, vector_store=store)
            ok += 1
            print(f"[reprocess-md] {i}/{len(paths)} ok chunks={res.n_chunks} | {os.path.basename(p)}",
                  flush=True)
        except Exception as exc:  # noqa: BLE001 - keep going
            fail += 1
            print(f"[reprocess-md] {i}/{len(paths)} FAIL {type(exc).__name__}: {exc} | {p}",
                  flush=True)
            try:
                conn.rollback()
            except Exception:
                pass
    print(f"[reprocess-md] rebuilding graph ...", flush=True)
    try:
        print(f"[reprocess-md] graph: {build_graph_index(conn)}", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[reprocess-md] graph build FAILED: {exc}", flush=True)
    conn.close()
    print(f"[reprocess-md] DONE ok={ok} fail={fail}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
