# Fluxo de trabalho: branch por tarefa, revisão antes do merge

Estas regras valem para todo trabalho no repositório — humano ou agente. Elas
complementam `docs/agents/issue-tracker.md` (onde as issues vivem) e
`docs/agents/triage-labels.md` (como são classificadas).

## 1. Toda tarefa nasce de uma issue

Nada entra na branch oficial sem uma issue correspondente. Se o trabalho não
tem issue, abra uma antes de escrever a primeira linha — inclusive para
correções pequenas. A issue é o registro de *por que* a mudança existe; o
commit registra apenas *o que* mudou.

## 2. Quem inicia a tarefa assina a issue

Antes de começar, a pessoa (ou o agente) que vai executar **assina a issue**:

1. Atribui a issue a si (`gh issue edit <n> --add-assignee @me`).
2. Publica um comentário de assinatura, neste formato:

   ```
   Assinado por @usuario em AAAA-MM-DD.
   Branch: <tipo>/<n>-<slug>
   ```

   Quando o executor for um agente, a assinatura nomeia **a pessoa responsável**
   pela tarefa, e identifica o agente em seguida:

   ```
   Assinado por @usuario em AAAA-MM-DD (executado pelo agente Claude Code).
   Branch: <tipo>/<n>-<slug>
   ```

Uma issue sem assinatura está livre para qualquer um assumir. Uma issue assinada
já tem dono — não trabalhe nela em paralelo. Se abandonar a tarefa, comente
dizendo isso e remova a atribuição, para que a issue volte a ficar livre.

## 3. Uma branch por tarefa

Nunca comite direto na branch oficial. Cada issue ganha a sua branch, criada a
partir da oficial atualizada:

```
<tipo>/<numero-da-issue>-<slug-curto>
```

`<tipo>` é um dos prefixos de Conventional Commits já usados no histórico:
`feat`, `fix`, `refactor`, `docs`, `test`, `build`, `chore`, `style`.

Exemplo: `refactor/12-quebrar-caderneta-pessoa-idosa`.

Uma branch resolve **uma** issue. Se descobrir outro defeito no caminho, abra
uma issue nova em vez de ampliar o escopo da branch em curso.

## 4. Revisão obrigatória antes do merge

O merge acontece por Pull Request, nunca por push direto. Antes de pedir
revisão, o PR precisa estar verde nos três portões que o projeto já tem:

```
cd services/rag-gateway && .venv/bin/python -m pytest tests/ -q
```

São 28 arquivos de teste. Se algum falhar, **não afrouxe o teste para o PR passar** —
o teste é o que resta quando a memória de por que aquilo importa já sumiu.

O PR deve conter `Closes #<n>` no corpo, para que a issue feche junto com o
merge, e descrever o que foi verificado — não apenas o que foi alterado.

Nenhum PR é mesclado pelo próprio autor sem revisão de outra pessoa. Isso vale
especialmente para mudanças no caminho de recuperação, onde uma regressão aparece
como **latência ou resposta pior**, nunca como erro — e por isso passa despercebida.
A revisão precisa confirmar:

- que a regra de recusa sem evidência continua valendo (`_refusal_text` em
  `services/orchestrator/app.py` não virou fallback silencioso para o modelo);
- que `tests/test_fts_stopwords.py` não foi afrouxado — o filtro de stopwords vale
  150x na busca, e reverter isso não quebra teste nenhum, só deixa tudo lento;
- que mudança em `raggw/graph/store.py` preserva a distinção entre aresta **tipada**
  (fato curado, sempre expande) e `cooc` (estatística, ruído neste corpus).

## 5. Ordem das tarefas

A ordem das fases vive em `docs/HANDOFF.md`, não em milestones. Ela existe por
dependência técnica, não por preferência — o harness de avaliação vem antes das
mudanças de recuperação porque sem ele nenhuma delas é falseável. Puxar uma tarefa
de fase posterior antes de a anterior fechar é decisão consciente, e deve ser dita
na issue.
