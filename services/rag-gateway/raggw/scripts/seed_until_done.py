"""CLI: resilient corpus seeding that keeps going until the file list is exhausted.

    python -m raggw.scripts.seed_until_done FOLDER --db data/rag_corpus.db

This is operationally stricter than seed_corpus.py: it logs every file, skips
already-ingested content by hash before parsing, records failures, and only exits
normally after the discovered file list has been fully scanned.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import traceback
from pathlib import Path

from .. import db
from ..config import Settings, get_settings
from ..embedding import Embedder, FakeEmbedder, make_embedder
from ..ingest import file_hash, ingest_file
from ..parsing.base import assess_complexity
from ..vectorstore import make_vector_store
from .parse_file import SUPPORTED


PDF_ONLY = {".pdf"}


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def normalize_exts(spec: str) -> set[str]:
    """"pdf, md,.docx" -> {".pdf", ".md", ".docx"}. Content-only: extension, never folder."""
    return {"." + e.strip().lstrip(".").lower() for e in spec.split(",") if e.strip()}


def discover(path: str | Path, *, exts: set[str]) -> list[Path]:
    root = Path(path)
    if root.is_file():
        return [root] if root.suffix.lower() in exts else []
    return sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in exts)


def _count_state(conn) -> dict:
    docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    chunks = conn.execute("SELECT COUNT(*) FROM document_chunks").fetchone()[0]
    emb = conn.execute(
        "SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL").fetchone()[0]
    return {"docs": docs, "chunks": chunks, "emb": emb}


def _log(fp, event: dict) -> None:
    event = {"ts": _now(), **event}
    fp.write(json.dumps(event, ensure_ascii=False) + "\n")
    fp.flush()


def _print_progress(i: int, total: int, status: str, path: Path, state: dict,
                    elapsed: float, *, chunks: int | None = None,
                    err: str | None = None) -> None:
    extra = f" chunks={chunks}" if chunks is not None else ""
    if err:
        extra += f" err={err[:160]}"
    print(
        f"[seed-until-done] {i}/{total} {status}{extra} | "
        f"docs={state['docs']} chunks={state['chunks']} emb={state['emb']} "
        f"elapsed={int(elapsed)}s | {path}",
        flush=True,
    )


def default_embedder(settings: Settings) -> Embedder:
    emb = make_embedder(settings)
    if isinstance(emb, FakeEmbedder):
        print("[seed-until-done] WARNING: using FakeEmbedder. "
              "Set RAG_REAL_MODELS=1 for bge-m3.", file=sys.stderr, flush=True)
    elif hasattr(emb, "info"):
        print(f"[seed-until-done] embedder={emb.info()}", flush=True)
    return emb


def run(folder: str | Path, *, db_path: str | Path, log_path: str | Path,
        settings: Settings | None = None, pdf_only: bool = True,
        mode: str = "all", exts: set[str] | None = None) -> dict:
    settings = settings or get_settings()
    exts = exts if exts else (PDF_ONLY if pdf_only else SUPPORTED)
    files = discover(folder, exts=exts)
    embedder = default_embedder(settings)
    store = make_vector_store(settings)
    conn = db.open_db(db_path)
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)

    summary = {
        "files": len(files),
        "ingested": 0,
        "skipped": 0,
        "failed": 0,
        "deferred_complex": 0,
        "chunks": 0,
    }
    started = time.time()
    with open(log_path, "a", encoding="utf-8") as log:
        _log(log, {
            "event": "start",
            "folder": str(folder),
            "db": str(db_path),
            "files": len(files),
            "pdf_only": pdf_only,
            "exts": sorted(exts),
            "mode": mode,
            "embedder": embedder.info() if hasattr(embedder, "info") else type(embedder).__name__,
        })
        try:
            for i, path in enumerate(files, 1):
                digest = None
                try:
                    digest = file_hash(path)
                    existing = conn.execute(
                        "SELECT id FROM documents WHERE content_hash=?", (digest,)).fetchone()
                    if existing:
                        summary["skipped"] += 1
                        if i == 1 or i % 10 == 0:
                            _print_progress(i, len(files), "skip", path, _count_state(conn),
                                            time.time() - started)
                        _log(log, {"event": "skip", "i": i, "total": len(files),
                                   "path": str(path), "document_id": existing["id"]})
                        continue

                    if mode == "simple-only":
                        complexity = assess_complexity(path)
                        if complexity != "simple":
                            summary["deferred_complex"] += 1
                            if i == 1 or i % 10 == 0:
                                _print_progress(i, len(files), "defer-complex", path,
                                                _count_state(conn), time.time() - started)
                            _log(log, {"event": "defer_complex", "i": i,
                                       "total": len(files), "path": str(path),
                                       "complexity": complexity})
                            continue

                    res = ingest_file(conn, path, embedder=embedder, settings=settings,
                                      vector_store=store)
                    if res.skipped:
                        summary["skipped"] += 1
                        status = "skip"
                    else:
                        summary["ingested"] += 1
                        summary["chunks"] += res.n_chunks
                        status = "ingest"
                    state = _count_state(conn)
                    _print_progress(i, len(files), status, path, state,
                                    time.time() - started, chunks=res.n_chunks)
                    _log(log, {"event": status, "i": i, "total": len(files),
                               "path": str(path), "document_id": res.document_id,
                               "chunks": res.n_chunks, "parser": res.parser,
                               "degraded_from": res.degraded_parser,
                               "markdown_path": res.markdown_path})
                except BaseException as exc:  # noqa: BLE001 - keep scanning the corpus.
                    if isinstance(exc, (KeyboardInterrupt, SystemExit)):
                        raise
                    summary["failed"] += 1
                    state = _count_state(conn)
                    err = f"{type(exc).__name__}: {exc}"
                    _print_progress(i, len(files), "FAIL", path, state,
                                    time.time() - started, err=err)
                    _log(log, {"event": "fail", "i": i, "total": len(files),
                               "path": str(path), "sha256": digest, "error": err,
                               "traceback": traceback.format_exc()})
                    try:
                        conn.rollback()
                    except Exception:
                        pass
        finally:
            final_state = _count_state(conn)
            conn.close()
            summary["elapsed_s"] = round(time.time() - started, 1)
            summary.update(final_state)
            _log(log, {"event": "done", **summary})
    print(f"[seed-until-done] done {summary}", flush=True)
    return summary


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Resilient bge-m3 corpus seeding; scans until all files are exhausted.")
    ap.add_argument("folder", help="folder or file to ingest")
    ap.add_argument("--db", default=None, help="SQLite path (default: RAG_DB_PATH)")
    ap.add_argument("--log", default="data/seed_until_done.jsonl",
                    help="JSONL progress/failure log")
    ap.add_argument("--all-supported", action="store_true",
                    help="include docx/epub/html/md/txt/xlsx/pptx, not only PDFs")
    ap.add_argument("--exts", default=None,
                    help="explicit comma list, e.g. 'pdf,md,docx' (overrides --all-supported)")
    ap.add_argument("--mode", choices=("all", "simple-only"), default="all",
                    help="all files, or only liteparse-suitable simple PDFs")
    args = ap.parse_args(argv)
    settings = get_settings()
    db_path = args.db or str(settings.db_path)
    run(args.folder, db_path=db_path, log_path=args.log, settings=settings,
        pdf_only=not args.all_supported, mode=args.mode,
        exts=normalize_exts(args.exts) if args.exts else None)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
