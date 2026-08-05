"""Baseline evals: metric contracts and the no-PHI CLI report.

All deterministic — FakeEmbedder/FakeReranker, no model downloads, no LLM."""
from __future__ import annotations

import json

import pytest

from raggw.evals import (
    DEFAULT_THRESHOLDS,
    FakeJudge,
    abstention_accuracy,
    citation_precision,
    gate,
    gold_document_recall_at_k,
    latency_stats,
    ndcg_at_k,
    retrieval_hit_rate,
    supporting_passage_recall_at_k,
)
from raggw.retrieval import Hit
from raggw.scripts import record_regression, run_evals


def _hit(label: str, text: str = "", *, document_id: int = 1) -> Hit:
    return Hit(
        chunk_id=1, document_id=document_id, chunk_text=text, citation_label=label,
        page_start=1, page_end=1, section_path=None, specialty=None,
        evidence_level=None, fused_score=0.0, rerank_score=0.9, final_score=0.9,
    )


def _pack(labels: list[str]) -> dict:
    return {"query": "q", "abstain": False,
            "chunks": [{"citation_label": lbl} for lbl in labels]}


# ----- citation_precision ----------------------------------------------------

def test_citation_precision_all_real():
    pack = _pack(["Sepsis Guideline p.1", "Sepsis Guideline p.2"])
    assert citation_precision(pack, {"Sepsis Guideline p.1", "Sepsis Guideline p.2"}) == 1.0


def test_citation_precision_partial():
    pack = _pack(["real p.1", "fabricated p.9"])
    assert citation_precision(pack, {"real p.1"}) == 0.5


def test_citation_precision_no_chunks_is_one():
    # Nothing cited -> nothing fabricated -> vacuously perfect (an abstain is not an error).
    assert citation_precision(_pack([]), {"anything"}) == 1.0


# ----- abstention_accuracy ---------------------------------------------------

def test_abstention_accuracy_all_correct():
    assert abstention_accuracy([(True, True), (False, False)]) == 1.0


def test_abstention_accuracy_half():
    assert abstention_accuracy([(True, True), (True, False)]) == 0.5


def test_abstention_accuracy_empty_is_one():
    assert abstention_accuracy([]) == 1.0


# ----- retrieval_hit_rate ----------------------------------------------------

def test_retrieval_hit_rate_matches_label():
    hits = [_hit("Sepsis Guideline 2021 p.4")]
    assert retrieval_hit_rate(hits, "Sepsis Guideline") is True


def test_retrieval_hit_rate_matches_text():
    hits = [_hit("doc1 p.1", "sepse grave tratamento")]
    assert retrieval_hit_rate(hits, "tratamento") is True


def test_retrieval_hit_rate_miss():
    hits = [_hit("doc1 p.1", "pneumonia")]
    assert retrieval_hit_rate(hits, "fratura") is False


def test_retrieval_hit_rate_empty():
    assert retrieval_hit_rate([], "anything") is False


# ----- retrieval quality metrics --------------------------------------------

def test_gold_document_recall_at_k_uses_ranked_documents():
    hits = [
        _hit("unrelated p.1", "other", document_id=9),
        _hit("Aortic guideline p.4", "acute aortic syndrome", document_id=7),
    ]
    assert gold_document_recall_at_k(hits, ["Aortic guideline"], k=1) == 0.0
    assert gold_document_recall_at_k(hits, ["Aortic guideline"], k=2) == 1.0


def test_supporting_passage_recall_at_k_uses_chunk_text():
    hits = [
        _hit("Guideline p.1", "diagnosis only"),
        _hit("Guideline p.2", "urgent surgical repair is recommended"),
    ]
    assert supporting_passage_recall_at_k(hits, ["urgent surgical repair"], k=2) == 1.0
    assert supporting_passage_recall_at_k(hits, ["urgent surgical repair"], k=1) == 0.0


def test_ndcg_at_k_penalizes_relevant_passage_below_irrelevant_hit():
    hits = [
        _hit("unrelated p.1", "other"),
        _hit("Aortic guideline p.4", "acute aortic syndrome"),
    ]
    score = ndcg_at_k(hits, ["Aortic guideline"], ["acute aortic syndrome"], k=2)
    assert round(score, 6) == round(1 / 1.584962500721156, 6)


def test_ndcg_at_k_is_normalized_when_one_source_has_multiple_chunks():
    hits = [
        _hit("Aortic guideline p.1", "acute aortic syndrome"),
        _hit("Aortic guideline p.2", "acute aortic syndrome"),
    ]
    assert ndcg_at_k(hits, ["Aortic guideline"], ["acute aortic syndrome"], k=2) == 1.0


# ----- latency_stats ---------------------------------------------------------

def test_latency_stats_basic():
    s = latency_stats([10.0, 20.0, 30.0, 40.0])
    assert s["p50"] == 20.0  # nearest-rank p50 of 4 samples: ceil(.5*4)=2 -> ordered[1]
    assert s["p95"] == 40.0  # ceil(.95*4)=4 -> ordered[3]
    assert s["mean"] == 25.0


def test_latency_stats_empty():
    s = latency_stats([])
    assert s == {"p50": 0.0, "p95": 0.0, "mean": 0.0}


# ----- FakeJudge -------------------------------------------------------------

def test_fake_judge_full_support():
    j = FakeJudge()
    # every answer term appears in the context -> faithfulness 1.0
    assert j.score("q", "sepse antibiotico", ["sepse antibiotico precoce"]) == 1.0


def test_fake_judge_partial_support():
    j = FakeJudge()
    # 1 of 2 answer terms present -> 0.5
    assert j.score("q", "sepse fratura", ["sepse grave"]) == 0.5


def test_fake_judge_empty_answer_is_one():
    assert FakeJudge().score("q", "", ["whatever"]) == 1.0


# ----- gate ------------------------------------------------------------------

def _good_metrics() -> dict:
    return {"faithfulness": 0.97, "citation_precision": 0.99,
            "abstention_accuracy": 1.0, "answerability_accuracy": 1.0,
            "gold_document_recall_at_20": 0.97,
            "supporting_passage_recall_at_20": 0.96,
            "ndcg_at_20": 0.95, "latency_p50_ms": 1200.0}


def test_gate_passes_on_good_metrics():
    res = gate(_good_metrics())
    assert res["passed"] is True
    assert res["reasons"] == []


def test_gate_fails_low_citation_precision():
    m = _good_metrics()
    m["citation_precision"] = 0.90
    res = gate(m)
    assert res["passed"] is False
    assert any("citation_precision" in r for r in res["reasons"])


def test_gate_fails_high_latency():
    m = _good_metrics()
    m["latency_p50_ms"] = 9000.0
    res = gate(m)
    assert res["passed"] is False
    assert any("latency" in r for r in res["reasons"])


def test_gate_thresholds_are_configurable():
    m = _good_metrics()
    m["faithfulness"] = 0.80
    assert gate(m)["passed"] is False
    # relax the threshold -> now passes
    relaxed = {**DEFAULT_THRESHOLDS, "faithfulness_min": 0.75}
    assert gate(m, thresholds=relaxed)["passed"] is True


def test_gate_per_cohort_none_is_backward_compatible():
    # Explicit per_cohort=None must behave exactly like the old 2-arg signature.
    res = gate(_good_metrics(), per_cohort=None)
    assert res["passed"] is True
    assert res["reasons"] == []


def test_gate_fails_when_one_cohort_fails_though_aggregate_passes():
    good = _good_metrics()
    bad_cohort = {**_good_metrics(), "citation_precision": 0.10}
    res = gate(good, per_cohort={"sepse": good, "fratura": bad_cohort})
    assert res["passed"] is False
    assert any(r.startswith("cohort=fratura") and "citation_precision" in r
              for r in res["reasons"])
    # the passing cohort must not itself be blamed
    assert not any(r.startswith("cohort=sepse") for r in res["reasons"])


# ----- run_evals smoke test --------------------------------------------------

def test_run_evals_seed_and_query(db_path):
    conn = run_evals.seed_corpus(db_path)
    pack, _ms = run_evals.run_item(
        conn, {"id": "x", "query": "sepse antibiotico", "specialty": "intensiva",
               "expect_abstain": False, "relevant_source_substr": "sepse"})
    assert pack["abstain"] is False
    assert pack["chunks"]
    conn.close()


def test_run_evals_main_reports_and_gates(capsys, db_path):
    rc = run_evals.main(["--mode", "fixture", "--report", str(db_path.with_suffix(".json"))])
    out = capsys.readouterr().out
    assert rc in (0, 1)  # exit code reflects gate; both are valid runs
    assert "citation_precision" in out
    assert "GATE" in out


def test_baseline_report_has_metadata_groups_and_no_raw_queries(tmp_path, capsys):
    report_path = tmp_path / "baseline.json"
    rc = run_evals.main([
        "--mode", "fixture", "--generation-id", "fixture-g0",
        "--report", str(report_path),
    ])
    capsys.readouterr()
    payload = json.loads(report_path.read_text("utf-8"))

    assert rc in (0, 1)
    assert payload["report_version"] == "baseline-v1"
    assert payload["metadata"]["generation_id"] == "fixture-g0"
    assert payload["metadata"]["model_mode"] == "fake"
    assert "retrieval" in payload["metric_groups"]
    assert "generation" in payload["metric_groups"]
    assert "gold_document_recall_at_20" in payload["metric_groups"]["retrieval"]
    assert "supporting_passage_recall_at_20" in payload["metric_groups"]["retrieval"]
    assert "ndcg_at_20" in payload["metric_groups"]["retrieval"]
    assert "acute-aortic-syndromes" in {item["id"] for item in payload["per_item"]}
    assert "anafilaxia" in {item["id"] for item in payload["per_item"]}
    assert "crise-tireotoxica" in {item["id"] for item in payload["per_item"]}
    assert '"query"' not in json.dumps(payload, ensure_ascii=False)


_COHORT_ITEMS = [
    {"id": "sepse-1", "cohort": "sepse", "risk_class": "high_risk",
     "query": "sepse antibiotico precoce tratamento", "specialty": "intensiva",
     "expect_abstain": False, "gold_source_substrings": ["Surviving Sepsis"],
     "supporting_passage_substrings": ["antibiotico precoce"], "source": "curated"},
    {"id": "sepse-2", "cohort": "sepse",
     "query": "sepse lactato ressuscitacao volemica", "specialty": "intensiva",
     "expect_abstain": False, "gold_source_substrings": ["Surviving Sepsis"],
     "supporting_passage_substrings": ["lactato ressuscitacao"], "source": "curated"},
    {"id": "fratura-1", "cohort": "orto",
     "query": "fratura tornozelo imobilizacao gesso", "specialty": "orto",
     "expect_abstain": False, "gold_source_substrings": ["AO Principles ankle"],
     "supporting_passage_substrings": ["imobilizacao gesso"], "source": "curated"},
    # No "cohort" key -- legacy item, must default to "unknown".
    {"id": "no-cohort", "query": "pneumonia adquirida comunidade antibioticoterapia",
     "specialty": "pneumo", "expect_abstain": False,
     "gold_source_substrings": ["ATS CAP"],
     "supporting_passage_substrings": ["antibioticoterapia empirica"]},
]


def test_metrics_by_cohort_partitions_correctly(db_path):
    conn = run_evals.seed_corpus(db_path)
    result = run_evals.evaluate(conn, _COHORT_ITEMS)
    conn.close()

    by_cohort = result["metrics_by_cohort"]
    assert set(by_cohort) == {"sepse", "orto", "unknown"}

    # Recompute each cohort's metrics independently from per_item (same evals.py
    # functions, no new math) and confirm the partition matches exactly.
    for cohort, cohort_metrics in by_cohort.items():
        cohort_items = [it for it in result["per_item"] if it["cohort"] == cohort]
        pairs = [(it["expected_abstain"], it["got_abstain"]) for it in cohort_items]
        assert cohort_metrics["abstention_accuracy"] == abstention_accuracy(pairs)

        golds = [it["gold_document_recall_at_20"] for it in cohort_items
                if it["gold_document_recall_at_20"] is not None]
        expected_gold = sum(golds) / len(golds) if golds else 1.0
        assert cohort_metrics["gold_document_recall_at_20"] == expected_gold

    # per_item carries cohort/risk_class/source, defaulting missing cohort to "unknown".
    no_cohort_item = next(it for it in result["per_item"] if it["id"] == "no-cohort")
    assert no_cohort_item["cohort"] == "unknown"
    assert no_cohort_item["risk_class"] is None
    assert no_cohort_item["source"] is None

    sepse1 = next(it for it in result["per_item"] if it["id"] == "sepse-1")
    assert sepse1["risk_class"] == "high_risk"
    assert sepse1["source"] == "curated"

    # sepse cohort has 2 items -- confirm the "sepse" bucket only saw those 2, not orto's.
    assert len([it for it in result["per_item"] if it["cohort"] == "sepse"]) == 2


def test_local_mode_reads_supplied_db_without_seeding(tmp_path, monkeypatch):
    db_file = tmp_path / "generation.db"
    conn = run_evals.seed_corpus(db_file)
    before = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    conn.close()
    monkeypatch.setenv("RAG_REAL_MODELS", "0")

    rc = run_evals.main([
        "--mode", "local", "--db", str(db_file), "--generation-id", "g-local",
        "--report", str(tmp_path / "local.json"),
    ])

    check = run_evals.open_readonly(db_file)
    after = check.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    check.close()
    assert rc in (0, 1)
    assert before == after


# ----- record_regression ------------------------------------------------------

def _write_testset(path, items=None):
    path.write_text(json.dumps({"version": "baseline-v1", "items": items or []}),
                    encoding="utf-8")


def test_record_regression_appends_new_item(tmp_path):
    testset_path = tmp_path / "testset.json"
    _write_testset(testset_path)

    rc = record_regression.main([
        "--testset", str(testset_path), "--id", "sepse-missed-01",
        "--cohort", "sepse", "--query", "sepse choque refratario vasopressor",
        "--risk-class", "high_risk", "--expect-abstain",
        "--gold-source", "Surviving Sepsis",
        "--supporting-passage", "choque refratario",
    ])
    assert rc == 0

    data = json.loads(testset_path.read_text("utf-8"))
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item == {
        "id": "sepse-missed-01", "cohort": "sepse", "risk_class": "high_risk",
        "query": "sepse choque refratario vasopressor", "expect_abstain": True,
        "gold_source_substrings": ["Surviving Sepsis"],
        "supporting_passage_substrings": ["choque refratario"],
        "source": "production_regression",
    }


def test_record_regression_idempotent_on_duplicate_id(tmp_path):
    testset_path = tmp_path / "testset.json"
    _write_testset(testset_path)
    argv = [
        "--testset", str(testset_path), "--id", "dup-1",
        "--cohort", "orto", "--query", "fratura exposta contaminada",
    ]

    assert record_regression.main(argv) == 0
    assert record_regression.main(argv) == 0  # second call is a no-op, not an error

    data = json.loads(testset_path.read_text("utf-8"))
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == "dup-1"


def test_record_regression_preserves_existing_items(tmp_path):
    testset_path = tmp_path / "testset.json"
    _write_testset(testset_path, items=[{"id": "curated-1", "cohort": "sepse"}])

    record_regression.main([
        "--testset", str(testset_path), "--id", "new-1",
        "--cohort", "sepse", "--query", "q",
    ])

    data = json.loads(testset_path.read_text("utf-8"))
    ids = {it["id"] for it in data["items"]}
    assert ids == {"curated-1", "new-1"}


def test_record_regression_rejects_invalid_risk_class():
    with pytest.raises(SystemExit):
        record_regression.main([
            "--testset", "unused.json", "--id", "x", "--cohort", "c",
            "--query", "q", "--risk-class", "bogus",
        ])
