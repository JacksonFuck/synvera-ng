#!/usr/bin/env python3
"""Baseline / métricas do Clinical GraphRAG.

Mede:
  - contagens no lexicon e no SQLite
  - cobertura do gold de triplas no lexicon.typed_edges
  - para cada query multi-hop: entidades detectadas, vizinhos tipados, graph_contribution
  - (#9) evidence-pack: triplas com provenance, hit/miss vs gold, invariante de citation

Uso (services/eval/graph):
    # offline (sem rede): lexicon + gold + multihop local
    python run_baseline.py
    python run_baseline.py --out results/baseline.json

    # live: Super-RAG :8099 — search contribution + pack de triplas
    python run_baseline.py --live --pack --out results/baseline_live.json

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

# pack_metrics vive ao lado deste script
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pack_metrics import (  # noqa: E402
    openie_candidate_stats,
    score_pack_against_gold,
    summarize_pack_scores,
    validate_pack_triples,
)

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


def multihop_pack_live(items: list[dict], limit: int = 10) -> dict:
    """Live contra POST /rag/evidence-pack: hit/miss de triplas + invariante (#9)."""
    rows: list[dict] = []
    with httpx.Client(timeout=60.0) as c:
        for it in items[:limit]:
            t0 = time.time()
            row: dict = {"id": it.get("id"), "query": it.get("query")}
            try:
                r = c.post(
                    f"{RAG}/rag/evidence-pack",
                    json={"query": it["query"], "top_k": 6},
                )
                r.raise_for_status()
                pack = r.json()
                inv = validate_pack_triples(pack)
                score = score_pack_against_gold(pack, it)
                ret = pack.get("retrieval") or {}
                row.update({
                    "status": score["status"],
                    "n_triples": score["n_triples"],
                    "n_matching": score["n_matching"],
                    "matching_sample": score["matching_sample"],
                    "chunks": score["chunks"],
                    "abstain": score["abstain"],
                    "invariant_ok": inv["ok"],
                    "invariant_violations": inv["violations"],
                    "graph_contribution": ret.get("graph_contribution"),
                    "retrieval_graph_triples": ret.get("graph_triples"),
                    "wall_s": round(time.time() - t0, 3),
                })
            except Exception as exc:
                row.update({
                    "status": "error",
                    "error": f"{type(exc).__name__}: {exc}",
                    "invariant_ok": True,  # falha de rede ≠ violação de provenance
                    "wall_s": round(time.time() - t0, 3),
                })
            rows.append(row)
    return summarize_pack_scores(rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=Path(__file__).parent / "results" / "baseline.json")
    ap.add_argument("--live", action="store_true",
                    help="chama Super-RAG :8099 (search contribution)")
    ap.add_argument("--pack", action="store_true",
                    help="com --live: valida evidence-pack (graph_triples vs gold)")
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
    # OpenIE store (#21): offline contagens pending/promoted/rejected
    if DB.exists():
        try:
            oconn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
            oconn.row_factory = sqlite3.Row
            report["openie_candidates"] = openie_candidate_stats(oconn)
            oconn.close()
        except Exception as exc:
            report["openie_candidates"] = {"error": type(exc).__name__}
    else:
        report["openie_candidates"] = {"table_present": False, "note": "no db"}
    if args.live:
        report["multihop_live"] = multihop_live(gold_q, limit=args.live_n)
        if args.pack:
            report["multihop_pack"] = multihop_pack_live(gold_q, limit=args.live_n)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = {
        "lexicon_typed": report["lexicon"]["n_typed_edges"],
        "typed_by_rel": report["lexicon"]["typed_by_rel"],
        "db_edges": report["db"].get("edges_by_rel"),
        "gold_triple_recall": report["gold_triples"].get("recall"),
        "multihop_offline_rate": report["multihop_offline"].get("rate"),
        "out": str(args.out),
    }
    if "multihop_live" in report:
        summary["mean_graph_contribution"] = report["multihop_live"].get(
            "mean_graph_contribution")
    if "multihop_pack" in report:
        mp = report["multihop_pack"]
        summary["pack_triple_hit_rate"] = mp.get("pack_triple_hit_rate")
        summary["mean_graph_triples"] = mp.get("mean_graph_triples")
        summary["pack_invariant_ok"] = mp.get("invariant_ok")
        summary["pack_mean_wall_s"] = mp.get("mean_wall_s")
    if "openie_candidates" in report:
        oc = report["openie_candidates"]
        summary["openie_pending"] = oc.get("pending")
        summary["openie_promoted"] = oc.get("promoted")
        summary["openie_rejected"] = oc.get("rejected")
        summary["openie_promote_rate"] = oc.get("promote_rate")
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    # Falha alta: tripla sem provenance no pack quebra o invariante clínico.
    if report.get("multihop_pack", {}).get("invariant_ok") is False:
        print(
            "INVARIANT FAIL: evidence-pack devolveu tripla sem provenance "
            "ou predicado aberto — ver multihop_pack.rows[].invariant_violations",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
