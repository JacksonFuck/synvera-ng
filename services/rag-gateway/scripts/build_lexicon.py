#!/usr/bin/env python3
"""Gera o léxico de entidades + arestas tipadas do GraphStore.

Fonte da verdade = dados clínicos curados (doencas.ts, bulario.ts), vendored em
`clinical_data/`. Extrai entidades e relações por regex + matching de surfaces —
**determinístico, sem LLM**. Saída: raggw/graph/lexicon.json.

Arestas tipadas (schema fechado):
  trata / tratado_por / dd / interage / contraindicated

LLM de indexação (fases futuras de candidatos OpenIE): **somente Gemma-4 local**
(`SIMVERA_GEMMA_URL`, default :8081). Este script não chama LLM.

Uso (em services/rag-gateway):
    .venv/bin/python scripts/build_lexicon.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
PKG = HERE.parent  # services/rag-gateway
OUT = PKG / "raggw" / "graph" / "lexicon.json"
DEFAULT_DOENCAS = PKG / "clinical_data" / "doencas.ts"
DEFAULT_BULARIO = PKG / "clinical_data" / "bulario.ts"

_ID = re.compile(r"\bid:\s*'([^']+)'")
_NOME = re.compile(r"\bnome:\s*'([^']+)'")
_PRINCIPIO = re.compile(r"\bprincipio:\s*'([^']+)'")
_STR_ITEMS = re.compile(r"'([^']+)'")
_ARR = lambda field: re.compile(rf"{field}:\s*\[([^\]]*)\]")  # noqa: E731
_SINONIMOS = _ARR("sinonimos")
_CID = _ARR("cid10")

# Superfícies genéricas demais para linkar arestas (ruído clínico).
_STOP_SURFACES = frozenset({
    "dor", "febre", "infeccao", "infecção", "choque", "analgesico", "analgésico",
    "antibiotico", "antibiótico", "aine", "corticoide", "soro", "volume", "oxigenio",
    "oxigênio", "agua", "água", "dieta", "repouso", "uti", "internacao", "internação",
})

# Fármacos de emergência frequentes nas condutas mas ausentes do bulário APS/RENAME.
# Determinístico: só vira nó se a surface aparecer em alguma conduta/uso.
_EMERGENCY_DRUGS: dict[str, list[str]] = {
    "noradrenalina": ["noradrenalina", "norepinefrina", "norepinephrine", "nor-adrenalina"],
    "adrenalina": ["adrenalina", "epinefrina", "epinephrine"],
    "heparina": ["heparina", "heparina nao fracionada", "heparina não fracionada", "HNF"],
    "enoxaparina": ["enoxaparina", "Clexane", "HBPM"],
    "alteplase": ["alteplase", "rtPA", "r-tPA", "activase"],
    "tenecteplase": ["tenecteplase", "TNK"],
    "amiodarona": ["amiodarona"],
    "atropina": ["atropina"],
    "vancomicina": ["vancomicina"],
    "ceftriaxona": ["ceftriaxona"],  # pode já existir no bulario — dedup por id
    "meropenem": ["meropenem"],
    "piperacilina-tazobactam": ["piperacilina", "piperacilina-tazobactam", "tazocin", "pip/tazo"],
    "cristaloides": ["cristaloides", "SF 0,9%", "ringer", "ringer lactato", "solucao salina"],
    "bicarbonato": ["bicarbonato", "NaHCO3"],
    "glicose": ["glicose 50%", "dextrose", "G50%", "glicose hipertônica"],
    "naloxona": ["naloxona"],
    "flumazenil": ["flumazenil"],
    "octreotida": ["octreotida", "octreotide"],
    "glucagon": ["glucagon"],
    "nitroglicerina": ["nitroglicerina", "nitrato", "ISDN", "mononitrato"],
    "dobutamina": ["dobutamina"],
    "dopamina": ["dopamina"],
    "vasopressina": ["vasopressina"],
    "linezolida": ["linezolida", "linezolid"],
    "oseltamivir": ["oseltamivir", "tamiflu"],
    "fenitoina": ["fenitoina", "fenitoína", "fenitoina sodica"],
    "midazolam": ["midazolam"],
    "succinilcolina": ["succinilcolina", "suxametonio"],
    "rocuronio": ["rocuronio"],
    "cetamina": ["cetamina", "ketamina"],
    "etomidato": ["etomidato"],
    "propofol": ["propofol"],
    "fentanil": ["fentanil", "fentanyl"],
    "morfina": ["morfina"],  # pode existir
    "hidrocortisona": ["hidrocortisona"],
    "metilprednisolona": ["metilprednisolona"],
}


def normalize(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return " ".join(stripped.lower().split())


def pad_for_match(text: str) -> str:
    """Normaliza e trata pontuação/aspas como fronteira de token (#27).

    Sem isto, `itens: [ 'noradrenalina e a 1ª escolha'` não casa ` noradrenalina `
    porque a aspa cola no início da surface.
    """
    n = normalize(text or "")
    # alfanumérico + hífen (nor-adrenalina, pip/tazo vira pip tazo)
    n = re.sub(r"[^a-z0-9]+", " ", n)
    return f" { ' '.join(n.split()) } "


def _blocks(ts: str) -> list[str]:
    starts = [m.start() for m in _ID.finditer(ts)]
    return [ts[a:b] for a, b in zip(starts, starts[1:] + [len(ts)])]


def _clean(s: str) -> str:
    return s.strip()


def _section(blk: str, field: str) -> str:
    """Texto do campo até o próximo campo top-level aproximado."""
    m = re.search(rf"\b{field}:\s*", blk)
    if not m:
        return ""
    rest = blk[m.end():]
    # corta em próximo campo conhecido no mesmo nível (heurística)
    stop = re.search(
        r"\n\s*(?:id:|nome:|secao:|sinonimos:|cid10:|capitulo:|fonte:|resumo:|"
        r"fisiopatologia:|exames:|diagnosticoDiferencial:|conduta:|atualizacoes:|"
        r"principio:|classe:|nomesComerciais:|mecanismo:|apresentacoes:|usoClinico:|"
        r"receituario:|posologia:|ajusteDose:|contraindicacoes:|efeitosAdversos:|"
        r"advertencias:|gestacaoLactacao:|interacoes:|numeroRegistro:)\s*",
        rest,
    )
    return rest[: stop.start()] if stop else rest


_PARENTESE_FINAL = re.compile(r"^(.+?)\s*\([^)]*\)\s*$")


def _base_sem_parenteses(nome: str) -> str | None:
    """"Tromboembolismo pulmonar (TEP)" → "Tromboembolismo pulmonar".

    O nome canônico traz a sigla entre parênteses, mas ninguém digita o parêntese: a
    query real é "tromboembolismo pulmonar de alto risco". Sem esta variante a entidade
    simplesmente não é detectada — e o efeito não é erro, é confiança de recuperação
    mais baixa ou recusa (#38).

    Medido em 2026-08-06: 22 das 226 entidades tinham a lacuna, entre elas TEP, TVP,
    PCR, TCE, AVC hemorrágico e pneumonia adquirida na comunidade — justamente as
    formas que um clínico digita.

    Devolve None quando não há parêntese, ou quando a base ficaria com menos de 3
    caracteres (o índice de detecção descarta surfaces curtas, então seria ruído).
    """
    m = _PARENTESE_FINAL.match(nome.strip())
    if not m:
        return None
    base = m.group(1).strip()
    return base if len(base) >= 3 else None


def extract_doencas(ts: str) -> list[dict]:
    out = []
    for blk in _blocks(ts):
        mid, mnome = _ID.search(blk), _NOME.search(blk)
        if not (mid and mnome):
            continue
        surfaces = [mnome.group(1)]
        # id canônico como surface (ex. sepse) — senão "sepse" na query não detecta
        # a entidade cujo nome é "Sepse e choque séptico" (#31)
        eid = mid.group(1)
        if eid and eid not in surfaces:
            surfaces.append(eid)
        # "Tromboembolismo pulmonar (TEP)" também precisa casar sem o parêntese (#38)
        base = _base_sem_parenteses(mnome.group(1))
        if base and base not in surfaces:
            surfaces.append(base)
        sm = _SINONIMOS.search(blk)
        if sm:
            surfaces += _STR_ITEMS.findall(sm.group(1))
        cm = _CID.search(blk)
        if cm:
            surfaces += _STR_ITEMS.findall(cm.group(1))
        out.append({
            "id": eid,
            "label": _clean(mnome.group(1)),
            "kind": "disease",
            "surfaces": [_clean(s) for s in surfaces],
            "_dd": _section(blk, "diagnosticoDiferencial"),
            "_conduta": _section(blk, "conduta"),
            "_resumo": _section(blk, "resumo") if "resumo:" in blk else "",
        })
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
        # mesma lacuna do lado dos fármacos, ex.: "Brometo de escopolamina (…)" (#38)
        base = _base_sem_parenteses(mnome.group(1))
        if base and base not in surfaces:
            surfaces.append(base)
        sm = _SINONIMOS.search(blk)
        if sm:
            surfaces += _STR_ITEMS.findall(sm.group(1))
        out.append({
            "id": f"drug-{mid.group(1)}",
            "label": _clean(mnome.group(1)),
            "kind": "drug",
            "surfaces": [_clean(s) for s in surfaces],
            "_uso": _section(blk, "usoClinico"),
            "_interacoes": _section(blk, "interacoes"),
            "_ci": _section(blk, "contraindicacoes"),
        })
    return out


def _surface_index(entities: list[dict], kinds: set[str] | None = None) -> list[tuple[str, str]]:
    items: list[tuple[str, str]] = []
    for e in entities:
        if kinds and e["kind"] not in kinds:
            continue
        for s in e["surfaces"]:
            ns = normalize(s)
            if len(ns) < 3 or ns in _STOP_SURFACES:
                continue
            items.append((ns, e["id"]))
    # superfícies mais longas primeiro → matching mais específico
    items.sort(key=lambda x: (-len(x[0]), x[0]))
    return items


def _match(text: str, index: list[tuple[str, str]], exclude: str | None = None) -> set[str]:
    if not text or not text.strip():
        return set()
    padded = pad_for_match(text)
    found: set[str] = set()
    for surf, eid in index:
        if exclude and eid == exclude:
            continue
        # surface do índice já é normalize(); re-pad por se tiver hífen/espaço
        needle = pad_for_match(surf).strip()
        if needle and f" {needle} " in padded:
            found.add(eid)
    return found


# Contexto de CONTRA-indicação / menção negativa perto do fármaco (evita FP:
# "beta-bloqueadores (atenolol) podem atenuar resposta à adrenalina" ≠ trata).
_NEG_CTX = re.compile(
    r"(evitar|contraindic|n[aã]o\s+(usar|associar|administr)|em\s+uso\s+de|"
    r"usu[aá]rios?\s+de|pacientes?\s+em|interage|intera[cç][aã]o|"
    r"atenuam?|bloqueiam?|piora|suspender|descontinuar)",
    re.I,
)
# Contexto de tratamento / administração.
_TREAT_CTX = re.compile(
    r"(administ|dose|mg\b|mcg\b|ml\b|iniciar|prefer|primeira\s+linha|"
    r"escolha|infus|bolus|im\b|ev\b|io\b|titular|prescrev|terap[eê]ut)",
    re.I,
)


def _match_drugs_in_conduta(text: str, drug_idx: list[tuple[str, str]]) -> set[str]:
    """Match de fármacos em conduta só com contexto terapêutico e sem janela negativa."""
    if not text:
        return set()
    raw = text
    padded = pad_for_match(text)
    found: set[str] = set()
    for surf, eid in drug_idx:
        pos = 0
        needle_body = pad_for_match(surf).strip()
        if not needle_body:
            continue
        needle = f" {needle_body} "
        while True:
            i = padded.find(needle, pos)
            if i < 0:
                break
            # janela de caracteres no texto tokenizado
            left = max(0, i - 80)
            right = min(len(padded), i + len(needle) + 80)
            window = padded[left:right]
            pos = i + len(needle)
            if _NEG_CTX.search(window):
                continue
            if not _TREAT_CTX.search(window) and not _TREAT_CTX.search(raw):
                # exige sinal de tratamento em algum lugar da conduta OU na janela
                # (títulos como 'Antibioticoterapia' contam via raw)
                continue
            found.add(eid)
            break
    return found


def _ensure_emergency_drugs(entities: list[dict]) -> None:
    """Adiciona nós drug-* de emergência se mencionados em condutas (in-place)."""
    existing = {e["id"] for e in entities}
    corpus = " ".join(
        (e.get("_conduta") or "") + " " + (e.get("_uso") or "")
        for e in entities
    )
    pad = pad_for_match(corpus)
    for slug, surfaces in _EMERGENCY_DRUGS.items():
        eid = f"drug-{slug}"
        if eid in existing:
            # enriquece surfaces se o monógrafo APS já existe
            for e in entities:
                if e["id"] == eid:
                    e["surfaces"] = list(dict.fromkeys(e["surfaces"] + surfaces))
            continue
        if any(
            f" {pad_for_match(s).strip()} " in pad
            for s in surfaces if len(normalize(s)) >= 3
        ):
            entities.append({
                "id": eid,
                "label": surfaces[0].title() if surfaces else slug,
                "kind": "drug",
                "surfaces": surfaces,
                "_uso": "",
                "_interacoes": "",
                "_ci": "",
            })
            existing.add(eid)


def extract_typed_edges(entities: list[dict]) -> list[list[str]]:
    """Deriva triplas tipadas a partir dos campos estruturados (texto livre → surface match)."""
    _ensure_emergency_drugs(entities)
    diseases = [e for e in entities if e["kind"] == "disease"]
    drugs = [e for e in entities if e["kind"] == "drug"]
    d_idx = _surface_index(entities, {"disease"})
    drug_idx = _surface_index(entities, {"drug"})

    edges: set[tuple[str, str, str]] = set()

    for d in diseases:
        did = d["id"]
        for other in _match(d.get("_dd", ""), d_idx, exclude=did):
            edges.add((did, "dd", other))
            edges.add((other, "dd", did))  # dd simétrico
        conduta = d.get("_conduta", "")
        for drug in _match_drugs_in_conduta(conduta, drug_idx):
            edges.add((drug, "trata", did))
            edges.add((did, "tratado_por", drug))

    for drug in drugs:
        did = drug["id"]
        # usoClinico é indicação curta — matching de doença exige superfície ≥5 chars
        uso = drug.get("_uso", "")
        for disease in _match(uso, [x for x in d_idx if len(x[0]) >= 5]):
            edges.add((did, "trata", disease))
            edges.add((disease, "tratado_por", did))
        for other in _match(drug.get("_interacoes", ""), drug_idx, exclude=did):
            a, b = sorted([did, other])
            edges.add((a, "interage", b))
        for disease in _match(drug.get("_ci", ""), [x for x in d_idx if len(x[0]) >= 5]):
            edges.add((did, "contraindicado", disease))

    # lista estável
    return [[a, rel, b] for a, rel, b in sorted(edges)]


def _public_entities(raw: list[dict]) -> list[dict]:
    """Remove campos privados _* antes de serializar."""
    out = []
    seen: set[str] = set()
    for e in raw:
        if e["id"] in seen:
            continue
        seen.add(e["id"])
        surfaces = list(dict.fromkeys(s for s in e["surfaces"] if len(s.strip()) >= 3))
        if not surfaces:
            continue
        out.append({
            "id": e["id"],
            "label": e["label"],
            "kind": e["kind"],
            "surfaces": surfaces,
        })
    return out


def build(doencas_path: Path, bulario_path: Path) -> dict:
    doencas_ts = doencas_path.read_text(encoding="utf-8")
    bulario_ts = bulario_path.read_text(encoding="utf-8")
    raw = extract_doencas(doencas_ts) + extract_bulario(bulario_ts)
    # matching usa raw (com seções); saída pública limpa
    typed = extract_typed_edges(raw)
    entities = _public_entities(raw)
    # reindex typed only for entities that survived cleaning
    ids = {e["id"] for e in entities}
    typed = [t for t in typed if t[0] in ids and t[2] in ids]
    return {
        "entities": entities,
        "typed_edges": typed,
        "meta": {
            "source_doencas": str(doencas_path),
            "source_bulario": str(bulario_path),
            "indexing_llm": "gemma-4-local-only",
            "extraction": "deterministic-surface-match",
        },
    }


def main() -> int:
    doencas = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DOENCAS
    bulario = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_BULARIO
    if not doencas.exists() or not bulario.exists():
        print(f"ERRO: fontes não encontradas:\n  {doencas}\n  {bulario}", file=sys.stderr)
        return 1

    payload = build(doencas, bulario)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    ents = payload["entities"]
    typed = payload["typed_edges"]
    diseases = sum(1 for e in ents if e["kind"] == "disease")
    drugs = sum(1 for e in ents if e["kind"] == "drug")
    rels = Counter(t[1] for t in typed)
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"lexicon.json: {len(ents)} entidades ({diseases} doencas, {drugs} farmacos)")
    print(f"typed_edges: {len(typed)}  por rel: {dict(rels)}")
    print(f"-> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
