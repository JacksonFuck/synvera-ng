"""Quality gate: parsed markdown -> ingest verdict. Low-quality docs are quarantined
with a machine-readable reason code instead of polluting the citable corpus.

ponytail: one source of truth for quality signals (assess_markdown). The offline audit
does 3-way human triage (ok/review/poor); this gate is the binary ingest decision
(ok vs quarantine) with a reason code. Same metrics, no drift."""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# Stable reason codes (persisted in documents.quarantine_reason; surfaced to operators).
NO_EXTRACTABLE_TEXT = "no_extractable_text"   # scanned/empty: nothing to cite
TOO_FEW_WORDS = "too_few_words"               # below policy floor (opt-in via min_words>0)
GARBLED_TEXT = "garbled_text"                 # replacement chars: bad text layer

_HEADER_FOOTER_HINTS = (
    "copyright", "all rights reserved", "www.", "volume ", " vol. ", "issue ",
)

DEFAULT_MAX_BAD_CHARS = 20


@dataclass
class QualityReport:
    status: str            # "ok" | "quarantine"
    reason: str | None
    metrics: dict = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return self.status == "ok"


def assess_markdown(markdown: str) -> dict:
    lines = [line.rstrip() for line in markdown.splitlines()]
    non_empty = [line for line in lines if line.strip()]
    lower = markdown.lower()
    words = re.findall(r"\w+", markdown)
    heading_count = sum(1 for line in lines if line.lstrip().startswith("#"))
    page_markers = lower.count("<!-- page ")
    table_lines = sum(1 for line in lines if "|" in line and "---" not in line)
    bad_char_count = markdown.count("�") + markdown.count("\x01")
    header_footer_lines = sum(
        1 for line in non_empty
        if any(hint in line.lower() for hint in _HEADER_FOOTER_HINTS)
    )
    long_lines = sum(1 for line in non_empty if len(line) > 220)
    return {
        "chars": len(markdown),
        "words": len(words),
        "non_empty_lines": len(non_empty),
        "heading_count": heading_count,
        "page_markers": page_markers,
        "table_like_lines": table_lines,
        "bad_char_count": bad_char_count,
        "header_footer_lines": header_footer_lines,
        "long_lines": long_lines,
    }


def gate(markdown: str, *, min_words: int = 0,
        max_bad_chars: int = DEFAULT_MAX_BAD_CHARS) -> QualityReport:
    metrics = assess_markdown(markdown)
    if metrics["words"] == 0:
        return QualityReport("quarantine", NO_EXTRACTABLE_TEXT, metrics)
    if metrics["bad_char_count"] > max_bad_chars:
        return QualityReport("quarantine", GARBLED_TEXT, metrics)
    if min_words > 0 and metrics["words"] < min_words:
        return QualityReport("quarantine", TOO_FEW_WORDS, metrics)
    return QualityReport("ok", None, metrics)
