#!/usr/bin/env python3
"""Gera o léxico de entidades do GraphStore a partir do conteúdo estruturado do app.

Fonte da verdade = os dados curados do front (src/data/doencas.ts, bulario.ts). Extrai
nome + sinônimos + CID (doenças) e nome + princípio + sinônimos (fármacos) por regex —
sem executar TS. Determinístico, sem LLM. Saída: raggw/graph/lexicon.json.

Uso (da raiz do repo):
    python rag-gateway/scripts/build_lexicon.py

Reproduzível: re-rode quando DOENCAS/BULARIO mudarem e versione o lexicon.json.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # .../app-v2
OUT = Path(__file__).resolve().parents[1] / "raggw" / "graph" / "lexicon.json"

# Bloco de um item: de `id: '...'` até o próximo `id:` (ou fim). Simples e robusto p/ estes dados.
_ID = re.compile(r"\bid:\s*'([^']+)'")
_NOME = re.compile(r"\bnome:\s*'([^']+)'")
_PRINCIPIO = re.compile(r"\bprincipio:\s*'([^']+)'")
_ARR = lambda field: re.compile(field + r":\s*\[([^\]]*)\]")  # noqa: E731
_SINONIMOS = _ARR("sinonimos")
_CID = _ARR("cid10")
_STR_ITEMS = re.compile(r"'([^']+)'")


def _blocks(ts: str) -> list[str]:
    """Fatia o array TS em blocos por item (âncora = `id:`)."""
    starts = [m.start() for m in _ID.finditer(ts)]
    return [ts[a:b] for a, b in zip(starts, starts[1:] + [len(ts)])]


def _clean(s: str) -> str:
    return s.strip()


def extract_doencas(ts: str) -> list[dict]:
    out = []
    for blk in _blocks(ts):
        mid, mnome = _ID.search(blk), _NOME.search(blk)
        if not (mid and mnome):
            continue
        surfaces = [mnome.group(1)]
        sm = _SINONIMOS.search(blk)
        if sm:
            surfaces += _STR_ITEMS.findall(sm.group(1))
        cm = _CID.search(blk)
        if cm:
            surfaces += _STR_ITEMS.findall(cm.group(1))
        out.append({"id": mid.group(1), "label": _clean(mnome.group(1)),
                    "kind": "disease", "surfaces": [_clean(s) for s in surfaces]})
    return out


def extract_bulario(ts: str) -> list[dict]:
    out = []
    for blk in _blocks(ts):
        mid, mnome = _ID.search(blk), _NOME.search(blk)
        if not (mid and mnome):
            continue
        surfaces = [mnome.group(1)]
        mp = _PRINCIPIO.search(blk)
        if mp:
            surfaces.append(mp.group(1))
        sm = _SINONIMOS.search(blk)
        if sm:
            surfaces += _STR_ITEMS.findall(sm.group(1))
        out.append({"id": f"drug-{mid.group(1)}", "label": _clean(mnome.group(1)),
                    "kind": "drug", "surfaces": [_clean(s) for s in surfaces]})
    return out


def main() -> int:
    doencas_ts = (ROOT / "src" / "data" / "doencas.ts").read_text(encoding="utf-8")
    bulario_ts = (ROOT / "src" / "data" / "bulario.ts").read_text(encoding="utf-8")
    entities = extract_doencas(doencas_ts) + extract_bulario(bulario_ts)
    # Dedup por id; descarta superfícies < 3 chars (ruído) preservando a ordem.
    seen, clean = set(), []
    for e in entities:
        if e["id"] in seen:
            continue
        seen.add(e["id"])
        e["surfaces"] = list(dict.fromkeys(s for s in e["surfaces"] if len(s.strip()) >= 3))
        if e["surfaces"]:
            clean.append(e)
    payload = {"entities": clean, "typed_edges": []}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    diseases = sum(1 for e in clean if e["kind"] == "disease")
    drugs = sum(1 for e in clean if e["kind"] == "drug")
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"lexicon.json: {len(clean)} entidades ({diseases} doencas, {drugs} farmacos) -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
