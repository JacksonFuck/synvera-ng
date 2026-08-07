# Clinical GraphRAG — Design (Synvera-ng)

**Data:** 2026-08-06 (status 2026-08-07)  
**Issue:** #4 (Fase 0–1), #6 (Fase 2), #17 (Fase 3)  
**Status:** Fases 0–3 **entregues** (PRs #5, #11–#14, #16, #22–#25).

## Objetivo

Elevar o grafo de *entity-linked hybrid* a GraphRAG clínico com arestas tipadas, multi-hop grounded e avaliação — sem trocar o Super-RAG por MS GraphRAG/LightRAG.

## Política de LLM (obrigatória)

> **Qualquer indexação/extração que use LLM usa exclusivamente Gemma-4 local**  
> (`SIMVERA_GEMMA_URL`, default `http://127.0.0.1:8081/v1`).  
> Proibido Anthropic, OpenAI cloud ou outros providers no pipeline de grafo.

A Fase 1 (arestas a partir de `doencas.ts` / `bulario.ts`) é **determinística** e não chama LLM.  
Fases futuras (candidatos OpenIE) usam `raggw/graph/gemma_index.py`.

## Arquitetura

```
clinical_data/*.ts  →  build_lexicon.py  →  lexicon.json (entities + typed_edges)
                                              ↓
                              inject_typed_edges.py  →  graph_edges (rel tipado)
                              (opcional) build_graph.py → rebuild completo

Query → hybrid (lex + dense + graph.expand only_typed) → rerank → orquestrador
```

## Relações (schema fechado)

| rel | significado |
|---|---|
| `trata` | fármaco → doença |
| `tratado_por` | doença → fármaco |
| `dd` | doença ↔ doença (diferencial) |
| `interage` | fármaco ↔ fármaco |
| `contraindicado` | fármaco → doença/condição |

`cooc` permanece no DB mas **não** expande vizinhos por default (`RAG_GRAPH_NEIGHBORS=0`).

## Métricas

Ver `services/eval/graph/run_baseline.py` e `graph/README.md`:

- contagem typed no lexicon e no SQLite
- recall de gold triples
- multi-hop offline (detect + vizinho tipado)
- multi-hop live (`graph_contribution` via `/rag/search`)
- pack live (`--live --pack`: hit rate de triplas no evidence-pack + invariante de provenance)

`GET /health` → bloco `graph` (`lexicon_loaded`, `n_typed_edges`, `edges_by_rel`, …).

## Fase 2 (entregue)

Evidence-pack `graph_triples` com provenance; orquestrador seção GRAFO CLÍNICO +
`simvera.graph_triples`; caps k≤2 / top-N; harness pack.

## Non-goals

- Community summaries MS GraphRAG no corpus inteiro
- OpenIE LLM sem gate / sem `source_chunk_id`
- Reativar expansão `cooc` massiva sem estudo
