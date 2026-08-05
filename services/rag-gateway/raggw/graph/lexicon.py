"""Léxico curado de entidades clínicas + detecção determinística (sem LLM).

Cada entidade tem formas de superfície (nome + sinônimos + CID); a detecção casa
frase inteira sobre o texto normalizado (sem acento, minúsculo). Semeado do conteúdo
estruturado do app (DOENCAS/BULARIO) via scripts/build_lexicon.py — nada de extração
por LLM (evita alucinação, roda em CPU).
"""
from __future__ import annotations

import json
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path


def normalize(s: str) -> str:
    """Minúsculo + sem diacríticos + espaços colapsados. 'Feocromocitoma' → 'feocromocitoma'."""
    nfd = unicodedata.normalize("NFD", s)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return " ".join(stripped.lower().split())


_ALPHA = "abcdefghijklmnopqrstuvwxyz"


def _edits1(word: str) -> set[str]:
    """Strings a 1 edição (Damerau-Levenshtein) de `word` — tolerância a erros ortográficos."""
    splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    deletes = [a + b[1:] for a, b in splits if b]
    transposes = [a + b[1] + b[0] + b[2:] for a, b in splits if len(b) > 1]
    replaces = [a + c + b[1:] for a, b in splits if b for c in _ALPHA]
    inserts = [a + c + b for a, b in splits for c in _ALPHA]
    return set(deletes + transposes + replaces + inserts)


@dataclass(frozen=True)
class Entity:
    id: str
    label: str
    kind: str                       # "disease" | "drug" | ...
    surfaces: tuple[str, ...]       # formas normalizadas (>=3 chars) para casar no texto


@dataclass
class Lexicon:
    entities: list[Entity] = field(default_factory=list)
    # Arestas típicas CURADAS (id_a, relação, id_b) — ex.: ("adrenalina","trata","anafilaxia").
    typed_edges: list[tuple[str, str, str]] = field(default_factory=list)

    def __post_init__(self) -> None:
        # Índice de detecção: forma de superfície → id da entidade. Multi-palavra permitido.
        self._by_surface: dict[str, str] = {}
        for e in self.entities:
            for surf in e.surfaces:
                if len(surf) >= 3:
                    self._by_surface.setdefault(surf, e.id)
        self._by_id: dict[str, Entity] = {e.id: e for e in self.entities}

    def get(self, entity_id: str) -> Entity | None:
        return self._by_id.get(entity_id)

    def detect(self, text: str) -> set[str]:
        """Ids das entidades cujas formas de superfície aparecem no texto (frase inteira)."""
        padded = f" {normalize(text)} "
        found: set[str] = set()
        for surf, eid in self._by_surface.items():
            if f" {surf} " in padded:
                found.add(eid)
        return found

    def detect_fuzzy(self, text: str) -> set[str]:
        """Ids por correspondência a 1 edição de TOKENS (>=4 chars) contra formas de superfície
        de palavra única — tolera erros ortográficos em nomes clínicos (ex.: 'sepe'→'sepse').
        Palavras curtas ficam de fora para evitar falsos positivos."""
        single = {s: e for s, e in self._by_surface.items() if " " not in s}
        found: set[str] = set()
        for tok in normalize(text).split():
            if len(tok) < 4 or tok in single:
                continue
            for variant in _edits1(tok):
                eid = single.get(variant)
                if eid is not None:
                    found.add(eid)
                    break
        return found


def load_lexicon(path: str | Path) -> Lexicon:
    """Carrega o léxico de um JSON {entities:[{id,label,kind,surfaces[]}], typed_edges:[[a,rel,b]]}."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    entities = [
        Entity(
            id=str(e["id"]),
            label=str(e.get("label", e["id"])),
            kind=str(e.get("kind", "entity")),
            surfaces=tuple(dict.fromkeys(normalize(s) for s in e.get("surfaces", []) if s.strip())),
        )
        for e in data.get("entities", [])
    ]
    typed = [(str(a), str(rel), str(b)) for a, rel, b in data.get("typed_edges", [])]
    return Lexicon(entities=entities, typed_edges=typed)
