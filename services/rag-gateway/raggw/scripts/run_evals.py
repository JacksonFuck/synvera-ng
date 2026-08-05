"""CLI for the local Base de Conhecimento baseline (deterministic fixture or local DB).

    python -m raggw.scripts.run_evals --mode fixture --report baseline.json
    RAG_REAL_MODELS=1 python -m raggw.scripts.run_evals --mode local \
        --db data/rag_corpus.db --generation-id active --report baseline.json

Fixture mode seeds a tiny SQLite corpus with FakeEmbedder/FakeReranker and no downloads.
Local mode opens an existing generation read-only, uses the configured local models and
never calls a cloud service. Both modes run hybrid_search + build_evidence_pack, measure
per-item latency, print a no-PHI report, and apply the baseline gate.

The fixture corpus proves the retrieval/citation/abstention contract; local mode evaluates
an existing ingested generation without mutating it.
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import time
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

from .. import db, evals
from ..config import get_settings
from ..embedding import FakeEmbedder, encode_vector, make_embedder
from ..reranking import FakeReranker, make_reranker
from ..retrieval import build_evidence_pack, hybrid_search
from ..vectorstore import make_vector_store

_EMB = FakeEmbedder(dim=8)
_RERANKER = FakeReranker()
_REPORT_VERSION = "baseline-v1"
_DEFAULT_K = 20

_DEFAULT_TESTSET = Path(__file__).resolve().parents[2] / "evals" / "testset.json"


def open_readonly(db_path: str | Path) -> sqlite3.Connection:
    """Open an existing generation without running schema creation or writes."""
    resolved = Path(db_path).expanduser().resolve()
    uri = f"file:{resolved}?mode=ro"
    conn = sqlite3.connect(uri, uri=True, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA query_only = ON")
    return conn

# Fixture corpus: (specialty, evidence_level, citation_label, chunk_text). Themes match the
# testset (sepse/pneumonia/fratura). No-evidence testset queries hit no chunk -> abstain.
_CORPUS = [
    ("intensiva", "guideline", "Surviving Sepsis 2021 p.12",
     "sepse grave tratamento antibiotico precoce reduz mortalidade"),
    ("intensiva", "guideline", "Surviving Sepsis 2021 p.20",
     "sepse lactato ressuscitacao volemica precoce alvo perfusao"),
    ("pneumo", "guideline", "ATS CAP 2019 p.5",
     "pneumonia adquirida comunidade antibioticoterapia empirica"),
    ("pneumo", "rct", "CURB65 validation p.3",
     "pneumonia gravidade escore curb65 estratifica risco"),
    ("orto", "review", "AO Principles ankle p.8",
     "fratura tornozelo imobilizacao gesso conservadora"),
    ("orto", "review", "AO Principles femur p.14",
     "fratura femur fixacao cirurgica haste intramedular"),
]


def seed_corpus(db_path) -> sqlite3.Connection:
    """Build the fixture corpus directly in SQLite (mirrors tests/test_retrieval _seed)."""
    conn = db.open_db(db_path)
    for specialty, ev, label, text in _CORPUS:
        doc_id = conn.execute(
            "INSERT INTO documents (source_path, content_hash, status, specialty, evidence_level) "
            "VALUES (?,?,?,?,?)",
            (f"/{label}.pdf", f"h-{label}", "active", specialty, ev),
        ).lastrowid
        cid = conn.execute(
            """INSERT INTO document_chunks
                 (document_id, chunk_index, chunk_text, contextual_text, section_path,
                  page_start, page_end, token_count, citation_label, embedding,
                  specialty, evidence_level)
               VALUES (?,0,?,?,?,1,1,?,?,?,?,?)""",
            (doc_id, text, text, "Secao", len(text.split()), label,
             encode_vector(_EMB.embed([text])[0]), specialty, ev),
        ).lastrowid
        conn.execute("INSERT INTO chunk_fts (rowid, chunk_text) VALUES (?,?)", (cid, text))
    conn.commit()
    return conn


def real_sources(conn) -> set[str]:
    rows = conn.execute("SELECT citation_label FROM document_chunks").fetchall()
    return {r["citation_label"] for r in rows if r["citation_label"]}


def run_item(conn, item: dict, *, embedder=None, reranker=None, store=None,
             settings=None) -> tuple[dict, float]:
    """Run one testset item. Returns (evidence_pack, latency_ms)."""
    embedder = embedder or _EMB
    reranker = reranker or _RERANKER
    settings = settings or get_settings()
    start = time.perf_counter()
    hits = hybrid_search(
        conn, item["query"], embedder=embedder, reranker=reranker,
        top_k=settings.search_top_k, candidate_n=settings.candidate_n,
        specialty=item.get("specialty"), store=store,
    )
    pack = build_evidence_pack(
        item["query"], hits, top_rerank_min=settings.rerank_min,
        min_supporting_chunks=settings.min_supporting_chunks,
    )
    latency_ms = (time.perf_counter() - start) * 1000.0
    pack["_hits"] = hits  # internal: used for metrics, never serialized
    return pack, latency_ms


def _synth_answer(pack: dict) -> str:
    """Deterministic 'answer' from the top citation (no LLM). Abstain -> empty answer."""
    if pack.get("abstain") or not pack.get("chunks"):
        return ""
    return pack["chunks"][0].get("text", "")


def _expected_patterns(item: dict, key: str, legacy_key: str) -> list[str]:
    values = item.get(key)
    if values is None:
        values = item.get(legacy_key)
    if isinstance(values, str):
        return [values]
    return list(values or [])


def _new_bucket() -> dict:
    """Accumulator mirroring the aggregate metric inputs -- same shape reused per cohort."""
    return {
        "abst_pairs": [], "precisions": [], "faiths": [], "latencies": [],
        "gold_recalls": [], "passage_recalls": [], "ndcgs": [],
        "hit_count": 0, "hit_total": 0,
    }


def _bucket_metrics(bucket: dict) -> dict:
    """Aggregate one bucket into a metrics dict, via the same evals.py functions used
    for the overall aggregate (no new metric math -- just a different subset)."""
    lat = evals.latency_stats(bucket["latencies"])
    faiths, precisions = bucket["faiths"], bucket["precisions"]
    gold_recalls, passage_recalls, ndcgs = (
        bucket["gold_recalls"], bucket["passage_recalls"], bucket["ndcgs"])
    return {
        "faithfulness": sum(faiths) / len(faiths) if faiths else 1.0,
        "citation_precision": sum(precisions) / len(precisions) if precisions else 1.0,
        "abstention_accuracy": evals.abstention_accuracy(bucket["abst_pairs"]),
        "answerability_accuracy": evals.abstention_accuracy(bucket["abst_pairs"]),
        "gold_document_recall_at_20": (sum(gold_recalls) / len(gold_recalls)
                                        if gold_recalls else 1.0),
        "supporting_passage_recall_at_20": (sum(passage_recalls) / len(passage_recalls)
                                            if passage_recalls else 1.0),
        "ndcg_at_20": sum(ndcgs) / len(ndcgs) if ndcgs else 1.0,
        "retrieval_hit_rate": (bucket["hit_count"] / bucket["hit_total"]
                               if bucket["hit_total"] else 1.0),
        "latency_p50_ms": lat["p50"], "latency_p95_ms": lat["p95"],
        "latency_mean_ms": lat["mean"],
    }


def evaluate(conn, items: list[dict], judge: evals.Judge | None = None, *,
             embedder=None, reranker=None, store=None, settings=None) -> dict:
    judge = judge or evals.FakeJudge()
    sources = real_sources(conn)
    per_item: list[dict] = []
    overall = _new_bucket()
    by_cohort: dict[str, dict] = {}

    for item in items:
        cohort = item.get("cohort") or "unknown"  # legacy items may lack cohort
        bucket = by_cohort.setdefault(cohort, _new_bucket())

        pack, ms = run_item(conn, item, embedder=embedder, reranker=reranker,
                            store=store, settings=settings)
        expected_abstain = bool(item["expect_abstain"])
        abst_pair = (expected_abstain, bool(pack["abstain"]))
        precision = evals.citation_precision(pack, sources)
        answer = _synth_answer(pack)
        contexts = [c.get("text", "") for c in pack.get("chunks", [])]
        faith = judge.score(item["query"], answer, contexts)

        source_patterns = _expected_patterns(
            item, "gold_source_substrings", "relevant_source_substr")
        passage_patterns = _expected_patterns(
            item, "supporting_passage_substrings", "relevant_source_substr")
        item_gold = item_passage = item_ndcg = None
        if not expected_abstain and (source_patterns or passage_patterns):
            item_gold = evals.gold_document_recall_at_k(
                pack["_hits"], source_patterns, k=_DEFAULT_K)
            item_passage = evals.supporting_passage_recall_at_k(
                pack["_hits"], passage_patterns, k=_DEFAULT_K)
            item_ndcg = evals.ndcg_at_k(
                pack["_hits"], source_patterns, passage_patterns, k=_DEFAULT_K)

        substr = item.get("relevant_source_substr")
        hit = None
        if substr:
            hit = evals.retrieval_hit_rate(pack["_hits"], substr)

        for target in (overall, bucket):
            target["abst_pairs"].append(abst_pair)
            target["precisions"].append(precision)
            target["faiths"].append(faith)
            target["latencies"].append(ms)
            if item_gold is not None:
                target["gold_recalls"].append(item_gold)
                target["passage_recalls"].append(item_passage)
                target["ndcgs"].append(item_ndcg)
            if substr:
                target["hit_total"] += 1
                target["hit_count"] += int(hit)

        per_item.append({
            "id": item["id"], "cohort": cohort,
            "risk_class": item.get("risk_class"), "source": item.get("source"),
            "got_abstain": pack["abstain"], "expected_abstain": expected_abstain,
            "n_chunks": len(pack["chunks"]), "latency_ms": round(ms, 2),
            "hit": hit,
            "gold_document_recall_at_20": item_gold,
            "supporting_passage_recall_at_20": item_passage,
            "ndcg_at_20": item_ndcg,
        })

    metrics_by_cohort = {cohort: _bucket_metrics(b) for cohort, b in by_cohort.items()}
    return {
        "metrics": _bucket_metrics(overall),
        "per_item": per_item,
        "metrics_by_cohort": metrics_by_cohort,
    }


def _model_descriptor(model, *, kind: str) -> dict:
    info = getattr(model, "info", None)
    details = info() if callable(info) else {}
    return {"kind": kind, "class": type(model).__name__, "config": details}


def _safe_config(settings) -> dict:
    return {
        "embed_dim": settings.embed_dim,
        "embed_device": settings.embed_device,
        "embed_fp16": settings.embed_use_fp16,
        "embed_batch_size": settings.embed_batch_size,
        "search_top_k": settings.search_top_k,
        "candidate_n": settings.candidate_n,
        "rerank_min": settings.rerank_min,
        "min_supporting_chunks": settings.min_supporting_chunks,
        "vector_store": os.environ.get("RAG_VECTOR_STORE", "sqlite"),
        "real_models_requested": os.environ.get("RAG_REAL_MODELS", "0").lower()
        in ("1", "true", "yes"),
    }


def _metric_groups(metrics: dict) -> dict:
    return {
        "retrieval": {
            key: metrics[key] for key in (
                "gold_document_recall_at_20", "supporting_passage_recall_at_20",
                "ndcg_at_20", "retrieval_hit_rate",
            )
        },
        "generation": {"faithfulness": metrics["faithfulness"]},
        "citation": {"citation_precision": metrics["citation_precision"]},
        "safety": {
            "answerability_accuracy": metrics["answerability_accuracy"],
            "abstention_accuracy": metrics["abstention_accuracy"],
        },
        "latency": {
            key: metrics[key] for key in (
                "latency_p50_ms", "latency_p95_ms", "latency_mean_ms",
            )
        },
    }


def _format_report(report: dict, gate_result: dict) -> str:
    m = report["metrics"]
    meta = report["metadata"]
    lines = ["=== Base de Conhecimento baseline (no PHI) ===", ""]
    lines.append(f"generation_id      = {meta['generation_id']}")
    lines.append(f"report_version     = {report['report_version']}")
    lines.append(f"model_mode         = {meta['model_mode']}")
    lines.append(f"evaluation_set     = {meta['evaluation_set_version']}")
    lines.append("")
    for it in report["per_item"]:
        flag = "OK " if it["got_abstain"] == it["expected_abstain"] else "BAD"
        lines.append(
            f"[{flag}] {it['id']}: abstain={it['got_abstain']} "
            f"(want {it['expected_abstain']}) chunks={it['n_chunks']} "
            f"hit={it['hit']} {it['latency_ms']}ms")
    lines += ["", "--- metrics ---"]
    lines.append("[retrieval]")
    lines.append(f"gold_document_recall@20       = {m['gold_document_recall_at_20']:.4f}")
    lines.append(f"supporting_passage_recall@20  = {m['supporting_passage_recall_at_20']:.4f}")
    lines.append(f"nDCG@20                        = {m['ndcg_at_20']:.4f}")
    lines.append(f"retrieval_hit_rate             = {m['retrieval_hit_rate']:.4f}")
    lines.append("[generation]")
    lines.append(f"faithfulness        = {m['faithfulness']:.4f}")
    lines.append("[citation]")
    lines.append(f"citation_precision  = {m['citation_precision']:.4f}")
    lines.append("[safety]")
    lines.append(f"abstention_accuracy = {m['abstention_accuracy']:.4f}")
    lines.append(f"answerability       = {m['answerability_accuracy']:.4f}")
    lines.append("[latency]")
    lines.append(f"latency p50/p95/mean= {m['latency_p50_ms']:.1f}/"
                 f"{m['latency_p95_ms']:.1f}/{m['latency_mean_ms']:.1f} ms")
    verdict = "PASS" if gate_result["passed"] else "FAIL"
    lines += ["", f"GATE: {verdict}"]
    for r in gate_result["reasons"]:
        lines.append(f"  - {r}")
    return "\n".join(lines)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Run the local Base de Conhecimento baseline (no cloud).")
    ap.add_argument("--testset", default=str(_DEFAULT_TESTSET), help="testset JSON path")
    ap.add_argument("--mode", choices=("fixture", "local"), default=None,
                    help="fixture uses Fake models; local reads an existing DB")
    ap.add_argument("--db", default=None,
                    help="existing SQLite generation for --mode local")
    ap.add_argument("--generation-id", default=None,
                    help="generation identifier stored in the report")
    ap.add_argument("--report", default=None,
                    help="write the versioned no-PHI JSON report to this path")
    ap.add_argument("--fail-on-cohort", action="store_true",
                    help="fail the gate if any single cohort misses its thresholds, "
                         "even when the aggregate passes")
    args = ap.parse_args(argv)

    testset = json.loads(Path(args.testset).read_text("utf-8"))
    items = testset["items"]
    mode = args.mode or ("local" if args.db else "fixture")
    settings = get_settings()
    if mode == "local":
        if not args.db:
            raise SystemExit("--mode local requires --db PATH")
        conn = open_readonly(args.db)
        embedder = make_embedder(settings)
        reranker = make_reranker()
        store = make_vector_store(settings)
        generation_id = args.generation_id or Path(args.db).stem
        model_mode = "real" if os.environ.get("RAG_REAL_MODELS", "").lower() \
            in ("1", "true", "yes") else "fake"
    else:
        conn = seed_corpus(":memory:")
        embedder, reranker, store = _EMB, _RERANKER, None
        settings = replace(
            settings, search_top_k=8, candidate_n=50,
            rerank_min=0.3, min_supporting_chunks=1,
        )
        generation_id = args.generation_id or "fixture"
        model_mode = "fake"
    try:
        report = evaluate(conn, items, embedder=embedder, reranker=reranker,
                          store=store, settings=settings)
    finally:
        conn.close()

    report["report_version"] = _REPORT_VERSION
    report["metadata"] = {
        "generation_id": generation_id,
        "evaluation_set_version": testset.get("version", "unversioned"),
        "model_mode": model_mode,
        "embedder": _model_descriptor(embedder, kind="fake" if model_mode == "fake" else "real"),
        "reranker": _model_descriptor(reranker, kind="fake" if model_mode == "fake" else "real"),
        "config": _safe_config(settings),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    report["metric_groups"] = _metric_groups(report["metrics"])
    per_cohort = report["metrics_by_cohort"] if args.fail_on_cohort else None
    gate_result = evals.gate(report["metrics"], per_cohort=per_cohort)
    report["gate"] = gate_result
    if args.report:
        output = Path(args.report)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(_format_report(report, gate_result))
    return 0 if gate_result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
