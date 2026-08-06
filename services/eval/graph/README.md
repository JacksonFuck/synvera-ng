# Harness Clinical GraphRAG

Métricas de léxico tipado, multi-hop offline e (opcional) live contra Super-RAG.

## Offline (sem rede)

Só lê `lexicon.json`, SQLite do corpus (se existir) e os golds:

```bash
cd services/eval/graph
PY=../../rag-gateway/.venv/bin/python

$PY run_baseline.py
$PY run_baseline.py --out results/baseline.json
```

Reporta:

- contagens de entidades / `typed_edges` por predicado
- recall do `gold_triples.json` no léxico
- taxa multi-hop offline (seed detect + vizinho tipado vs `gold_multihop.json`)

## Live (Super-RAG em `:8099`)

```bash
# contribution de search (como antes)
$PY run_baseline.py --live --out results/baseline_live.json

# + evidence-pack: triplas com provenance vs gold (#9)
$PY run_baseline.py --live --pack --live-n 10 --out results/baseline_pack.json
```

Com `--pack`, cada query do gold chama `POST /rag/evidence-pack` e grava:

| campo | significado |
|-------|-------------|
| `pack_triple_hit_rate` | fração das queries com tripla citável alinhada a `expect_rels` × `expect_entities` |
| `mean_graph_triples` | média de triplas no pack |
| `mean_wall_s` / `pack_mean_wall_s` | latência wall-clock do pack |
| `invariant_ok` | **false** se alguma tripla veio sem `citation_label` ou com predicado aberto |

Exit code **2** se o invariante de provenance falhar (tripla sem fonte no pack).

## Testes unitários (offline)

```bash
$PY -m pytest tests/test_pack_metrics.py -q
```

Não precisam de RAG no ar: validam scoring e o invariante de citation.

## Golds

| ficheiro | uso |
|----------|-----|
| `gold_triples.json` | arestas (source, predicate, target) esperadas no léxico |
| `gold_multihop.json` | queries com `expect_entities` / `expect_rels` |

## Política

Indexação LLM (se houver): **somente** Gemma-4 local (`SIMVERA_GEMMA_URL`, tipicamente `:8081`).
Fase 1 de arestas tipadas é determinística (TS / surfaces).
