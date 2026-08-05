"""pdftotext working tier (poppler). Always available; covers the 92.5% digital corpus.
Emits Markdown + page/section-tagged blocks. Real high-quality Markdown comes from
liteparse/MinerU; this keeps the pipeline functional and testable today."""
from __future__ import annotations

import re
import subprocess

from ..models import Block, ParsedDoc
from .base import is_heading

_PARA_SPLIT = re.compile(r"\n\s*\n")


class PdftotextParser:
    name = "pdftotext"

    def parse(self, path) -> ParsedDoc:
        raw = subprocess.run(
            ["pdftotext", "-enc", "UTF-8", str(path), "-"],
            capture_output=True, check=True,
        ).stdout.decode("utf-8", "replace")

        segments = raw.split("\f")
        if segments and not segments[-1].strip():
            segments = segments[:-1]  # drop trailing form-feed artifact

        blocks: list[Block] = []
        md: list[str] = []
        section: str | None = None

        for page_no, page_text in enumerate(segments, start=1):
            md.append(f"\n<!-- page {page_no} -->\n")
            for para in _PARA_SPLIT.split(page_text):
                para = para.strip()
                if not para:
                    continue
                # Peel leading heading lines (headings often abut body with no blank line).
                body_lines: list[str] = []
                for line in para.split("\n"):
                    if is_heading(line) and not body_lines:
                        section = line.strip()
                        blocks.append(Block(section, page_no, section, "heading"))
                        md.append(f"\n## {section}\n")
                    else:
                        body_lines.append(line)
                text = " ".join(line.strip() for line in body_lines).strip()
                if text:
                    blocks.append(Block(text, page_no, section, "text"))
                    md.append(text + "\n")

        return ParsedDoc(
            markdown="".join(md).strip(),
            blocks=blocks,
            page_count=len(segments),
            parser=self.name,
            source_path=str(path),
        )
