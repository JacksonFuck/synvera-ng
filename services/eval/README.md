# Harness de avaliação (Fase A)

Mede acurácia (MedQA / PubMedQA), citação, recusa e latência em quatro alvos:

| alvo | o que testa |
|------|-------------|
| `gemma` | Gemma sozinho (conhecimento paramétrico) |
| `meissa` | Meissa sozinho |
| `rag` | evidence-pack + Gemma (ganho do corpus) |
| `simvera` | orquestrador completo `:8100` |

## Uso

```bash
cd services/eval
PY=../rag-gateway/.venv/bin/python   # ou python3 com httpx

$PY datasets.py --bench medqa --n 20
$PY run.py --target gemma --data data/medqa-20.jsonl
$PY run.py --target simvera --data data/medqa-20.jsonl
$PY score.py --dir results/simvera --bench medqa
$PY report.py --dir results/simvera --bench medqa
```

`--no-forced-choice` desliga a instrução de “só a letra” (mede taxa de recusa em produção).

Com `forced_choice` (padrão), o alvo `simvera` manda `forced_choice: true` no body do
orquestrador: sem Meissa, sem modo consulta, `max_tokens` baixo, e o JSON devolve
`simvera.citation_labels` para o report.

Subsets fixos em `data/*.jsonl` (versionáveis). Resultados em `results/` (gitignored).

## Baseline MedQA-20 (forced-choice)

| alvo | acurácia | citação | recusa | lat p50 |
|------|--------:|--------:|-------:|--------:|
| gemma | 65% | 0% | 0% | 0,2s |
| meissa | 35% | 0% | 0% | 0,6s |
| rag | 70% | 100% | 0% | 8,2s |
| simvera (antes do fix) | 35% | 0% | 45% | 16s |
| **simvera (após forced_choice)** | **70%** | **100%** | **0%** | **8,5s** |

## GraphRAG (multi-hop / pack de triplas)

Ver [`graph/README.md`](graph/README.md). Resumo:

```bash
cd services/eval/graph
PY=../../rag-gateway/.venv/bin/python
$PY run_baseline.py                          # offline
$PY run_baseline.py --live --pack            # evidence-pack vs gold
$PY -m pytest tests/test_pack_metrics.py -q  # invariante + scoring
```

## Limitações

- MedQA/PubMedQA em inglês vs corpus majoritariamente em português — BGE-M3 multilíngue, mas a acurácia sub-reporta o valor clínico real em PT.
- n=20 é smoke; decisão de mudança de pipeline: n=100 ou 300.
- Não substitui julgamento clínico humano.
