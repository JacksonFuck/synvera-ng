"""Tiered parser: pdftotext working tier + complexity router (liteparse/MinerU)."""
from __future__ import annotations

import sys
import types

from raggw.models import Block, ParsedDoc
from raggw.parsing import base
from raggw.parsing.pdftotext_parser import PdftotextParser
from raggw.parsing.router import choose_tier, parse_file


# --- pdftotext working tier (real subprocess against the PDF fixture) ---

def test_pdftotext_extracts_all_pages(sample_pdf):
    doc = PdftotextParser().parse(sample_pdf)
    assert doc.page_count == 2
    assert doc.parser == "pdftotext"
    assert {b.page for b in doc.blocks} == {1, 2}
    md = doc.markdown.lower()
    assert "alpha" in md and "beta" in md


def test_pdftotext_blocks_have_page_provenance(sample_pdf):
    doc = PdftotextParser().parse(sample_pdf)
    p1 = " ".join(b.text for b in doc.blocks if b.page == 1).lower()
    p2 = " ".join(b.text for b in doc.blocks if b.page == 2).lower()
    assert "alpha" in p1 and "sepse" in p1
    assert "beta" in p2 and "pneumonia" in p2


def test_pdftotext_detects_section_from_heading(sample_pdf):
    doc = PdftotextParser().parse(sample_pdf)
    body = [b for b in doc.blocks if "alpha" in b.text.lower()]
    assert body, "expected a body block on page 1"
    assert body[0].section_path and "INTRODUCAO" in body[0].section_path


# --- complexity heuristic ---

def test_low_text_density_is_complex():
    assert base.assess_complexity(sample_text="", page_count=5) == "complex"


def test_rich_text_is_simple():
    assert base.assess_complexity(sample_text="word " * 500, page_count=1) == "simple"


def test_liteparse_complexity_keeps_digital_article_simple(monkeypatch, tmp_path):
    fake = types.ModuleType("liteparse")

    class Stats:
        def __init__(self, text_length, needs_ocr=True):
            self.text_length = text_length
            self.needs_ocr = needs_ocr
            self.full_page_image = False
            self.is_garbled = False

    class LiteParse:
        def __init__(self, quiet=True):
            self.quiet = quiet

        def is_complex(self, _path):
            return [Stats(3800), Stats(3600), Stats(6100, needs_ocr=False)]

    fake.LiteParse = LiteParse
    monkeypatch.setitem(sys.modules, "liteparse", fake)

    assert base.assess_complexity(tmp_path / "article.pdf") == "simple"


def test_liteparse_complexity_routes_missing_text_to_mineru(monkeypatch, tmp_path):
    fake = types.ModuleType("liteparse")

    class Stats:
        text_length = 0
        needs_ocr = True
        full_page_image = False
        is_garbled = False

    class LiteParse:
        def __init__(self, quiet=True):
            self.quiet = quiet

        def is_complex(self, _path):
            return [Stats(), Stats()]

    fake.LiteParse = LiteParse
    monkeypatch.setitem(sys.modules, "liteparse", fake)

    assert base.assess_complexity(tmp_path / "scan.pdf") == "complex"


# --- routing: simple -> liteparse, complex -> MinerU, missing -> pdftotext ---

def test_choose_tier_simple_prefers_liteparse():
    assert choose_tier("simple", available={"liteparse", "mineru", "pdftotext"}) == "liteparse"


def test_choose_tier_complex_prefers_mineru():
    assert choose_tier("complex", available={"liteparse", "mineru", "pdftotext"}) == "mineru"


def test_choose_tier_falls_back_to_pdftotext():
    assert choose_tier("simple", available={"pdftotext"}) == "pdftotext"
    assert choose_tier("complex", available={"pdftotext"}) == "pdftotext"


def test_parse_file_dispatches_to_chosen_parser(sample_pdf):
    seen = []

    class Recorder:
        name = "liteparse"

        def parse(self, path):
            seen.append(path)
            return ParsedDoc(markdown="x", blocks=[Block("x", 1)], page_count=1,
                             parser="liteparse")

    doc = parse_file(sample_pdf, parsers={"liteparse": Recorder()}, complexity="simple")
    assert doc.parser == "liteparse"
    assert seen == [sample_pdf]


# --- pdftotext fallback is explicit and visible, not silent ---

def test_parse_file_marks_fallback_from_when_chosen_parser_raises(sample_pdf):
    class Flaky:
        name = "mineru"

        def parse(self, path):
            raise RuntimeError("mineru exploded")

    doc = parse_file(sample_pdf, parsers={"mineru": Flaky(), "pdftotext": PdftotextParser()},
                     complexity="complex", available={"mineru", "pdftotext"})
    assert doc.parser == "pdftotext"
    assert doc.fallback_from == "mineru"


def test_parse_file_leaves_fallback_from_none_on_normal_path(sample_pdf):
    doc = parse_file(sample_pdf, parsers={"pdftotext": PdftotextParser()},
                     complexity="simple", available={"pdftotext"})
    assert doc.parser == "pdftotext"
    assert doc.fallback_from is None
