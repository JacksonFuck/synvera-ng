"""Deterministic query planning for recall — no LLM.

Turns a raw clinical question into (1) an accent-normalized form, (2) lexicon-driven
expansion terms (synonyms, acronyms, CID codes, PT/EN surfaces of any entity the query
mentions), and (3) sub-queries for compound questions. Feeds the FTS/lexical stage so
recall survives abbreviations, accents, synonyms and multi-part questions. All terms come
from the curated lexicon or the query itself — never generated, so nothing is fabricated.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .graph.lexicon import Lexicon, normalize

# Safe connectors to split a compound question. Word-boundary "e"/"ou" only (not inside words).
_SPLIT = re.compile(r"\s*(?:\?|;|\band\b|\be\b|\bou\b|\bor\b)\s*", re.IGNORECASE)
_WORD = re.compile(r"\w+", re.UNICODE)


@dataclass
class QueryPlan:
    original: str
    normalized: str
    expansions: list[str] = field(default_factory=list)  # extra surface terms (synonyms/acronyms/CID)
    subqueries: list[str] = field(default_factory=list)   # decomposed compound parts (>1 only)

    def expanded_query(self) -> str:
        """Original query plus expansion surfaces — a single string for the FTS OR-match."""
        return " ".join([self.original, *self.expansions]).strip()


def plan_query(query: str, lexicon: Lexicon | None = None) -> QueryPlan:
    norm = normalize(query)
    parts = [p.strip() for p in _SPLIT.split(query) if p.strip() and _WORD.search(p)]
    subqueries = parts if len(parts) > 1 else []

    expansions: list[str] = []
    if lexicon is not None:
        # Detecção exata primeiro; o fuzzy de 1 edição entra só como REDE DE SEGURANÇA,
        # quando a exata não achou nada — aí é plausível que seja erro de digitação, que
        # é o propósito dele (typo tolerance, #321 AC).
        #
        # Antes os dois eram unidos, e o fuzzy competia em vez de socorrer. Medido em
        # 2026-08-06 (#44) sobre as 20 queries do gold_multihop: ele nunca foi a única
        # fonte de entidade, e nas 3 vezes em que falou junto com a exata, falou errado
        # — "como"→coma em duas delas. "Como" abre metade das perguntas clínicas em
        # português, então isso injetava coma-rebaixamento na expansão o tempo todo.
        # O efeito nunca foi erro: era confiança de recuperação menor, e em #38 recusa.
        seeds = lexicon.detect(query)
        if not seeds:
            seeds = lexicon.detect_fuzzy(query)
        for eid in sorted(seeds):
            ent = lexicon.get(eid)
            if ent:
                expansions.extend(ent.surfaces)  # normalized synonyms/acronyms/CID/EN

    # Drop surfaces already present in the query; dedup, keep order.
    seen = set(_WORD.findall(norm))
    expansions = [e for e in dict.fromkeys(expansions) if e and e not in seen]
    return QueryPlan(original=query, normalized=norm, expansions=expansions,
                     subqueries=subqueries)
