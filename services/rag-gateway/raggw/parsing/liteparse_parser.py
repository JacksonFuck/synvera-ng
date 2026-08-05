"""liteparse adapter — simple/fast tier. Apache-2.0, Rust/PDFium, CPU. Emits Markdown.
Constructor raises if liteparse is absent so the router drops it from the registry."""
from __future__ import annotations

from ..models import ParsedDoc
from .base import text_to_blocks


class LiteparseParser:
    name = "liteparse"

    def __init__(self, *, ocr_enabled: bool = False) -> None:
        import liteparse  # ImportError -> excluded from registry (graceful)
        self._LiteParse = liteparse.LiteParse
        self._ocr_enabled = ocr_enabled

    def parse(self, path) -> ParsedDoc:
        lp = self._LiteParse(output_format="markdown", quiet=True,
                             ocr_enabled=self._ocr_enabled)
        res = lp.parse(str(path))
        pages = [
            (getattr(p, "page_number", None) or (i + 1), getattr(p, "text", "") or "")
            for i, p in enumerate(res.pages)
        ]
        return ParsedDoc(
            markdown=getattr(res, "text", "") or "",
            blocks=text_to_blocks(pages),
            page_count=len(res.pages),
            parser=self.name,
            source_path=str(path),
        )
