"""Phase 5 — eval metrics for the medical RAG gateway. Pure, deterministic functions.

These score the *retrieval/citation/abstention* contract that makes clinical claims
auditable: a citation is only sound if it points at a real source, and the system must
abstain when evidence is weak (never fabricate, especially doses). Faithfulness here is a
deterministic stand-in (FakeJudge); a real LLM judge is a documented follow-up — see Judge.

No model downloads, no network. All local, zero egress.
"""
from __future__ import annotations

import math
import re
from typing import Protocol

# ---- Death criteria (configurable thresholds) -------------------------------
# Defaults match the Phase 5 plan: faithfulness >=0.95, citation_precision >=0.98,
# high abstention accuracy, p50 latency <=5000ms.
DEFAULT_THRESHOLDS: dict[str, float] = {
    "faithfulness_min": 0.95,
    "citation_precision_min": 0.98,
    "abstention_accuracy_min": 0.90,
    "answerability_accuracy_min": 0.95,
    "gold_document_recall_at_20_min": 0.95,
    "supporting_passage_recall_at_20_min": 0.90,
    "ndcg_at_20_min": 0.85,
    "latency_p50_max_ms": 5000.0,
}


def _terms(text: str) -> list[str]:
    return re.findall(r"\w+", (text or "").lower(), flags=re.UNICODE)


def citation_precision(pack: dict, real_sources: set[str]) -> float:
    """Fraction of evidence-pack citations whose citation_label is a real source.

    Vacuously 1.0 when the pack cites nothing (an abstention fabricates no citation)."""
    chunks = pack.get("chunks", [])
    if not chunks:
        return 1.0
    hits = sum(1 for c in chunks if c.get("citation_label") in real_sources)
    return hits / len(chunks)


def abstention_accuracy(results: list[tuple[bool, bool]]) -> float:
    """Accuracy over (expected_abstain, got_abstain) pairs. Empty -> 1.0 (nothing wrong)."""
    if not results:
        return 1.0
    correct = sum(1 for expected, got in results if expected == got)
    return correct / len(results)


def retrieval_hit_rate(hits, relevant_substr: str) -> bool:
    """True if any hit's citation_label or chunk_text contains the relevant substring."""
    needle = (relevant_substr or "").lower()
    if not needle:
        return False
    for h in hits:
        label = (h.citation_label or "").lower()
        text = (h.chunk_text or "").lower()
        if needle in label or needle in text:
            return True
    return False


def _patterns(patterns: str | list[str] | tuple[str, ...] | None) -> list[str]:
    if isinstance(patterns, str):
        patterns = [patterns]
    return [p.casefold() for p in (patterns or []) if p]


def _matches_source(hit, patterns: list[str]) -> bool:
    label = (getattr(hit, "citation_label", "") or "").casefold()
    return any(pattern in label for pattern in patterns)


def _matches_text(hit, patterns: list[str]) -> bool:
    text = (getattr(hit, "chunk_text", "") or "").casefold()
    return any(pattern in text for pattern in patterns)


def gold_document_recall_at_k(hits, gold_source_substrings,
                              *, k: int = 20) -> float:
    """Fraction of expected source families appearing in the top-k hits."""
    patterns = _patterns(gold_source_substrings)
    if not patterns:
        return 1.0
    ranked = hits[:max(0, k)]
    matched = sum(any(_matches_source(hit, [pattern]) for hit in ranked)
                  for pattern in patterns)
    return matched / len(patterns)


def supporting_passage_recall_at_k(hits, supporting_substrings,
                                   *, k: int = 20) -> float:
    """Fraction of expected supporting passages found in the top-k hits."""
    patterns = _patterns(supporting_substrings)
    if not patterns:
        return 1.0
    ranked = hits[:max(0, k)]
    matched = sum(any(_matches_text(hit, [pattern]) for hit in ranked)
                  for pattern in patterns)
    return matched / len(patterns)


def ndcg_at_k(hits, gold_source_substrings=None, supporting_substrings=None,
              *, k: int = 20) -> float:
    """Binary-relevance nDCG for source-family or passage-level expectations."""
    source_patterns = _patterns(gold_source_substrings)
    text_patterns = _patterns(supporting_substrings)
    if not source_patterns and not text_patterns:
        return 1.0
    ranked = hits[:max(0, k)]
    relevance = [int(_matches_source(h, source_patterns) or
                     _matches_text(h, text_patterns)) for h in ranked]
    if not relevance:
        return 0.0

    def dcg(values: list[int]) -> float:
        return sum((2 ** rel - 1) / math.log2(index + 2)
                   for index, rel in enumerate(values))

    # The expected labels identify source families/passages, while a source can
    # legitimately contribute multiple relevant chunks. Normalize against the
    # best ordering of the observed candidate pool so nDCG stays in [0, 1].
    ideal = sorted(relevance, reverse=True)
    ideal_score = dcg(ideal)
    return dcg(relevance) / ideal_score if ideal_score else 0.0


def latency_stats(samples_ms: list[float]) -> dict[str, float]:
    """p50, p95 (nearest-rank), and mean. Empty -> all zeros."""
    if not samples_ms:
        return {"p50": 0.0, "p95": 0.0, "mean": 0.0}
    ordered = sorted(samples_ms)
    n = len(ordered)

    def pct(p: float) -> float:
        # Nearest-rank: rank = ceil(p/100 * n), clamped to [1, n].
        rank = max(1, min(n, math.ceil(p / 100.0 * n)))
        return ordered[rank - 1]

    return {
        "p50": pct(50),
        "p95": pct(95),
        "mean": sum(ordered) / n,
    }


class Judge(Protocol):
    """Faithfulness judge: how well an answer is supported by its retrieved contexts.

    Real implementation = a local LLM grading answer-vs-context (follow-up: wire the
    orchestrator/MedGemma as the grader, no egress). FakeJudge below is the deterministic
    stand-in used in CI so the harness is exercisable without a model."""

    def score(self, query: str, answer: str, contexts: list[str]) -> float: ...


class FakeJudge:
    """Deterministic faithfulness proxy: fraction of answer terms present in the contexts.

    NOT semantic — only stable, so the eval pipeline runs without an LLM. Empty answer
    -> 1.0 (nothing claimed, nothing unsupported)."""

    def score(self, query: str, answer: str, contexts: list[str]) -> float:
        ans_terms = _terms(answer)
        if not ans_terms:
            return 1.0
        ctx_terms = set()
        for c in contexts:
            ctx_terms.update(_terms(c))
        supported = sum(1 for t in ans_terms if t in ctx_terms)
        return supported / len(ans_terms)


def gate(metrics: dict, thresholds: dict[str, float] | None = None,
         per_cohort: dict[str, dict] | None = None) -> dict:
    """Apply the death criteria. Returns {passed, reasons}. Missing metrics fail loud.

    per_cohort, when given, maps cohort -> that cohort's metrics dict (same shape as
    `metrics`). Each cohort is checked against the same thresholds; a failing cohort
    fails the overall gate even when the aggregate passes, and reasons name it
    ("cohort=<name>: ..."). None (default) keeps aggregate-only behavior unchanged."""
    th = thresholds or DEFAULT_THRESHOLDS

    def reasons_for(m: dict) -> list[str]:
        found: list[str] = []

        def check_min(key: str, th_key: str) -> None:
            val = m.get(key)
            if val is None:
                found.append(f"{key}: missing")
            elif val < th[th_key]:
                found.append(f"{key}={val:.4f} < {th[th_key]}")

        check_min("faithfulness", "faithfulness_min")
        check_min("citation_precision", "citation_precision_min")
        check_min("abstention_accuracy", "abstention_accuracy_min")
        check_min("answerability_accuracy", "answerability_accuracy_min")
        check_min("gold_document_recall_at_20", "gold_document_recall_at_20_min")
        check_min("supporting_passage_recall_at_20",
                  "supporting_passage_recall_at_20_min")
        check_min("ndcg_at_20", "ndcg_at_20_min")

        lat = m.get("latency_p50_ms")
        if lat is None:
            found.append("latency_p50_ms: missing")
        elif lat > th["latency_p50_max_ms"]:
            found.append(f"latency_p50_ms={lat:.1f} > {th['latency_p50_max_ms']}")
        return found

    reasons = reasons_for(metrics)
    for cohort, cohort_metrics in (per_cohort or {}).items():
        reasons += [f"cohort={cohort}: {r}" for r in reasons_for(cohort_metrics)]

    return {"passed": not reasons, "reasons": reasons}
