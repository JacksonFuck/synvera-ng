# Ingestão fácil + Corpus como Second Brain (4 incrementos)

## Contexto

O Super-RAG (rag-gateway :8099) já tem pipeline de ingestão maduro (parse→markdown artifact→quality gate→chunk→embed→SQLite+LanceDB+GraphStore), mas a entrada de novos arquivos é por CLI/scripts no servidor. O usuário quer: (1) inserir material de qualquer dispositivo (celular, outro PC, PC dele) via drag-and-drop multi-arquivo no admin do app; (2) pasta monitorada com ingestão automática; (3) o corpus exposto como vault Obsidian em markdown, estilo "second brain" Karpathy (espelho das fontes + wiki curada com [[wikilinks]]); (4) acesso via MCP para as LLMs locais e outros clientes; e (5) abrir a fonte ao clicar numa citação (usuário comum = trecho estendido; admin = texto integral — decisão de copyright já tomada).

**Regra dura do usuário (wiki):** o trabalho bruto é de scripts determinísticos/ML local (derivar notas e links do GraphStore de ~1,4M entidades que JÁ existe); LLM (Claude Code) só faz revisão final — minimizar tokens.

**Trunfo descoberto na exploração:** o espelho markdown já existe — `ingest.py:56 _write_markdown_artifact()` grava 1 `.md`/documento em `data/parsed_markdown/`, caminho em `documents.markdown_path`. O vault não é construído do zero; é materializado.

**Ordem aprovada:** Upload → Watcher → Vault (+ citação) → MCP. Cada incremento = spec→plano→implementação próprios. Este plano detalha o Incremento 1 e define a arquitetura dos demais.

## Arquitetura geral

```
[celular/PC] React admin ──HTTPS──▶ Deno gateway (/admin/* proxy, JWT+role) ──▶ rag-gateway :8099
                                                                                  │ POST /admin/uploads (Inc.1)
[~/rag-inbox] ──inbox_watcher (Inc.2)──▶ POST /ingest (loopback) ──▶ jobs queue ──▶ ingest_file()
                                                                                  │
                             corpus.db (documents.markdown_path) ── parsed_markdown.real-<TS>/
                                                                                  │
[~/rag-vault] (Inc.3, FORA de data/ e das gerações)                               │
  ├─ sources/  ◀── vault_sync.py: materializa do DB ATIVO (copia + frontmatter)
  ├─ wiki/     ◀── vault_wiki_build.py: determinístico sobre GraphStore; LLM só revisa
  └─ CLAUDE.md (protocolos INGESTÃO/CONSULTA/LINT), index.md, log.md
                                                                                  │
[Claude Desktop/LLMs locais] ◀──MCP (Inc.4)──▶ tools rag_search/vault_*/ingest (HTTP sobre :8099)
```

**Decisão-chave (vault vs. generations):** `data/parsed_markdown` é staged/promovido por geração `real-<TS>` — symlinks quebrariam. `vault/sources/` é **materializado a partir do DB ativo** (`documents WHERE status='active'`), copiando cada `.md` com frontmatter YAML (doc_id, content_hash, specialty, citation). Sync idempotente por content_hash, com prune de órfãos; hook no `--promote` do `rebuild_real_corpus.sh` + disponível por cron.

## Incremento 1 — Upload multi-arquivo (detalhado)

### rag-gateway — `rag-gateway/raggw/admin.py`
- **Novo `POST /admin/uploads`** (em `register_admin_routes`, gated por `check_admin` admin.py:212):
  `files: list[UploadFile]`, `specialty: str | None = Form(None)` → `{"results": [{filename, status: queued|duplicate|rejected, job_id?, document_id?, reason?, size_bytes}]}`. Falha de um arquivo NÃO aborta o batch.
- Por arquivo: (1) whitelist de extensão derivada do parsing router (reexportar `SUPPORTED` em `raggw/parsing/router.py` — hoje vive em scripts); (2) **streaming em blocos de 1MB** para spool `settings.uploads_dir` (novo `RAG_UPLOADS_DIR`, default `db_path.parent/"uploads"`), sha256 + contagem no mesmo passo, teto `RAG_UPLOAD_MAX_MB` (default 100 — teto Cloudflare Tunnel) → NUNCA `file.file.read()` inteiro (anti-padrão de `/admin/skills`); (3) **dedup ANTES de enfileirar** (`documents.content_hash`, mesma query de ingest.py:78); (4) rename atômico p/ `uploads/<sha16>_<safe_name>` (sanitização de `_write_markdown_artifact`) + `jobs.enqueue(metadata={source:"upload", original_filename, specialty})`.
- **Novos `GET /admin/jobs?ids=…` e `GET /admin/jobs/{id}`**: wrappers gated delegando às queries de api.py:263-283 (os `/jobs` atuais não passam pelo proxy).

### Gateway Deno — `gateway/handler.ts`
- **Nenhuma rota nova**: `adminProxy` (handler.ts:276) já é genérico e streaming (`body: req.body, duplex:'half'`), injeta `x-admin-token` após `checkAdmin` fail-closed.
- Validar 2 pontos: `rateLimited(user.sub)` roda antes do proxy — 20 arquivos = 20 requests; medir janela e, se preciso, isentar/subir p/ admin. Confirmar ausência de idle-timeout curto no `Deno.serve` para uploads longos.

### Frontend — React
- **Novo `src/features/admin/CorpusUpload.tsx`** (NÃO generalizar `SkillUpload` — semânticas diferentes; convivem no `AdminPage.tsx`).
- **1 request POR arquivo** (progresso/retry individual, bodies pequenos p/ túnel), concorrência 2 client-side.
- Novo `uploadCorpusFile(file, specialty, onProgress, signal)` em `src/lib/admin.ts` via **XMLHttpRequest** (fetch não expõe upload.onprogress), reusando `gatewayUrl()`/`getSession()` e o mapeamento de erros de `uploadSkill()` (admin.ts:163-188).
- Estados por arquivo: `pending → uploading(pct) → queued(job_id) → processing → done|failed|duplicate|rejected`; poll `GET /admin/jobs?ids=…` (~2s, backoff). Validação client-side de extensão/tamanho (constante espelhando o backend). `duplicate` é informativo, não erro.

### Testes
- `rag-gateway/tests/test_admin.py`: multi-file happy path; duplicado → sem job; extensão inválida → rejected e batch continua; > limite → rejected + spool limpo; 403 sem token; `/admin/jobs` gated.
- `rag-gateway/tests/test_jobs.py`: job `source=upload` processa fim-a-fim.
- `src/features/admin/CorpusUpload.test.tsx` (vitest, molde `SkillUpload.test.tsx`): mock XHR, N linhas, progresso, erro isolado, polling→done.
- `gateway/handler.test.ts` (Deno): `POST /admin/uploads` multipart admin→upstream com token injetado; não-admin→403 sem tocar upstream.

## Incremento 2 — Pasta monitorada (épico)
- `raggw/scripts/inbox_watcher.py` + systemd user unit. **Polling com verificação de estabilidade** (size+mtime imutáveis ~5s) em vez de inotify — robusto a cópias parciais/rsync.
- Fluxo: scan `~/rag-inbox` → estável → hash+dedup → `POST /ingest` **via HTTP loopback** (nunca abrir o SQLite direto — worker da API é o único consumidor; sobrevive a promotes) → mover p/ `processed/`|`failed/` só após resolução do job (poll `/jobs/{id}`). Retry/backoff se API fora do ar (rebuild).
- Ordem: dry-run scan → enqueue+move → systemd+log JSONL → pytest com API fake.

## Incremento 3 — Vault + "artigo na citação" (épico)
Ordem interna: (a) endpoints de fonte → (b) sources sync → (c) wiki determinística → (d) CLAUDE.md+lint.
- **(a)** `POST /rag/source-excerpt {chunk_id}` (usuário comum): chunk + vizinhos da mesma `section_path` (via `Hit`: retrieval.py:24 já tem chunk_id/document_id/citation_label/páginas), limite duro de tamanho (fair use). **Precisa de rota explícita no Deno** (só `/admin/*` é genérico). Admin: `GET /admin/documents/{id}/markdown` → texto integral de `markdown_path` (404/410 gracioso se geração antiga sumiu). UI: modal `SourceViewer` onde `result.sources` renderiza; botão "texto integral" só p/ admin.
- **(b)** `raggw/scripts/vault_sync.py` — materialização DB→`~/rag-vault/sources/` (CLI `--vault --db [--prune]`); hook no `--promote`.
- **(c)** `raggw/scripts/vault_wiki_build.py` — determinístico sobre o GraphStore: entidades por grau/frequência (1,4M é inviável completo — cortar por limiar/top-N por especialidade, decidir com amostra), 1 nota atômica/entidade (frontmatter, definição dos chunks ancorados, `[[links]]` por coocorrência, backlinks p/ sources), `index.md` (MOCs) e `log.md`. Idempotente com marcadores `<!-- generated -->` preservando edições manuais.
- **(d)** `~/rag-vault/CLAUDE.md` Karpathy: INGESTÃO (rode os scripts; LLM não escreve nota bruta), CONSULTA, LINT (`vault_lint.py` reporta órfãos/links quebrados/frontmatter inválido → LLM corrige só o apontado).

## Incremento 4 — Servidor MCP (épico)
- Novo pacote `rag-gateway/raggw_mcp/server.py` (FastMCP), **cliente HTTP fino sobre a API** (nunca SQLite direto). Transportes: stdio (LLMs locais/Claude Desktop) + streamable-HTTP em 127.0.0.1 p/ LAN via túnel autenticado.
- Tools: `rag_search`→`/rag/search`; `rag_evidence_pack`→`/rag/evidence-pack`; `vault_read/search/recent` (filesystem sandboxed em `~/rag-vault`); `ingest_path` opcional gated por token. Truncar saídas grandes.
- Ordem: stdio+search → vault tools → HTTP+auth → config clientes.

## Riscos / decisões em aberto
1. Teto de body no caminho nuvem (Cloudflare ~100MB) — confirmar topologia; 1-request-por-arquivo mitiga.
2. Rate limiter do gateway vs. rajadas de upload — medir e decidir isenção admin.
3. `markdown_path` pós-promote: confirmar preservação/política de GC de gerações antes do Inc. 3.
4. Retenção do spool `uploads/`: recomendação = manter como fonte canônica (permite reprocessar) + monitor de disco.
5. Backpressure: expor `queued` count no `/health` e no admin UI.
6. Limiar de entidades da wiki e formato de slug — decidir com amostra real do GraphStore.
7. Auth do MCP remoto (mobile): Tailscale vs. token vs. JWT via gateway — decisão do usuário no Inc. 4.

## Verificação (Incremento 1)
1. `cd rag-gateway && uv run pytest` — suíte completa verde (base atual: 198).
2. `cd gateway && deno task test` — incluindo o novo caso de proxy multipart.
3. `npm test` (vitest) — `CorpusUpload.test.tsx`.
4. E2E manual: subir rag-gateway + gateway + `npm run dev`; logar como admin; arrastar 3 arquivos (1 pdf, 1 md, 1 duplicado) → ver 2 `queued`→`done` e 1 `duplicate`; conferir `documents` novos via `GET /admin/documents?q=…`; repetir do navegador do celular na LAN.
5. Confirmar spool `uploads/` com os originais e ausência de temps órfãos.

## Pós-aprovação
Gravar o spec em `docs/superpowers/specs/2026-07-14-ingestao-second-brain-design.md` (workflow brainstorming) e iniciar a implementação do Incremento 1; Incrementos 2–4 ganham specs/planos próprios ao chegar a vez.
