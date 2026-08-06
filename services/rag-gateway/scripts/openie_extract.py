#!/usr/bin/env python3
"""CLI offline: candidatos OpenIE via Gemma-4 local (#19).

    cd services/rag-gateway
    .venv/bin/python scripts/openie_extract.py --limit 20
    .venv/bin/python scripts/openie_extract.py --limit 50 --after-chunk-id 12345

Nunca promove. Nunca usa cloud. Resume com --after-chunk-id do run anterior.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from raggw import db  # noqa: E402
from raggw.config import get_settings  # noqa: E402
from raggw.graph.lexicon import load_lexicon  # noqa: E402
from raggw.graph.openie_extract import run_extract_batch  # noqa: E402
from raggw.graph.store import load_required_lexicon  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="OpenIE extract → pending candidates")
    ap.add_argument("--limit", type=int, default=50, help="max chunks this run")
    ap.add_argument("--after-chunk-id", type=int, default=0, help="resume after this id")
    ap.add_argument("--max-pairs", type=int, default=12, help="entity pairs per chunk")
    ap.add_argument("--db", type=str, default=None, help="override RAG_DB_PATH")
    args = ap.parse_args()

    settings = get_settings()
    db_path = args.db or str(settings.db_path)
    lex = load_required_lexicon(settings)
    if lex is None:
        # fallback path env
        path = os.environ.get("RAG_GRAPH_LEXICON")
        if path:
            lex = load_lexicon(path)
    if lex is None:
        print("ERRO: léxico não carregado (RAG_GRAPH_LEXICON)", file=sys.stderr)
        return 1

    conn = db.open_db(db_path)
    try:
        report = run_extract_batch(
            conn, lex,
            limit=args.limit,
            after_chunk_id=args.after_chunk_id,
            max_pairs=args.max_pairs,
        )
    finally:
        conn.close()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(
        f"# resume: --after-chunk-id {report['last_chunk_id']}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
