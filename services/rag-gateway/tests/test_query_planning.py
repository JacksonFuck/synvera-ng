"""Query planning: accent normalization, lexicon-driven expansion, compound decomposition.
Deterministic, no LLM — expansion terms come only from the curated lexicon or the query."""
from __future__ import annotations

from raggw.graph.lexicon import Entity, Lexicon, normalize
from raggw.query_planning import plan_query


def _ent(eid, label, kind, surfaces):
    return Entity(id=eid, label=label, kind=kind,
                  surfaces=tuple(normalize(s) for s in surfaces))


def _lex() -> Lexicon:
    return Lexicon(entities=[
        _ent("feocromocitoma", "Feocromocitoma", "disease",
             ["feocromocitoma", "pheochromocytoma", "metanefrinas"]),
        _ent("sepse", "Sepse", "disease", ["sepse", "choque septico", "sofa"]),
    ])


def test_plan_normalizes_accents():
    plan = plan_query("Suspeita de FEOCROMOCITOMA com crise")
    assert "feocromocitoma" in plan.normalized  # lowercased, accent-stripped


def test_plan_expands_with_lexicon_synonyms_and_acronyms():
    plan = plan_query("paciente com feocromocitoma", _lex())
    # EN synonym + related surface added; the word already present is not re-added
    assert "pheochromocytoma" in plan.expansions
    assert "metanefrinas" in plan.expansions
    assert "feocromocitoma" not in plan.expansions
    # expanded_query keeps the original and appends surfaces
    eq = plan.expanded_query()
    assert eq.startswith("paciente com feocromocitoma")
    assert "pheochromocytoma" in eq


def test_plan_expands_typo_to_canonical_surface():
    # #321 typo tolerance: 'sepe' is 1 edit from 'sepse' -> the canonical term is recalled.
    plan = plan_query("tratamento de sepe grave", _lex())
    assert "sepse" in plan.expansions


def test_plan_decomposes_compound_question():
    plan = plan_query("qual a dose de noradrenalina e como manejar a sepse?")
    assert len(plan.subqueries) >= 2
    assert any("noradrenalina" in s for s in plan.subqueries)
    assert any("sepse" in s for s in plan.subqueries)


def test_plan_simple_query_has_no_subqueries():
    plan = plan_query("tratamento da sepse")
    assert plan.subqueries == []


def test_plan_without_lexicon_has_no_expansions():
    plan = plan_query("tratamento da sepse")
    assert plan.expansions == []
