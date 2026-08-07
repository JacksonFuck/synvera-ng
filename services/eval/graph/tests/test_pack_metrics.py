"""Harness multi-hop: métricas de evidence-pack (#9) — offline, sem rede."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pack_metrics import (  # noqa: E402
    openie_candidate_stats,
    score_pack_against_gold,
    summarize_pack_scores,
    validate_pack_triples,
)


def _t(**kw):
    base = {
        "source": "drug-noradrenalina",
        "predicate": "trata",
        "target": "sepse",
        "citation_label": "Knobel p. 210",
    }
    base.update(kw)
    return base


def test_validate_ok_with_closed_cited_triples():
    inv = validate_pack_triples({"graph_triples": [_t(), _t(predicate="dd", source="itu")]})
    assert inv["ok"] is True
    assert inv["n_triples"] == 2
    assert inv["violations"] == []


def test_validate_fails_missing_citation():
    inv = validate_pack_triples({
        "graph_triples": [_t(citation_label=""), _t(citation_label=None)],
    })
    assert inv["ok"] is False
    assert any(v["reason"] == "missing_citation" for v in inv["violations"])


def test_validate_fails_open_predicate():
    inv = validate_pack_triples({
        "graph_triples": [_t(predicate="cura_magica", citation_label="x p.1")],
    })
    assert inv["ok"] is False
    assert any(v["reason"] == "open_predicate" for v in inv["violations"])


def test_score_hit_when_expected_rel_and_entity_present():
    gold = {
        "id": "mh-01",
        "expect_entities": ["sepse", "drug-vancomicina"],
        "expect_rels": ["trata", "tratado_por"],
    }
    pack = {"graph_triples": [_t()], "chunks": [{"id": 1}], "abstain": False}
    s = score_pack_against_gold(pack, gold)
    assert s["status"] == "hit"
    assert s["hit"] is True
    assert s["n_matching"] >= 1


def test_score_miss_when_pack_empty():
    gold = {
        "id": "mh-02",
        "expect_entities": ["anafilaxia", "drug-adrenalina"],
        "expect_rels": ["trata"],
    }
    s = score_pack_against_gold({"graph_triples": [], "chunks": []}, gold)
    assert s["status"] == "miss"
    assert s["hit"] is False


def test_score_ignores_triple_without_citation():
    gold = {"expect_entities": ["sepse"], "expect_rels": ["trata"]}
    pack = {"graph_triples": [_t(citation_label="")]}
    s = score_pack_against_gold(pack, gold)
    assert s["status"] == "miss"
    assert s["n_triples"] == 0


def test_summarize_pack_scores_rates_and_invariant():
    rows = [
        {"status": "hit", "n_triples": 2, "wall_s": 1.0, "invariant_ok": True},
        {"status": "miss", "n_triples": 0, "wall_s": 2.0, "invariant_ok": True},
        {"status": "skip", "n_triples": 0, "wall_s": 0.5, "invariant_ok": True},
    ]
    sm = summarize_pack_scores(rows)
    assert sm["n"] == 2
    assert sm["hit"] == 1
    assert sm["pack_triple_hit_rate"] == 0.5
    assert sm["mean_graph_triples"] == (2 + 0 + 0) / 3
    assert sm["invariant_ok"] is True

    bad = summarize_pack_scores(
        rows + [{"status": "hit", "n_triples": 1, "wall_s": 1.0, "invariant_ok": False}]
    )
    assert bad["invariant_ok"] is False


def test_openie_candidate_stats_empty_conn():
    class _Boom:
        def execute(self, *a, **k):
            raise RuntimeError("no table")

    st = openie_candidate_stats(_Boom())
    assert st["table_present"] is False
    assert st["total"] == 0


def test_openie_candidate_stats_counts():
    class _FakeConn:
        def execute(self, sql, params=None):
            class R:
                def fetchall(self_inner):
                    return [
                        {"status": "pending", "n": 3},
                        {"status": "promoted", "n": 2},
                        {"status": "rejected", "n": 1},
                    ]
            return R()

    st = openie_candidate_stats(_FakeConn())
    assert st["table_present"] is True
    assert st["pending"] == 3
    assert st["promoted"] == 2
    assert st["rejected"] == 1
    assert st["total"] == 6
    assert st["promote_rate"] == 2 / 3
