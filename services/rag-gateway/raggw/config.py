"""Settings — env-driven. ponytail: ~8 values, no settings framework needed."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    db_path: Path
    markdown_dir: Path
    chunk_min_tokens: int
    chunk_max_tokens: int
    chunk_overlap_tokens: int
    embed_dim: int
    embed_device: str
    embed_use_fp16: bool
    embed_batch_size: int
    search_top_k: int
    candidate_n: int
    rerank_min: float
    min_supporting_chunks: int
    quality_min_words: int
    quality_max_bad_chars: int
    diversity_family_cap: int


def get_settings() -> Settings:
    # Read at call time so tests can override via env / monkeypatch.
    db_path = Path(os.environ.get("RAG_DB_PATH", "data/rag_gateway.db"))
    return Settings(
        host=os.environ.get("RAG_HOST", "127.0.0.1"),  # zero-egress: loopback only
        port=int(os.environ.get("RAG_PORT", "8099")),
        db_path=db_path,
        markdown_dir=Path(os.environ.get("RAG_MARKDOWN_DIR", str(db_path.parent / "parsed_markdown"))),
        chunk_min_tokens=int(os.environ.get("RAG_CHUNK_MIN", "350")),
        chunk_max_tokens=int(os.environ.get("RAG_CHUNK_MAX", "700")),
        chunk_overlap_tokens=int(os.environ.get("RAG_CHUNK_OVERLAP", "90")),
        embed_dim=int(os.environ.get("RAG_EMBED_DIM", "1024")),
        embed_device=os.environ.get("RAG_EMBED_DEVICE", "cpu").strip().lower() or "cpu",
        embed_use_fp16=os.environ.get("RAG_EMBED_FP16", "").lower() in ("1", "true", "yes"),
        embed_batch_size=int(os.environ.get("RAG_EMBED_BATCH_SIZE", "12")),
        search_top_k=int(os.environ.get("RAG_SEARCH_TOP_K", "8")),
        candidate_n=int(os.environ.get("RAG_CANDIDATE_N", "50")),
        rerank_min=float(os.environ.get("RAG_RERANK_MIN", "0.3")),
        min_supporting_chunks=int(os.environ.get("RAG_MIN_SUPPORTING", "1")),
        quality_min_words=int(os.environ.get("RAG_QUALITY_MIN_WORDS", "0")),
        quality_max_bad_chars=int(os.environ.get("RAG_QUALITY_MAX_BAD_CHARS", "20")),
        diversity_family_cap=int(os.environ.get("RAG_DIVERSITY_FAMILY_CAP", "3")),
    )
