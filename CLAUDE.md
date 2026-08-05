# CLAUDE.md — SYNVERA-NG

Leia `CONTEXT.md`, as ADRs pertinentes em `docs/adr/` e `docs/HANDOFF.md` antes de alterar o produto. Preserve a linguagem canônica e sinalize conflitos com decisões aceitas.

Toda afirmação clínica vem do corpus, com citação de fonte e página. Sem evidência, o sistema recusa — nunca deixa o modelo responder de memória. Essa é a propriedade pela qual o sistema existe, não uma preferência de estilo.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`JacksonFuck/synvera-ng`, private). External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Fluxo de trabalho (obrigatório)

Toda tarefa nasce de uma issue; quem inicia **assina a issue** antes de começar; cada issue ganha **a sua branch** (`<tipo>/<n>-<slug>`); o merge só acontece por PR revisado por outra pessoa, com a suíte `pytest` verde. Nunca comite direto na branch oficial. Ver `docs/agents/workflow.md`.

### Triage labels

We use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at root. See `docs/agents/domain.md`.

### Auditabilidade clínica (obrigatório)

Este sistema é destinado a integrar prontuário eletrônico hospitalar e de APS. Risco CFM classificado como **alto**: influencia conduta. Antes de qualquer mudança que toque modelo, inferência, recuperação clínica, predição ou visão médica, carregue a skill `cfm-sbis-auditabilidade`. As lacunas de conformidade já conhecidas estão em `docs/HANDOFF.md` — não as descubra de novo.

### Context7 & Gestão de Dependências

Sempre instale e utilize o plugin/CLI/MCP do **Context7** (`@upstash/context7-mcp` ou `npx ctx7`) para consultar e verificar a documentação oficial e as versões mais recentes das dependências antes de implementar ou atualizar pacotes no projeto.

### Dados

`data/` tem ~120GB gerenciados por DVC, não por git. **Nunca rode `git clean` sem `-e data/`** — para o git aquilo é arquivo não rastreado, e um clean apagaria corpus, índice e modelos. Ver `data/README.md`.
