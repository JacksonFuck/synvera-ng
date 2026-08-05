# Synvera-ng

Apoio à decisão clínica ancorado em evidência. Três serviços locais orquestrados:
um RAG sobre corpus médico, um modelo especialista, e um consolidador multimodal.

**Toda resposta cita fonte e página. Sem evidência no corpus, o sistema recusa em
vez de inventar.** Essa é a propriedade central, não um detalhe de implementação.

Inferência 100% local — nenhum dado sai da máquina.

## Arquitetura

```
LibreChat :3080  ──►  orquestrador :8100  ──┬──►  Super-RAG :8099    BGE-M3 + reranker + grafo
                      (FastAPI, OpenAI-      ├──►  Meissa-4B :8003    especialista, com visão
                       compatible)           └──►  Gemma-4-12B :8081  consolidador multimodal
```

O orquestrador consulta o RAG e o Meissa **em paralelo**, consolida no Gemma e
devolve com citações. Se o RAG não encontra evidência, a resposta é uma recusa
explícita — o Gemma nunca responde de memória.

## Estrutura

| Caminho | O que é |
|---|---|
| `services/rag-gateway/` | Super-RAG: busca híbrida (BM25 + denso + grafo), RRF, rerank |
| `services/orchestrator/` | O shim que orquestra os três e fala OpenAI-compatible |
| `services/eval/` | Harness de avaliação (MedQA, PubMedQA) — ver `docs/plans/` |
| `librechat/` | Imagem própria + config. Interface clínica |
| `ops/` | Scripts dos containers de modelo e units systemd |
| `prompts/` | System prompts clínicos |
| `docs/` | Specs, planos, conformidade regulatória, **HANDOFF.md** |

Dados não ficam no repo. Vivem em `~/synvera-data/`:

| Pasta | Conteúdo | Versionado |
|---|---|---|
| `inbox/` | você joga PDF/MD aqui para indexar | não |
| `processed/` | markdown tratado — o que alimenta o índice | DVC |
| `raw/` | PDFs originais e corpora baixados | DVC |
| `index/` | `rag_corpus.db` + LanceDB | **nunca** — é derivado, regenerável |
| `models/` | GGUFs | não — vêm do HuggingFace |

## Começar

```bash
cp .env.example .env          # preencher RAG_ADMIN_TOKEN
dvc pull                      # traz processed/ e raw/
```

Subir os serviços:

```bash
bash ops/llama/start-gemma.sh
bash ops/llama/start-meissa.sh
systemctl --user start synvera-rag-gateway synvera-orchestrator
cd librechat && docker compose up -d --build
```

Interface em http://localhost:3080.

## Verificar que está de pé

```bash
curl -s localhost:8099/health && curl -s localhost:8100/health
```

Uma pergunta clínica deve voltar em menos de 10s, com citação de página. Se voltar
sem citação, algo está errado — reporte, não ignore.

## Antes de mudar qualquer coisa

Leia `docs/HANDOFF.md`. Ele tem o estado medido, as armadilhas que já custaram
tempo (o cache frio que parece falha, o symlink que engana, o `reasoning_budget`
que não funciona) e o que está pendente.

## Contexto regulatório

Destinado a integrar prontuário eletrônico hospitalar e de APS. Risco CFM
classificado como **alto**: o sistema influencia conduta. As lacunas conhecidas de
conformidade estão listadas em `docs/HANDOFF.md` e não devem ser ignoradas num
deploy com dados reais de paciente.
