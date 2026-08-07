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


# ── fuzzy como rede de segurança, não competidor (#44) ───────────────────────

def _lex_minimo():
    from raggw.graph.lexicon import Entity, Lexicon
    return Lexicon(entities=[
        Entity(id="sepse", label="Sepse", kind="disease",
               surfaces=("sepse", "choque septico")),
        Entity(id="coma-rebaixamento", label="Coma", kind="disease",
               surfaces=("coma", "rebaixamento de consciencia")),
    ])


def test_fuzzy_nao_injeta_quando_a_deteccao_exata_acertou():
    """"Como" dista 1 edição de "coma" e abre metade das perguntas clínicas.

    Medido em 2026-08-06 (#44): nas 20 queries do gold_multihop o fuzzy nunca foi a
    única fonte de entidade, e nas 3 vezes em que falou junto com a detecção exata,
    falou errado — 2 delas exatamente este "como"→coma. O efeito não é erro: é
    confiança de recuperação mais baixa, e no caso de #38 foi recusa.
    """
    plano = plan_query("Como manejar sepse grave?", _lex_minimo())
    juntas = " ".join(plano.expansions)
    assert "choque septico" in juntas, "a entidade certa precisa continuar expandindo"
    assert "rebaixamento" not in juntas, "coma-rebaixamento não tem o que fazer aqui"


def test_fuzzy_ainda_salva_erro_de_digitacao():
    """A rede de segurança precisa continuar valendo — é para isso que ele existe.

    Sem detecção exata para "sepe", o fuzzy é a única chance de recuperar a entidade.
    """
    plano = plan_query("conduta na sepe", _lex_minimo())
    assert "choque septico" in " ".join(plano.expansions)


def test_sem_entidade_nenhuma_nao_explode():
    plano = plan_query("pergunta sobre nada disso", _lex_minimo())
    assert plano.expansions == []
