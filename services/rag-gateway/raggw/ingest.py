"""Ingest pipeline: parse -> chunk -> embed -> store. Dedup by content_hash.
All local, zero egress. Embedder is injected (FakeEmbedder in tests; bge-m3 in prod)."""
from __future__ import annotations

import hashlib
import importlib.metadata
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from .chunking import chunk_document
from .config import Settings
from .embedding import Embedder, encode_vector
from .models import ParsedDoc
from .parsing.router import parse_file
from .quality import gate


@dataclass
class IngestResult:
    document_id: int
    n_chunks: int
    skipped: bool = False
    parser: str | None = None
    markdown_path: str | None = None
    quarantined: bool = False
    quarantine_reason: str | None = None
    degraded_parser: str | None = None  # tier that failed, forcing the pdftotext fallback


_PARSER_PACKAGES = {
    "liteparse": "liteparse",
    "mineru": "mineru",
}


def file_hash(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def _parser_version(parser: str) -> str | None:
    package = _PARSER_PACKAGES.get(parser)
    if not package:
        return None
    try:
        return importlib.metadata.version(package)
    except importlib.metadata.PackageNotFoundError:
        return None


def _write_markdown_artifact(settings: Settings, *, digest: str, path: Path,
                             markdown: str) -> str:
    settings.markdown_dir.mkdir(parents=True, exist_ok=True)
    safe_stem = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in path.stem)
    safe_stem = safe_stem[:90].strip("_") or "document"
    out = settings.markdown_dir / f"{digest[:16]}_{safe_stem}.md"
    out.write_text(markdown, encoding="utf-8")
    return str(out)


def ingest_file(
    conn: sqlite3.Connection,
    path: str | Path,
    *,
    embedder: Embedder,
    settings: Settings,
    parse: Callable[[Any], ParsedDoc] = parse_file,
    metadata: dict | None = None,
    vector_store=None,
) -> IngestResult:
    path = Path(path)
    digest = file_hash(path)

    existing = conn.execute(
        "SELECT id FROM documents WHERE content_hash=?", (digest,)).fetchone()
    if existing:
        return IngestResult(existing["id"], 0, skipped=True)  # dedup: zero egress, no re-work

    meta = metadata or {}
    doc = parse(path)
    markdown_path = _write_markdown_artifact(
        settings, digest=digest, path=path, markdown=doc.markdown)
    title = meta.get("title") or path.stem

    report = gate(doc.markdown, min_words=settings.quality_min_words,
                  max_bad_chars=settings.quality_max_bad_chars)
    if not report.ok:
        # ponytail: quarantine writes a documents row but no chunks/vectors/FTS, so the doc
        # is structurally unretrievable (retrieval JOINs document_chunks). The reprocess tool
        # is the deliberate remediation path and clears quarantine_reason on success.
        cur = conn.execute(
            """INSERT INTO documents
                 (corpus_id, source_path, source_type, title, specialty, evidence_level,
                  publication_year, language, license, content_hash, parser, parser_version,
                  markdown_path, page_count, ingestion_status, quarantine_reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'quarantined', ?)""",
            (meta.get("corpus_id"), str(path), meta.get("source_type"), title,
             meta.get("specialty"), meta.get("evidence_level"), meta.get("publication_year"),
             meta.get("language"), meta.get("license"), digest, doc.parser,
             _parser_version(doc.parser), markdown_path, doc.page_count, report.reason),
        )
        conn.commit()
        return IngestResult(cur.lastrowid, 0, quarantined=True,
                            quarantine_reason=report.reason, parser=doc.parser,
                            markdown_path=markdown_path, degraded_parser=doc.fallback_from)

    chunks = chunk_document(
        doc,
        min_tokens=settings.chunk_min_tokens,
        max_tokens=settings.chunk_max_tokens,
        overlap_tokens=settings.chunk_overlap_tokens,
        title=title,
    )
    vectors = embedder.embed([c.contextual_text for c in chunks]) if chunks else []

    cur = conn.execute(
        """INSERT INTO documents
             (corpus_id, source_path, source_type, title, specialty, evidence_level,
              publication_year, language, license, content_hash, parser, parser_version,
              markdown_path, page_count, ingestion_status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'done')""",
        (meta.get("corpus_id"), str(path), meta.get("source_type"), title,
         meta.get("specialty"), meta.get("evidence_level"), meta.get("publication_year"),
         meta.get("language"), meta.get("license"), digest, doc.parser,
         _parser_version(doc.parser), markdown_path, doc.page_count),
    )
    doc_id = cur.lastrowid

    store_items: list[dict] = []
    for chunk, vec in zip(chunks, vectors):
        ccur = conn.execute(
            """INSERT INTO document_chunks
                 (document_id, chunk_index, chunk_text, contextual_text, section_path,
                  page_start, page_end, token_count, chunk_type, citation_label,
                  embedding, specialty, evidence_level)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (doc_id, chunk.chunk_index, chunk.chunk_text, chunk.contextual_text,
             chunk.section_path, chunk.page_start, chunk.page_end, chunk.token_count,
             chunk.chunk_type, chunk.citation_label, encode_vector(vec),
             meta.get("specialty"), meta.get("evidence_level")),
        )
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?, ?)",
                     (ccur.lastrowid, chunk.chunk_text))
        store_items.append({"id": ccur.lastrowid, "vector": vec,
                            "specialty": meta.get("specialty"), "status": "active"})

    conn.commit()
    # Espelha os vetores no índice ANN (se houver); BLOBs do SQLite seguem canônicos.
    if vector_store is not None and store_items:
        vector_store.add(store_items)
    return IngestResult(doc_id, len(chunks), skipped=False, parser=doc.parser,
                        markdown_path=markdown_path, degraded_parser=doc.fallback_from)
