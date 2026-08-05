"""Text-native tier: .md/.txt files ARE already the target text. Reading them
directly avoids routing markdown/plain text through PDF parsers (liteparse/pdftotext),
which fail on non-PDF input (CalledProcessError). Always available, no subprocess."""
from __future__ import annotations

import re
from pathlib import Path

from ..models import Block, ParsedDoc

_PARA_SPLIT = re.compile(r"\n\s*\n")


class TextParser:
    name = "text"

    def parse(self, path) -> ParsedDoc:
        raw = Path(path).read_text(encoding="utf-8", errors="replace")
        blocks: list[Block] = []
        section: str | None = None
        for para in _PARA_SPLIT.split(raw):
            para = para.strip()
            if not para:
                continue
            first = para.split("\n", 1)[0].strip()
            if first.startswith("#"):  # markdown heading
                section = first.lstrip("#").strip()
                blocks.append(Block(section, 1, section, "heading"))
                body = para[len(para.split("\n", 1)[0]):].strip()
                if body:
                    blocks.append(Block(body, 1, section, "text"))
            else:
                blocks.append(Block(para, 1, section, "text"))
        return ParsedDoc(
            markdown=raw.strip(),
            blocks=blocks,
            page_count=1,
            parser=self.name,
            source_path=str(path),
        )
