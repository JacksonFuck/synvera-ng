"""CLI: parse a file or folder to high-quality Markdown for RAG (tiered router).

    python -m raggw.scripts.parse_file INPUT [-o OUT_DIR]
"""
from __future__ import annotations

import argparse
from pathlib import Path

from ..parsing.router import SUPPORTED_EXTS as SUPPORTED
from ..parsing.router import parse_file as _parse


def discover(path) -> list[Path]:
    path = Path(path)
    if path.is_file():
        return [path]
    return sorted(p for p in path.rglob("*")
                  if p.is_file() and p.suffix.lower() in SUPPORTED)


def parse_to_markdown(path) -> str:
    return _parse(path).markdown


def run(inputs, out_dir) -> list[Path]:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for f in discover(inputs):
        dest = out / (f.stem + ".md")
        dest.write_text(parse_to_markdown(f), encoding="utf-8")
        written.append(dest)
    return written


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Parse file(s) to high-quality Markdown for semantic RAG.")
    ap.add_argument("input", help="PDF/doc file or folder")
    ap.add_argument("-o", "--out", default="out", help="output dir for .md (default: out/)")
    args = ap.parse_args(argv)
    written = run(args.input, args.out)
    for w in written:
        print(w)
    print(f"[parse] {len(written)} file(s) -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
