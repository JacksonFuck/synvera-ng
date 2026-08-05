# RAG Gateway (Fase 1 — ingestão)

Gateway de ingestão do RAG médico. **100% local, zero egress de PHI.** Bind `127.0.0.1`.
Pipeline: `parse(file) → chunks citáveis → schema SQLite → (embed) → store`, com fila/worker e API FastAPI.

## Invariantes
- **Zero egress**: nada de cloud na ingestão nem na busca. Bind apenas loopback.
- **Citação obrigatória**: todo chunk carrega `page_start/end` + `section_path` + `citation_label`.
- **TDD**: nenhum código de produção sem teste falhando antes.

## Parsing em camadas (tiered)
| Tier | Ferramenta | Quando | Saída |
|------|-----------|--------|-------|
| Rápido | **liteparse** (Apache-2.0, Rust/PDFium, CPU) | docs simples/digitais | Markdown |
| Pesado | **MinerU** | docs complexos (tabelas/fórmulas/multicoluna/scan) | Markdown alta qualidade |
| Fallback | **pdftotext** (poppler) | sempre disponível (cobre 92,5% digital) | texto+páginas |

`liteparse` e `MinerU` instalam em background (`scripts/install_parsers.sh`). Até lá, o tier `pdftotext`
mantém o pipeline funcional e testável. Todos atrás do **Parser port** (`raggw/parsing/base.py`).

## Layout
```
raggw/
  config.py            settings (host/porta/chunking) — bind 127.0.0.1
  db.py                schema SQLite: documents, document_chunks, ingestion_jobs (+FTS5, dedup content_hash)
  models.py            dataclasses: Block, ParsedDoc, Chunk
  chunking.py          blocks -> chunks citáveis (350–700 tok, overlap, contextual_header)
  embedding.py         Embedder port + FakeEmbedder (+ BgeM3 depois)
  parsing/
    base.py            Parser protocol + router de complexidade
    pdftotext_parser.py  tier funcional hoje
    liteparse_parser.py  adapter simples/rápido
    mineru_parser.py     adapter complexo
  ingest.py            parse -> chunk -> embed -> store (dedup)
  jobs.py              fila + worker, status em ingestion_jobs
  api.py               FastAPI /health /ingest /jobs
  scripts/
    parse_file.py      CLI: arquivo/pasta -> Markdown de alta qualidade
    seed_corpus.py     auto-ingestão de uma pasta local
```

## Uso
```bash
uv venv --python 3.12 .venv && source .venv/bin/activate
uv pip install -e ".[dev]"
pytest                                   # suíte (usa FakeEmbedder + PDF fixture real)
python -m raggw.scripts.parse_file ARQUIVO.pdf -o out/   # parse -> markdown
python -m raggw.scripts.seed_corpus /caminho/da/pasta    # auto-ingestão
uvicorn raggw.api:app --host 127.0.0.1 --port 8099       # API
```

## Retrieval (Fase 2)
Busca híbrida **lexical (FTS5/BM25) + densa (cosine) → RRF → rerank → top-k**, com filtros
`status=active` (esconde supersedidas) + `specialty`, **abstenção** quando a evidência é fraca,
e **evidence pack citável**.

- `POST /rag/search` `{query, specialty?, top_k?}` → hits ranqueados (com `citation_label`).
- `POST /rag/evidence-pack` `{query, specialty?}` → `{abstain, confidence_precheck, chunks[...]}`.

**Modelos reais** (bge-m3 + bge-reranker-v2-m3) ficam atrás dos ports `Embedder`/`Reranker`
e são **opt-in** (baixam ~4.7GB de pesos públicos):
```bash
RAG_REAL_MODELS=1 uvicorn raggw.api:app --host 127.0.0.1 --port 8099
RAG_REAL_MODELS=1 python -m raggw.scripts.seed_corpus PASTA   # re-embeda com bge-m3
RAG_REAL_MODELS=1 .venv/bin/python -m pytest tests/test_real_models.py  # smoke real
```
Por padrão, o bge-m3 sobe em CPU para não disputar VRAM. Para acelerar embeddings na GPU:
```bash
RAG_REAL_MODELS=1 RAG_EMBED_DEVICE=cuda RAG_EMBED_FP16=1 python -m raggw.scripts.seed_corpus PASTA
```
Sem essa flag, usa `FakeEmbedder`/`FakeReranker` (determinísticos, sem download) — os testes
rodam assim. Vetores de placeholder precisam ser **re-embedados** antes de busca semântica real.

## Baseline clínico

O baseline executa o seam público `hybrid_search -> evidence pack` e gera um relatório JSON
sem queries ou respostas brutas. O modo fixture é determinístico e não baixa modelos:

```bash
python -m raggw.scripts.run_evals \
  --mode fixture \
  --generation-id fixture-g0 \
  --report data/evals/baseline-fixture.json
```

Para avaliar uma geração SQLite existente sem alterá-la, use o modo local. A inferência
permanece local; para o caminho real, `RAG_REAL_MODELS=1` habilita BGE-M3 e o reranker local:

```bash
RAG_REAL_MODELS=1 python -m raggw.scripts.run_evals \
  --mode local \
  --db data/rag_corpus.db \
  --generation-id active \
  --report data/evals/baseline-active.json
```

O relatório registra geração, versão do conjunto de avaliação, configuração sanitizada,
métricas de recuperação, geração, citação, segurança e latência. O gate retorna `0` quando
os critérios passam e `1` quando há regressão ou métrica abaixo do limite.
