# Harness de avaliação do SimVera

Sub-projeto A do programa "estado-da-arte em RAG" (A → B → C → D).

## Problema

Não existe forma de provar que uma mudança no RAG melhorou alguma coisa.

Isso não é hipotético. Em 2026-08-04 o GraphRAG foi construído e calibrado observando
cinco queries a olho. A calibração estava certa por acidente: o grafo custava 4,5s por
query e contribuía zero, e isso passou despercebido por semanas porque ninguém media.
O ajuste que corrigiu (`RAG_GRAPH_NEIGHBORS=0`) foi validado do mesmo jeito frágil —
cinco queries, olhando.

Enquanto A não existir, B (grafo tipado), C (recuperação em tempo de query) e D
(ingestão de 34GB + contextual retrieval) são mudanças não falseáveis.

## Objetivo

Medir, de forma repetível, se uma mudança no pipeline melhora ou piora:

1. **acurácia** em benchmark público (MedQA, PubMedQA)
2. **atribuição** — de onde veio o ganho: corpus, Meissa ou Gemma
3. **propriedades próprias** que benchmark nenhum mede: recall de citação, taxa de
   recusa, latência

Não-objetivo: substituir julgamento clínico humano. O harness mede regressão, não
aprova conduta.

## Decisões e o porquê

### Benchmark público, não gabarito interno

Escolha do usuário. A alternativa considerada era gerar ~50 perguntas dos 120 registros
de `DOENCAS` e 76 de `BULARIO` — mediria recuperação do corpus próprio com precisão,
mas não é comparável com a literatura.

Limitação aceita e declarada: MedQA/PubMedQA são em inglês contra um corpus em
português. O BGE-M3 é multilíngue, então funciona, mas provavelmente sub-reporta a
recuperação. PubMedQA só fica justo depois da fase D, quando os 8,1GB de PubMed
entrarem no índice.

### Scorer próprio, não o do Meissa

O plano original era reusar `environments/multi_agent_collaboration/eval/eval_medqa.py`
e `eval_pubmedqa.py` do repo do Meissa. **Eles não rodam**: ambos importam
`eval_helpers` na linha 8, e esse arquivo não existe no working tree nem no histórico
do repo.

O que sobrevive e é reaproveitado:

- o **formato do item** — `{id, label, difficulty, response}`, lido do acesso a
  `item.get(...)` nos dois arquivos
- as **regex de extração** — `clean_answer()` em `eval_medqa.py` (padrões `Answer:\s*([A-E])`
  e sete variantes) e a lógica yes/no/maybe em `eval_pubmedqa.py:37-44`

Consequência: a comparabilidade com os números publicados do paper do Meissa é de
**método**, não bit a bit. Fica registrado para não ser reivindicado a mais depois.

Descartado: reconstruir `eval_helpers` por engenharia reversa. O scorer inteiro cabe em
~60 linhas; reconstruir uma dependência ausente para "ficar igual" custa mais e ainda
assim não seria igual.

### Escolha forçada no benchmark, recusa preservada em produção

O sistema recusa quando falta evidência — verificado em produção, e é a propriedade de
segurança mais importante que ele tem. MedQA força A–E: `clean_answer()` devolve `None`
para uma recusa, que vira erro de extração. O benchmark, cru, pune exatamente o que
queremos preservar.

Solução: o runner injeta "responda apenas com a letra" (`--forced-choice`, ligado por
padrão). Produção não muda.

A taxa de recusa vem de uma **segunda passada, sem a flag, só nos alvos `rag` e `simvera`
e só no subset de 100** — os alvos sem RAG não têm evidência para recusar por falta dela,
e a métrica não precisa de 300 itens para ser lida. Custo dessa passada: ~30min, somados
ao orçamento abaixo.

Descartado: desligar a recusa. Ela é o comportamento, não o obstáculo.

## Arquitetura

Diretório novo: `simvera-eval/`. Fora do `rag-gateway` porque avalia o sistema inteiro
(shim + RAG + dois modelos), não a biblioteca de retrieval.

```
datasets.py   baixa e fixa os itens        →  data/<bench>-<n>.jsonl (versionado)
targets.py    um alvo = (item) -> texto    →  4 implementações independentes
run.py        alvo × dataset               →  results/<alvo>/<bench>.json
score.py      extração + acurácia          →  lê results/, imprime tabela
report.py     citação, recusa, latência    →  lê results/, imprime tabela
```

Cada arquivo tem uma responsabilidade e nenhum importa o outro exceto `run.py`, que
compõe `datasets` + `targets`. `score.py` e `report.py` leem só o disco — podem rodar
sobre resultados antigos sem reexecutar nada.

### Fluxo

```
datasets.load(bench, n) → [item]
                            ↓
                    targets.get(nome)(item) → {texto, latencia_s, citacoes[], recusou}
                            ↓
                    run.py grava results/<alvo>/<bench>.json
                            ↓
              score.py (acurácia)      report.py (citação/recusa/latência)
```

### Interface do alvo

```python
Resposta = TypedDict("Resposta", {
    "text": str,           # texto bruto do modelo, sem pós-processamento
    "latency_s": float,
    "citations": list[str],# citation_labels que o alvo devolveu (vazio p/ alvos sem RAG)
    "abstained": bool,     # o alvo se recusou a responder
})

def responder(item: dict, *, forced_choice: bool) -> Resposta: ...
```

Um alvo é uma função. Sem classe, sem registry, sem plugin — quatro entradas num dict.

### Os quatro alvos

| alvo | o que exercita | responde a pergunta |
|---|---|---|
| `gemma` | Gemma-4 direto, 8081, sem RAG | quanto é conhecimento paramétrico? |
| `rag` | `/rag/evidence-pack` + Gemma | quanto o corpus adiciona? |
| `meissa` | Meissa-4B direto, 8003 | o setup reproduz o paper? |
| `simvera` | shim completo, 8100 | o número que importa |

Sem os quatro, uma variação de acurácia não é atribuível. `rag` menos `gemma` é o ganho
do corpus; `simvera` menos `rag` é o ganho da orquestração.

## Métricas

**`score.py`** — acurácia por benchmark e por `difficulty`, mais taxa de falha de
extração (resposta que não casou nenhuma regex; alta demais invalida a acurácia).

**`report.py`** — o que o benchmark não vê:

| métrica | definição | por que importa |
|---|---|---|
| recall de citação | % de respostas com ≥1 `citation_label` | resposta sem fonte é o modo de falha que o projeto existe para evitar |
| taxa de recusa | % de `abstained=True`, medida sem `--forced-choice` | subir muito = RAG cego; cair a zero = guardrail quebrado |
| latência p50/p95 | fim a fim, por alvo | orçamento declarado: 10s |

## Erros

O harness roda por horas contra quatro serviços locais. Falhar no meio e perder tudo é
inaceitável.

- **Resultados são append-only por item.** `run.py` grava incrementalmente e pula itens
  já presentes no arquivo de saída. Reexecutar retoma de onde parou.
- **Falha de um item não derruba a run.** Exceção vira `{"error": "..."}` no item, contado
  em `report.py` como falha de execução, distinta de falha de extração.
- **Timeout por item** (default 60s) — um alvo travado não pode consumir a janela toda.
- **Sem retry automático.** Um retry mascara instabilidade, que é justamente o que se
  quer medir. Reexecução é manual e explícita.

## Testes

Um teste, `test_score.py`, com casos que falham se a extração quebrar:

- resposta com `Answer: C` → `C`
- resposta com `**Answer: (B)**` → `B`
- recusa em português → `None` e `abstained=True`
- yes/no/maybe do PubMedQA, incluindo `maybe` no meio do texto
- item com `error` não entra no denominador da acurácia

A extração por regex é a peça frágil do harness: se ela quebrar, todas as acurácias ficam
erradas em silêncio. É o único ponto que justifica teste aqui.

Não há teste para `run.py` nem `targets.py` — exigiriam mockar quatro serviços para
verificar que HTTP funciona.

## Custo

~8s por query. 300 itens × 4 alvos ≈ 2h por rodada completa.

Subset de **100 itens para iterar**, **300 para decidir**. Os subsets são fixos e
versionados: mudança de número entre rodadas tem que vir da mudança no pipeline, não da
amostra.

## Verificação

O harness está pronto quando:

1. `score.py` reproduz a acurácia do alvo `meissa` dentro de **5 pontos percentuais** do
   número publicado — se não reproduz, o setup está errado e nenhum outro número vale.
   O número de referência é lido do paper/README do repo do Meissa **antes** da primeira
   rodada e anotado aqui; não assumir de memória
2. `rag` supera `gemma` — se não superar, o corpus não está ajudando e isso é a primeira
   coisa a investigar
3. `report.py` mostra recall de citação > 0 para `rag` e `simvera`, e = 0 para `gemma`
4. reexecutar uma run interrompida retoma sem duplicar itens

## Fora de escopo

- LLM-as-judge para qualidade da resposta livre (fase própria, se houver)
- Avaliação de recuperação isolada (recall@k contra gabarito) — foi a alternativa não
  escolhida
- Multimodal — o Gemma lê imagem, mas nenhum destes benchmarks tem imagem
- CI — roda sob demanda; 2h por rodada não cabe em pipeline
