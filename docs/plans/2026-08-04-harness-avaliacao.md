# Harness de Avaliação do SimVera — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Medir de forma repetível se uma mudança no pipeline de RAG melhora ou piora acurácia, atribuição de ganho, recall de citação, taxa de recusa e latência.

**Architecture:** Cinco módulos sem dependência circular em `simvera-eval/`. `datasets.py` baixa e normaliza benchmarks públicos para um formato único em disco. `targets.py` expõe quatro alvos (Gemma puro, RAG+Gemma, Meissa puro, SimVera completo) atrás de uma assinatura única. `run.py` compõe os dois e grava resultados append-only, retomáveis. `score.py` e `report.py` leem só o disco e podem rodar sobre resultados antigos.

**Tech Stack:** Python 3, httpx (já instalado no venv do orquestrador), pytest (a instalar). Sem `datasets` do HuggingFace — os benchmarks vêm pela API REST do datasets-server, que já devolve JSON.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-harness-avaliacao-design.md`
- Diretório novo: `/home/jackson-fuck/Projetos/simvera-eval/` — **não** é repositório git próprio; será versionado dentro de `Apppocus-2.0`? **Não.** Fica fora do repo; os commits deste plano são apenas do plano/spec em `Apppocus-2.0`. Cada task diz explicitamente o que commitar.
- Venv reaproveitado: `/home/jackson-fuck/Projetos/simvera-orchestrator/.venv` (fastapi 0.141.1, httpx 0.28.1). Adicionar apenas `pytest`.
- Serviços alvo, todos já no ar: RAG `http://127.0.0.1:8099`, Gemma `http://127.0.0.1:8081/v1`, Meissa `http://127.0.0.1:8003/v1`, SimVera `http://127.0.0.1:8100/v1`.
- Modelo do shim: `simvera-triangulo`.
- Ambos os servidores llama.cpp exigem `"chat_template_kwargs": {"enable_thinking": False}` no payload. Medido: TTFT 2,35s → 0,19s. Numa rodada de 2h isso é a diferença entre viável e inviável. `reasoning_budget: 0` **não** funciona neste build.
- Timeout por item: 60s. Sem retry automático.
- Subsets fixos: 100 itens para iterar, 300 para decidir.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `simvera-eval/datasets.py` | Baixar MedQA/PubMedQA, normalizar para item único, gravar `data/<bench>-<n>.jsonl` |
| `simvera-eval/score.py` | Extrair a resposta do texto bruto e calcular acurácia |
| `simvera-eval/targets.py` | Quatro alvos, uma assinatura |
| `simvera-eval/run.py` | Compor dataset × alvo, gravar append-only, retomar |
| `simvera-eval/report.py` | Citação, recusa, latência |
| `simvera-eval/tests/test_score.py` | Extração e normalização — os dois pontos que corrompem em silêncio |

**Formato do item** (produzido por `datasets.py`, consumido por `targets.py` e `run.py`):

```python
{"id": str, "bench": "medqa"|"pubmedqa", "question": str,
 "options": dict[str,str] | None, "label": str, "difficulty": str}
```

**Formato do resultado** (gravado por `run.py`, lido por `score.py` e `report.py`):

```python
{"id": str, "label": str, "difficulty": str, "response": str,
 "latency_s": float, "citations": list[str], "abstained": bool, "error": str|None}
```

Os nomes `id`, `label`, `difficulty`, `response` são os mesmos que os scorers do Meissa acessam via `item.get(...)`, para manter a forma comparável. Diferença deliberada: `response` aqui é `str`, não `dict` — nosso scorer é próprio (o do Meissa não roda: importa `eval_helpers`, ausente do repo).

**Decisão de conteúdo:** o campo `context.contexts` do PubMedQA é **descartado**. Fornecê-lo entregaria a evidência de bandeja e o harness mediria geração, não recuperação — que é exatamente o que precisamos medir.

---

### Task 1: datasets.py — baixar e normalizar

**Files:**
- Create: `/home/jackson-fuck/Projetos/simvera-eval/datasets.py`
- Create: `/home/jackson-fuck/Projetos/simvera-eval/tests/test_score.py`
- Create: `/home/jackson-fuck/Projetos/simvera-eval/.gitignore`

**Interfaces:**
- Consumes: nada
- Produces: `norm_medqa(row: dict) -> dict`, `norm_pubmedqa(row: dict) -> dict`, `fetch(bench: str, n: int) -> list[dict]`, `main()`. Constante `BENCHES: dict[str, dict]`.

- [ ] **Step 1: Criar o diretório e instalar pytest**

```bash
mkdir -p /home/jackson-fuck/Projetos/simvera-eval/tests /home/jackson-fuck/Projetos/simvera-eval/data
cd /home/jackson-fuck/Projetos/simvera-eval
printf 'results/\n__pycache__/\n*.pyc\n' > .gitignore
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/pip install -q pytest
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python -c "import pytest;print('pytest',pytest.__version__)"
```

Esperado: imprime a versão do pytest. `data/` é versionado (subsets fixos); `results/` não.

- [ ] **Step 2: Escrever o teste que falha**

Criar `tests/test_score.py` com as duas normalizações. As linhas de entrada são cópias reais das amostras da API do datasets-server.

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import datasets


def test_norm_medqa_mapeia_answer_idx_para_label():
    row = {
        "question": "A junior orthopaedic surgery resident...",
        "answer": "Tell the attending that he cannot fail to disclose this mistake",
        "options": {"A": "Disclose the error", "B": "Tell the attending",
                    "C": "Report to ethics", "D": "Do nothing"},
        "meta_info": "step1",
        "answer_idx": "B",
        "metamap_phrases": ["junior orthopaedic surgery resident"],
    }
    item = datasets.norm_medqa(row)
    assert item["label"] == "B"
    assert item["difficulty"] == "step1"
    assert item["options"]["B"] == "Tell the attending"
    assert item["bench"] == "medqa"
    assert "metamap_phrases" not in item


def test_norm_pubmedqa_descarta_o_contexto():
    row = {
        "pubid": 21645374,
        "question": "Do mitochondria play a role in remodelling lace plant leaves?",
        "context": {"contexts": ["Programmed cell death (PCD) is the regulated death..."]},
        "long_answer": "Results depicted mitochondrial dynamics in vivo...",
        "final_decision": "yes",
    }
    item = datasets.norm_pubmedqa(row)
    assert item["label"] == "yes"
    assert item["id"] == "21645374"
    assert item["options"] is None
    assert item["difficulty"] == "unknown"
    # O contexto entregaria a evidência de bandeja; o harness mediria geração, não recuperação.
    assert "context" not in item
    assert "long_answer" not in item
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python -m pytest tests/test_score.py -v
```

Esperado: FAIL com `ModuleNotFoundError: No module named 'datasets'`.

- [ ] **Step 4: Implementar datasets.py**

```python
"""Baixa MedQA e PubMedQA e normaliza para um formato único de item.

Usa a API REST do datasets-server (devolve JSON pronto) em vez da biblioteca
`datasets` do HuggingFace — evita uma dependência pesada para ler 300 linhas.

O subset é determinístico (offset 0..n na ordem do dataset) e gravado em disco
para ser versionado: entre duas rodadas, uma diferença de número tem que vir da
mudança no pipeline, nunca da amostra.

Uso:
    python datasets.py --bench medqa --n 300
    python datasets.py --bench pubmedqa --n 100
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import httpx

API = "https://datasets-server.huggingface.co/rows"
DATA = Path(__file__).resolve().parent / "data"

BENCHES = {
    "medqa": {"dataset": "GBaker/MedQA-USMLE-4-options",
              "config": "default", "split": "test"},
    # pqa_labeled é o subset anotado por humanos (1000 itens); só tem split 'train'.
    "pubmedqa": {"dataset": "qiaojin/PubMedQA",
                 "config": "pqa_labeled", "split": "train"},
}


def norm_medqa(row: dict) -> dict:
    """answer_idx é a letra correta; meta_info ('step1'/'step2&3') vira difficulty."""
    return {
        "id": "",  # preenchido por fetch(): MedQA não traz id próprio
        "bench": "medqa",
        "question": row["question"],
        "options": row["options"],
        "label": row["answer_idx"],
        "difficulty": row.get("meta_info") or "unknown",
    }


def norm_pubmedqa(row: dict) -> dict:
    """Descarta context/long_answer de propósito: com o contexto dado, o harness
    mediria geração, não recuperação."""
    return {
        "id": str(row["pubid"]),
        "bench": "pubmedqa",
        "question": row["question"],
        "options": None,
        "label": row["final_decision"],
        "difficulty": "unknown",
    }


_NORM = {"medqa": norm_medqa, "pubmedqa": norm_pubmedqa}


def fetch(bench: str, n: int) -> list[dict]:
    """Primeiros n itens do split, em páginas de 100 (limite da API)."""
    cfg = BENCHES[bench]
    norm = _NORM[bench]
    out: list[dict] = []
    with httpx.Client(timeout=60.0) as client:
        while len(out) < n:
            page = client.get(API, params={
                "dataset": cfg["dataset"], "config": cfg["config"],
                "split": cfg["split"], "offset": len(out),
                "length": min(100, n - len(out))})
            page.raise_for_status()
            rows = page.json()["rows"]
            if not rows:
                break
            for r in rows:
                item = norm(r["row"])
                if not item["id"]:
                    item["id"] = f"{bench}-{len(out)}"
                out.append(item)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bench", choices=sorted(BENCHES), required=True)
    ap.add_argument("--n", type=int, default=300)
    args = ap.parse_args()

    items = fetch(args.bench, args.n)
    DATA.mkdir(exist_ok=True)
    path = DATA / f"{args.bench}-{len(items)}.jsonl"
    with path.open("w", encoding="utf-8") as fh:
        for it in items:
            fh.write(json.dumps(it, ensure_ascii=False) + "\n")
    print(f"{path}: {len(items)} itens")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python -m pytest tests/test_score.py -v
```

Esperado: `2 passed`.

- [ ] **Step 6: Baixar os quatro subsets**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
PY=/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python
$PY datasets.py --bench medqa --n 100
$PY datasets.py --bench medqa --n 300
$PY datasets.py --bench pubmedqa --n 100
$PY datasets.py --bench pubmedqa --n 300
wc -l data/*.jsonl
```

Esperado: quatro arquivos com 100, 300, 100 e 300 linhas. Se `pubmedqa-300` vier com menos, pqa_labeled tem 1000 itens — investigar antes de seguir.

---

### Task 2: score.py — extração e acurácia

**Files:**
- Create: `/home/jackson-fuck/Projetos/simvera-eval/score.py`
- Modify: `/home/jackson-fuck/Projetos/simvera-eval/tests/test_score.py` (acrescentar)

**Interfaces:**
- Consumes: formato do resultado (Task 4 grava, mas o teste usa fixtures em memória — esta task não depende de `run.py`)
- Produces: `extract(text: str, bench: str) -> str | None`, `tally(items: list[dict], bench: str) -> dict`

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao final de `tests/test_score.py`:

```python
import score


def test_extract_medqa_answer_simples():
    assert score.extract("Answer: C", "medqa") == "C"


def test_extract_medqa_negrito_com_parenteses():
    assert score.extract("**Answer: (B)**", "medqa") == "B"


def test_extract_medqa_pega_a_ultima_ocorrencia():
    # O modelo raciocina em voz alta e conclui no fim; a última é a resposta.
    txt = "Option (A) seems plausible but is wrong. Final Answer: D"
    assert score.extract(txt, "medqa") == "D"


def test_extract_medqa_recusa_devolve_none():
    txt = "A EVIDÊNCIA não fornece elementos para escolher entre as alternativas."
    assert score.extract(txt, "medqa") is None


def test_extract_pubmedqa_yes_no_maybe():
    assert score.extract("yes", "pubmedqa") == "yes"
    assert score.extract("Answer: no", "pubmedqa") == "no"
    # 'maybe' no meio do texto, com a conclusão no fim.
    assert score.extract("It could be yes, but evidence is weak. maybe", "pubmedqa") == "maybe"


def test_extract_pubmedqa_recusa_devolve_none():
    assert score.extract("Não há evidência suficiente no corpus.", "pubmedqa") is None


def test_tally_ignora_itens_com_erro():
    items = [
        {"label": "A", "response": "Answer: A", "difficulty": "step1", "error": None},
        {"label": "B", "response": "Answer: C", "difficulty": "step1", "error": None},
        {"label": "C", "response": "", "difficulty": "step1", "error": "timeout"},
    ]
    r = tally = score.tally(items, "medqa")
    assert r["total"] == 2          # o item com erro sai do denominador
    assert r["correct"] == 1
    assert r["errors"] == 1
    assert r["accuracy"] == 50.0


def test_tally_conta_falha_de_extracao_separada_do_erro():
    items = [
        {"label": "A", "response": "Answer: A", "difficulty": "step1", "error": None},
        {"label": "B", "response": "não sei dizer", "difficulty": "step1", "error": None},
    ]
    r = score.tally(items, "medqa")
    assert r["total"] == 2
    assert r["correct"] == 1
    assert r["extraction_fail"] == 1
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python -m pytest tests/test_score.py -v
```

Esperado: FAIL com `ModuleNotFoundError: No module named 'score'`. Os 2 testes da Task 1 continuam passando.

- [ ] **Step 3: Implementar score.py**

```python
"""Extrai a resposta do texto bruto e calcula acurácia.

Scorer próprio. Os do Meissa (environments/multi_agent_collaboration/eval/) importam
`eval_helpers` na linha 8 e esse arquivo não existe no repo nem no histórico — não
rodam. Daqui foram reaproveitados o formato do item e os padrões de regex.

Falha de extração é contada separada de erro de execução: extração alta demais
invalida a acurácia, e é um sintoma diferente de um serviço fora do ar.

Uso:
    python score.py --dir results/simvera --bench medqa
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

# Mesmos padrões do clean_answer() do Meissa, na mesma ordem.
_MEDQA = [
    re.compile(p, re.IGNORECASE | re.MULTILINE) for p in (
        r"Answer:\s*\(?([A-E])\)?",
        r"The correct answer is\s*\(?([A-E])\)?",
        r"Final Answer:\s*\(?([A-E])\)?",
        r"Correct Answer:\s*\(?([A-E])\)?",
        r"\*\*Answer:\s*\(?([A-E])\)?\*\*",
        r"\(([A-E])\)",
        r"(?:^|\n)\s*([A-E])\)\s",
        r"^([A-E])$",
    )
]


def extract(text: str, bench: str) -> str | None:
    """Rótulo extraído, ou None quando nenhum padrão casa (recusa ou divagação)."""
    if not isinstance(text, str) or not text.strip():
        return None
    if bench == "medqa":
        found: list[str] = []
        for pat in _MEDQA:
            found.extend(pat.findall(text))
        return found[-1].upper() if found else None
    # pubmedqa: a última menção vence — o modelo raciocina antes e conclui no fim.
    last, best = -1, None
    for label in ("yes", "no", "maybe"):
        idx = text.lower().rfind(label)
        if idx > last:
            last, best = idx, label
    return best


def tally(items: list[dict], bench: str) -> dict:
    """Acurácia sobre os itens sem erro de execução, com quebra por difficulty."""
    ok = [i for i in items if not i.get("error")]
    by_diff: dict[str, dict] = defaultdict(lambda: {"total": 0, "correct": 0})
    correct = extraction_fail = 0
    for it in ok:
        pred = extract(it.get("response", ""), bench)
        d = by_diff[it.get("difficulty") or "unknown"]
        d["total"] += 1
        if pred is None:
            extraction_fail += 1
            continue
        if pred.lower() == str(it["label"]).lower():
            correct += 1
            d["correct"] += 1
    total = len(ok)
    return {
        "total": total,
        "correct": correct,
        "errors": len(items) - total,
        "extraction_fail": extraction_fail,
        "accuracy": round(correct / total * 100, 2) if total else 0.0,
        "by_difficulty": {k: dict(v) for k, v in sorted(by_diff.items())},
    }


def load(dirpath: Path, bench: str) -> list[dict]:
    path = dirpath / f"{bench}.json"
    if not path.exists():
        raise SystemExit(f"não encontrado: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="ex: results/simvera")
    ap.add_argument("--bench", choices=("medqa", "pubmedqa"), required=True)
    args = ap.parse_args()

    r = tally(load(Path(args.dir), args.bench), args.bench)
    print(f"{args.dir}  {args.bench}")
    print(f"  acurácia          {r['accuracy']:6.2f}%  ({r['correct']}/{r['total']})")
    print(f"  falha de extração {r['extraction_fail']:6d}")
    print(f"  erro de execução  {r['errors']:6d}")
    for d, v in r["by_difficulty"].items():
        acc = v["correct"] / v["total"] * 100 if v["total"] else 0
        print(f"    {d:14s} {acc:6.2f}%  ({v['correct']}/{v['total']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python -m pytest tests/test_score.py -v
```

Esperado: `9 passed`.

---

### Task 3: targets.py — os quatro alvos

**Files:**
- Create: `/home/jackson-fuck/Projetos/simvera-eval/targets.py`

**Interfaces:**
- Consumes: formato do item (Task 1)
- Produces: `TARGETS: dict[str, Callable]`, `build_prompt(item: dict, forced_choice: bool) -> str`, `Resposta` (TypedDict com `text`, `latency_s`, `citations`, `abstained`)

- [ ] **Step 1: Implementar targets.py**

Sem teste dedicado: testar exigiria mockar quatro serviços HTTP para verificar que HTTP funciona. A verificação real é o smoke da Task 4.

```python
"""Quatro alvos, uma assinatura. Cada alvo é uma função — sem classe, sem registry.

A comparação entre alvos é o que torna um ganho atribuível:
    rag - gemma      = o que o corpus adiciona
    simvera - rag    = o que a orquestração adiciona
Sem isso, uma variação de acurácia não diz de onde veio.
"""
from __future__ import annotations

import time
from typing import TypedDict

import httpx

RAG = "http://127.0.0.1:8099"
GEMMA = "http://127.0.0.1:8081/v1"
MEISSA = "http://127.0.0.1:8003/v1"
SIMVERA = "http://127.0.0.1:8100/v1"

TIMEOUT = 60.0
RAG_TOP_K = 6

# Sem isto o llama.cpp gasta ~20s raciocinando antes do primeiro token visível.
# Medido: TTFT 2,35s -> 0,19s. `reasoning_budget: 0` é ignorado neste build.
NO_THINK = {"enable_thinking": False}


class Resposta(TypedDict):
    text: str
    latency_s: float
    citations: list[str]
    abstained: bool


def build_prompt(item: dict, forced_choice: bool) -> str:
    """MedQA: pergunta + alternativas. PubMedQA: só a pergunta (contexto descartado)."""
    parts = [item["question"]]
    if item.get("options"):
        parts += [f"{k}. {v}" for k, v in sorted(item["options"].items())]
    if forced_choice:
        parts.append(
            "Answer with only the letter (A, B, C or D). No explanation."
            if item.get("options") else
            "Answer with only one word: yes, no, or maybe. No explanation.")
    return "\n".join(parts)


def _chat(url: str, model: str, prompt: str) -> str:
    """Chamada OpenAI-compatible. Cai para reasoning_content quando o modelo
    gastou o orçamento inteiro pensando e devolveu content vazio."""
    with httpx.Client(timeout=TIMEOUT) as c:
        r = c.post(f"{url}/chat/completions", json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512, "temperature": 0.0,
            "chat_template_kwargs": NO_THINK})
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
    return (msg.get("content") or "").strip() or (msg.get("reasoning_content") or "").strip()


def _timed(fn) -> Resposta:
    t0 = time.time()
    text, cites, abst = fn()
    return Resposta(text=text, latency_s=round(time.time() - t0, 3),
                    citations=cites, abstained=abst)


def target_gemma(item: dict, *, forced_choice: bool) -> Resposta:
    """Gemma-4 sozinho, sem RAG. Baseline: quanto é conhecimento paramétrico."""
    p = build_prompt(item, forced_choice)
    return _timed(lambda: (_chat(GEMMA, "gemma-4-12b", p), [], False))


def target_meissa(item: dict, *, forced_choice: bool) -> Resposta:
    """Meissa-4B sozinho. Reproduz o número do paper e valida o setup."""
    p = build_prompt(item, forced_choice)
    return _timed(lambda: (_chat(MEISSA, "meissa", p), [], False))


def target_rag(item: dict, *, forced_choice: bool) -> Resposta:
    """evidence-pack + Gemma. Isola o ganho do corpus, sem o Meissa."""
    def go():
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.post(f"{RAG}/rag/evidence-pack",
                       json={"query": item["question"], "top_k": RAG_TOP_K})
            r.raise_for_status()
            pack = r.json()
        chunks = pack.get("chunks") or []
        cites = [ch.get("citation_label", "") for ch in chunks if ch.get("citation_label")]
        if pack.get("abstain") or not chunks:
            return "", cites, True
        ev = "\n\n".join(f"[{ch.get('citation_label','?')}] {ch.get('text','')}"
                         for ch in chunks)
        p = f"EVIDÊNCIA:\n{ev}\n\n---\n\n{build_prompt(item, forced_choice)}"
        return _chat(GEMMA, "gemma-4-12b", p), cites, False
    return _timed(go)


def target_simvera(item: dict, *, forced_choice: bool) -> Resposta:
    """O triângulo completo pelo shim. O número que importa."""
    def go():
        with httpx.Client(timeout=TIMEOUT) as c:
            r = c.post(f"{SIMVERA}/chat/completions", json={
                "model": "simvera-triangulo",
                "messages": [{"role": "user",
                              "content": build_prompt(item, forced_choice)}],
                "stream": False, "temperature": 0.0})
            r.raise_for_status()
            body = r.json()
        msg = body["choices"][0]["message"]
        text = (msg.get("content") or "").strip()
        # O shim devolve as citações no corpo do texto; o pack não é exposto.
        # Aproximação: rótulos entre colchetes. Se o shim passar a expor
        # `citations` no JSON, preferir esse campo.
        import re as _re
        cites = _re.findall(r"\[([^\]]{3,80})\]", text)
        return text, cites, not text
    return _timed(go)


TARGETS = {
    "gemma": target_gemma,
    "meissa": target_meissa,
    "rag": target_rag,
    "simvera": target_simvera,
}
```

- [ ] **Step 2: Fumaça manual, um item por alvo**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python - <<'EOF'
import json, targets
item = json.loads(open("data/medqa-100.jsonl").readline())
for name, fn in targets.TARGETS.items():
    try:
        r = fn(item, forced_choice=True)
        print(f"{name:8s} {r['latency_s']:6.2f}s cites={len(r['citations']):2d} "
              f"abst={r['abstained']} -> {r['text'][:60]!r}")
    except Exception as e:
        print(f"{name:8s} ERRO {type(e).__name__}: {e}")
EOF
```

Esperado: quatro linhas. `gemma` e `meissa` com `cites=0`; `rag` com `cites>0`. Qualquer `ERRO` aqui é serviço fora do ar — resolver antes da Task 4.

---

### Task 4: run.py — orquestrar, append-only, retomar

**Files:**
- Create: `/home/jackson-fuck/Projetos/simvera-eval/run.py`

**Interfaces:**
- Consumes: `targets.TARGETS`, formato do item (Task 1)
- Produces: `results/<alvo>/<bench>.json` no formato do resultado

- [ ] **Step 1: Implementar run.py**

```python
"""Roda um alvo sobre um dataset e grava resultados retomáveis.

Uma rodada completa leva ~2h. Falhar no meio e perder tudo é inaceitável: os
resultados são gravados a cada item e itens já presentes são pulados, então
reexecutar retoma de onde parou.

Sem retry automático de propósito — um retry mascara instabilidade, que é
justamente uma das coisas que se quer medir.

Uso:
    python run.py --target simvera --data data/medqa-100.jsonl
    python run.py --target rag --data data/medqa-100.jsonl --no-forced-choice
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import targets as T

ROOT = Path(__file__).resolve().parent


def load_done(out: Path) -> tuple[list[dict], set[str]]:
    if not out.exists():
        return [], set()
    got = json.loads(out.read_text(encoding="utf-8"))
    return got, {g["id"] for g in got}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=sorted(T.TARGETS), required=True)
    ap.add_argument("--data", required=True, help="ex: data/medqa-100.jsonl")
    ap.add_argument("--no-forced-choice", action="store_true",
                    help="deixa o alvo recusar; usado para medir taxa de recusa")
    args = ap.parse_args()

    data = Path(args.data)
    items = [json.loads(l) for l in data.read_text(encoding="utf-8").splitlines() if l.strip()]
    bench = items[0]["bench"]

    suffix = "" if not args.no_forced_choice else "-free"
    outdir = ROOT / "results" / f"{args.target}{suffix}"
    outdir.mkdir(parents=True, exist_ok=True)
    out = outdir / f"{bench}.json"

    done, seen = load_done(out)
    todo = [i for i in items if i["id"] not in seen]
    print(f"{args.target}{suffix} / {bench}: {len(done)} feitos, {len(todo)} restantes")

    fn = T.TARGETS[args.target]
    t_start = time.time()
    for n, item in enumerate(todo, 1):
        rec = {"id": item["id"], "label": item["label"],
               "difficulty": item["difficulty"], "response": "",
               "latency_s": 0.0, "citations": [], "abstained": False, "error": None}
        try:
            r = fn(item, forced_choice=not args.no_forced_choice)
            rec.update(response=r["text"], latency_s=r["latency_s"],
                       citations=r["citations"], abstained=r["abstained"])
        except Exception as exc:
            rec["error"] = f"{type(exc).__name__}: {exc}"
        done.append(rec)
        # Grava a cada item: uma queda no item 250 de 300 não custa as 2h anteriores.
        out.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
        eta = (time.time() - t_start) / n * (len(todo) - n)
        print(f"  [{n}/{len(todo)}] {rec['latency_s']:5.1f}s "
              f"{'ERRO' if rec['error'] else 'ok'}  eta {eta/60:.0f}min",
              file=sys.stderr, flush=True)

    errs = sum(1 for d in done if d.get("error"))
    print(f"{out}: {len(done)} itens, {errs} erros")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Verificar que retoma sem duplicar**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
PY=/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python
head -3 data/medqa-100.jsonl > data/smoke-3.jsonl
$PY run.py --target gemma --data data/smoke-3.jsonl
$PY run.py --target gemma --data data/smoke-3.jsonl
$PY -c "
import json; d=json.load(open('results/gemma/medqa.json'))
print('itens:',len(d),'ids unicos:',len({x['id'] for x in d}))
assert len(d)==len({x['id'] for x in d})==3, 'DUPLICOU'
print('OK: retomada sem duplicata')"
```

Esperado: a segunda execução imprime `3 feitos, 0 restantes` e o assert passa.

- [ ] **Step 3: Pontuar o smoke**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python score.py --dir results/gemma --bench medqa
```

Esperado: tabela com acurácia sobre 3 itens. Se `falha de extração` for 3, o prompt de escolha forçada não está funcionando — investigar antes de gastar 2h.

---

### Task 5: report.py — citação, recusa, latência

**Files:**
- Create: `/home/jackson-fuck/Projetos/simvera-eval/report.py`

**Interfaces:**
- Consumes: `results/<alvo>/<bench>.json` (Task 4)
- Produces: `metrics(items: list[dict]) -> dict`

- [ ] **Step 1: Implementar report.py**

```python
"""Métricas que benchmark público não mede: citação, recusa, latência.

MedQA e PubMedQA medem acerto. As propriedades pelas quais este sistema existe —
responder com fonte e recusar quando falta evidência — não aparecem em nenhuma
delas. Daí este módulo.

Uso:
    python report.py --bench medqa
    python report.py --bench medqa --dirs results/rag results/simvera
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def pct(n: int, d: int) -> float:
    return round(n / d * 100, 1) if d else 0.0


def metrics(items: list[dict]) -> dict:
    ok = [i for i in items if not i.get("error")]
    lat = sorted(i["latency_s"] for i in ok)
    def q(p: float) -> float:
        return round(lat[min(int(len(lat) * p), len(lat) - 1)], 2) if lat else 0.0
    return {
        "n": len(items),
        "erros": len(items) - len(ok),
        "citacao_pct": pct(sum(1 for i in ok if i.get("citations")), len(ok)),
        "recusa_pct": pct(sum(1 for i in ok if i.get("abstained")), len(ok)),
        "p50": q(0.50),
        "p95": q(0.95),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bench", choices=("medqa", "pubmedqa"), required=True)
    ap.add_argument("--dirs", nargs="*", default=None,
                    help="default: todos os results/*/ que tiverem o bench")
    args = ap.parse_args()

    dirs = ([Path(d) for d in args.dirs] if args.dirs
            else sorted(p for p in (ROOT / "results").glob("*")
                        if (p / f"{args.bench}.json").exists()))
    if not dirs:
        raise SystemExit(f"nenhum resultado para {args.bench}")

    print(f"{'alvo':16s} {'n':>4s} {'err':>4s} {'citação':>8s} {'recusa':>7s} "
          f"{'p50':>7s} {'p95':>7s}")
    for d in dirs:
        m = metrics(json.loads((d / f"{args.bench}.json").read_text(encoding="utf-8")))
        print(f"{d.name:16s} {m['n']:4d} {m['erros']:4d} {m['citacao_pct']:7.1f}% "
              f"{m['recusa_pct']:6.1f}% {m['p50']:6.2f}s {m['p95']:6.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Rodar sobre o smoke**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python report.py --bench medqa
```

Esperado: uma linha para `gemma` com `citação 0.0%` (alvo sem RAG) e latências plausíveis.

- [ ] **Step 3: Commit do plano e da spec**

O código vive fora do repo git. O que se commita aqui é a documentação.

```bash
cd /home/jackson-fuck/Projetos/Apppocus-2.0
git add docs/superpowers/plans/2026-08-04-harness-avaliacao.md
git diff --cached --name-only | grep -i 'env' && echo "PARE: .env no stage" || echo "sem .env: ok"
git commit -m "docs: plano de implementação do harness de avaliação"
```

---

### Task 6: rodada completa e critérios de verificação

**Files:** nenhum. Esta task executa e confere.

- [ ] **Step 1: Ler o número publicado do Meissa**

```bash
grep -riE 'medqa|pubmedqa' /home/jackson-fuck/Projetos/Meissa/README.md | grep -oE '[0-9]{2}\.[0-9]' | head
```

Anotar o valor em `docs/superpowers/specs/2026-08-04-harness-avaliacao-design.md`, critério 1. **Não assumir de memória.** Se o README não trouxer o número, buscar no paper antes de seguir — sem referência, o critério 1 não é verificável e isso precisa ser dito, não contornado.

- [ ] **Step 2: Rodada de iteração (100 itens × 4 alvos)**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
PY=/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python
for t in gemma meissa rag simvera; do
  for b in medqa pubmedqa; do
    $PY run.py --target $t --data data/$b-100.jsonl
  done
done
```

Esperado: ~1h. Rodar destacado (`setsid nohup ... &`) — a sessão pode cair.

- [ ] **Step 3: Passada sem escolha forçada, só para taxa de recusa**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
PY=/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python
for t in rag simvera; do
  $PY run.py --target $t --data data/medqa-100.jsonl --no-forced-choice
done
```

Alvos sem RAG ficam de fora: não têm evidência para recusar por falta dela.

- [ ] **Step 4: Conferir os quatro critérios da spec**

```bash
cd /home/jackson-fuck/Projetos/simvera-eval
PY=/home/jackson-fuck/Projetos/simvera-orchestrator/.venv/bin/python
for t in gemma meissa rag simvera; do $PY score.py --dir results/$t --bench medqa; done
$PY report.py --bench medqa
```

Conferir, e **relatar o que não bater em vez de contornar**:

1. `meissa` dentro de 5pp do número publicado — se não, o setup está errado e nenhum outro número vale
2. `rag` > `gemma` — se não, o corpus não está ajudando, e essa é a primeira coisa a investigar
3. `citação` > 0 para `rag` e `simvera`, = 0 para `gemma`
4. retomada sem duplicata já verificada na Task 4

---

## Self-Review

**Cobertura da spec:**

| Requisito da spec | Task |
|---|---|
| `datasets.py` baixa e fixa subsets | 1 |
| `targets.py` com 4 alvos | 3 |
| `run.py` append-only e retomável | 4 |
| `score.py` acurácia + falha de extração | 2 |
| `report.py` citação/recusa/latência | 5 |
| Escolha forçada padrão, recusa em passada separada | 3 (`build_prompt`), 4 (`--no-forced-choice`), 6 step 3 |
| Contexto do PubMedQA descartado | 1 (`norm_pubmedqa` + teste) |
| Timeout 60s, sem retry | 3 (`TIMEOUT`), 4 (sem laço de retry) |
| Teste da extração | 2 |
| Subsets 100/300 | 1 step 6 |
| Os 4 critérios de verificação | 6 |

**Consistência de tipos:** `Resposta` (`text`/`latency_s`/`citations`/`abstained`) é produzida em `targets.py` e consumida em `run.py:rec.update(...)` com os mesmos nomes. O formato do resultado gravado por `run.py` tem as chaves que `score.tally` (`label`, `response`, `difficulty`, `error`) e `report.metrics` (`latency_s`, `citations`, `abstained`, `error`) leem.

**Lacuna conhecida, declarada:** `target_simvera` extrai citações por regex de colchetes no texto, porque o shim não expõe o pack no JSON de resposta. É aproximação. Se o número de citação de `simvera` divergir muito do de `rag`, a causa provável é essa extração, não o pipeline — o conserto é o shim passar a devolver `citations` no corpo, e aí o alvo prefere esse campo.
