# Engenharia de Usabilidade — GuiaMed AMPLE (IEC 62366-1)

> Modelo pré-preenchido. Revisar e assinar (RT).

**Produto:** GuiaMed AMPLE (SaMD) · **Versão:** [PREENCHER] · **Data:** [PREENCHER]

## 1. Especificação de uso

- **Usuários pretendidos:** profissionais de saúde habilitados e estudantes da
  área, maiores de 18 anos. Familiaridade com termos clínicos e com navegadores
  web.
- **Ambiente de uso:** qualquer ambiente assistencial ou de estudo, em navegador
  web/dispositivo pessoal. Pode incluir situações de pressão/tempo (emergência),
  mas a informação é sempre auxiliar e conferível.
- **Funções primárias relacionadas à segurança:** cálculo de dose; consulta de
  posologia/conduta; geração/impressão de receituário.

## 2. Princípios de projeto para segurança de uso

- **Transparência do papel do software:** aviso global com aceite no primeiro
  acesso (apoio à decisão; decisão e responsabilidade do médico; não é
  telemedicina) e avisos contextuais nos módulos de alto risco.
- **Edição e conferência:** doses e posologias são **editáveis**; o profissional
  revisa antes de imprimir/aplicar.
- **Sinalização de exceções:** avisos para antimicrobianos (2 vias, identificação
  do prescritor) e para medicamentos de controle especial (não suportados).
- **Prevenção de erro de entrada:** guardas para valores inválidos; exibição de
  resultado apenas com dados válidos.
- **Acessibilidade:** interface auditada (axe-core) em conformidade WCAG 2.2 AA
  (contraste, landmarks, foco, rótulos) — reduz erro de uso por leitura/navegação.

## 3. Erros de uso previstos e controles (risco de uso)

| Erro de uso potencial | Consequência | Controle de usabilidade |
|---|---|---|
| Tratar a sugestão como decisão final | Conduta sem avaliação individual | Aviso global com aceite + avisos por módulo + responsabilidade do prescritor |
| Inserir valor incorreto (peso/idade) | Cálculo errôneo | Guardas de entrada; resultado só com dados válidos; conferência |
| Imprimir antimicrobiano em forma inadequada | Receita recusada | Detecção + impressão automática em 2 vias + aviso |
| Tentar prescrever controlado | Receituário inadequado | Catálogo sem controlados + aviso explícito |
| Não preencher identificação do prescritor | Receita inválida | Cabeçalho com médico/CRM; aviso de endereço/telefone p/ antimicrobiano |

## 4. Avaliação de usabilidade

- **Avaliação formativa:** durante o desenvolvimento, ajustes de fluxo e avisos.
- **Avaliação somativa (recomendada antes de versões maiores):** teste com
  profissionais representativos executando as funções primárias, registrando erros
  de uso e sua mitigação. [PREENCHER: registrar quando realizada.]
- Verificação automatizada de acessibilidade (axe-core) sem violações nas telas.

**Aprovação do RT:** ____________________ · Data: __/__/____
