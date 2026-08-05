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

Subsets fixos em `data/*.jsonl` (versionáveis). Resultados em `results/` (gitignored).

## Limitações

- MedQA/PubMedQA em inglês vs corpus majoritariamente em português — BGE-M3 multilíngue, mas a acurácia sub-reporta o valor clínico real em PT.
- n=20 é smoke; decisão de mudança de pipeline: n=100 ou 300.
- Não substitui julgamento clínico humano.
