# Handoff — Synvera-ng

Estado vivo do trabalho. Atualizado ao fim de cada fase. Se você é o agente que
assume, leia isto inteiro antes de tocar em qualquer coisa.

**Última atualização:** 2026-08-04, fim da sessão de reorganização. Fases 0–7 fechadas,
9 implementada. Três commits locais: `0fe4fc5`, `6a1a9c0`, `a1e7286`.

> **Uma coisa bloqueia tudo:** `git push` foi negado pelo classificador de permissões.
> O trabalho está commitado localmente, mas o remote continua vazio. Peça ao usuário:
> `cd ~/Projetos/Synvera-ng && git push -u origin main`. Só depois disso o fluxo de
> issue → branch → PR descrito em `docs/agents/workflow.md` passa a ser possível.
>
> **Um bug em aberto domina o resto:** query nunca vista leva mais que o
> `SIMVERA_RAG_TIMEOUT` de 20s, e o orquestrador recusa uma pergunta respondível. Ver
> "Problema aberto e prioritário". Não trate como transiente — já foi investigado.

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

## Problema aberto e prioritário: latência de query nova

Query repetida: ~2,1s. Query **nunca vista**: **~37s** — e em produção toda pergunta é
nova. O `SIMVERA_RAG_TIMEOUT` é 20s, então o orquestrador recusa antes de o RAG
responder, e o usuário vê "não posso responder sem fonte" numa pergunta perfeitamente
respondível. **Esse é o bug mais grave em aberto.**

Não é o endpoint: medido alternando `/rag/search` e `/rag/evidence-pack` na mesma query,
os dois se comportam igual. É custo de disco em cache frio, e a causa raiz provável é
RAM: 22GB de máquina, ~19GB de swap em uso, working set de 34GB. Antes de mover os dados
o serviço rodava há horas com o cache quente e entregava ~1s.

### O que já foi eliminado como causa (não repita esta investigação)

| Suspeito | Veredito | Evidência |
|---|---|---|
| Cache frio | **não é** | a MESMA query repetida 4× ficou mais lenta: 37→44→43→89s |
| `/rag/evidence-pack` mais caro que `/rag/search` | **não é** | alternados na mesma query, comportam-se igual |
| `_neighbor_context` | **não é** | índice composto existe, plano ótimo, 0,000s por lookup |
| Grafo (`expand()`) | **não é** | 0,01–0,03s; e a query *mais lenta* tem *menos* chunks ligados |
| `_load_chunks` | **não é** | 0,01s |
| **FTS5 sem stopwords** | **era, em parte** | 3,00s → 0,02s. **Corrigido**, ver abaixo |

### Corrigido: stopwords no FTS5

`_fts_query` fazia `" OR ".join` de **todos** os tokens. `"qual" OR "a" OR "na" OR …`
casa quase todo o corpus e o BM25 pontua tudo. Medido, estável na repetição:

| query | antes | depois |
|---|---|---|
| `qual a conduta inicial na embolia pulmonar macica` | 15,61s | 0,02s |
| `qual a dose de adrenalina na anafilaxia` | 2,69s | 0,15s |
| `Paciente com dor toracica. O que faco?` | 0,69s | 0,02s |

Filtro em tempo de query (não tokenizer novo — reindexar 1,2M chunks custa horas).
Protegido por `tests/test_fts_stopwords.py`: o sintoma de uma regressão aqui é
latência, não erro, e leva horas para achar.

### O que sobra, e é o próximo passo

**O ganho de 150x no FTS não apareceu no total.** Ponta a ponta continua 2,5–18s e
errático. Logo o custo dominante está no **denso/ANN** ou no **rerank** — os dois únicos
estágios ainda não instrumentados, porque medi-los exige carregar uma segunda cópia dos
modelos e a máquina já opera com 19GB de swap.

Caminho: instrumentar dentro do processo que já está no ar (middleware de timing por
estágio em `raggw/api.py::_search`), em vez de subir modelos duplicados.

Suspeita não confirmada: os **~713k vetores órfãos** do LanceDB são 58% de overhead —
1.948.303 vetores para 1.235.197 chunks. Podem estar inflando a varredura do IVF.

Não suba `SIMVERA_RAG_TIMEOUT` antes disso: troca recusa por espera de 40s.

### Achado colateral, já corrigido

O venv veio de `Apppocus-2.0` com instalação **editável**, e o `.pth` guardava o caminho
absoluto antigo. Rodando de `tests/` ou `/tmp`, `import raggw` carregava a cópia velha em
`Apppocus-2.0/rag-gateway/`. O serviço resolvia certo por acaso (cwd vence), mas qualquer
teste ou script rodado de outro diretório testava código que não é o que está no ar.
`.pth` reapontado; verificado de três diretórios diferentes.

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

2. **Isolar a latência de query nova.** É o que impede o sistema de ser usável: hoje
   uma pergunta inédita estoura o `SIMVERA_RAG_TIMEOUT` e vira recusa. FTS5, grafo,
   `_load_chunks`, `_neighbor_context` e cache frio **já foram descartados com
   medição** — não repita. O que falta instrumentar é o **denso/ANN** e o **rerank**.
   Faça isso com um middleware de timing por estágio dentro de `raggw/api.py::_search`,
   no processo que já está no ar; subir uma segunda cópia dos modelos numa máquina com
   22GB de RAM e 19GB de swap vai falhar ou falsear a medida.

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
- **Sem provenance de IA**: o shim não devolve modelo, versão nem chunks usados
- llama.cpp loga prompt no journalctl — vira PHI quando integrado

## Pendências registradas, não resolvidas

- ~713k vetores órfãos no LanceDB (1.948.303 para 1.235.197 chunks)
- 34G em `~/corpora` nunca ingeridos
- MedCPT desligado (`RAG_RETRIEVERS=bge-m3`), decisão nunca tomada pelo usuário
- `~/simvera-rescue/from-tarball/` contém um scraper de Telegram com credenciais de
  sessão, extraído de um tarball antes de apagá-lo. Não é do projeto e **não deve
  entrar no repo**. Cabe ao usuário decidir se apaga.
