"""Métricas do evidence-pack para o harness multi-hop (#9).

Funções puras: unit-testáveis offline. O runner live chama /rag/evidence-pack
e passa o JSON por aqui.
"""
from __future__ import annotations

from typing import Any

# Espelho do schema fechado do Clinical GraphRAG (rag-gateway + orquestrador).
TYPED_PREDICATES = frozenset({
    "trata", "tratado_por", "dd", "interage", "contraindicado",
})


def validate_pack_triples(pack: dict[str, Any] | None) -> dict[str, Any]:
    """Invariante: toda tripla no pack tem citation e predicado fechado.

    Falha clara se aparecer tripla sem provenance (nunca deveria sair do gateway).
    """
    triples = list((pack or {}).get("graph_triples") or [])
    violations: list[dict] = []
    for i, t in enumerate(triples):
        if not isinstance(t, dict):
            violations.append({"index": i, "reason": "not_object", "triple": t})
            continue
        if not t.get("citation_label"):
            violations.append({
                "index": i, "reason": "missing_citation",
                "predicate": t.get("predicate"),
                "source": t.get("source"), "target": t.get("target"),
            })
        pred = t.get("predicate")
        if pred not in TYPED_PREDICATES:
            violations.append({
                "index": i, "reason": "open_predicate",
                "predicate": pred,
                "source": t.get("source"), "target": t.get("target"),
            })
    return {
        "ok": not violations,
        "n_triples": len(triples),
        "violations": violations,
    }


def score_pack_against_gold(
    pack: dict[str, Any] | None,
    gold_item: dict[str, Any],
) -> dict[str, Any]:
    """Hit se o pack traz tripla citável alinhada a expect_rels × expect_entities.

    - Predicado em expect_rels (se o gold listar rels)
    - source ou target em expect_entities (se o gold listar entidades)
    - citation_label obrigatório
    """
    raw = list((pack or {}).get("graph_triples") or [])
    triples = [
        t for t in raw
        if isinstance(t, dict) and t.get("citation_label")
        and t.get("predicate") in TYPED_PREDICATES
    ]
    expect_rels = set(gold_item.get("expect_rels") or [])
    expect_ents = set(gold_item.get("expect_entities") or [])

    matching: list[dict] = []
    for t in triples:
        if expect_rels and t.get("predicate") not in expect_rels:
            continue
        ends = {t.get("source"), t.get("target")}
        if expect_ents and not (ends & expect_ents):
            continue
        matching.append({
            "source": t.get("source"),
            "predicate": t.get("predicate"),
            "target": t.get("target"),
            "citation_label": t.get("citation_label"),
        })

    # sem expectativa útil → skip (não conta no rate)
    if not expect_rels and not expect_ents:
        status = "skip"
    elif matching:
        status = "hit"
    else:
        status = "miss"

    return {
        "status": status,
        "hit": status == "hit",
        "n_triples": len(triples),
        "n_matching": len(matching),
        "matching_sample": matching[:5],
        "expect_rels": sorted(expect_rels),
        "expect_entities": sorted(expect_ents),
        "chunks": len((pack or {}).get("chunks") or []),
        "abstain": bool((pack or {}).get("abstain")),
    }


def summarize_pack_scores(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Agrega hit/miss de score_pack_against_gold + latência + contagens."""
    scored = [r for r in rows if r.get("status") in ("hit", "miss")]
    hits = sum(1 for r in scored if r.get("status") == "hit")
    n = len(scored)
    n_triples = [r.get("n_triples", 0) for r in rows if "n_triples" in r]
    walls = [r["wall_s"] for r in rows if isinstance(r.get("wall_s"), (int, float))]
    inv_ok = all(r.get("invariant_ok", True) for r in rows)
    return {
        "n": n,
        "hit": hits,
        "miss": n - hits,
        "pack_triple_hit_rate": (hits / n) if n else None,
        "mean_graph_triples": (sum(n_triples) / len(n_triples)) if n_triples else None,
        "mean_wall_s": (sum(walls) / len(walls)) if walls else None,
        "invariant_ok": inv_ok,
        "rows": rows,
    }
