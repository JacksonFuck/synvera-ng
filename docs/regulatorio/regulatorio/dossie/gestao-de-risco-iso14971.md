# Gestão de Risco — GuiaMed AMPLE (ISO 14971:2020)

> Modelo pré-preenchido. O Responsável Técnico deve revisar, completar e assinar.
> A gestão de risco é o documento central do dossiê e conecta-se à validação
> clínica (issue #2/#14).

**Produto:** GuiaMed AMPLE (SaMD). **RT:** Dr. Eder Abelha Flavio — CRM-PR 42907.
**Versão:** [PREENCHER] · **Data:** [PREENCHER]

## 1. Política e critérios de aceitação de risco

A organização adota o princípio de reduzir riscos tão baixo quanto razoavelmente
praticável. Como o produto é **apoio à decisão** e o profissional de saúde
**sempre valida** a informação antes de qualquer conduta, o controle de risco
predominante é a **supervisão humana qualificada** somada à transparência (avisos)
e à validação do conteúdo clínico.

**Critério:** um risco residual é aceitável quando (a) o profissional dispõe de
informação e avisos suficientes para detectar e corrigir uma eventual imprecisão
antes da conduta, e (b) o conteúdo foi validado por responsável técnico contra
fontes oficiais.

## 2. Características relacionadas à segurança (uso pretendido)

- Usuários: **profissionais de saúde habilitados** (não leigos).
- O software **não administra** medicamentos, **não comanda equipamentos**, **não
  diagnostica autonomamente** e **não persiste dados de pacientes**.
- A saída é sempre **conferível** pelo profissional contra a fonte.

## 3. Identificação de perigos e análise de risco

Escala (qualitativa): Probabilidade P (1 raro – 3 provável) × Severidade S
(1 leve – 3 grave). Risco = P×S. Controles reduzem P e/ou S.

| ID | Perigo / situação perigosa | Dano potencial | P×S inicial | Controles de risco implementados | Risco residual |
|---|---|---|---|---|---|
| R1 | Cálculo de dose com resultado incorreto (fórmula/arredondamento) | Dose inadequada ao paciente | 2×3 | Funções puras testadas (suíte automatizada); validação clínica pelo RT; aviso de apoio à decisão; profissional confere e aplica | Baixo |
| R2 | Entrada inválida (peso 0, idade negativa, creatinina 0) gerando saída sem sentido | Decisão baseada em valor errôneo | 2×2 | Guardas de entrada (peso≤0/não-finito, creatinina>0 etc.); exibição só com dados válidos; conferência do profissional | Baixo |
| R3 | Dado de posologia desatualizado/incorreto no catálogo | Prescrição inadequada | 2×3 | Validação clínica das 161 posologias por RT contra FTN/RENAME/bula/diretriz; versionamento da fonte; posologia editável pelo médico; aviso | Baixo |
| R4 | Antimicrobiano impresso em via única (não conforme RDC 471/2021) | Receita recusada / não-conformidade sanitária | 2×1 | Detecção de antimicrobiano → impressão automática em 2 vias + aviso de endereço/telefone do prescritor | Muito baixo |
| R5 | Tentativa de prescrever medicamento de controle especial (Portaria 344/98) | Uso de receituário inadequado | 1×2 | Catálogo NÃO inclui controlados; aviso explícito de que exigem receituário próprio | Muito baixo |
| R6 | Profissional interpreta a sugestão como decisão automática | Conduta sem avaliação individual | 2×3 | Disclaimer global com aceite (Res. CFM 2.454/2026: decisão e responsabilidade do médico); avisos contextuais por módulo; responsabilidade do prescritor no receituário | Baixo |
| R7 | Cálculo pediátrico por peso sem teto / excedendo dose máxima | Sobredose pediátrica | 2×3 | Teto por tomada na calculadora; aviso de conferir dose máxima e apresentação; validação clínica | Baixo |
| R8 | Sugestão de posologia da comunidade incorreta | Prescrição inadequada | 2×2 | Fluxo de curadoria (IA pré-valida → admin/RT aprova → só então visível); marcação "revise antes de usar"; não autoritativa | Baixo |
| R9 | Indisponibilidade do software | Atraso/indisponibilidade de consulta | 2×1 | Produto é apoio (não crítico); profissional dispõe de fontes alternativas; PWA com cache offline | Muito baixo |
| R10 | Vazamento/uso indevido de dados pessoais do usuário | Dano à privacidade (LGPD) | 1×2 | Controles de segurança (ver `ciberseguranca-rdc848.md`): RLS, CPF só em hash, HTTPS/HSTS, CSP, validação server-side, auditoria | Baixo |
| R11 | Erro de identificação no receituário (dados obrigatórios incompletos) | Receita inválida | 1×2 | Cabeçalho com médico/CRM/UF; aviso de endereço/telefone p/ antimicrobiano; campos editáveis e conferidos pelo médico | Baixo |

> Atualizar a tabela conforme a validação clínica (R3/R7) e novos achados. A
> **pendência da atropina** (piso 0,1 mg sem teto) é um item de R7 a resolver na
> validação.

## 4. Avaliação do risco residual global

Após os controles, todos os riscos residuais são classificados como **baixos ou
muito baixos**, sustentados pelo controle dominante de **supervisão humana
qualificada** (o produto não age sobre o paciente sem o profissional). O benefício
clínico (agilidade e padronização do apoio à decisão para profissionais) supera o
risco residual.

## 5. Controles de risco — resumo (rastreabilidade)

| Controle | Onde está implementado |
|---|---|
| Avisos / disclaimers (global com aceite + por módulo + prescritor) | `src/components/MedicalDisclaimer.tsx`, Termos de Uso |
| Validação clínica do conteúdo | `docs/clinico/` (checklist + metodologia) |
| Guardas de entrada e testes automatizados | `src/domain/**`, suíte Vitest (117 testes) |
| Receita de antimicrobiano em 2 vias | `src/features/receituario/ReceituarioPage.tsx` |
| Exclusão de controlados | `src/data/prescriptionDrugs.ts` |
| Segurança de dados | ver `ciberseguranca-rdc848.md` |
| Curadoria do conteúdo da comunidade | Edge Functions + gate do admin |

## 6. Atividades de produção e pós-produção

- **Tecnovigilância:** monitorar queixas/eventos e notificar no Notivisa quando
  cabível (RDC 67/2009 + 551/2021).
- **Controle de alterações:** mudanças significativas no software ou no conteúdo
  clínico disparam reavaliação de risco e atualização deste documento.
- **Revisão periódica:** revisar a gestão de risco ao menos anualmente ou a cada
  mudança relevante.

**Aprovação do RT:** ____________________ (Dr. Eder Abelha Flavio — CRM-PR 42907)
· Data: __/__/____
