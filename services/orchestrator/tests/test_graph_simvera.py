"""Seam orquestrador: grafo clínico no contexto + espelho em simvera (#8).

Contract tests com pack fixture — sem GPU, sem rede.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as orch  # noqa: E402

_ALLOWED = frozenset({"trata", "tratado_por", "dd", "interage", "contraindicado"})


def _triple(**kw):
    base = {
        "source": "drug-noradrenalina",
        "source_label": "Noradrenalina",
        "predicate": "trata",
        "target": "sepse",
        "target_label": "Sepse",
        "citation_label": "Knobel sepse p. 210",
        "page_start": 210,
        "page_end": 210,
        "chunk_id": 1,
        "document_id": 1,
    }
    base.update(kw)
    return base


def _pack(*, triples=None, chunks=None, abstain=False):
    return {
        "query": "sepse noradrenalina",
        "abstain": abstain,
        "supporting_chunks": 0 if abstain else 1,
        "confidence_precheck": 0.0 if abstain else 0.9,
        "graph_triples": list(triples or []),
        "chunks": list(chunks if chunks is not None else [{
            "chunk_id": 1,
            "document_id": 1,
            "text": "noradrenalina no choque septico",
            "citation_label": "Knobel sepse p. 210",
            "page_start": 210,
            "page_end": 210,
            "rerank_score": 0.9,
        }]),
    }


def test_build_context_includes_graph_section_distinct_from_parecer():
    pack = _pack(triples=[_triple()])
    ctx = orch.build_context(pack, parecer="Parecer Meissa: use nora.")
    assert "=== GRAFO CLÍNICO" in ctx
    assert "=== PARECER DO ESPECIALISTA" in ctx
    assert "=== EVIDÊNCIA DO CORPUS ===" in ctx
    # hops distinguíveis do parecer
    graph_i = ctx.index("=== GRAFO CLÍNICO")
    parecer_i = ctx.index("=== PARECER DO ESPECIALISTA")
    assert graph_i < parecer_i
    assert "trata" in ctx[graph_i:parecer_i]
    assert "Knobel sepse p. 210" in ctx[graph_i:parecer_i]
    assert "Parecer Meissa" in ctx[parecer_i:]
    assert "Parecer Meissa" not in ctx[graph_i:parecer_i]


def test_build_context_omits_graph_section_when_no_triples():
    ctx = orch.build_context(_pack(triples=[]), parecer=None)
    assert "=== GRAFO CLÍNICO" not in ctx
    assert "=== EVIDÊNCIA DO CORPUS ===" in ctx


def test_pack_graph_triples_requires_citation_and_closed_predicate():
    raw = [
        _triple(),
        _triple(predicate="cura_magica", citation_label="x p.1"),  # fora do schema
        _triple(source="asma", target="salbutamol", predicate="trata",
                citation_label=""),  # sem fonte
        _triple(source="a", target="b", predicate="dd",
                citation_label="AMIB p. 50", source_label="A", target_label="B"),
    ]
    clean = orch._pack_graph_triples({"graph_triples": raw})
    preds = {(t["source"], t["predicate"], t["target"]) for t in clean}
    assert ("drug-noradrenalina", "trata", "sepse") in preds
    assert ("a", "dd", "b") in preds
    assert all(t["predicate"] in _ALLOWED for t in clean)
    assert all(t.get("citation_label") for t in clean)
    assert not any(t["predicate"] == "cura_magica" for t in clean)


def test_simvera_exposes_graph_triples_used():
    pack = _pack(triples=[_triple(), _triple(predicate="tratado_por",
                                             source="sepse", target="drug-noradrenalina",
                                             source_label="Sepse",
                                             target_label="Noradrenalina")])
    payload: dict = {"choices": []}
    orch._attach_provenance(payload, pack=pack, parecer="ok", forced=False, t0=0.0)
    sv = payload["simvera"]
    assert "graph_triples" in sv
    assert len(sv["graph_triples"]) == 2
    assert all(t.get("citation_label") for t in sv["graph_triples"])
    assert all(t["predicate"] in _ALLOWED for t in sv["graph_triples"])


def test_simvera_graph_triples_empty_when_pack_has_none():
    payload: dict = {}
    orch._attach_provenance(payload, pack=_pack(triples=[]), parecer=None,
                            forced=False, t0=0.0)
    assert payload["simvera"]["graph_triples"] == []


def test_simvera_graph_triples_empty_on_abstain():
    """Sem chunks/abstain → recusa; não vazar triplas inventadas."""
    pack = _pack(triples=[_triple()], chunks=[], abstain=True)
    payload: dict = {}
    orch._attach_provenance(payload, pack=pack, parecer=None, forced=False, t0=0.0)
    assert payload["simvera"]["abstained"] is True
    assert payload["simvera"]["graph_triples"] == []
    assert payload["simvera"]["citations"] == []


def test_simvera_graph_triples_empty_on_consultation():
    pack = _pack(triples=[_triple()])
    payload: dict = {}
    orch._attach_provenance(payload, pack=pack, parecer=None, forced=False, t0=0.0,
                            consultation=True)
    assert payload["simvera"]["consultation"] is True
    assert payload["simvera"]["graph_triples"] == []


def test_forced_choice_still_detectable_and_context_keeps_evidence():
    """forced_choice não pede slots por causa do grafo; contexto ainda tem evidência."""
    assert orch._forced_choice({"forced_choice": True}) is True
    pack = _pack(triples=[_triple()])
    ctx = orch.build_context(pack, parecer=None)
    assert "=== EVIDÊNCIA DO CORPUS ===" in ctx
    # grafo é aditivo mesmo em contexto de consolidação (forced usa o mesmo builder)
    assert "=== GRAFO CLÍNICO" in ctx
