# Handoff — Synvera-ng

Estado vivo do trabalho. Atualizado ao fim de cada fase. Se você é o agente que
assume, leia isto inteiro antes de tocar em qualquer coisa.

**Última atualização:** 2026-08-07 — smoke ponta a ponta; 7 defeitos achados e corrigidos.

### GraphRAG (estado 2026-08-07)

| Fase | Estado | Entrega |
|------|--------|---------|
| 0–1 typed edges + harness | done | gold multi-hop (PR #5) |
| 2 pack de triplas + consolidação | done | evidence-pack / orch / caps (PRs #11–#14) |
| 3 OpenIE local + gate manual | done | PRs #22–#25; #17 |
| Health graph metrics | done | PR #16 / #15 |
| Lexicon surface match | done | #27 / PR #28; #31 / PR #32 |
| Inject SQLite produção | done | #29 — 2026-08-07; `cooc` 12438 preservado; tipadas = lexicon |
| Surfaces sem parêntese | done | #38 / PRs #45, #47 — typed **2144**, gold recall **0.7021** |
| Fuzzy só como fallback | done | #44 / PR #48 |

### Sessão 2026-08-07 — smoke ponta a ponta (o que ela ensinou)

O smoke do orquestrador achou **sete** defeitos, e o padrão importa mais que a lista:
**nenhum deles dava erro.** Todos apareciam como latência, recusa ou campo vazio — que é
exatamente o que o `AGENTS.md` avisa ser o modo de falha caro deste projeto.

| # | Defeito | Como aparecia | PR |
|---|---------|---------------|-----|
| 33 | `RuntimeError: Already borrowed` — tokenizer *fast* compartilhado entre threads | recusa clínica espúria em ~17% das queries | #34 |
| 39 | teste de concorrência sem prazo no `join` | penduraria o pytest em vez de falhar | #40 |
| 37 | `_VIGNETTE_RE` casava `qual a conduta` sem paciente | pergunta conceitual caía em `PRECISO_SABER` | #41 |
| 35 | processo rodando código anterior ao merge | `graph_triples` vazio por 3h, sem sinal nenhum | #42 |
| 36 | `meissa: "off"` confundia timeout, vazio e erro | impossível decidir o prazo com dado | #43, #46 |
| 38 | surface só com parêntese (`Tromboembolismo pulmonar (TEP)`) | abstain com corpus saudável | #45, #47 |
| 44 | `detect_fuzzy` casava `como`→`coma` | entidade não relacionada na expansão | #48 |
| 50 | shim não devolvia modelo nem versão | lacuna CFM aberta | #51 |

**Provenance de IA (#50):** `simvera.provenance` traz `ts`, `shim`, `gemma` (modelo
**ecoado** pelo upstream), `meissa` (id **pedido**, e só quando participou) e `rag`
(`raggw_version`, embedder, reranker, vector store, `lexicon_typed_edges`).
Duas ressalvas registradas: vale **só em não-streaming** — a resposta em streaming nunca
carregou o bloco `simvera` — e o Meissa declara o id pedido, não o eco. Ver issues abertas.

**Telemetria do Meissa (#36), medida:** perna com mediana **9,8s** isolada e **8,9s** em
paralelo (n=8), contra `SIMVERA_MEISSA_DEADLINE=7` — o prazo cai **abaixo da mediana** do
que cronometra. Sob stack completa quente, **6/6 timeout**. O número não foi alterado: a
escolha entre subir o prazo e tirar a perna do caminho síncrono é de produto, e agora tem
telemetria (`simvera.meissa` ∈ {ok, vazio, timeout, erro, off} + `meissa_s`) para ser feita
com dado. **Não suba no escuro** — mesmo aviso que vale para `SIMVERA_RAG_TIMEOUT`.

**Código obsoleto (#35):** `GET /health` de ambos os serviços traz
`code.{loaded_mtime, disk_mtime, stale}`. `stale: true` significa reinicie. Bloco `code`
**ausente** = processo anterior a esta mudança, o que é o próprio sinal.

**Armadilha 8 confirmada duas vezes nesta sessão.** Um A/B de prazo do Meissa saiu
invertido por rodar sempre o mesmo lado primeiro (cache quente), e uma medida de
`ReadTimeout` quase virou regressão inventada quando era cache frio. Aqueça a query e
alterne a ordem **antes** de concluir qualquer coisa.

**Erro de raciocínio registrado:** afirmei que o resíduo de `conf 0.657` em
`Como manejar embolia pulmonar` vinha do fuzzy de #44. **Não vinha** — remover o `coma` da
expansão não moveu a confiança em nada. A queda de 0.991 para 0.657 vem do prefixo
`Como manejar` diluir o casamento, não da entidade espúria. Nexo causal afirmado sem teste.

**Re-inject** (após rebuild do léxico):
```bash
cd services/rag-gateway
RAG_DB_PATH=../../data/index/rag_corpus.db .venv/bin/python scripts/inject_typed_edges.py
```
Reiniciar o processo `:8099` se o pack live não refletir as edges novas (código/DB).

Seam: `POST /rag/evidence-pack` + `simvera.graph_triples`.  
Harness: `services/eval/graph/` — offline `run_baseline.py`; live `--live --pack`.

### Próximo (sem ticket aberto)

- Reiniciar Super-RAG e validar pack live (ex. sepse/noradrenalina → `graph_triples` > 0)
- OpenIE extract+gate em amostra real (operacional)
- Path pruning opcional; latência stack Meissa+Gemma

> **Latência (2026-08-04, ainda válido):** query clínica quente ~1,1–1,5s RAG;
> 1ª query pós-restart sem preload ~22s. Ver secção de latência abaixo.

---

## Prompt para o agente que continua

> Você assume o **Synvera-ng** (`~/Projetos/Synvera-ng`, remote
> `github.com/JacksonFuck/synvera-ng`, privado): apoio à decisão clínica que orquestra
> três serviços locais — Super-RAG sobre corpus médico (`:8099`), especialista
> Meissa-4B (`:8003`) e Gemma-4-12B como consolidador multimodal (`:8081`), atrás de um
> shim OpenAI-compatible (`:8100`) que o LibreChat (`:3080`) consome.
>
> **Antes de agir, leia nesta ordem:** este handoff inteiro, `AGENTS.md`, e o plano
> aprovado em `~/.claude/plans/atomic-juggling-moore.md`. As fases 0–7 e 9 estão
> fechadas; o que resta está em "Próximo passo".
>
> **Objetivo declarado pelo usuário:** deixar o Super-RAG funcional e o Synvera-ng
> completo e testado. Hoje ele responde com citação de página e recusa sem evidência —
> mas a latência de query nova o torna inutilizável na prática. É por aí que se começa.
>
> **Cinco regras que vieram do usuário e valem acima de conveniência:**
>
> 1. **Toda resposta clínica é ancorada no corpus**, com fonte e página. Sem evidência,
>    o sistema recusa. Nunca "conserte" isso deixando o modelo responder de memória —
>    é a propriedade pela qual o sistema existe, e já foi verificada funcionando.
> 2. **Medir antes de afirmar.** Este projeto já teve um grafo custando 4,5s para
>    contribuir zero porque ninguém mediu, e eu mesmo anunciei três regressões
>    inexistentes por comparar quente com frio. Leia "Armadilhas" antes de concluir
>    qualquer coisa sobre desempenho.
> 3. **Nada de segredo nem dado no git.** `.env` real nunca. `data/` tem ~120GB sob DVC.
> 4. **Auditabilidade não é opcional.** O destino é prontuário eletrônico hospitalar e
>    de APS; risco CFM classificado como alto. Antes de mexer em modelo, inferência ou
>    recuperação clínica, carregue a skill `cfm-sbis-auditabilidade`.
> 5. **O sistema simula uma consulta.** Quando falta dado essencial, ele pergunta em vez
>    de supor. Isso já está implementado — não o remova para "simplificar".
>
> **Duas coisas que parecem bug e não são:** o RAG demora ~40s na primeiríssima query
> após reiniciar (carrega BGE-M3 e o reranker); e `/health` do orquestrador consulta os
> três upstreams, então um `curl -m 8` pode estourar sem que nada esteja errado.

---

## O que o sistema é

```
LibreChat :3080  ──►  orquestrador :8100  ──┬──►  Super-RAG :8099   (BGE-M3 + reranker + grafo)
                      (app.py, FastAPI)     ├──►  Meissa-4B :8003   (especialista, com visão)
                                            └──►  Gemma-4-12B :8081 (consolidador multimodal)
```

O orquestrador dispara RAG e Meissa **em paralelo**, consolida no Gemma e devolve
com citação de página. Se o RAG falhar ou não achar evidência, ele **recusa** — não
deixa o Gemma responder sozinho.

## Estado medido (não estimado)

| Métrica | Valor | Como foi medido |
|---|---|---|
| Busca no RAG, query **repetida** | ~2,1s p50 | era 204,3s antes desta sessão |
| Busca no RAG, query **nova** | **~37s** | ver abaixo — é este o número que importa |
| Meissa isolado (regime) | 1,20s | Q8_0 com visão |
| VRAM total | 29.781 de 32.607 MiB | Gemma 12.382 + Meissa 10.510 + RAG 6.592 |
| Disco | 681G de 896G (81%) | eram 89% antes da limpeza |
| Corpus indexado | 629.070 docs / 1.235.197 chunks | de `fine-tuning-data/{pubmed-md,textbooks-md}` |
| Grafo | 194 nós, 12.438 arestas, 33,1% dos chunks | contribuição ainda marginal |

## Latência do RAG — estado medido 2026-08-04 (sessão de instrumentação)

### O que foi feito nesta sessão

1. **Timing por estágio** em `hybrid_search` / `planned_search`, exposto em
   `retrieval.stage_timings_s`, `retrieval.total_s`, `retrieval.dominant_stage` em
   `/rag/search` e `/rag/evidence-pack`. Log `raggw.search` no processo.
2. **Preload no lifespan** (`RAG_PRELOAD_MODELS=1` default): carrega BGE-M3 + reranker
   no boot para a 1ª query do usuário não pagar ~22s. Opt-out com `=0`.

Não sobe segunda cópia dos modelos; medição no processo `synvera-rag-gateway` em `:8099`.

### Números

**A — só Super-RAG** (~5,4 GiB GPU). Queries limpas, modelos quentes:

| estágio | tempo típico |
|---|---|
| `embed_s` | 0,02–0,04s |
| `lexical_s` | 0,04–0,24s |
| `dense_s` (LanceDB) | 0,33–0,55s |
| `graph_s` | 0,00–0,07s |
| `rerank_s` | 0,45–0,63s |
| **total_s** | **1,1–1,5s** |

**B — stack completa** (Meissa + Gemma + RAG, VRAM ~28,3 GiB / 32 GiB, swap ~22 GiB).
Série de 6 queries clínicas + 1 repetição (2026-08-04):

| query | total_s | dominant | nota |
|---|---|---|---|
| embolia (1ª após LLMs up) | 7,3s | dense | pressão inicial |
| adrenalina | 12,2s | **lexical** | pior da série; ainda &lt; 20s |
| Wells | 1,8s | rerank | |
| pneumonia UTI | 7,2s | lexical | |
| cetoacidose (+hex) | 4,6s | lexical | |
| sepse | 1,6s | rerank | |
| embolia **repetida** | **1,0s** | rerank | quente estável |

Nenhuma da série estorou `SIMVERA_RAG_TIMEOUT=20`. O lexical **volta a ser errático**
sob stack completa (0,03s → 10,7s na mesma sessão) — coerente com thrashing de
cache SQLite/disco quando a VRAM e o swap estão cheios, não com bug de stopwords.

1ª query **após restart do RAG sem preload**: `embed≈11,8s` + `rerank≈4s` →
**total≈21,8s** (estoura 20s). Com preload no boot, 1ª query após health = **1,29s**.

### Releitura do bug "query nova = 37s"

A hipótese "toda query inédita leva 37s" **não se reproduziu** neste ambiente
(Meissa/Gemma off, ~12 GiB RAM disponível). O que se reproduziu e explica recusa no
orquestrador:

| cenário | total | estoura 20s? |
|---|---|---|
| 1ª query pós-restart (lazy load) | ~22s | **sim** |
| query clínica quente | 1,1–1,5s | não |
| FTS isolado (após stopwords) | 0,02–0,16s | não |

Medições antigas de 37s+ com a **mesma** query piorando (37→44→89s) batem com
pressão de **RAM/swap** e thrashing, não com "query inédita" por si. Revalidar com
Meissa+Gemma no ar antes de declarar o problema fechado ponta a ponta.

### O que já foi eliminado (não repita)

| Suspeito | Veredito | Evidência |
|---|---|---|
| Cache frio sozinho | **não é a história completa** | mesma query piorava sob swap; quente limpo é ~1,2s |
| `/rag/evidence-pack` vs `/rag/search` | **não é** | iguais na alternância |
| `_neighbor_context` | **não é** | 0,000s |
| Grafo (`expand()` no hybrid) | **não é** | 0,00–0,07s em stage_timings |
| `_load_chunks` | **não é** | 0,02–0,05s |
| **FTS5 sem stopwords** | **era, em parte** | corrigido; isolado 0,02–0,16s |
| **Lazy load embed+rerank** | **era, na 1ª query** | 21,8s; **preload no boot** |

### Corrigido antes: stopwords no FTS5

`_fts_query` fazia `" OR ".join` de **todos** os tokens. Filtro em tempo de query.
`tests/test_fts_stopwords.py`. Isolado reconfirmado nesta sessão.

### O que ainda pode melhorar (não bloqueante sob carga atual)

- **`n_reranked` ≈ 130–150** é **proposital** (#321 never-degrades: todo lex∪dense
  entra no rerank + budget de grafo). Capar `prot[:candidate_n]` falha
  `test_graph_only_candidate_survives_when_protected_set_fills_candidate_n`.
  Ganho de latência no rerank exige outro desenho (ex.: rerank em duas fases),
  não um teto cego.
- **~713k vetores órfãos** no LanceDB.
- **Containers Meissa/Gemma** estavam montando `~/synvera-data/models` **vazio**
  (resto da Fase 3). Recriados com `ops/llama/start-server.sh {meissa,gemma}` →
  `Synvera-ng/data/models`. Se voltarem a reiniciar em loop, checar o bind.

Não suba `SIMVERA_RAG_TIMEOUT` "no escuro": troca recusa por espera. Com preload +
caminho quente a 1,2s, o timeout de 20s é folga.

### Achado colateral, já corrigido (sessão anterior)

O venv veio de `Apppocus-2.0` com instalação **editável**, e o `.pth` guardava o caminho
absoluto antigo. `.pth` reapontado; verificado de três diretórios diferentes.

## Armadilhas que já custaram tempo

1. **`rag-gateway/data` é symlink** para `apppocus-rag-wt` (um git worktree). Eu li o
   banco errado ao planejar e reportei números falsos. Sempre `readlink -f` antes.
2. **Cache frio do SQLite** faz a query passar de 1s para ~20s e estourar
   `RAG_TIMEOUT`. Parece falha do sistema, não é. Aqueça antes de medir.
3. **TTFT ≠ tempo total.** Comparar streaming com não-streaming me fez anunciar uma
   regressão de 3x que não existia. Meça o mesmo lado dos dois.
4. **`reasoning_budget: 0` não funciona** neste build do llama.cpp. Só
   `chat_template_kwargs: {enable_thinking: false}` desliga o raciocínio — vale
   ~20s de TTFT.
5. **`/tmp/llama.cpp` está em tmpfs.** Um reboot apaga o binário e derruba Gemma e
   Meissa. Fase 7 resolve; até lá, não reinicie a máquina sem rebuildar.
6. **Os scorers do Meissa não rodam** — importam `eval_helpers`, ausente do repo.
7. **O indexador do desktop é um predador de I/O.** `localsearch-extractor-3` começou a
   varrer os 633k markdowns assim que eles apareceram em `Synvera-ng/data/`: 4,5GB
   residentes, 40% de CPU em estado D, RAG empurrado para o swap, busca de ~1s para
   15–47s. Resolvido com `Synvera-ng/data/.trackerignore`. **Se aparecer lentidão
   inexplicada depois de mover dados, cheque `ps aux | grep localsearch` antes de
   qualquer outra hipótese.**
8. **Comparar quente com frio inventa regressões.** Errei isso três vezes num dia:
   TTFT contra tempo total, query repetida contra query nova, endpoint A quente contra
   endpoint B frio. Alterne os dois lados na mesma série antes de concluir qualquer coisa.
9. **A máquina tem 22GB de RAM** e opera com ~19GB de swap em uso. O RAG sozinho tem
   pico de 11,2GB residentes. Working set de 34GB não cabe — a latência é sensível a
   qualquer outro processo que peça memória.

## Fases

| # | Fase | Estado |
|---|---|---|
| 0 | Resgatar customização volátil do LibreChat | **feita** |
| 1 | Parar serviços | **dispensada** — a ingestão já estava travada há 2 dias |
| 2 | Limpeza de disco (~90G) | **feita** |
| 3 | Mover dados para `Synvera-ng/data/` | **feita** — duas vezes; ver nota |
| 4 | Consolidar os `rag_corpus.db` divergentes | **feita** |
| 5 | Criar monorepo + DVC | **feita** — `0fe4fc5`, `6a1a9c0`; **push bloqueado** |
| 6 | LibreChat com imagem própria | **imagem construída e verificada**; não trocada em produção |
| 7 | llama.cpp fora do tmpfs | **feita** |
| 8 | Verificação ponta a ponta (9 critérios no plano) | parcial — 5/5 serviços de pé, 8 citações na resposta |
| 9 | Modo consulta | **implementado**, verificação bloqueada pela latência |

### Fase 9 saiu diferente do plano, e por um motivo medido

O plano dizia: classificar a saída do **Meissa** e repassar as perguntas dele. Medi antes
de codar e **o Meissa não pergunta**: diante de "Paciente com dor torácica, o que faço?"
ele despeja um protocolo genérico. Instruído explicitamente a perguntar, acertou 1 de 4 —
pediu informação num caso que já tinha idade, PA e comorbidade, e ecoou o literal
`<pergunta 1>` do template. Está casando formato, não julgando suficiência.

O **Gemma-12B** acerta 3–4 de 4 no mesmo teste. Então o julgamento foi para o
consolidador, que já vê evidência, parecer e conversa inteira.

Resultado: **sem classificador, sem máquina de estados, sem chamada extra.** A regra vive
em `SYSTEM_CONSOLIDACAO` e as perguntas do Gemma *são* a resposta daquele turno; o
usuário responde e o histórico carrega o estado (`_rodadas_de_pergunta` conta os turnos
anteriores). Teto em `SIMVERA_MAX_PERGUNTAS=2`; atingido, o sistema responde com o que
tem e declara o que faltou.

Interação com o harness: `--forced-choice` precisa suprimir isso, senão
`score.extract()` devolve `None` e a acurácia despenca por motivo que não é erro.

### Próximo passo

Na ordem. O item 1 é o único que exige o usuário; os outros são trabalho.

1. **`git push`** (ação do usuário — bloqueado para o agente). Sem isso o remote fica
   vazio e o fluxo de PR do `docs/agents/workflow.md` não existe na prática.

2. **Latência (quase fechado neste host, falta revalidar com stack completa).**
   Timing por estágio e preload já no código (não commitados). Preload verificado:
   1ª query após health 200 = **1,29s** (antes ~22s lazy). Próximos: (a) commit;
   (b) re-medir com Meissa+Gemma no ar; (c) opcional: reduzir `n_reranked` de ~130
   para `candidate_n` e revalidar scores.

3. **Trocar o LibreChat para a imagem própria.** A imagem `synvera/librechat:local` já
   está construída e verificada (ferramenta embutida, script idempotente, falha alto se
   o upstream mudar). O que falta é trocar em produção — e há uma armadilha: rodar o
   compose a partir de `Synvera-ng/librechat/` cria um `./data-node` novo e **perde o
   histórico de conversas**, que hoje vive em `Projetos/LibreChat/data-node`. Migre o
   volume do Mongo antes, ou aponte o bind para o caminho antigo.

4. **Verificar o modo consulta ponta a ponta** — bloqueado hoje pelo item 2. Critérios
   8 e 9 do plano: pergunta incompleta deve *perguntar*; a mesma em `--forced-choice`
   deve responder a letra, provando que o harness não é contaminado.

5. **Fase A do programa de RAG** (harness de avaliação). Spec em
   `docs/specs/2026-08-04-harness-avaliacao-design.md`, plano em
   `docs/plans/2026-08-04-harness-avaliacao.md`. Código não começado.

6. **Fase B** — as 245 arestas tipadas. `build_lexicon.py` grava `"typed_edges": []`
   fixo; os dados estão em `src/data/{doencas,bulario}.ts` do Apppocus-2.0, nos campos
   `conduta`, `diagnosticoDiferencial`, `usoClinico`, `interacoes`, `contraindicacoes`.
   O caminho já está aberto: `_neighbors(only_typed=True)` expande aresta tipada por
   padrão desde `a1e7286`.

### O que mudou de lugar

| Antes | Agora |
|---|---|
| `~/models/` | `Synvera-ng/data/models/` |
| `apppocus-rag-wt/.../data/rag_corpus.db` | `Synvera-ng/data/index/rag_corpus.db` |
| `apppocus-rag-wt/.../data/lancedb_corpus` | `Synvera-ng/data/index/lancedb_corpus` |
| `apppocus-rag-wt/.../data/parsed_markdown` | `Synvera-ng/data/processed/parsed_markdown` |
| `~/fine-tuning-data/{pubmed,textbooks}-md` | `Synvera-ng/data/processed/` |
| `~/fine-tuning-data/` (PDFs), `~/corpora/` | `Synvera-ng/data/raw/` |
| `/tmp/llama.cpp/build/bin` (tmpfs) | `~/opt/llama-bin` |

Os symlinks `Apppocus-2.0/rag-gateway/data` e `SYNVERA/rag-gateway/data` foram
repontados para `Synvera-ng/data/index`, então os projetos antigos continuam
funcionando. Os containers agora sobem por `ops/llama/start-server.sh {gemma|meissa}`
com `restart=unless-stopped` — sobrevivem a reboot, o que antes não acontecia.

### Bancos: qual é o bom

| Banco | docs | chunks | grafo | veredito |
|---|---|---|---|---|
| `Synvera-ng/data/index/rag_corpus.db` | 629.070 | 1.235.197 | 646.461 | **produção** |
| `Apppocus-2.0/data/rag_corpus.db` | 625.708 | 625.708 | 0 | snapshot velho, descartável |
| `.../rag_corpus_fresh.db` | 507.174 | 738.274 | **1.208.269** | órfão — ver abaixo |

**Achado não resolvido:** o `fresh` órfão tem 1,64 vínculos de grafo por chunk
contra 0,52 da produção. O grafo de produção pode ter ficado pela metade, ou o
`fresh` usou um léxico mais rico. Vale investigar antes da fase B do programa de RAG.

### Nota sobre a Fase 3 (por que os dados mudaram de lugar duas vezes)

Primeiro foram para `~/synvera-data/`, fora do repo. Aí o DVC recusou:
*"Cannot add files inside symlinked directories"* — ele não aceita chegar aos dados por
symlink, e o layout padrão exige os dados sob a raiz do repositório para que os
ponteiros `.dvc` sejam versionados junto ao código. Foram para `Synvera-ng/data/`.

Se alguém propuser tirá-los de novo "para não poluir o repo": os bytes **não** estão no
git (só ponteiros de ~120 bytes), e tirá-los quebra o DVC. O risco real é outro e está
avisado em `data/README.md` e no `AGENTS.md`: **`git clean -xfd` apagaria os 120GB**,
porque para o git aquilo é arquivo não rastreado.

## Configuração para agentes (desde `a1e7286`)

`AGENTS.md` e `CLAUDE.md` carregam o mesmo bloco `## Agent skills`, no modelo do
Panoptis-APS; o `CLAUDE.md` tem a seção extra *Fluxo de trabalho (obrigatório)*.
Detalhes em `docs/agents/{issue-tracker,triage-labels,domain,workflow}.md`.

Issues vivem no GitHub (`JacksonFuck/synvera-ng`, privado); PRs externos não entram na
triagem. Os cinco rótulos canônicos existem no repositório. **Não coloque PHI em issue**
— nem em título, corpo, comentário ou anexo.

Os portões de PR aqui são `pytest` (28 arquivos, todos verdes). O `workflow.md` foi
adaptado do Panoptis, que é TypeScript: `vitest`/`eslint` foram substituídos, e a
cláusula anti-drift de escore clínico foi trocada pelo risco real deste projeto —
regressão na recuperação aparece como latência ou resposta pior, **nunca como erro**.

## Programa de RAG (separado das fases acima)

O usuário quer "estado-da-arte em RAG". Decompus em quatro, nesta ordem:

- **A — harness de avaliação.** Spec e plano escritos (`docs/specs/` e `docs/plans/`),
  código não começado. É o instrumento: sem ele, B/C/D são mudanças não falseáveis.
- **B — grafo tipado.** 245 arestas clínicas já provadas extraíveis de
  `src/data/{doencas,bulario}.ts` (`tratado_por` 79, `trata` 27, `dd` 107,
  `contraindicado` 19, `interage` 13). Hoje 100% das arestas no banco são `cooc`, que é
  ruído. **O caminho de código já está pronto** desde `a1e7286`: aresta tipada expande
  sempre (peso 2,0), `cooc` só sob `RAG_GRAPH_NEIGHBORS`. Falta só gerar as arestas —
  `build_lexicon.py` grava `"typed_edges": []` fixo e nunca leu aqueles campos.
- **C — recuperação em tempo de query.** rewriting, HyDE, multi-query.
- **D — ingestão dos 34G de `~/corpora` + contextual retrieval numa passada só.**
  Contextual retrieval reescreve o que um chunk é; fazer depois custa reprocessar tudo.

## Conformidade (o usuário vai integrar isto a um PEP hospitalar e de APS)

Risco CFM classificado: **alto** — o sistema influencia conduta. Com o Meissa lendo
imagem, entra em território SaMD/ANVISA. Já conforme: inferência 100% local, recusa
sem evidência, humano no loop. Lacunas abertas:

- `RAG_HOST=0.0.0.0` (mudança minha, necessária para o container alcançar) — em PEP
  vira serviço com PHI em todas as interfaces
- ~~Sem provenance de IA~~ → **parcialmente fechada** em #50 / PR #51.
  `simvera.provenance` traz modelo, versão e runtime; os chunks já vinham em
  `simvera.citations`. **Duas ressalvas:** vale só em resposta **não-streaming** (o bloco
  `simvera` nunca foi emitido em streaming, e o LibreChat streama por padrão), e o campo
  do Meissa declara o **id pedido**, não o eco do upstream. Ambas com issue aberta.
- llama.cpp loga prompt no journalctl — vira PHI quando integrado

## Pendências registradas, não resolvidas

- ~713k vetores órfãos no LanceDB (1.948.303 para 1.235.197 chunks)
- 34G em `~/corpora` nunca ingeridos
- MedCPT desligado (`RAG_RETRIEVERS=bge-m3`), decisão nunca tomada pelo usuário
- `~/simvera-rescue/from-tarball/` contém um scraper de Telegram com credenciais de
  sessão, extraído de um tarball antes de apagá-lo. Não é do projeto e **não deve
  entrar no repo**. Cabe ao usuário decidir se apaga.
