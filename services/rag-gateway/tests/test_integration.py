"""End-to-end through the REAL default registry (liteparse if usable, else pdftotext)."""
from __future__ import annotations

from raggw.parsing.router import parse_file


def test_default_pipeline_parses_real_pdf(sample_pdf):
    doc = parse_file(sample_pdf)  # real complexity assessment + real adapters
    assert doc.page_count >= 1
    assert doc.parser in {"liteparse", "pdftotext"}  # mineru gated off by default
    assert doc.blocks
    md = doc.markdown.lower()
    assert "alpha" in md or "beta" in md
