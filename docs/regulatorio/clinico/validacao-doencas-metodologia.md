# Validação médica das fichas da aba Doenças — metodologia

Documento de apoio à **revisão médica obrigatória** das 59 fichas clínicas da aba
**Doenças** (`src/data/doencas.ts`). Relaciona-se à issue **#32** (e é análogo à
validação das posologias, #2/#14).

## O que precisa ser validado
Cada ficha tem: resumo, fisiopatologia, **exames a solicitar**, **diagnóstico
diferencial**, **conduta** e uma camada "Atualizações — diretrizes recentes".
A validação foca em **doses, limiares, escores, janelas terapêuticas e
contraindicações**.

## Origem do conteúdo (não é validação)
- Curadoria **assistida por IA** a partir de duas fontes: *Medicina de Emergência –
  Abordagem Prática* (USP/HC-FMUSP, 19ª ed.) e *Tratado de Medicina de Emergência
  ABRAMEDE* (Manole, 1ª ed., 2024), com notas de diretrizes recentes (SSC, ESC/AHA,
  GINA, GOLD, ADA/EASD, MS 2024, etc.).
- Passou por **cross-check automatizado** USP × ABRAMEDE: 11 fichas sem erros e 6
  com ajustes já aplicados (ex.: concentração máx de KCl 80/120 mEq/L). **Isso não
  substitui a validação médica formal.**

## Como usar o checklist
Planilha: [`checklist-validacao-doencas.csv`](checklist-validacao-doencas.csv) — uma
linha por ficha, com a coluna **"Doses/limiares-chave a validar"** já extraída do
código. Para cada ficha:
1. Abra a ficha no app (aba Doenças → buscar) e confira contra a fonte primária e os
   **protocolos institucionais**.
2. Preencha **Validado (OK/Ajustar)**, **Ajuste sugerido**, **Revisor** e **Data**.
3. Itens "Ajustar" viram tarefa de correção no `doencas.ts` (a coluna fonte aponta o
   capítulo USP).

## Liberação
**PARCIAL** — as **59 fichas do checklist** foram validadas por **Eder Abelha** em
**2026-06-24** (coluna *Validado* = OK, com revisor e data registrados em
[`checklist-validacao-doencas.xlsx`](checklist-validacao-doencas.xlsx)).

⚠️ **Pendente:** o módulo `src/data/doencas.ts` tem hoje **70 fichas**. As **11 mais
recentes** (lotes #88 Cardiovasculares + #90 Neurológicas) **ainda não foram validadas**.
Elas já foram **adicionadas ao checklist** (linhas **60–70**, com doses/limiares
extraídos do código), aguardando revisão. O marcador `REVISÃO MÉDICA OBRIGATÓRIA`
segue aplicável a elas até que estejam **OK** com revisor e data. Só então a aba
estará liberada para uso assistencial.
