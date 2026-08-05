"""MinerU adapter — complex tier (tables/formulas/multicolumn/dense scan). High-quality
Markdown via the MinerU CLI. Parses *_content_list.json for per-block page provenance.

NOTE: MinerU downloads model weights on first run (public models, not PHI — but multi-GB).
Gated behind RAG_ENABLE_MINERU so seeding never triggers a surprise download."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from ..models import Block, ParsedDoc
from .base import heading_text


class MineruParser:
    name = "mineru"

    def __init__(self) -> None:
        venv_cli = Path(sys.executable).parent / "mineru"
        self._cli = shutil.which("mineru") or (str(venv_cli) if venv_cli.exists() else None)
        if not self._cli:
            import mineru  # noqa: F401 — ImportError -> excluded from registry

    def parse(self, path) -> ParsedDoc:
        path = Path(path)
        with tempfile.TemporaryDirectory() as out:
            cmd = [
                self._cli or "mineru",
                "-p", str(path),
                "-o", out,
                "-m", os.environ.get("RAG_MINERU_METHOD", "auto"),
                "-b", os.environ.get("RAG_MINERU_BACKEND", "pipeline"),
            ]
            if os.environ.get("RAG_MINERU_START_PAGE"):
                cmd.extend(["-s", os.environ["RAG_MINERU_START_PAGE"]])
            if os.environ.get("RAG_MINERU_END_PAGE"):
                cmd.extend(["-e", os.environ["RAG_MINERU_END_PAGE"]])
            subprocess.run(cmd, check=True, capture_output=True)
            content_list = next(Path(out).rglob("*_content_list.json"), None)
            md_file = next(Path(out).rglob("*.md"), None)
            markdown = md_file.read_text("utf-8") if md_file else ""

            blocks: list[Block] = []
            section: str | None = None
            pages_seen: set[int] = set()
            if content_list:
                for item in json.loads(content_list.read_text("utf-8")):
                    page_no = int(item.get("page_idx", 0)) + 1
                    pages_seen.add(page_no)
                    table = (item.get("table_body") or "").strip()
                    if table:
                        blocks.append(Block(table, page_no, section, "table"))
                        continue

                    text = (item.get("text") or "").strip()
                    if not text:
                        continue
                    heading = heading_text(text)
                    if heading:
                        section = heading
                        blocks.append(Block(heading, page_no, section, "heading"))
                    else:
                        blocks.append(Block(text, page_no, section, "text"))

            return ParsedDoc(
                markdown=markdown,
                blocks=blocks,
                page_count=max(pages_seen) if pages_seen else 0,
                parser=self.name,
                source_path=str(path),
            )
