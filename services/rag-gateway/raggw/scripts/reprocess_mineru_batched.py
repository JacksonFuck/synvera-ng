"""Reprocess one large PDF with MinerU in page batches, then replace its DB chunks.

Useful for very large scanned/table-heavy PDFs where a single MinerU run can
exhaust worker memory. Existing successful ranges are reused, so the command is
restartable.
"""
from __future__ import annotations

import argparse
import importlib.metadata
import json
import os
import shutil
import sqlite3
import subprocess
import time
from pathlib import Path

from .. import db
from ..chunking import chunk_document
from ..config import get_settings
from ..embedding import encode_vector, make_embedder
from ..models import Block, ParsedDoc
from ..parsing.base import heading_text
from ..parsing.mineru_batch import batched_parse


def _run(cmd: list[str], *, log: Path, env: dict[str, str]) -> None:
    with log.open("a", encoding="utf-8") as fp:
        fp.write(f"\n$ {' '.join(cmd)}\n")
        fp.flush()
        subprocess.run(cmd, check=True, stdout=fp, stderr=fp, env=env)


def _page_count(path: Path) -> int:
    out = subprocess.run(["pdfinfo", str(path)], capture_output=True,
                         text=True, check=True).stdout
    for line in out.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":", 1)[1].strip())
    raise RuntimeError(f"could not read page count from {path}")


def _find_one(root: Path, suffix: str) -> Path:
    matches = list(root.rglob(f"*{suffix}"))
    if not matches:
        raise FileNotFoundError(f"no *{suffix} under {root}")
    return matches[0]


def _compact_range_dir(range_dir: Path) -> None:
    keep_names = {"range.md", "content_list.json", "run.log"}
    for path in sorted(range_dir.rglob("*"), reverse=True):
        if path.is_file() and path.name not in keep_names:
            path.unlink(missing_ok=True)
        elif path.is_dir():
            try:
                path.rmdir()
            except OSError:
                pass


def _parse_content(content_path: Path, *, page_offset: int) -> tuple[list[Block], int]:
    data = json.loads(content_path.read_text("utf-8"))
    blocks: list[Block] = []
    section: str | None = None
    max_page = page_offset
    for item in data:
        page_no = int(item.get("page_idx", 0)) + 1 + page_offset
        max_page = max(max_page, page_no)
        table = (item.get("table_body") or "").strip()
        if table:
            blocks.append(Block(table, page_no, section, "table"))
            continue
        text = (item.get("text") or "").strip()
        if not text:
            continue
        heading = heading_text(text)
        if heading:
            section = heading
            blocks.append(Block(heading, page_no, section, "heading"))
        else:
            blocks.append(Block(text, page_no, section, "text"))
    return blocks, max_page


def _parser_version() -> str | None:
    try:
        return importlib.metadata.version("mineru")
    except importlib.metadata.PackageNotFoundError:
        return None


def run(path: str | Path, *, db_path: str | Path, doc_id: int,
        out_dir: str | Path, batch_pages: int = 48, max_retries: int = 2,
        on_batch_error: str = "skip") -> dict:
    path = Path(path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    settings = get_settings()
    total_pages = _page_count(path)
    env = os.environ.copy()
    env.setdefault("TMPDIR", str(Path(db_path).parent / "tmp"))
    env.setdefault("RAG_MINERU_BACKEND", "pipeline")
    env.setdefault("RAG_MINERU_METHOD", "auto")
    Path(env["TMPDIR"]).mkdir(parents=True, exist_ok=True)

    mineru = shutil.which("mineru") or str(Path(os.environ.get("VIRTUAL_ENV", "")).joinpath("bin/mineru"))
    if not Path(mineru).exists():
        mineru = str(Path(os.sys.executable).parent / "mineru")

    started = time.time()

    def run_range(start: int, end: int) -> tuple[str, list[Block]]:
        # Isolated per batch: own dir, own temp files, no shared state with other ranges.
        range_dir = out_dir / f"pages_{start:04d}_{end:04d}"
        range_dir.mkdir(parents=True, exist_ok=True)
        md_out = range_dir / "range.md"
        content_out = range_dir / "content_list.json"
        if not (md_out.exists() and content_out.exists()):
            print(f"[mineru-batched] range {start}-{end}", flush=True)
            try:
                _run([
                    mineru,
                    "-p", str(path),
                    "-o", str(range_dir),
                    "-m", env["RAG_MINERU_METHOD"],
                    "-b", env["RAG_MINERU_BACKEND"],
                    "-s", str(start),
                    "-e", str(end),
                ], log=range_dir / "run.log", env=env)
                _find_one(range_dir, ".md").replace(md_out)
                _find_one(range_dir, "_content_list.json").replace(content_out)
                _compact_range_dir(range_dir)
            except Exception:
                # A failed attempt must not leave partial output behind: batched_parse's
                # retry (or a subsequent independent run) would have _find_one pick up a
                # stale file from this try. Wipe the range dir and re-raise so the caller
                # (batched_parse) can retry/skip/raise on a clean slate.
                shutil.rmtree(range_dir, ignore_errors=True)
                range_dir.mkdir(parents=True, exist_ok=True)
                raise

        md_text = md_out.read_text("utf-8")
        md_with_marker = f"\n\n<!-- pages {start + 1}-{end + 1} -->\n\n{md_text}"
        blocks, _seen_page = _parse_content(content_out, page_offset=start)
        return md_with_marker, blocks

    result = batched_parse(total_pages, run_range, batch_pages=batch_pages,
                           max_retries=max_retries, on_batch_error=on_batch_error)
    all_blocks = result.blocks
    table_count = sum(1 for b in all_blocks if b.block_type == "table")
    if result.failed_ranges:
        print(f"[mineru-batched] skipped failed ranges: {result.failed_ranges}", flush=True)

    markdown_path = settings.markdown_dir / f"reprocessed_mineru_{doc_id}_{path.stem[:80]}.md"
    settings.markdown_dir.mkdir(parents=True, exist_ok=True)
    markdown = result.markdown.strip()
    markdown_path.write_text(markdown, encoding="utf-8")
    doc = ParsedDoc(markdown=markdown, blocks=all_blocks, page_count=total_pages,
                    parser="mineru", source_path=str(path))

    chunks = chunk_document(
        doc,
        min_tokens=settings.chunk_min_tokens,
        max_tokens=settings.chunk_max_tokens,
        overlap_tokens=settings.chunk_overlap_tokens,
        title=path.stem,
    )
    print(f"[mineru-batched] embedding chunks={len(chunks)} tables={table_count}", flush=True)
    embedder = make_embedder(settings)
    vectors = embedder.embed([c.contextual_text for c in chunks]) if chunks else []

    conn = db.open_db(db_path)
    try:
        old = conn.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
        if old is None:
            raise RuntimeError(f"document {doc_id} not found")
        conn.execute(
            "DELETE FROM chunk_fts WHERE rowid IN "
            "(SELECT id FROM document_chunks WHERE document_id=?)",
            (doc_id,),
        )
        conn.execute("DELETE FROM document_chunks WHERE document_id=?", (doc_id,))
        conn.execute(
            """UPDATE documents
               SET parser=?, parser_version=?, markdown_path=?, page_count=?,
                   ingestion_status='done', quarantine_reason=NULL
               WHERE id=?""",
            ("mineru", _parser_version(), str(markdown_path), total_pages, doc_id),
        )
        for chunk, vec in zip(chunks, vectors):
            cur = conn.execute(
                """INSERT INTO document_chunks
                   (document_id, chunk_index, chunk_text, contextual_text, section_path,
                    page_start, page_end, token_count, chunk_type, citation_label,
                    embedding, specialty, evidence_level)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (doc_id, chunk.chunk_index, chunk.chunk_text, chunk.contextual_text,
                 chunk.section_path, chunk.page_start, chunk.page_end, chunk.token_count,
                 chunk.chunk_type, chunk.citation_label, encode_vector(vec),
                 old["specialty"], old["evidence_level"]),
            )
            conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?, ?)",
                         (cur.lastrowid, chunk.chunk_text))
        conn.commit()
    finally:
        conn.close()

    summary = {
        "doc_id": doc_id,
        "pages": total_pages,
        "blocks": len(all_blocks),
        "tables": table_count,
        "chunks": len(chunks),
        "markdown_path": str(markdown_path),
        "elapsed_s": round(time.time() - started, 1),
        "failed_ranges": result.failed_ranges,
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2),
                                          encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    return summary


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Reprocess a large PDF with MinerU in batches.")
    ap.add_argument("path")
    ap.add_argument("--db", required=True)
    ap.add_argument("--doc-id", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch-pages", type=int, default=48)
    args = ap.parse_args(argv)
    run(args.path, db_path=args.db, doc_id=args.doc_id, out_dir=args.out,
        batch_pages=args.batch_pages)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
