"""Core dataclasses passed between parse -> chunk -> store."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Block:
    """A unit of parsed content with provenance (page + section)."""
    text: str
    page: int
    section_path: str | None = None
    block_type: str = "text"  # text|table|figure_caption|heading


@dataclass
class ParsedDoc:
    """Output of a Parser tier: high-quality markdown + provenance-carrying blocks."""
    markdown: str
    blocks: list[Block]
    page_count: int = 0
    parser: str = ""            # which tier produced it: liteparse|mineru|pdftotext
    source_path: str | None = None
    fallback_from: str | None = None  # tier that raised, triggering pdftotext fallback


@dataclass
class Chunk:
    """A citable retrieval unit."""
    chunk_index: int
    chunk_text: str
    contextual_text: str
    section_path: str | None
    page_start: int
    page_end: int
    token_count: int
    chunk_type: str = "text"
    citation_label: str = ""
    embedding: list[float] = field(default_factory=list)
