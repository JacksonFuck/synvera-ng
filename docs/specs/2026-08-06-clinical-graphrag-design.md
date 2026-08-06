# Clinical GraphRAG — Design (Synvera-ng)

**Data:** 2026-08-06  
**Issue:** #4  
**Status:** Fase 0–1 em implementação

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

Ver `services/eval/graph/run_baseline.py`:

- contagem typed no lexicon e no SQLite
- recall de gold triples
- multi-hop offline (detect + vizinho tipado)
- multi-hop live (`graph_contribution` via `/rag/search`)

## Non-goals

- Community summaries MS GraphRAG no corpus inteiro
- OpenIE LLM sem gate / sem `source_chunk_id`
- Reativar expansão `cooc` massiva sem estudo
