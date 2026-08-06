#!/usr/bin/env python3
"""Injeta arestas tipadas do lexicon.json no grafo SQLite sem rebuild completo.

Mais barato que `build_graph.py` (que reprocessa 1,2M chunks). Preserva
graph_nodes e graph_chunk_entities; substitui apenas edges com rel <> 'cooc'
e reinsere as tipadas do léxico (peso 5.0, igual a GraphStore.build_from_chunks).

Uso:
    .venv/bin/python scripts/inject_typed_edges.py
"""
from __future__ import annotations

import json
import os
import sqlite3
import sys
from collections import Counter
from pathlib import Path

PKG = Path(__file__).resolve().parents[1]
LEX = PKG / "raggw" / "graph" / "lexicon.json"


def main() -> int:
    db_path = Path(os.environ.get("RAG_DB_PATH", str(PKG / "data" / "rag_corpus.db")))
    if not db_path.exists():
        # monorepo layout
        alt = PKG.parents[1] / "data" / "index" / "rag_corpus.db"
        if alt.exists():
            db_path = alt
        else:
            print(f"ERRO: DB não encontrado: {db_path}", file=sys.stderr)
            return 1
    if not LEX.exists():
        print(f"ERRO: {LEX} ausente — rode build_lexicon.py antes", file=sys.stderr)
        return 1

    data = json.loads(LEX.read_text(encoding="utf-8"))
    typed = data.get("typed_edges") or []
    entity_ids = {e["id"] for e in data.get("entities") or []}

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    # schema
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS graph_edges (
            a TEXT NOT NULL, b TEXT NOT NULL, rel TEXT NOT NULL DEFAULT 'cooc',
            weight REAL NOT NULL DEFAULT 0, PRIMARY KEY (a, b, rel)
        );
        """
    )
    before = dict(conn.execute(
        "SELECT rel, COUNT(*) c FROM graph_edges GROUP BY rel").fetchall())
    print(f"banco : {db_path}")
    print(f"antes : {before}")
    print(f"lexicon typed_edges: {len(typed)}")

    # remove tipadas antigas; mantém cooc
    conn.execute("DELETE FROM graph_edges WHERE rel <> 'cooc'")
    n_ok = n_skip = 0
    for row in typed:
        if len(row) != 3:
            n_skip += 1
            continue
        a, rel, b = str(row[0]), str(row[1]), str(row[2])
        if a not in entity_ids or b not in entity_ids or a == b:
            n_skip += 1
            continue
        # nós devem existir (ou inserimos stub a partir do léxico)
        for eid in (a, b):
            ent = next((e for e in data["entities"] if e["id"] == eid), None)
            if ent:
                conn.execute(
                    "INSERT OR IGNORE INTO graph_nodes (entity_id, label, kind) VALUES (?,?,?)",
                    (ent["id"], ent.get("label", ent["id"]), ent.get("kind", "entity")),
                )
        conn.execute(
            "INSERT OR REPLACE INTO graph_edges (a, b, rel, weight) VALUES (?,?,?,?)",
            (a, b, rel, 5.0),
        )
        n_ok += 1
    conn.commit()
    after = dict(conn.execute(
        "SELECT rel, COUNT(*) c FROM graph_edges GROUP BY rel").fetchall())
    print(f"inseridas: {n_ok}  skip: {n_skip}")
    print(f"depois: {after}")
    conn.execute("ANALYZE")
    conn.commit()
    conn.close()
    return 0 if n_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
