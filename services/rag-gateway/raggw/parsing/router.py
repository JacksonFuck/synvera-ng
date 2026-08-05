"""Complexity router: simple/fast -> liteparse, complex -> MinerU, fallback -> pdftotext.

Adapters are discovered lazily; whichever heavy parser fails to import simply drops
out of the registry and the router falls back to pdftotext (graceful degradation)."""
from __future__ import annotations

import os

from ..models import ParsedDoc
from .base import Parser, assess_complexity
from .pdftotext_parser import PdftotextParser
from .text_parser import TextParser

# Extensões que o pipeline sabe parsear — fonte única para seed/upload/watcher.
SUPPORTED_EXTS = {".pdf", ".docx", ".epub", ".html", ".htm", ".pptx", ".xlsx", ".md", ".txt"}

# Text-native formats: the file already IS the target text; never route to PDF parsers.
_TEXT_EXTS = {".md", ".markdown", ".txt"}
# Word documents get their own native parser (python-docx), never the PDF tiers.
_DOCX_EXTS = {".docx"}

# Preference order per complexity. First available tier wins.
_ORDER = {
    "simple": ["liteparse", "pdftotext", "mineru"],
    "complex": ["mineru", "pdftotext", "liteparse"],
}


def choose_tier(complexity: str, available: set[str]) -> str:
    for tier in _ORDER.get(complexity, _ORDER["simple"]):
        if tier in available:
            return tier
    return "pdftotext"


def default_parsers() -> dict[str, Parser]:
    registry: dict[str, Parser] = {"pdftotext": PdftotextParser(), "text": TextParser()}
    try:
        from .docx_parser import DocxParser
        registry["docx"] = DocxParser()
    except Exception:
        pass
    try:
        from .liteparse_parser import LiteparseParser
        registry["liteparse"] = LiteparseParser()
    except Exception:
        pass
    # MinerU downloads multi-GB models on first run — opt in explicitly (no silent egress).
    if os.environ.get("RAG_ENABLE_MINERU", "").lower() in ("1", "true", "yes"):
        try:
            from .mineru_parser import MineruParser
            registry["mineru"] = MineruParser()
        except Exception:
            pass
    return registry


def parse_file(
    path,
    *,
    parsers: dict[str, Parser] | None = None,
    complexity: str | None = None,
    available: set[str] | None = None,
) -> ParsedDoc:
    registry = parsers if parsers is not None else default_parsers()
    avail = available if available is not None else set(registry)
    # Text-native formats bypass the PDF complexity tiers entirely.
    ext = os.path.splitext(str(path))[1].lower()
    if ext in _TEXT_EXTS and "text" in registry:
        return registry["text"].parse(path)
    if ext in _DOCX_EXTS and "docx" in registry:
        return registry["docx"].parse(path)
    if complexity is None:
        complexity = assess_complexity(path)
    tier = choose_tier(complexity, available=avail)
    parser = registry.get(tier) or registry["pdftotext"]
    try:
        return parser.parse(path)
    except Exception:
        # Graceful degradation: a flaky heavy parser must not kill ingestion.
        # The fallback is made explicit via fallback_from, not silent.
        if parser.name != "pdftotext":
            doc = registry["pdftotext"].parse(path)
            doc.fallback_from = parser.name
            return doc
        raise
