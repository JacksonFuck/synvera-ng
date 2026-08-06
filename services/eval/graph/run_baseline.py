#!/usr/bin/env python3
"""Baseline / métricas do Clinical GraphRAG.

Mede:
  - contagens no lexicon e no SQLite
  - cobertura do gold de triplas no lexicon.typed_edges
  - para cada query multi-hop: entidades detectadas, vizinhos tipados, graph_contribution

Uso (services/eval/graph):
    python run_baseline.py
    python run_baseline.py --out results/baseline.json

Não chama LLM de indexação. Retrieval usa Super-RAG :8099 se disponível.
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
import time
import unicodedata
from collections import Counter
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[3]  # Synvera-ng (…/eval/graph → repo root)
LEX = ROOT / "services" / "rag-gateway" / "raggw" / "graph" / "lexicon.json"
GOLD_T = Path(__file__).parent / "gold_triples.json"
GOLD_Q = Path(__file__).parent / "gold_multihop.json"
RAG = os.environ.get("SIMVERA_RAG_URL", "http://127.0.0.1:8099")
DB = Path(os.environ.get(
    "RAG_DB_PATH",
    str(ROOT / "data" / "index" / "rag_corpus.db"),
))


def normalize(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s)
    return " ".join(
        "".join(c for c in nfd if unicodedata.category(c) != "Mn").lower().split()
    )


def load_lexicon() -> dict:
    return json.loads(LEX.read_text(encoding="utf-8"))


def detect(query: str, entities: list[dict]) -> set[str]:
    padded = f" {normalize(query)} "
    found = set()
    for e in entities:
        for s in e.get("surfaces") or []:
            ns = normalize(s)
            if len(ns) >= 3 and f" {ns} " in padded:
                found.add(e["id"])
                break
    return found


def typed_neighbors(lex: dict, seeds: set[str]) -> set[str]:
    out = set()
    for a, rel, b in lex.get("typed_edges") or []:
        if a in seeds:
            out.add(b)
        if b in seeds:
            out.add(a)
    return out


def db_stats() -> dict:
    if not DB.exists():
        return {"error": f"missing {DB}"}
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    out = {
        "nodes": conn.execute("SELECT COUNT(*) FROM graph_nodes").fetchone()[0],
        "edges_by_rel": dict(conn.execute(
            "SELECT rel, COUNT(*) FROM graph_edges GROUP BY rel").fetchall()),
        "chunk_links": conn.execute(
            "SELECT COUNT(*) FROM graph_chunk_entities").fetchone()[0],
    }
    conn.close()
    return out


def gold_triple_coverage(lex: dict, gold: list[dict]) -> dict:
    edge_set = {(a, rel, b) for a, rel, b in (lex.get("typed_edges") or [])}
    ids = {e["id"] for e in lex.get("entities") or []}
    hit = miss = skip = 0
    missing = []
    for g in gold:
        a, rel, b = g["source"], g["predicate"], g["target"]
        if a not in ids or b not in ids:
            skip += 1
            continue
        if (a, rel, b) in edge_set:
            hit += 1
        else:
            miss += 1
            missing.append(f"{a}-[{rel}]->{b}")
    evaluable = hit + miss
    return {
        "hit": hit,
        "miss": miss,
        "skip_unknown_entity": skip,
        "recall": (hit / evaluable) if evaluable else None,
        "missing_sample": missing[:15],
    }


def multihop_offline(lex: dict, items: list[dict]) -> dict:
    """Sem rede: seed detect + vizinho tipado cobre expect_entities?"""
    ents = lex.get("entities") or []
    ok = 0
    details = []
    for it in items:
        seeds = detect(it["query"], ents)
        neigh = typed_neighbors(lex, seeds) | seeds
        expected = set(it.get("expect_entities") or [])
        # entidades do gold que existem no léxico
        expected = {e for e in expected if any(x["id"] == e for x in ents)}
        covered = expected <= neigh if expected else False
        # se expect vazio após filtro, não conta
        if not expected:
            details.append({"id": it["id"], "status": "skip", "seeds": sorted(seeds)})
            continue
        if covered:
            ok += 1
            details.append({"id": it["id"], "status": "hit", "seeds": sorted(seeds)})
        else:
            details.append({
                "id": it["id"], "status": "miss", "seeds": sorted(seeds),
                "neigh": sorted(neigh)[:20], "expected": sorted(expected),
            })
    n = sum(1 for d in details if d["status"] != "skip")
    return {"hit": ok, "n": n, "rate": (ok / n) if n else None, "details": details}


def multihop_live(items: list[dict], limit: int = 10) -> dict:
    rows = []
    with httpx.Client(timeout=45.0) as c:
        for it in items[:limit]:
            t0 = time.time()
            try:
                r = c.post(f"{RAG}/rag/search", json={"query": it["query"], "top_k": 6})
                r.raise_for_status()
                body = r.json()
                ret = body.get("retrieval") or {}
                rows.append({
                    "id": it["id"],
                    "total_s": ret.get("total_s"),
                    "graph_candidates": ret.get("graph_candidates"),
                    "graph_contribution": ret.get("graph_contribution"),
                    "dominant": ret.get("dominant_stage"),
                    "stages": ret.get("stage_timings_s"),
                    "wall_s": round(time.time() - t0, 3),
                })
            except Exception as exc:
                rows.append({"id": it["id"], "error": f"{type(exc).__name__}: {exc}"})
    contrib = [r.get("graph_contribution") for r in rows
               if isinstance(r.get("graph_contribution"), (int, float))]
    return {
        "n": len(rows),
        "mean_graph_contribution": (sum(contrib) / len(contrib)) if contrib else None,
        "rows": rows,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=Path(__file__).parent / "results" / "baseline.json")
    ap.add_argument("--live", action="store_true", help="chama Super-RAG :8099")
    ap.add_argument("--live-n", type=int, default=10)
    args = ap.parse_args()

    if not LEX.exists():
        print(f"ERRO: {LEX} — rode build_lexicon.py", file=sys.stderr)
        return 1

    lex = load_lexicon()
    gold_t = json.loads(GOLD_T.read_text(encoding="utf-8"))
    gold_q = json.loads(GOLD_Q.read_text(encoding="utf-8"))
    rels = Counter(t[1] for t in (lex.get("typed_edges") or []))

    report = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "policy": {
            "indexing_llm": "gemma-4-local-only",
            "gemma_url_env": "SIMVERA_GEMMA_URL",
            "extraction_phase1": "deterministic-surface-match",
        },
        "lexicon": {
            "path": str(LEX),
            "n_entities": len(lex.get("entities") or []),
            "n_typed_edges": len(lex.get("typed_edges") or []),
            "typed_by_rel": dict(rels),
        },
        "db": db_stats(),
        "gold_triples": gold_triple_coverage(lex, gold_t),
        "multihop_offline": multihop_offline(lex, gold_q),
    }
    if args.live:
        report["multihop_live"] = multihop_live(gold_q, limit=args.live_n)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "lexicon_typed": report["lexicon"]["n_typed_edges"],
        "typed_by_rel": report["lexicon"]["typed_by_rel"],
        "db_edges": report["db"].get("edges_by_rel"),
        "gold_triple_recall": report["gold_triples"].get("recall"),
        "multihop_offline_rate": report["multihop_offline"].get("rate"),
        "out": str(args.out),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
