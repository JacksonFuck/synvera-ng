"""CLI: parse a sample corpus to Markdown and report parser quality signals.

This does not write embeddings or mutate the RAG database. It is meant as a gate
before large seeding runs.
"""
from __future__ import annotations

import argparse
import json
import time
from collections import Counter
from pathlib import Path

from ..parsing.router import parse_file
from ..quality import assess_markdown
from .parse_file import SUPPORTED


PDF_ONLY = {".pdf"}


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def discover(path: str | Path, *, exts: set[str]) -> list[Path]:
    root = Path(path)
    if root.is_file():
        return [root] if root.suffix.lower() in exts else []
    return sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in exts)


def _safe_name(path: Path, index: int) -> str:
    stem = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in path.stem)
    stem = stem[:90].strip("_") or "document"
    return f"{index:03d}_{stem}.md"


def score_quality(metrics: dict) -> str:
    if metrics["words"] < 200:
        return "poor"
    if metrics["bad_char_count"] > 20:
        return "poor"
    if metrics["header_footer_lines"] > 12 or metrics["long_lines"] > 30:
        return "review"
    if metrics["heading_count"] == 0 and metrics["page_markers"] > 0:
        return "review"
    return "ok"


def run(folder: str | Path, *, out_dir: str | Path, limit: int = 30,
        pdf_only: bool = True) -> dict:
    exts = PDF_ONLY if pdf_only else SUPPORTED
    files = discover(folder, exts=exts)[:limit]
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    report_path = out / "parser_quality.jsonl"
    summary_path = out / "summary.json"
    parser_counts: Counter[str] = Counter()
    quality_counts: Counter[str] = Counter()
    started = time.time()

    with report_path.open("w", encoding="utf-8") as report:
        for i, path in enumerate(files, 1):
            item = {
                "ts": _now(),
                "i": i,
                "total": len(files),
                "path": str(path),
            }
            try:
                doc = parse_file(path)
                md_path = out / _safe_name(path, i)
                md_path.write_text(doc.markdown, encoding="utf-8")
                metrics = assess_markdown(doc.markdown)
                quality = score_quality(metrics)
                parser_counts[doc.parser] += 1
                quality_counts[quality] += 1
                item.update({
                    "event": "parsed",
                    "parser": doc.parser,
                    "page_count": doc.page_count,
                    "markdown_path": str(md_path),
                    "quality": quality,
                    "metrics": metrics,
                })
            except Exception as exc:  # noqa: BLE001 - audit should finish the sample.
                quality_counts["fail"] += 1
                item.update({
                    "event": "fail",
                    "quality": "fail",
                    "error": f"{type(exc).__name__}: {exc}",
                })
            report.write(json.dumps(item, ensure_ascii=False) + "\n")
            report.flush()
            print(json.dumps(item, ensure_ascii=False), flush=True)

    summary = {
        "folder": str(folder),
        "out_dir": str(out),
        "files": len(files),
        "parser_counts": dict(parser_counts),
        "quality_counts": dict(quality_counts),
        "elapsed_s": round(time.time() - started, 1),
        "report": str(report_path),
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"event": "summary", **summary}, ensure_ascii=False), flush=True)
    return summary


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Audit parser Markdown quality on a file sample.")
    ap.add_argument("folder", help="folder or file to audit")
    ap.add_argument("-o", "--out", default="data/parser_quality_audit",
                    help="directory for markdown samples and reports")
    ap.add_argument("--limit", type=int, default=30, help="number of files to parse")
    ap.add_argument("--all-supported", action="store_true",
                    help="include docx/epub/html/md/txt/xlsx/pptx, not only PDFs")
    args = ap.parse_args(argv)
    run(args.folder, out_dir=args.out, limit=args.limit,
        pdf_only=not args.all_supported)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
