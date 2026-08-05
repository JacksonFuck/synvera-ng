"""Shared test fixtures. Builds a real multi-page PDF with no extra deps."""
from __future__ import annotations

from pathlib import Path

import pytest


def _content_stream(lines: list[str]) -> str:
    parts = ["BT", "/F1 14 Tf", "72 720 Td"]
    for i, line in enumerate(lines):
        safe = line.replace("\\", "").replace("(", "").replace(")", "")
        parts.append(f"({safe}) Tj" if i == 0 else f"0 -18 Td ({safe}) Tj")
    parts.append("ET")
    return "\n".join(parts)


def make_pdf(pages: list) -> bytes:
    """Minimal valid multi-page PDF. Each page is a str (one line) or list[str] (lines).

    Hand-rolled (no reportlab/fpdf dep) so pdftotext extracts known text per page,
    separated by form-feed (\\f). Keep strings free of ()\\ characters.
    """
    pages = [[p] if isinstance(p, str) else list(p) for p in pages]
    n = len(pages)
    page_nums, content_nums, num = [], [], 3
    for _ in range(n):
        page_nums.append(num); num += 1
        content_nums.append(num); num += 1
    font_num = num

    parts: list[tuple[int, str]] = []
    def obj(k: int, body: str) -> None:
        parts.append((k, f"{k} 0 obj\n{body}\nendobj\n"))

    obj(1, "<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join(f"{p} 0 R" for p in page_nums)
    obj(2, f"<< /Type /Pages /Kids [{kids}] /Count {n} >>")
    for i in range(n):
        obj(page_nums[i],
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_nums[i]} 0 R "
            f"/Resources << /Font << /F1 {font_num} 0 R >> >> >>")
        stream = _content_stream(pages[i])
        obj(content_nums[i], f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream")
    obj(font_num, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    out = b"%PDF-1.4\n"
    offsets: dict[int, int] = {}
    for k, text in parts:
        offsets[k] = len(out)
        out += text.encode("latin-1")
    xref_pos = len(out)
    max_n = max(offsets)
    out += f"xref\n0 {max_n + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for k in range(1, max_n + 1):
        out += f"{offsets[k]:010d} 00000 n \n".encode()
    out += (f"trailer\n<< /Size {max_n + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF").encode()
    return out


@pytest.fixture
def sample_pdf(tmp_path: Path) -> Path:
    p = tmp_path / "sample.pdf"
    p.write_bytes(make_pdf([
        ["INTRODUCAO", "texto de corpo alpha sobre sepse grave em adultos"],
        ["METODOS", "texto de corpo beta sobre pneumonia adquirida na comunidade"],
    ]))
    return p


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "test.db"
