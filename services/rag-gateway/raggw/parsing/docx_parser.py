"""Native .docx tier: python-docx reads the document directly, so .docx never
routes through PDF parsers (liteparse/pdftotext fail on non-PDF input).
iter_inner_content() preserves heading/paragraph/table order."""
from __future__ import annotations

import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

from ..models import Block, ParsedDoc


class DocxParser:
    name = "docx"

    def parse(self, path) -> ParsedDoc:
        d = docx.Document(str(path))
        blocks: list[Block] = []
        md_parts: list[str] = []
        section: str | None = None
        for item in d.iter_inner_content():
            if isinstance(item, Paragraph):
                text = item.text.strip()
                if not text:
                    continue
                style = (item.style.name or "").lower() if item.style else ""
                if style.startswith("heading") or style == "title":
                    section = text
                    blocks.append(Block(text, 1, section, "heading"))
                    md_parts.append(f"# {text}")
                else:
                    blocks.append(Block(text, 1, section, "text"))
                    md_parts.append(text)
            elif isinstance(item, Table):
                rows = [
                    " | ".join(c.text.strip() for c in row.cells)
                    for row in item.rows
                ]
                table_text = "\n".join(r for r in rows if r.strip(" |"))
                if table_text:
                    blocks.append(Block(table_text, 1, section, "table"))
                    md_parts.append(table_text)
        return ParsedDoc(
            markdown="\n\n".join(md_parts),
            blocks=blocks,
            page_count=1,
            parser=self.name,
            source_path=str(path),
        )
