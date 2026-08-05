# Ciclo de Vida do Software — GuiaMed AMPLE (IEC 62304)

> Modelo pré-preenchido. Descreve os processos de desenvolvimento e manutenção do
> software conforme a IEC 62304 (ed. nacional). Revisar e assinar (RT).

**Produto:** GuiaMed AMPLE (SaMD) · **Versão:** [PREENCHER] · **Data:** [PREENCHER]

## 1. Classificação de segurança do software (IEC 62304, cláusula 4.3)

| Classe | Critério | Aplica? |
|---|---|---|
| A | Nenhuma lesão possível | — |
| **B** | **Lesão NÃO séria possível** | **Sim (adotada)** |
| C | Morte ou lesão séria possível | — |

**Justificativa da Classe B:** uma eventual imprecisão de cálculo/conteúdo poderia
contribuir para uma conduta inadequada, mas (a) o produto é **apoio à decisão**
sem ação autônoma sobre o paciente, (b) o **profissional habilitado sempre valida**
a informação antes da conduta (controle de risco dominante), e (c) o conteúdo é
validado por responsável técnico. Esses fatores afastam o cenário de lesão séria
atribuível diretamente ao software, situando-o na **Classe B**.

## 2. Arquitetura e ambiente

- **Front-end:** aplicação web SPA/PWA (React + TypeScript), executada no navegador
  do profissional. Cálculos clínicos rodam localmente (funções puras).
- **Back-end:** Supabase (autenticação, banco PostgreSQL com RLS, Edge Functions),
  hospedado no Brasil (região São Paulo).
- **Não** há persistência de dados de paciente; o receituário é gerado e impresso
  localmente.

## 3. Processo de desenvolvimento (IEC 62304, cláusula 5)

- **Planejamento e requisitos:** funcionalidades documentadas no repositório
  (issues/commits) e na destinação de uso; requisitos clínicos ancorados em fontes
  (FTN/RENAME/bula/diretrizes).
- **Projeto e implementação:** TypeScript com verificação de tipos (`tsc`); código
  organizado por domínio (`src/domain`) e features (`src/features`).
- **Verificação:** suíte de testes automatizados (Vitest, atualmente 117 testes,
  cobrindo cálculos clínicos, validações e regras críticas); verificação de tipos;
  lint; build de produção. Verificação de acessibilidade (axe-core).
- **Liberação:** versionamento por Git; histórico de commits como registro de
  alterações; build reproduzível (Vite).

## 4. Gestão de configuração (cláusula 8)

- Controle de versão **Git** (repositório GitHub `edeerflavio/Apppocus-2.0`).
- Cada mudança é um commit rastreável; releases identificados por versão.
- Migrações de banco versionadas em `supabase/migrations/` (sequenciais).
- Itens de configuração: código-fonte, dados clínicos (`src/data`), migrações,
  Edge Functions, dependências (lockfile).

## 5. Gestão de problemas e manutenção (cláusulas 6 e 9)

- Problemas registrados como issues; correções rastreadas por commit referenciando
  a issue.
- Mudanças significativas disparam reavaliação de risco (ISO 14971) e, se aplicável,
  atualização da notificação ANVISA.
- Tecnovigilância pós-mercado: queixas/eventos avaliados e, quando cabível,
  notificados no Notivisa.

## 6. SOUP — Software of Unknown Provenance (cláusula 8.1.2)

Componentes de terceiros utilizados (dependências de produção). Manter atualizado
conforme o `package.json`/lockfile e monitorar vulnerabilidades (`npm audit`).

| Componente | Versão | Função | Observação de segurança |
|---|---|---|---|
| react | ^19.2.6 | Biblioteca de UI | Amplamente mantida |
| react-dom | ^19.2.6 | Renderização DOM | — |
| react-router-dom | ^7.17.0 | Roteamento | — |
| @supabase/supabase-js | ^2.108.1 | Cliente de banco/auth | Conexão TLS |
| lucide-react | ^1.18.0 | Ícones | Sem lógica clínica |
| vite-plugin-pwa | ^1.3.0 | Service worker / PWA | Cache offline |

> Política: rodar `npm audit` periodicamente; avaliar e atualizar dependências com
> vulnerabilidades; registrar a avaliação. (Na última verificação, `npm audit
> --omit=dev` retornou 0 vulnerabilidades.)

## 7. Itens de segurança do software (rastreáveis à gestão de risco)

Os controles de software que mitigam riscos (guardas de entrada, testes de
cálculo, impressão em 2 vias para antimicrobiano, exclusão de controlados, avisos)
estão rastreados na `gestao-de-risco-iso14971.md` (seção 5) e implementados no
código indicado.

**Aprovação do RT:** ____________________ · Data: __/__/____
