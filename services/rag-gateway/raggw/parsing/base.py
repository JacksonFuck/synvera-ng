"""Parser port + shared helpers (heading detection, complexity assessment)."""
from __future__ import annotations

import re
import subprocess
from typing import Protocol, runtime_checkable

from ..models import Block, ParsedDoc

_HEADING_MAX = 60
_PARA_SPLIT = re.compile(r"\n\s*\n")


@runtime_checkable
class Parser(Protocol):
    name: str

    def parse(self, path) -> ParsedDoc: ...


def heading_text(line: str) -> str | None:
    """Return the heading text if `line` looks like a heading, else None.
    Recognizes Markdown ('## X') and ALL-CAPS short lines."""
    s = line.strip()
    if not s or "\n" in s:
        return None
    if s.startswith("#"):
        return s.lstrip("#").strip() or None
    # ponytail: ALL-CAPS short line = heading. Crude but safe (few false positives);
    # liteparse/MinerU markdown supplies real '#' headings for their tiers.
    if s.isupper() and len(s) <= _HEADING_MAX:
        return s
    return None


def is_heading(line: str) -> bool:
    return heading_text(line) is not None


def text_to_blocks(pages: list[tuple[int, str]]) -> list[Block]:
    """Shared: turn (page_no, page_text) pairs into provenance-tagged blocks.
    Section carries across pages; leading heading lines are peeled into headings."""
    blocks: list[Block] = []
    section: str | None = None
    for page_no, page_text in pages:
        for para in _PARA_SPLIT.split(page_text):
            para = para.strip()
            if not para:
                continue
            body: list[str] = []
            for line in para.split("\n"):
                h = heading_text(line)
                if h and not body:
                    section = h
                    blocks.append(Block(h, page_no, section, "heading"))
                else:
                    body.append(line)
            text = " ".join(line.strip() for line in body).strip()
            if text:
                blocks.append(Block(text, page_no, section, "text"))
    return blocks


def _quick_extract(path) -> str:
    try:
        return subprocess.run(
            ["pdftotext", "-l", "2", "-enc", "UTF-8", str(path), "-"],
            capture_output=True, timeout=30,
        ).stdout.decode("utf-8", "replace")
    except Exception:
        return ""


def _liteparse_complexity(path) -> str | None:
    """Use liteparse's native per-page signal when available (best router signal)."""
    try:
        import liteparse
        stats = liteparse.LiteParse(quiet=True).is_complex(str(path))
        if not stats:
            return None
        text_lengths = [int(getattr(s, "text_length", 0) or 0) for s in stats]
        no_text_pages = sum(1 for n in text_lengths if n < 80)
        page_count = len(stats)
        if any(getattr(s, "full_page_image", False) or getattr(s, "is_garbled", False)
               for s in stats):
            return "complex"
        # `needs_ocr` can be true for ordinary articles with embedded figures.
        # Route to MinerU only when the text layer is missing/weak, not merely
        # because the PDF contains images.
        if no_text_pages / max(1, page_count) >= 0.25:
            return "complex"
        if sum(text_lengths) / max(1, page_count) < 500:
            return "complex"
        return "simple"
    except Exception:
        return None


def assess_complexity(path=None, *, sample_text: str | None = None,
                      page_count: int | None = None) -> str:
    """Route to MinerU (complex) vs liteparse (simple). Prefer liteparse's native
    complexity signal; fall back to a text-density heuristic."""
    if sample_text is None and path is not None:
        native = _liteparse_complexity(path)
        if native is not None:
            return native
    if sample_text is None:
        sample_text = _quick_extract(path)
        if page_count is None:
            page_count = max(1, sample_text.count("\f"))
    if page_count is None:
        page_count = 1
    density = len(sample_text.strip()) / max(1, page_count)
    return "complex" if density < 100 else "simple"
